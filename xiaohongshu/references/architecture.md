# Browser Bridge Architecture

## Overview

The Browser Bridge system enables AI agents to control web pages within Obsidian's embedded browser, bypassing anti-bot detection that blocks traditional automation tools (Playwright, Selenium, Puppeteer, etc.).

## Why Traditional Automation Fails on XHS

Xiaohongshu (小红书) employs aggressive anti-bot measures:

1. **Browser fingerprinting** — Detects headless Chrome, WebDriver flags, automation indicators
2. **Behavioral analysis** — Non-human click patterns, timing, mouse movement
3. **TLS fingerprinting** — Identifies non-standard HTTP clients
4. **Rate limiting** — Blocks rapid automated requests

## The Browser Bridge Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                          Obsidian Desktop App                    │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Claudian   │    │  Browser Bridge   │    │   Surfing     │  │
│  │   (AI Agent) │    │  Plugin           │    │   Plugin      │  │
│  │              │    │                    │    │               │  │
│  │  Python/     │───>│  HTTP Server       │───>│  <webview>    │  │
│  │  Claude Code │    │  :27182            │    │  (Electron)   │  │
│  │              │<───│  JSON UTF-8        │<───│               │  │
│  └──────────────┘    └──────────────────┘    └───────┬───────┘  │
│                                                       │          │
└───────────────────────────────────────────────────────┼──────────┘
                                                        │
                                            Real HTTPS session
                                            (user's cookies)
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  xiaohongshu.com │
                                              │  (production)    │
                                              └─────────────────┘
```

## Component Roles

### 1. Surfing Plugin (Webview Provider)

- Provides Electron `<webview>` tag inside Obsidian
- User logs in manually — establishes real browser session
- Shares Chromium engine with Obsidian (not headless)
- No automation flags, no WebDriver protocol exposed

### 2. Browser Bridge Plugin (HTTP API Layer)

- Creates HTTP server on `127.0.0.1:27182`
- Discovers active `<webview>` elements in workspace
- Proxies JavaScript execution via `webview.executeJavaScript()`
- Handles CORS, JSON encoding, error propagation

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/ping` | Health check |
| GET | `/state` | Current URL + title |
| POST | `/navigate` | Navigate to URL |
| POST | `/eval` | Execute JavaScript |
| GET | `/content` | Get page text |
| GET | `/snapshot` | Interactive elements |
| GET | `/screenshot` | Page screenshot (base64) |
| POST | `/click` | Click element |
| POST | `/type` | Type into input |
| GET | `/back` | Go back |
| GET | `/forward` | Go forward |
| POST | `/open` | Open URL in new Surfing tab |
| GET | `/tabs` | List browser tabs |

### 3. Python Scripts (Automation Logic)

- Pure Python stdlib (no external dependencies)
- `urllib.request` for HTTP (UTF-8 safe on Windows)
- Compose JavaScript snippets for DOM manipulation
- Handle encoding transformations (Unicode escape, HTML entities)

## Security Model

1. **Binding**: HTTP server only listens on `127.0.0.1` (localhost)
2. **No secrets**: No passwords stored; uses existing browser session
3. **User-initiated**: Scripts only run when explicitly called
4. **Session-bound**: If browser session expires, scripts fail gracefully
5. **No fingerprint leakage**: Webview appears as normal Electron browser

## Why This Works Against Anti-Bot

| Anti-bot Check | Result |
|----------------|--------|
| `navigator.webdriver` | `false` (not using WebDriver) |
| Chrome DevTools Protocol | Not attached |
| Automation extension check | No automation extensions |
| TLS fingerprint | Standard Chromium/Electron |
| Cookie validation | Real session cookies from manual login |
| Behavioral pattern | JavaScript executes in-page, indistinguishable from user |

## Comparison with Alternatives

| Approach | XHS Detection | Chinese Encoding | Setup Complexity |
|----------|---------------|------------------|------------------|
| Playwright | ❌ Detected | ✅ OK | Medium |
| Selenium | ❌ Detected | ✅ OK | High |
| Puppeteer | ❌ Detected | ✅ OK | Medium |
| curl/httpie | ❌ No session | ❌ GBK issues | Low |
| Browser Bridge | ✅ Undetected | ✅ UTF-8 safe | Low (plugin) |

## Inspirations

- **Cursor's Open Browser** — Similar pattern of AI controlling embedded browser
- **Obsidian Surfing** — Provides the webview infrastructure
- **Chrome DevTools Protocol** — Conceptually similar but detectable
