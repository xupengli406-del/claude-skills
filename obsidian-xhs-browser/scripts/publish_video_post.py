# -*- coding: utf-8 -*-
"""
Publish a video post to Xiaohongshu (小红书) via Browser Bridge.

Similar to publish_image_post.py but handles video upload flow.
Video posts have a different upload mechanism and processing time.

Status: STUB - video upload flow needs testing with actual XHS video tab.

Usage:
    python publish_video_post.py --title "标题" --content "内容" --video path/to/video.mp4
    python publish_video_post.py --title "标题" --content "内容" --video path/to/video.mp4 --cover path/to/cover.png

TODO:
- [ ] Test video tab switch selector
- [ ] Determine video upload input selector (may differ from image)
- [ ] Handle video processing wait time (XHS transcodes server-side)
- [ ] Add cover image upload support
- [ ] Handle video size limits (max 5 min, specific resolution requirements)
"""

import argparse
import base64
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bridge import (
    bridge,
    js,
    wait,
    get_state,
    navigate,
    check_bridge,
    encode_title_unicode,
    encode_content_html,
)

# ─── Constants ────────────────────────────────────────────────────────────────

XHS_MAIN = "https://www.xiaohongshu.com"
XHS_CREATOR = "https://creator.xiaohongshu.com/publish/publish"
WAIT_NAV = 3
WAIT_UPLOAD = 10  # Video uploads take longer
WAIT_PROCESS = 30  # Video processing on server
WAIT_PUBLISH = 5

# Maximum video size in bytes (100MB as a safe limit)
MAX_VIDEO_SIZE = 100 * 1024 * 1024


def step_navigate_to_creator():
    """Navigate to XHS creator center."""
    print("[1/9] Navigating to creator center...")
    navigate(XHS_MAIN)
    wait(2)
    r = navigate(XHS_CREATOR)
    if "error" in r:
        print(f"  ERROR: {r['error']}")
        return False
    wait(WAIT_NAV)

    state = get_state()
    url = state.get("url", "")
    if "login" in url.lower():
        print("  ERROR: Not logged in.")
        return False
    print("  OK: On creator page")
    return True


def step_switch_to_video_tab():
    """Switch to the video tab (视频)."""
    print("[2/9] Switching to video tab...")
    # The video tab is usually the default/first tab
    r = js(
        """try {
  const tabs = document.querySelectorAll('[class*="creator-tab"], [class*="tab"], [role="tab"]');
  let found = false;
  for (const t of tabs) {
    const txt = t.textContent || '';
    if (txt.indexOf('\\u89c6\\u9891') >= 0) { t.click(); found = true; break; }
  }
  found ? 'ok' : 'video tab not found (may already be active)'
} catch(e) { 'err:' + e }"""
    )
    result = r.get("result", "")
    print(f"  Result: {result}")
    wait(2)
    return True  # Video tab might be default


def step_upload_video(video_path):
    """
    Upload video file.

    NOTE: Video upload may work differently from image upload.
    XHS might use a chunked upload or different input selector.
    This is a best-effort implementation based on the image pattern.
    """
    print(f"[3/9] Uploading video: {os.path.basename(video_path)}...")

    if not os.path.exists(video_path):
        print(f"  ERROR: Video file not found: {video_path}")
        return False

    file_size = os.path.getsize(video_path)
    if file_size > MAX_VIDEO_SIZE:
        print(f"  ERROR: Video too large ({file_size / 1024 / 1024:.1f}MB > {MAX_VIDEO_SIZE / 1024 / 1024:.0f}MB limit)")
        return False

    print(f"  File size: {file_size / 1024 / 1024:.1f}MB")

    # Read and encode video as base64
    # WARNING: Large videos may exceed JS string limits
    with open(video_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    ext = os.path.splitext(video_path)[1].lower()
    mime_map = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".webm": "video/webm",
    }
    mime_type = mime_map.get(ext, "video/mp4")
    filename = os.path.basename(video_path)

    upload_js = f"""(async function() {{
    try {{
        const b64 = "{b64}";
        const byteString = atob(b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], {{type: '{mime_type}'}});
        const file = new File([blob], '{filename}', {{type: '{mime_type}', lastModified: Date.now()}});
        // Try video-specific upload input first
        let input = document.querySelector('input[accept*="video"][type=file]') ||
                    document.querySelector('input.upload-input[type=file]') ||
                    document.querySelector('input[type=file]');
        if (!input) return 'no file input found for video';
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', {{bubbles: true}}));
        return 'uploaded: ' + file.size + ' bytes';
    }} catch(e) {{ return 'err: ' + e; }}
}})()"""

    r = js(upload_js)
    result = r.get("result", "")
    if "uploaded" in str(result):
        print(f"  OK: {result}")
        print(f"  Waiting for server processing ({WAIT_PROCESS}s)...")
        wait(WAIT_PROCESS)
        return True
    else:
        print(f"  ERROR: {result}")
        return False


