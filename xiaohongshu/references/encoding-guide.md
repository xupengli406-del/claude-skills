# Encoding Solutions for Xiaohongshu Automation

## The Problem

Automating Chinese text input on xiaohongshu.com involves a multi-layer encoding challenge:

```
Python string (UTF-8)
  → JSON serialization
    → HTTP body (UTF-8 bytes)
      → JS string in browser
        → DOM manipulation (React/TipTap)
```

Each layer can corrupt Chinese characters if not handled correctly.

## Challenge 1: Windows + curl = GBK Corruption

### Problem

On Windows, `subprocess.Popen(['curl', ...])` uses the system default codepage (GBK/CP936) for pipe encoding. When JSON with Chinese characters passes through:

```python
# BROKEN: curl subprocess corrupts UTF-8 Chinese
subprocess.run(['curl', '-X', 'POST', 'http://localhost:27182/eval',
    '-d', json.dumps({'code': 'document.title = "你好"'})
])
# Actual bytes sent: GBK-encoded garbage
```

### Solution: urllib.request

```python
import urllib.request, json

# CORRECT: urllib handles encoding properly
data = json.dumps({'code': 'document.title = "你好"'}, ensure_ascii=False)
payload = data.encode('utf-8')
req = urllib.request.Request(url, data=payload,
    headers={'Content-Type': 'application/json; charset=utf-8'})
resp = urllib.request.urlopen(req)
```

Key: `ensure_ascii=False` keeps Chinese as-is, `.encode('utf-8')` creates proper bytes.

## Challenge 2: React Controlled Inputs

### Problem

XHS title input is a React controlled component. Setting `.value` directly doesn't trigger React's state update:

```javascript
// BROKEN: React doesn't see this change
input.value = '我的标题';
input.dispatchEvent(new Event('input', {bubbles: true}));
// React state still empty → submit sends blank title
```

### Solution: Native Value Setter + Unicode Escapes

```javascript
// CORRECT: Bypass React's synthetic getter/setter
const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
).set;
setter.call(input, '我的标题');
input.dispatchEvent(new Event('input', {bubbles: true}));
input.dispatchEvent(new Event('change', {bubbles: true}));
```

But wait — the Chinese string still needs to survive the Python → JSON → HTTP → JS pipeline. Solution: Unicode escape at Python level:

```python
# Python: Convert to Unicode escapes
title = "我的标题"
escaped = ''.join(f'\\u{ord(c):04x}' if ord(c) > 127 else c for c in title)
# Result: "\\u6211\\u7684\\u6807\\u9898"

# This ASCII-safe string travels perfectly through JSON → HTTP → JS
js_code = f"setter.call(input, '{escaped}')"
# In JS, '\\u6211\\u7684\\u6807\\u9898' is automatically decoded to '我的标题'
```

### Why This Works

1. Python generates `\\uXXXX` escape sequences (ASCII-safe)
2. JSON encodes them without any transformation
3. HTTP transmits pure ASCII bytes
4. JavaScript parser interprets `\uXXXX` as Unicode code points
5. `setter.call()` bypasses React's value interception
6. `dispatchEvent` triggers React's update cycle

## Challenge 3: TipTap/ProseMirror Content Editor

### Problem

The XHS body editor uses TipTap (built on ProseMirror). It's not a `<textarea>` — it's a `contenteditable` div with complex internal state.

```javascript
// BROKEN: Direct text insertion doesn't update editor state
editor.textContent = '内容';
// ProseMirror's document model is out of sync → saves blank
```

### Solution: innerHTML with HTML Entities

TipTap will pick up `innerHTML` changes if structured as proper HTML:

```python
# Python: Convert each line to HTML paragraph with entity encoding
lines = ["第一段内容", "", "第三段内容"]
html_parts = []
for line in lines:
    if not line:
        html_parts.append('<p>&nbsp;</p>')  # Empty paragraph
    else:
        # Encode each Chinese char as HTML numeric entity
        encoded = ''.join(
            f'&#{ord(c)};' if ord(c) > 127 else c
            for c in line
        )
        html_parts.append(f'<p>{encoded}</p>')
content_html = ''.join(html_parts)
# Result: '<p>&#31532;&#19968;&#27573;&#20869;&#23481;</p><p>&nbsp;</p><p>&#31532;&#19977;&#27573;&#20869;&#23481;</p>'
```

