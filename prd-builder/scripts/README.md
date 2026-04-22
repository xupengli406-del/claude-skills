# scripts/

工具脚本，由 `SKILL.md` 五阶段工作流调用。所有脚本必须从 **skill 根目录**运行。

---

## 依赖一次性安装

`scan_codebase.mjs` 仅用 Node.js 标准库（fs / path / url），**无需安装任何 npm 包**。

需要的只是 Node.js ≥ 18。

```bash
node --version   # 期望 v18+ 任意版本
```

---

## 工具清单

### `scan_codebase.mjs`

反向挖掘 demo 代码库，导出"模块 × 功能点"清单。**Stage 1 Mine** 用。

```bash
node scripts/scan_codebase.mjs <repo_path>
# 例：
node scripts/scan_codebase.mjs D:/work/my-demo
```

输出（落到 `~/.claude/skills/prd-builder/output/`）：

| 文件 | 用途 |
| --- | --- |
| `inventory.json` | 机器可读的全量清单（路由 / Modal / store / 计费 / 外部依赖 / OAuth / env） |
| `inventory.md` | 给用户看的中文确认稿（直接发给用户对齐模块树） |

扫描启发式（详见 `../codebase-mining.md`）：

| 类别 | 抓取规则 |
| --- | --- |
| 框架 | `package.json` 里 `react/next/vue/svelte` |
| UI 库 | `tailwind/antd/mui/shadcn-ui` |
| 状态管理 | `zustand/redux toolkit/jotai/recoil` |
| 路由文件 | `src/router*` `src/App.tsx` `src/routes/` |
| 页面 | `src/pages/**` `app/**/page.tsx` `*Pane.tsx` `*View.tsx` |
| 功能点候选 | `*Modal.tsx` `*Dialog.tsx` `*Drawer.tsx` `*Popover.tsx` |
| 业务实体 | `src/store/*` `src/slices/*` |
| 计费数据 | `src/constants/pricing*` |
| 外部依赖 | grep `https://...` 排除 localhost / example.com |
| OAuth | grep google/apple/discord/github/wechat |
| 环境变量 | `process.env.X` `import.meta.env.X` |

自动跳过：`node_modules / .git / dist / build / .next / coverage / legacy / deprecated / __archive`。

### 输出后的下一步

把 `output/inventory.md` 发给用户，让他确认模块清单。确认后再走 Stage 2（填 `templates/prd.md` 模块总览）。

---

## 没有自动渲染脚本？

PRD 不像简历那样需要 PDF —— 它的目标就是 markdown。直接把生成的 markdown：

1. 复制到飞书 Wiki（`<grid>` `<lark-table>` `<image token>` 都会被原生识别）
2. 推到 GitHub 仓库做版本管理
3. 让团队评审

如果将来需要 markdown 转 PDF，可以照搬 `resume-builder/scripts/render_pdf.mjs` 的范式（playwright + chromium），但当前不在 v1 范围。

---

## 飞书图片回灌（可选）

PRD 里的 `<image token="待补"/>` 在评审通过后通常需要灌真图。两种路径：

1. **手动**：在飞书里截图直接粘贴，图片 token 由飞书自动生成。
2. **批量**：参考 `xupengli406-del/video-ai-agent-prd` 仓库的 `fetch_images.mjs`：用 `@modelcontextprotocol/sdk` 直连飞书 MCP，按 token 批量下载/回灌。

后者主要用于 PRD 已经写好但需要导出成离线可读 markdown（如 GitHub）时。
