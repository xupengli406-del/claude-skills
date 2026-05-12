# Xiaohongshu Automation Scripts

Python scripts for automating Xiaohongshu (小红书) via the Browser Bridge plugin.

## Prerequisites

- **Python 3.8+** (uses only stdlib: `json`, `urllib`, `base64`, `time`, `argparse`)
- **Obsidian** with:
  - [Surfing plugin](https://github.com/PKM-er/Obsidian-Surfing) (embedded browser)
  - [Browser Bridge plugin](../plugin/browser-bridge/) (HTTP API, port 27182)
- **Logged in** to xiaohongshu.com in the Surfing browser

## Scripts

### `bridge.py` — Core Module

Reusable Python wrapper for the Browser Bridge HTTP API. Import in other scripts:

```python
from bridge import bridge, js, wait, get_state, navigate, check_bridge
from bridge import encode_title_unicode, encode_content_html
```

**Quick test:**
```bash
python bridge.py
# Should print: [OK] Bridge connected: browser-bridge v1.0.0
```

### `publish_image_post.py` — Publish Image Post

```bash
# Basic usage
python publish_image_post.py \
  --title "我的第一条自动化笔记" \
  --content "这是通过AI自动发布的内容" \
  --image ./my-image.png

# With content from file
python publish_image_post.py \
  --title "标题" \
  --content-file content.txt \
  --image ./photo.jpg

# Dry run (fill content but don't publish)
python publish_image_post.py \
  --title "测试" \
  --content "测试内容" \
  --image ./test.png \
  --dry-run
```

### `publish_video_post.py` — Publish Video Post (Experimental)

```bash
python publish_video_post.py \
  --title "视频标题" \
  --content "视频描述" \
  --video ./my-video.mp4

# With custom cover
python publish_video_post.py \
  --title "标题" \
  --content "内容" \
  --video ./video.mp4 \
  --cover ./cover.png
```

**Note:** Video upload is experimental. Large videos (>50MB) may hit base64 encoding limits.

### `read_profile.py` — Read Profile & Posts

```bash
# Read current user's profile
python read_profile.py

# Read specific profile
python read_profile.py --url "https://www.xiaohongshu.com/user/profile/xxxxx"

# Save to JSON
python read_profile.py --output my_posts.json
```

### `read_comments.py` — Read Post Comments

```bash
# Read comments from a post
python read_comments.py --url "https://www.xiaohongshu.com/explore/xxxxx"

# Load more comments with extra scrolling
python read_comments.py --url "POST_URL" --scroll 5

# Save to JSON
python read_comments.py --url "POST_URL" --output comments.json
```

## Architecture

```
┌──────────────────┐     HTTP :27182     ┌──────────────────────┐
│  Python Script   │ ──────────────────> │  Browser Bridge      │
│  (this dir)      │ <────────────────── │  (Obsidian plugin)   │
└──────────────────┘     JSON UTF-8      └──────────┬───────────┘
                                                    │ executeJS
                                                    ▼
                                          ┌──────────────────────┐
                                          │  Surfing Webview     │
                                          │  (Electron <webview>)│
                                          │  xiaohongshu.com     │
                                          └──────────────────────┘
```

## Key Technical Details

### Why urllib instead of requests/curl?

Windows Python's `subprocess` defaults to GBK encoding, corrupting Chinese characters when piped through curl. `urllib.request` handles UTF-8 correctly end-to-end.

### Why Unicode escapes for title?

React controlled inputs intercept normal value assignment. We use `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to bypass React's synthetic event system, and Unicode escapes (`\uXXXX`) ensure the JS string is ASCII-safe during transmission.

### Why HTML entities for content?

The TipTap/ProseMirror editor uses `innerHTML` injection. HTML entity encoding (`&#XXXX;`) preserves Chinese characters through the JSON → JS string → innerHTML pipeline without encoding corruption.

### Why DataTransfer API for upload?

XHS's file upload uses a hidden `<input type="file">`. We can't trigger the native file picker programmatically (security restriction), but we CAN set `input.files` via the `DataTransfer` API and dispatch a `change` event.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bridge unreachable" | Check Obsidian is running, Browser Bridge plugin enabled |
| "No embedded browser found" | Open any URL in Surfing browser first |
| "Redirected to login" | Log into xiaohongshu.com manually in Surfing |
| Title/content empty | XHS may have updated their DOM; check selectors |
| Image upload fails | Check image size (<20MB) and format (PNG/JPG) |
| Video processing timeout | Large videos need more time; increase WAIT_PROCESS |
