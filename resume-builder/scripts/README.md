# scripts/

工具脚本，由 `SKILL.md` 五阶段工作流调用。所有脚本必须从 **skill 根目录**运行（`~/.claude/skills/resume-builder/`），而不是从 `scripts/` 目录运行。

---

## 依赖一次性安装

```bash
# Python 端（用于 extract_pdf.py）
pip install pymupdf

# Node 端（用于 render_pdf.mjs）
npm init -y                              # 仅首次
npm install playwright
npm install pdf-lib
npx playwright install chromium          # 下载 Chromium 内核
```

如果机器没有下载 Playwright Chromium，脚本会尝试使用系统 Chrome/Edge；也可通过 `RESUME_BROWSER_PATH` 指定浏览器可执行文件。不要在 Skill 中写死用户名或机器专属路径。

如果 `~/.claude/skills/resume-builder/` 下没有 `package.json`，先 `npm init -y` 再 `npm install playwright`。playwright 与 chromium 加起来约 200MB，下载一次后所有后续渲染秒级完成。

---

## 工具清单

### `extract_pdf.py`

从已有 PDF 简历提取文本与高分辨率页面图。**Stage 1 Intake** 用。

```bash
python scripts/extract_pdf.py /path/to/old_resume.pdf
```

输出（落到 `output/`）：

| 文件 | 说明 |
| --- | --- |
| `origin_pages/page_XX.png` | 2.5x DPI 页面图，jsPDF/Canva 导出的图形化 PDF 必须靠它视觉读取 |
| `origin_resume.md` | 文本层提取结果（图形化 PDF 会是空的，正常现象） |
| `origin_spans.json` | 每个 span 的 font/size/color/bbox，用于排版还原对照 |

### `render_pdf.mjs`

把 `templates/resume.html` 渲染成单页 A4 PDF + 预览图。**Stage 5 Render** 用。

```bash
# 默认输出 output/简历_产品经理_简历_v1.pdf
node scripts/render_pdf.mjs

# 自定义文件名（推荐每次都给参数）
node scripts/render_pdf.mjs --name=李旭鹏 --role=AIGC产品经理 --suffix=字节_v2
```

参数：

| 参数 | 默认 | 用途 |
| --- | --- | --- |
| `--name` | `简历` | 文件名前缀（用户姓名） |
| `--role` | `产品经理` | 岗位简写 |
| `--suffix` | `v1` | 版本号或公司简写（v2 / 字节_v2 / MiniMax_v1 …） |

输出：

| 文件 | 说明 |
| --- | --- |
| `output/<name>_<role>_简历_<suffix>.pdf` | 最终交付物 |
| `output/preview.png` | 整页截图，agent **必须读这张图**确认单页排版无误 |

**安全检查**：脚本会扫 `templates/resume.html` 是否还残留 `{{占位符}}`，有就拒绝渲染并列出残留项，避免把模板当成成品交付。

---

## 飞书素材抓取（可选，参考代码片段）

如果用户引用飞书 Wiki 文档，用 `user-feishu-mcp` MCP server。常用工具：

- `fetch-doc` — 抓 markdown 正文（图片是 `<image token=.../>` 占位）
- `fetch-file` — 按 image_token 拉真图（返回 base64，需要 Node 直连 MCP SDK 才能拿到原始字节，Cursor agent 直接调会被自动渲染成图片预览）

批量回灌图片的 Node 脚本范式见 `xupengli406-del/video-ai-agent-prd` 仓库的 `fetch_images.mjs`。
