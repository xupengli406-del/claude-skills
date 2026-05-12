# -*- coding: utf-8 -*-
"""
Browser Bridge Client Module

Reusable Python wrapper for the Browser Bridge HTTP API (port 27182).
The Browser Bridge plugin runs inside Obsidian and exposes the Surfing
webview to external tools. This module provides the Python interface.

Usage:
    from bridge import bridge, js, wait, get_state, navigate

Requirements:
    - Obsidian with Surfing plugin (webview)
    - Browser Bridge plugin installed and enabled
    - A URL already open in the Surfing browser
"""

import json
import urllib.request
import time
import sys

# Default bridge endpoint
BRIDGE_URL = "http://127.0.0.1:27182"


def bridge(endpoint, data=None):
    """
    Send a request to the Browser Bridge HTTP API.

    Args:
        endpoint: API path (e.g., '/eval', '/state', '/navigate')
        data: Optional dict payload (will be JSON-encoded as UTF-8)

    Returns:
        dict: JSON response from the bridge

    Raises:
        ConnectionError: If the bridge is unreachable
    """
    url = BRIDGE_URL + endpoint
    if data:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
    else:
        req = urllib.request.Request(url)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        return {
            "error": f"Bridge unreachable at {BRIDGE_URL}. "
            f"Is Obsidian running with Browser Bridge plugin enabled? "
            f"Detail: {e}"
        }
    except Exception as e:
        return {"error": str(e)}


def js(code):
    """
    Execute JavaScript code in the active Surfing webview.

    Args:
        code: JavaScript code string to evaluate

    Returns:
        dict: {'result': <return_value>} or {'error': <message>}
    """
    return bridge("/eval", {"code": code})


def wait(seconds):
    """Sleep for specified seconds with progress indicator."""
    time.sleep(seconds)


def get_state():
    """
    Get current state of the active webview.

    Returns:
        dict: {'url': '...', 'title': '...'} or {'error': '...'}
    """
    return bridge("/state")


def navigate(url):
    """
    Navigate the active webview to a URL.

    Args:
        url: Target URL

    Returns:
        dict: {'url': '...', 'title': '...'} or {'error': '...'}
    """
    return bridge("/navigate", {"url": url})


def get_content():
    """
    Get text content of the current page.

    Returns:
        dict: {'url': '...', 'title': '...', 'text': '...'} or {'error': '...'}
    """
    return bridge("/content")


def get_snapshot():
    """
    Get interactive element snapshot of the current page.

    Returns:
        dict: {'url': '...', 'title': '...', 'interactive': [...]} or {'error': '...'}
    """
    return bridge("/snapshot")


def click(selector=None, index=None, x=None, y=None):
    """
    Click an element on the page.

    Args:
        selector: CSS selector string
        index: Interactive element index (from snapshot)
        x, y: Coordinates for positional click

    Returns:
        dict: {'clicked': True, ...} or {'error': '...'}
    """
    data = {}
    if selector:
        data["selector"] = selector
    elif index is not None:
        data["index"] = index
    elif x is not None and y is not None:
        data["x"] = x
        data["y"] = y
    else:
        return {"error": "Provide selector, index, or x+y coordinates"}
    return bridge("/click", data)


def type_text(selector, text):
    """
    Type text into an input element.

    Args:
        selector: CSS selector for the input element
        text: Text to type

    Returns:
        dict: {'typed': True} or {'error': '...'}
    """
    return bridge("/type", {"selector": selector, "text": text})


def ping():
    """
    Check if the bridge is alive.

    Returns:
        dict: {'ok': True, 'plugin': 'browser-bridge', 'version': '...'} or {'error': '...'}
    """
    return bridge("/ping")


def check_bridge():
    """
    Verify bridge connectivity and print status.

    Returns:
        bool: True if bridge is reachable, False otherwise
    """
    r = ping()
    if "error" in r:
        print(f"[ERROR] Bridge check failed: {r['error']}", file=sys.stderr)
        print(
            "\nTroubleshooting:",
            "\n  1. Is Obsidian running?",
            "\n  2. Is the Browser Bridge plugin enabled?",
            "\n  3. Is a URL open in the Surfing browser?",
            file=sys.stderr,
        )
        return False
    print(f"[OK] Bridge connected: {r.get('plugin')} v{r.get('version')}")
    return True


# ─── Encoding Utilities ───────────────────────────────────────────────────────


def encode_title_unicode(text):
    """
    Encode text as JavaScript Unicode escape sequences.
    Required for React controlled inputs that intercept normal value setting.

    Args:
        text: Chinese/Unicode text string

    Returns:
        str: JS-safe Unicode escaped string (e.g., '\\u4f60\\u597d')
    """
    return "".join(
        f"\\u{ord(c):04x}" if ord(c) > 127 else c for c in text
    )


def encode_content_html(lines):
    """
    Encode content lines as HTML with entity encoding.
    Required for TipTap/ProseMirror editor that uses innerHTML.

    Args:
        lines: List of text lines (empty string = blank line)

    Returns:
        str: HTML string with <p> tags and &#xxx; entities
    """
    parts = []
    for line in lines:
        if not line:
            parts.append("<p>&nbsp;</p>")
        else:
            encoded = "".join(
                f"&#{ord(c)};" if ord(c) > 127 else c for c in line
            )
            parts.append(f"<p>{encoded}</p>")
    return "".join(parts)


if __name__ == "__main__":
    # Quick connectivity test
    print("Testing Browser Bridge connection...")
    if check_bridge():
        state = get_state()
        print(f"Current page: {state.get('title', 'N/A')}")
        print(f"URL: {state.get('url', 'N/A')}")
    else:
        sys.exit(1)