def step_wait_for_processing():
    """Wait for video processing to complete."""
    print("[4/9] Waiting for video processing...")
    # Poll for processing completion
    for attempt in range(12):  # Max 60 seconds
        r = js(
            """(function() {
            const progress = document.querySelector('[class*="progress"], [class*="upload-status"]');
            const done = document.querySelector('[class*="success"], [class*="complete"]');
            if (done) return 'done';
            if (progress) return 'processing: ' + (progress.textContent || '').trim();
            return 'unknown';
        })()"""
        )
        result = r.get("result", "")
        if result == "done":
            print(f"  OK: Processing complete")
            return True
        print(f"  Status: {result}")
        wait(5)

    print("  WARNING: Processing timeout, attempting to continue...")
    return True


def step_fill_title(title_text):
    """Fill title (same as image post)."""
    print(f"[5/9] Filling title: {title_text[:30]}...")
    title_escaped = encode_title_unicode(title_text)

    title_js = f"""try {{
    const input = document.querySelector('input.d-text') ||
                  document.querySelector('input[placeholder*="\\u6807\\u9898"]') ||
                  document.querySelector('input[type="text"]');
    if (!input) return 'no title input found';
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '{title_escaped}');
    input.dispatchEvent(new Event('input', {{bubbles: true}}));
    input.dispatchEvent(new Event('change', {{bubbles: true}}));
    'title set: ' + input.value.length + ' chars'
}} catch(e) {{ 'err: ' + e }}"""

    r = js(title_js)
    result = r.get("result", "")
    print(f"  Result: {result}")
    wait(1)
    return "title set" in str(result) or "err" not in str(result)


def step_fill_content(content_text):
    """Fill content (same as image post)."""
    print(f"[6/9] Filling content ({len(content_text)} chars)...")
    content_lines = content_text.split("\n")
    content_html = encode_content_html(content_lines)

    content_js = f"""try {{
    const editor = document.querySelector('.tiptap.ProseMirror') ||
                   document.querySelector('[contenteditable="true"]');
    if (!editor) return 'no editor found';
    editor.focus();
    editor.innerHTML = '{content_html}';
    editor.dispatchEvent(new Event('input', {{bubbles: true}}));
    'content set: ' + editor.innerText.length + ' chars'
}} catch(e) {{ 'err: ' + e }}"""

    r = js(content_js)
    result = r.get("result", "")
    print(f"  Result: {result}")
    wait(1)
    return "content set" in str(result)


def step_set_cover(cover_path):
    """Set custom cover image (optional)."""
    if not cover_path:
        print("[7/9] Skipping cover (using auto-generated)...")
        return True

    print(f"[7/9] Setting cover image: {os.path.basename(cover_path)}...")
    # TODO: Implement cover upload
    # XHS usually auto-generates a cover from the video
    # Custom cover requires clicking "edit cover" button first
    print("  NOTE: Custom cover not yet implemented, using auto-generated")
    return True


def step_publish():
    """Click publish button."""
    print("[8/9] Publishing...")
    r = js(
        """try {
    const btns = document.querySelectorAll('button');
    let found = false;
    for (const b of btns) {
        const t = b.textContent.trim();
        if (t === '\\u53d1\\u5e03' && b.getBoundingClientRect().width > 0) {
            b.click(); found = true; break;
        }
    }
    found ? 'published' : 'publish button not found'
} catch(e) { 'err: ' + e }"""
    )
    result = r.get("result", "")
    print(f"  Result: {result}")
    wait(WAIT_PUBLISH)
    return result == "published"


def step_verify_success():
    """Verify publish success."""
    print("[9/9] Verifying...")
    state = get_state()
    url = state.get("url", "")
    if "published=true" in url or "publish" not in url.lower():
        print("  OK: Published successfully!")
        return True
    print(f"  WARNING: Uncertain. URL: {url}")
    return False


def publish_video_post(title, content, video_path, cover_path=None, dry_run=False):
    """Execute the full video post publish flow."""
    print("=" * 60)
    print("Xiaohongshu Video Post Publisher (EXPERIMENTAL)")
    print("=" * 60)
    print(f"  Title: {title[:50]}")
    print(f"  Video: {video_path}")
    print(f"  Cover: {cover_path or 'auto'}")
    print(f"  Dry run: {dry_run}")
    print("=" * 60)

    if not check_bridge():
        return False

    if not step_navigate_to_creator():
        return False
    if not step_switch_to_video_tab():
        return False
    if not step_upload_video(video_path):
        return False
    if not step_wait_for_processing():
        return False
    if not step_fill_title(title):
        return False
    if not step_fill_content(content):
        return False
    if not step_set_cover(cover_path):
        return False

    if dry_run:
        print("\n[DRY RUN] Stopping before publish.")
        return True

    if not step_publish():
        return False
    return step_verify_success()


def main():
    parser = argparse.ArgumentParser(
        description="Publish a video post to Xiaohongshu (EXPERIMENTAL)"
    )
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--content", help="Post content")
    parser.add_argument("--content-file", help="Path to content text file")
    parser.add_argument("--video", required=True, help="Path to video file")
    parser.add_argument("--cover", help="Path to cover image (optional)")
    parser.add_argument("--dry-run", action="store_true", help="Don't publish")

    args = parser.parse_args()

    content = ""
    if args.content_file:
        with open(args.content_file, "r", encoding="utf-8") as f:
            content = f.read()
    elif args.content:
        content = args.content

    if not os.path.exists(args.video):
        print(f"ERROR: Video not found: {args.video}")
        sys.exit(1)

    success = publish_video_post(
        args.title, content, args.video, args.cover, args.dry_run
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
