# -*- coding: utf-8 -*-
"""
Publish an image post to Xiaohongshu (小红书) via Browser Bridge.

This script automates the full publish flow:
1. Navigate to XHS creator center (with auto-auth trick)
2. Switch to image-text tab
3. Upload image via DataTransfer API
4. Fill title with Unicode escape + React setter pattern
5. Fill content with HTML entity encoding + TipTap innerHTML
6. Verify content before publish
7. Click publish button
8. Verify success via URL change

Prerequisites:
- Obsidian running with Surfing + Browser Bridge plugins
- User already logged into xiaohongshu.com in Surfing browser

Usage:
    python publish_image_post.py --title "标题" --content "内容" --image path/to/image.png
    python publish_image_post.py --title "标题" --content-file content.txt --image path/to/image.png
"""

import argparse
import base64
import json
import os
import sys
import time

# Add parent directory for bridge import
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
WAIT_NAV = 3  # seconds to wait after navigation
WAIT_UPLOAD = 5  # seconds to wait after image upload
WAIT_PUBLISH = 5  # seconds to wait after clicking publish


# ─── Step Functions ───────────────────────────────────────────────────────────


def step_navigate_to_creator():
    """Navigate to XHS creator center, using main site for auth cookie."""
    print("[1/8] Navigating to creator center...")

    # First visit main site to ensure auth cookies are set
    r = navigate(XHS_MAIN)
    if "error" in r:
        print(f"  ERROR: {r['error']}")
        return False
    wait(2)

    # Now navigate to creator publish page
    r = navigate(XHS_CREATOR)
    if "error" in r:
        print(f"  ERROR: {r['error']}")
        return False
    wait(WAIT_NAV)

    # Verify we're on the right page
    state = get_state()
    url = state.get("url", "")
    if "creator.xiaohongshu.com" in url:
        print(f"  OK: On creator page")
        return True
    elif "login" in url.lower():
        print(f"  ERROR: Redirected to login. Please log in manually first.")
        return False
    else:
        print(f"  WARNING: Unexpected URL: {url}")
        return True  # Try to continue anyway


def step_switch_to_image_tab():
    """Switch to the image-text (图文) tab."""
    print("[2/8] Switching to image-text tab...")
    r = js(
        """try {
  const tabs = document.querySelectorAll('[class*="creator-tab"]');
  let found = false;
  for (const t of tabs) {
    const txt = t.textContent || '';
    if (txt.indexOf('\\u56fe\\u6587') >= 0) { t.click(); found = true; break; }
  }
  if (!found) {
    // Fallback: try other tab selectors
    const allTabs = document.querySelectorAll('[class*="tab"], [role="tab"]');
    for (const t of allTabs) {
      const txt = t.textContent || '';
      if (txt.indexOf('\\u56fe\\u6587') >= 0) { t.click(); found = true; break; }
    }
  }
  found ? 'ok' : 'not found, tried ' + document.querySelectorAll('[class*="tab"]').length + ' tabs'
} catch(e) { 'err:' + e }"""
    )
    result = r.get("result", "")
    if result == "ok":
        print(f"  OK: Switched to image-text tab")
        wait(2)
        return True
    else:
        print(f"  Result: {result}")
        # May already be on image tab
        return True


