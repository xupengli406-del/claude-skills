---
name: xiaohongshu
description: >-
  小红书自动化：通过 Browser Bridge 插件操控 Obsidian 内嵌浏览器，自动发布图文/视频笔记、
  读取个人主页帖子列表、抓取评论数据。利用真实浏览器会话绕过小红书反爬机制。
  当用户需要发布小红书内容、批量管理帖子、读取评论数据时使用。
argument-hint: "[操作: publish_image|publish_video|read_profile|read_comments] [参数]"
user-invocable: true
---

# 小红书自动化 (Xiaohongshu Automation)

你是一个小红书内容自动化助手。通过 Browser Bridge 插件操控 Obsidian 内嵌的 Surfing 浏览器，自动化小红书创作者平台的操作。

## 核心原理

利用 Obsidian Surfing 插件的 Electron webview 作为真实浏览器环境，通过 Browser Bridge 插件暴露的 HTTP API（端口 27182）执行 JavaScript 操作页面。**这不是爬虫，是用户真实浏览器会话的程序化操控**。

```
Python 脚本 ──HTTP:27182──> Browser Bridge Plugin ──executeJS──> Surfing Webview (小红书)
```

## 前置条件

1. **Obsidian** 已安装并运行
2. **Surfing 插件** 已安装（提供内嵌浏览器）
3. **Browser Bridge 插件** 已安装并启用（`plugin/browser-bridge/` 目录中有源码）
4. 用户已在 Surfing 浏览器中**手动登录** xiaohongshu.com
5. **Python 3.8+**（脚本仅使用标准库）

### 安装 Browser Bridge 插件

```bash
# 复制 plugin 到 Obsidian 插件目录
cp -r plugin/browser-bridge/ <vault>/.obsidian/plugins/browser-bridge/
# 在 Obsidian 设置 → 第三方插件 中启用 "Browser Bridge"
```

## 操作列表

### 1. publish_image — 发布图文笔记

**触发词**: 发小红书, 发布笔记, publish to xiaohongshu, 发图文, post to xhs

```bash
python scripts/publish_image_post.py \
  --title "笔记标题" \
  --content "笔记正文内容\n第二段" \
  --image path/to/image.png
```

**流程**:
1. 导航到创作者中心（先访问主站获取 auth cookie）
2. 切换到图文 tab
3. 通过 DataTransfer API 上传图片
4. 用 Unicode escape + React setter 填充标题
5. 用 HTML entity + TipTap innerHTML 填充正文
6. 验证内容 → 点击发布 → 确认成功

### 2. publish_video — 发布视频笔记（实验性）

**触发词**: 发视频, publish video, 发视频笔记

```bash
python scripts/publish_video_post.py \
  --title "视频标题" \
  --content "视频描述" \
  --video path/to/video.mp4
```

### 3. read_profile — 读取个人主页

**触发词**: 看看我的小红书, read my xhs, 小红书数据, 我的帖子

```bash
python scripts/read_profile.py --output posts.json
python scripts/read_profile.py --url "https://www.xiaohongshu.com/user/profile/xxx"
```

### 4. read_comments — 读取帖子评论

**触发词**: 看评论, read comments, 帖子评论, 评论数据

```bash
python scripts/read_comments.py --url "POST_URL" --scroll 3 --output comments.json
```

### 5. delete_post — 删除帖子（未实现）

预留接口，需要从个人主页进入编辑模式删除。

## 编码规则（核心技术）

### 标题：Unicode Escape + React Setter

小红书标题使用 React controlled input，直接 `.value = '中文'` 无效。

```python
# Python 端：转换为 Unicode 转义序列
title_escaped = ''.join(f'\\u{ord(c):04x}' if ord(c) > 127 else c for c in title)

# JS 端：使用 HTMLInputElement.prototype.value.set 绕过 React
js_code = f"""
const input = document.querySelector('input.d-text');
const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
).set;
setter.call(input, '{title_escaped}');
input.dispatchEvent(new Event('input', {{bubbles: true}}));
"""
```

### 正文：HTML Entity + TipTap innerHTML

小红书编辑器使用 TipTap (基于 ProseMirror)，需要通过 innerHTML 注入格式化内容。

```python
# Python 端：将中文转换为 HTML 数字实体
content_html = ''.join(
    f'<p>{"&nbsp;" if not line else "".join(f"&#{ord(c)};" if ord(c) > 127 else c for c in line)}</p>'
    for line in content_lines
)

# JS 端：直接设置 innerHTML
js_code = f"""
const editor = document.querySelector('.tiptap.ProseMirror');
editor.innerHTML = '{content_html}';
editor.dispatchEvent(new Event('input', {{bubbles: true}}));
"""
```

### 图片上传：DataTransfer API

无法触发原生文件选择器，用 DataTransfer API 构造 FileList：

```javascript
const dt = new DataTransfer();
dt.items.add(file);  // file = new File([blob], name, {type})
input.files = dt.files;
input.dispatchEvent(new Event('change', {bubbles: true}));
```

### 网络传输：urllib（非 curl）

Windows 下 curl subprocess 默认 GBK 编码，会损坏 UTF-8 中文。必须用 Python `urllib.request`：

```python
import urllib.request, json
payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(url, data=payload,
    headers={'Content-Type': 'application/json; charset=utf-8'})
```

## 错误处理

| 错误 | 原因 | 解决 |
|------|------|------|
| Bridge unreachable | Obsidian 未运行 / 插件未启用 | 启动 Obsidian，启用 Browser Bridge |
| No embedded browser | 没有打开 Surfing 浏览器标签 | 在 Surfing 中打开任意 URL |
| Redirected to login | 会话过期 | 手动重新登录 xiaohongshu.com |
| Title input not found | XHS 改版 DOM 结构变了 | 更新 CSS 选择器 |
| Upload failed | 文件过大或格式不支持 | 图片 <20MB PNG/JPG; 视频 <100MB MP4 |

## 安全说明

- **不存储密码**：所有认证通过用户已登录的浏览器会话
- **不绕过认证**：如果 cookie 过期，脚本不会尝试自动登录
- **本地通信**：HTTP API 仅绑定 127.0.0.1，不暴露外网
- **用户主动触发**：所有操作需要用户明确调用

## 示例

### AI Agent 自动发帖

```
用户: 帮我发一条小红书，标题"周末探店记录"，内容写3段关于咖啡馆的体验，配图用 D:\photos\cafe.jpg

AI: 好的，我来帮你发布这条笔记。
[调用 publish_image_post.py 执行完整流程]
✅ 笔记发布成功！
```

### 批量读取数据分析

```
用户: 帮我看看我最近的帖子数据

AI: 正在读取你的小红书主页...
[调用 read_profile.py]
你最近有 15 条笔记，其中点赞最高的是"xxx"（2.3k 赞）
```

## 目录结构

```
xiaohongshu/
├── SKILL.md                          主入口（本文件）
├── plugin/
│   └── browser-bridge/
│       ├── main.js                   Browser Bridge 插件源码 (422 行)
│       └── manifest.json             Obsidian 插件清单
├── scripts/
│   ├── README.md                     脚本使用指南
│   ├── bridge.py                     核心 HTTP 客户端模块
│   ├── publish_image_post.py         图文发布脚本
│   ├── publish_video_post.py         视频发布脚本（实验性）
│   ├── read_profile.py               主页帖子读取
│   └── read_comments.py              评论数据读取
└── references/
    ├── architecture.md               技术架构说明
    └── encoding-guide.md             编码方案详解
```
