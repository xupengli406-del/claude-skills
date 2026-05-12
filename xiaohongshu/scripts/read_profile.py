# -*- coding: utf-8 -*-
"""
Read Xiaohongshu Profile & Post List via Browser Bridge.

Navigates to the user's profile page and extracts post list information
including titles, engagement metrics, and links.

Usage:
    python read_profile.py                    # Read current user's profile
    python read_profile.py --url PROFILE_URL  # Read specific profile
    python read_profile.py --output posts.json  # Save to JSON file
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
XHS_PROFILE = "https://www.xiaohongshu.com/user/profile"


def navigate_to_profile(profile_url=None):
    """Navigate to profile page."""
    print("[1/3] Navigating to profile...")
    target = profile_url or XHS_PROFILE

    # Visit main site first for auth
    navigate(XHS_MAIN)
    wait(2)

    r = navigate(target)
    if "error" in r:
        print(f"  ERROR: {r['error']}")
        return False
    wait(3)

    state = get_state()
    url = state.get("url", "")
    if "login" in url.lower():
        print("  ERROR: Not logged in. Please log in manually first.")
        return False

    print(f"  OK: On profile page")
    return True


def extract_profile_info():
    """Extract profile metadata."""
    print("[2/3] Extracting profile info...")
    r = js(
        """(function() {
    try {
        const name = document.querySelector('[class*="user-name"]')?.textContent?.trim() ||
                     document.querySelector('.user-nickname')?.textContent?.trim() || 'Unknown';
        const desc = document.querySelector('[class*="user-desc"]')?.textContent?.trim() ||
                     document.querySelector('.user-desc')?.textContent?.trim() || '';
        const statsEls = document.querySelectorAll('[class*="count"], [class*="num"]');
        const stats = {};
        statsEls.forEach(el => {
            const label = el.closest('[class*="item"]')?.textContent?.trim() || '';
            const num = el.textContent?.trim() || '0';
            if (label.includes('关注')) stats.following = num;
            else if (label.includes('粉丝')) stats.followers = num;
            else if (label.includes('赞')) stats.likes = num;
        });
        return JSON.stringify({name, desc, stats});
    } catch(e) { return JSON.stringify({error: e.toString()}); }
})()"""
    )
    result = r.get("result", "{}")
    try:
        data = json.loads(result)
        if "error" not in data:
            print(f"  Name: {data.get('name', 'N/A')}")
            print(f"  Bio: {data.get('desc', 'N/A')[:60]}")
            stats = data.get("stats", {})
            if stats:
                print(f"  Followers: {stats.get('followers', 'N/A')}")
        return data
    except (json.JSONDecodeError, TypeError):
        print(f"  Could not parse profile info")
        return {}


def extract_posts():
    """Extract post list from profile page."""
    print("[3/3] Extracting posts...")

    # Scroll to load posts
    js("window.scrollTo(0, document.body.scrollHeight / 2)")
    wait(2)

    r = js(
        """(function() {
    try {
        const posts = [];
        // Try multiple selectors for post cards
        const cards = document.querySelectorAll(
            '[class*="note-item"], [class*="post-item"], [class*="card"], section[class*="note"]'
        );
        cards.forEach((card, i) => {
            if (i >= 50) return; // Limit to 50 posts
            const titleEl = card.querySelector('[class*="title"], h3, a[class*="title"]');
            const linkEl = card.querySelector('a[href*="/explore/"], a[href*="/discovery/"]') ||
                           card.querySelector('a[href]');
            const likeEl = card.querySelector('[class*="like"], [class*="count"]');
            const imgEl = card.querySelector('img');

            const post = {
                index: i,
                title: titleEl?.textContent?.trim() || '',
                link: linkEl?.href || '',
                likes: likeEl?.textContent?.trim() || '',
                thumbnail: imgEl?.src || ''
            };
            if (post.title || post.link) posts.push(post);
        });
        return JSON.stringify({count: posts.length, posts: posts});
    } catch(e) { return JSON.stringify({error: e.toString()}); }
})()"""
    )
    result = r.get("result", "{}")
    try:
        data = json.loads(result)
        if "error" in data:
            print(f"  ERROR: {data['error']}")
            return []
        posts = data.get("posts", [])
        print(f"  Found {data.get('count', 0)} posts")
        for p in posts[:5]:
            print(f"    - {p.get('title', 'Untitled')[:40]} ({p.get('likes', '?')} likes)")
        if len(posts) > 5:
            print(f"    ... and {len(posts) - 5} more")
        return posts
    except (json.JSONDecodeError, TypeError):
        print(f"  Could not parse posts")
        return []


def read_profile(profile_url=None, output_file=None):
    """Full profile reading flow."""
    print("=" * 60)
    print("Xiaohongshu Profile Reader")
    print("=" * 60)

    if not check_bridge():
        return None

    if not navigate_to_profile(profile_url):
        return None

    profile = extract_profile_info()
    posts = extract_posts()

    result = {"profile": profile, "posts": posts, "url": get_state().get("url", "")}

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\nSaved to: {output_file}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Read Xiaohongshu profile and post list"
    )
    parser.add_argument("--url", help="Profile URL (default: current user)")
    parser.add_argument("--output", "-o", help="Output JSON file path")

    args = parser.parse_args()
    result = read_profile(args.url, args.output)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
