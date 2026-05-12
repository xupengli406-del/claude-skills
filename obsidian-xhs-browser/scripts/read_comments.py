# -*- coding: utf-8 -*-
"""
Read comments from a Xiaohongshu post via Browser Bridge.

Navigates to a specific post and extracts all visible comments
including author, content, likes, and timestamps.

Usage:
    python read_comments.py --url POST_URL
    python read_comments.py --url POST_URL --output comments.json
    python read_comments.py --url POST_URL --scroll 3  # Scroll 3 times to load more
"""

import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bridge import bridge, js, wait, get_state, navigate, check_bridge

# ─── Constants ────────────────────────────────────────────────────────────────

XHS_MAIN = "https://www.xiaohongshu.com"


def navigate_to_post(post_url):
    """Navigate to the post page."""
    print(f"[1/3] Navigating to post...")

    # Visit main site first for auth
    navigate(XHS_MAIN)
    wait(2)

    r = navigate(post_url)
    if "error" in r:
        print(f"  ERROR: {r['error']}")
        return False
    wait(3)

    state = get_state()
    url = state.get("url", "")
    if "login" in url.lower():
        print("  ERROR: Not logged in. Please log in manually first.")
        return False

    print(f"  OK: Loaded post page")
    return True


def extract_post_info():
    """Extract the post's own content."""
    print("[2/3] Extracting post content...")
    r = js(
        """(function() {
    try {
        const title = document.querySelector('[class*="title"], h1[class*="note"]')?.textContent?.trim() || '';
        const content = document.querySelector('[class*="desc"], [class*="content"], .note-text')?.textContent?.trim() || '';
        const author = document.querySelector('[class*="author-name"], [class*="nickname"]')?.textContent?.trim() || '';
        const likeBtn = document.querySelector('[class*="like"][class*="count"], [class*="like-wrapper"] span');
        const likes = likeBtn?.textContent?.trim() || '0';
        const collectBtn = document.querySelector('[class*="collect"][class*="count"]');
        const collects = collectBtn?.textContent?.trim() || '0';
        const commentCount = document.querySelector('[class*="comment"][class*="count"]');
        const comments = commentCount?.textContent?.trim() || '0';

        return JSON.stringify({
            title, content: content.slice(0, 500), author, likes, collects, comments
        });
    } catch(e) { return JSON.stringify({error: e.toString()}); }
})()"""
    )
    result = r.get("result", "{}")
    try:
        data = json.loads(result)
        if "error" not in data:
            print(f"  Title: {data.get('title', 'N/A')[:50]}")
            print(f"  Author: {data.get('author', 'N/A')}")
            print(f"  Likes: {data.get('likes', '0')} | Collects: {data.get('collects', '0')} | Comments: {data.get('comments', '0')}")
        return data
    except (json.JSONDecodeError, TypeError):
        return {}


def extract_comments(scroll_times=2):
    """Extract comments from the post page."""
    print(f"[3/3] Extracting comments (scroll {scroll_times}x to load more)...")

    # Scroll to comments section
    js("""document.querySelector('[class*="comment"]')?.scrollIntoView({behavior: 'smooth'})""")
    wait(2)

    # Scroll multiple times to load more comments
    for i in range(scroll_times):
        js("window.scrollBy(0, 800)")
        wait(1.5)

    r = js(
        """(function() {
    try {
        const comments = [];
        // Try multiple selectors for comment items
        const items = document.querySelectorAll(
            '[class*="comment-item"], [class*="comment-inner"], [class*="comment"] [class*="item"]'
        );
        items.forEach((item, i) => {
            if (i >= 100) return; // Limit
            const author = item.querySelector('[class*="name"], [class*="author"], [class*="nickname"]')?.textContent?.trim() || '';
            const content = item.querySelector('[class*="content"], [class*="text"], p')?.textContent?.trim() || '';
            const time = item.querySelector('[class*="time"], [class*="date"], time')?.textContent?.trim() || '';
            const likeEl = item.querySelector('[class*="like"] span, [class*="count"]');
            const likes = likeEl?.textContent?.trim() || '0';

            if (content) {
                comments.push({index: i, author, content: content.slice(0, 300), time, likes});
            }
        });
        return JSON.stringify({count: comments.length, comments});
    } catch(e) { return JSON.stringify({error: e.toString()}); }
})()"""
    )
    result = r.get("result", "{}")
    try:
        data = json.loads(result)
        if "error" in data:
            print(f"  ERROR: {data['error']}")
            return []
        comments = data.get("comments", [])
        print(f"  Found {data.get('count', 0)} comments")
        for c in comments[:5]:
            print(f"    @{c.get('author', '?')}: {c.get('content', '')[:50]}")
        if len(comments) > 5:
            print(f"    ... and {len(comments) - 5} more")
        return comments
    except (json.JSONDecodeError, TypeError):
        print(f"  Could not parse comments")
        return []


def read_comments(post_url, scroll_times=2, output_file=None):
    """Full comment reading flow."""
    print("=" * 60)
    print("Xiaohongshu Comment Reader")
    print("=" * 60)
    print(f"  URL: {post_url}")
    print("=" * 60)

    if not check_bridge():
        return None

    if not navigate_to_post(post_url):
        return None

    post_info = extract_post_info()
    comments = extract_comments(scroll_times)

    result = {
        "post": post_info,
        "comments": comments,
        "url": post_url,
    }

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\nSaved to: {output_file}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Read comments from a Xiaohongshu post"
    )
    parser.add_argument("--url", required=True, help="Post URL")
    parser.add_argument("--scroll", type=int, default=2, help="Scroll times to load more (default: 2)")
    parser.add_argument("--output", "-o", help="Output JSON file path")

    args = parser.parse_args()
    result = read_comments(args.url, args.scroll, args.output)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