def step_upload_image(image_path):
    """Upload image via DataTransfer API + base64 encoding."""
    print(f"[3/8] Uploading image: {os.path.basename(image_path)}...")

    if not os.path.exists(image_path):
        print(f"  ERROR: Image file not found: {image_path}")
        return False

    # Read and encode image
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    # Determine MIME type from extension
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    mime_type = mime_map.get(ext, "image/png")
    filename = os.path.basename(image_path)

    # Use DataTransfer API to inject file into upload input
    upload_js = f"""(async function() {{
    try {{
        const b64 = "{b64}";
        const byteString = atob(b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], {{type: '{mime_type}'}});
        const file = new File([blob], '{filename}', {{type: '{mime_type}', lastModified: Date.now()}});
        const input = document.querySelector('input.upload-input[type=file]');
        if (!input) {{
            // Fallback selectors
            const inputs = document.querySelectorAll('input[type=file]');
            if (inputs.length === 0) return 'no file input found';
            const dt = new DataTransfer();
            dt.items.add(file);
            inputs[0].files = dt.files;
            inputs[0].dispatchEvent(new Event('change', {{bubbles: true}}));
            return 'uploaded via fallback: ' + file.size + ' bytes';
        }}
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
        wait(WAIT_UPLOAD)
        return True
    else:
        print(f"  ERROR: {result}")
        return False


def step_fill_title(title_text):
    """Fill title using Unicode escape + React controlled input setter."""
    print(f"[4/8] Filling title: {title_text[:30]}...")

    # Convert to JS Unicode escape sequence for safe transmission
    title_escaped = encode_title_unicode(title_text)

    title_js = f"""try {{
    const input = document.querySelector('input.d-text');
    if (!input) {{
        // Fallback: find title input by placeholder or other attributes
        const inputs = document.querySelectorAll('input[type="text"]');
        for (const inp of inputs) {{
            if (inp.placeholder && inp.placeholder.indexOf('\\u6807\\u9898') >= 0) {{
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(inp, '{title_escaped}');
                inp.dispatchEvent(new Event('input', {{bubbles: true}}));
                inp.dispatchEvent(new Event('change', {{bubbles: true}}));
                return 'title set (fallback): ' + inp.value.length + ' chars';
            }}
        }}
        return 'no title input found';
    }}
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '{title_escaped}');
    input.dispatchEvent(new Event('input', {{bubbles: true}}));
    input.dispatchEvent(new Event('change', {{bubbles: true}}));
    'title set: ' + input.value.length + ' chars'
}} catch(e) {{ 'err: ' + e }}"""

    r = js(title_js)
    result = r.get("result", "")
    if "title set" in str(result):
        print(f"  OK: {result}")
        wait(1)
        return True
    else:
        print(f"  ERROR: {result}")
        return False


def step_fill_content(content_text):
    """Fill content using HTML entity encoding + TipTap innerHTML."""
    print(f"[5/8] Filling content ({len(content_text)} chars)...")

    # Split into lines and encode as HTML entities
    content_lines = content_text.split("\n")
    content_html = encode_content_html(content_lines)

    content_js = f"""try {{
    const editor = document.querySelector('.tiptap.ProseMirror');
    if (!editor) {{
        // Fallback: look for contenteditable
        const editors = document.querySelectorAll('[contenteditable="true"]');
        for (const ed of editors) {{
            if (ed.classList.contains('ProseMirror') || ed.closest('[class*="editor"]')) {{
                ed.focus();
                ed.innerHTML = '{content_html}';
                ed.dispatchEvent(new Event('input', {{bubbles: true}}));
                return 'content set (fallback): ' + ed.innerText.length + ' chars';
            }}
        }}
        return 'no editor found';
    }}
    editor.focus();
    editor.innerHTML = '{content_html}';
    editor.dispatchEvent(new Event('input', {{bubbles: true}}));
    'content set: ' + editor.innerText.length + ' chars'
}} catch(e) {{ 'err: ' + e }}"""

    r = js(content_js)
    result = r.get("result", "")
    if "content set" in str(result):
        print(f"  OK: {result}")
        wait(1)
        return True
    else:
        print(f"  ERROR: {result}")
        return False


def step_verify_content():
    """Verify title and content are filled correctly."""
    print("[6/8] Verifying content...")
    r = js(
        """try {
    const titleEl = document.querySelector('input.d-text') ||
                    document.querySelector('input[type="text"]');
    const editorEl = document.querySelector('.tiptap.ProseMirror') ||
                     document.querySelector('[contenteditable="true"]');
    const title = titleEl ? titleEl.value : 'N/A';
    const content = editorEl ? editorEl.innerText : 'N/A';
    JSON.stringify({title: title, content: content.slice(0, 200), titleLen: title.length, contentLen: content.length})
} catch(e) { 'err: ' + e }"""
    )
    result = r.get("result", "")
    if "err" in str(result):
        print(f"  ERROR: {result}")
        return False

    try:
        data = json.loads(result)
        print(f"  Title ({data.get('titleLen', 0)} chars): {data.get('title', 'N/A')[:50]}")
        print(f"  Content ({data.get('contentLen', 0)} chars): {data.get('content', 'N/A')[:80]}...")
        if data.get("titleLen", 0) == 0:
            print("  WARNING: Title is empty!")
            return False
        return True
    except (json.JSONDecodeError, TypeError):
        print(f"  Raw result: {result}")
        return True  # Try to continue


def step_publish():
    """Click the publish button."""
    print("[7/8] Publishing...")
    r = js(
        """try {
    const btns = document.querySelectorAll('button');
    let found = false;
    for (const b of btns) {
        const t = b.textContent.trim();
        if (t === '\\u53d1\\u5e03' && b.getBoundingClientRect().width > 0) {
            b.click();
            found = true;
            break;
        }
    }
    if (!found) {
        // Fallback: look for publish button by class
        const pubBtns = document.querySelectorAll('[class*="publish"] button, button[class*="submit"]');
        for (const b of pubBtns) {
            if (b.getBoundingClientRect().width > 0) {
                b.click();
                found = true;
                break;
            }
        }
    }
    found ? 'published' : 'publish button not found'
} catch(e) { 'err: ' + e }"""
    )
    result = r.get("result", "")
    if result == "published":
        print(f"  OK: Publish button clicked")
        wait(WAIT_PUBLISH)
        return True
    else:
        print(f"  ERROR: {result}")
        return False


def step_verify_success():
    """Verify publish success by checking URL change."""
    print("[8/8] Verifying publish success...")
    state = get_state()
    url = state.get("url", "")

    if "published=true" in url:
        print(f"  OK: Post published successfully!")
        return True
    elif "publish" not in url.lower():
        # URL changed away from publish page = likely success
        print(f"  OK: Navigation detected (likely success)")
        print(f"  Final URL: {url}")
        return True
    else:
        print(f"  WARNING: May not have published. URL: {url}")
        return False


# ─── Main Flow ────────────────────────────────────────────────────────────────


def publish_image_post(title, content, image_path, dry_run=False):
    """
    Execute the full image post publish flow.

    Args:
        title: Post title string
        content: Post content string (newlines create paragraphs)
        image_path: Path to image file
        dry_run: If True, stop before clicking publish

    Returns:
        bool: True if successful
    """
    print("=" * 60)
    print("Xiaohongshu Image Post Publisher")
    print("=" * 60)
    print(f"  Title: {title[:50]}")
    print(f"  Content: {len(content)} chars")
    print(f"  Image: {image_path}")
    print(f"  Dry run: {dry_run}")
    print("=" * 60)

    # Check bridge connectivity
    if not check_bridge():
        return False

    # Execute steps
    steps = [
        lambda: step_navigate_to_creator(),
        lambda: step_switch_to_image_tab(),
        lambda: step_upload_image(image_path),
        lambda: step_fill_title(title),
        lambda: step_fill_content(content),
        lambda: step_verify_content(),
    ]

    for step_fn in steps:
        if not step_fn():
            print("\n[FAILED] Aborting publish flow.")
            return False

    if dry_run:
        print("\n[DRY RUN] Stopping before publish. Content verified above.")
        return True

    # Publish
    if not step_publish():
        return False

    return step_verify_success()


def main():
    parser = argparse.ArgumentParser(
        description="Publish an image post to Xiaohongshu via Browser Bridge"
    )
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--content", help="Post content (inline text)")
    parser.add_argument(
        "--content-file", help="Path to text file with post content"
    )
    parser.add_argument("--image", required=True, help="Path to image file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fill content but don't click publish",
    )

    args = parser.parse_args()

    # Get content from file or argument
    if args.content_file:
        if not os.path.exists(args.content_file):
            print(f"ERROR: Content file not found: {args.content_file}")
            sys.exit(1)
        with open(args.content_file, "r", encoding="utf-8") as f:
            content = f.read()
    elif args.content:
        content = args.content
    else:
        print("ERROR: Provide --content or --content-file")
        sys.exit(1)

    # Validate image
    if not os.path.exists(args.image):
        print(f"ERROR: Image file not found: {args.image}")
        sys.exit(1)

    success = publish_image_post(args.title, content, args.image, args.dry_run)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