```javascript
// JS: Set innerHTML and trigger update
const editor = document.querySelector('.tiptap.ProseMirror');
editor.focus();
editor.innerHTML = '<p>&#31532;&#19968;&#27573;&#20869;&#23481;</p>...';
editor.dispatchEvent(new Event('input', {bubbles: true}));
```

### Why HTML Entities?

1. `&#XXXXX;` is pure ASCII — survives all encoding layers
2. Browser's HTML parser converts entities back to Unicode for display
3. TipTap syncs its internal document model from the rendered DOM
4. The `input` event signals TipTap that content changed

## Challenge 4: File Upload Without Native Dialog

### Problem

`<input type="file">` elements cannot be programmatically triggered to open the file picker (browser security). The `click()` method opens the dialog but you can't select a file programmatically.

### Solution: DataTransfer API

Construct a `File` object from bytes and inject it via `DataTransfer`:

```javascript
// 1. Decode base64 to binary
const b64 = "iVBORw0KGgo..."; // base64 image data
const byteString = atob(b64);
const ab = new ArrayBuffer(byteString.length);
const ia = new Uint8Array(ab);
for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
}

// 2. Create File object
const blob = new Blob([ab], {type: 'image/png'});
const file = new File([blob], 'photo.png', {
    type: 'image/png',
    lastModified: Date.now()
});

// 3. Inject via DataTransfer
const input = document.querySelector('input[type=file]');
const dt = new DataTransfer();
dt.items.add(file);
input.files = dt.files;

// 4. Trigger change event (XHS upload handler listens for this)
input.dispatchEvent(new Event('change', {bubbles: true}));
```

### Limitations

- **File size**: Base64 encoding inflates size by ~33%. Very large files (>50MB) may hit JS string length limits
- **MIME type**: Must match what XHS expects (image/png, image/jpeg, video/mp4)
- **Timing**: Upload processing is async — need to wait before proceeding

## Encoding Pipeline Summary

```
┌─────────────────────────────────────────────────────────┐
│                     TITLE PIPELINE                        │
├─────────────────────────────────────────────────────────┤
│ "我的标题"                                               │
│   ↓ Python: ord() → f'\\u{:04x}'                        │
│ "\\u6211\\u7684\\u6807\\u9898"                           │
│   ↓ JSON: already ASCII-safe                             │
│ {"code": "setter.call(input, '\\u6211...')"}             │
│   ↓ HTTP: UTF-8 bytes (all ASCII)                        │
│   ↓ JS parser: \\uXXXX → Unicode codepoints             │
│ setter.call(input, "我的标题")                            │
│   ↓ React state update via event dispatch                │
│ ✅ Title saved correctly                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CONTENT PIPELINE                       │
├─────────────────────────────────────────────────────────┤
│ "内容第一段\n\n内容第二段"                                │
│   ↓ Python: split('\n') + f'&#{ord(c)};'                │
│ "<p>&#20869;&#23481;...</p><p>&nbsp;</p><p>...</p>"      │
│   ↓ JSON: already ASCII-safe                             │
│ {"code": "editor.innerHTML = '<p>&#20869;...'"}          │
│   ↓ HTTP: UTF-8 bytes (all ASCII)                        │
│   ↓ JS: innerHTML assignment                             │
│   ↓ Browser HTML parser: &#XXXX; → Unicode              │
│   ↓ TipTap syncs from DOM                                │
│ ✅ Content saved correctly                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     IMAGE PIPELINE                        │
├─────────────────────────────────────────────────────────┤
│ image.png (binary file)                                  │
│   ↓ Python: base64.b64encode()                           │
│ "iVBORw0KGgo..." (ASCII string)                          │
│   ↓ JSON: embedded in JS code string                     │
│ {"code": "const b64 = 'iVBORw0KGgo...'"}               │
│   ↓ HTTP: UTF-8 bytes (all ASCII)                        │
│   ↓ JS: atob() → Uint8Array → Blob → File              │
│   ↓ DataTransfer injection                               │
│   ↓ XHS upload handler processes file                    │
│ ✅ Image uploaded correctly                              │
└─────────────────────────────────────────────────────────┘
```

## Quick Reference: Python Encoding Functions

```python
def encode_title_unicode(text):
    """Title: Unicode escapes for React input."""
    return ''.join(f'\\u{ord(c):04x}' if ord(c) > 127 else c for c in text)

def encode_content_html(lines):
    """Content: HTML entities for TipTap editor."""
    return ''.join(
        f'<p>{"&nbsp;" if not line else "".join(f"&#{ord(c)};" if ord(c) > 127 else c for c in line)}</p>'
        for line in lines
    )
```
