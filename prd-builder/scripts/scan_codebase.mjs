// scan_codebase.mjs — Reverse-mine a demo repo into a PRD-ready inventory.
//
// Usage:
//   node scripts/scan_codebase.mjs <repo_path>
//
// Outputs (into the skill's ./output/ folder):
//   inventory.json   — machine-readable module/route/component/store inventory
//   inventory.md     — human-readable confirmation draft (paste to user for sign-off)
//
// Heuristics (see ../codebase-mining.md for rationale):
//   - Routes from src/router*, src/pages, src/routes, src/App.tsx
//   - Modal/Dialog components from src/components/**/*Modal*|*Dialog*|*Drawer*|*Popover*
//   - Stores from src/store/* or src/slices/*
//   - Pricing constants from src/constants/pricing*
//   - External deps from grep of https://, fetch(, axios in src/
//
// This is intentionally heuristic, not bullet-proof — confirm the result with
// the user before using it as the PRD module tree.

import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SKILL_ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(SKILL_ROOT, 'output')

const repo = path.resolve(process.argv[2] || '.')
console.log(`[scan] target repo: ${repo}`)

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache',
  'coverage', '.turbo', '.vercel', '.idea', '.vscode',
  'legacy', 'deprecated', '__archive', '__deprecated', 'backup',
])

async function* walk(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

async function safeRead(p) {
  try {
    return await fs.readFile(p, 'utf8')
  } catch {
    return null
  }
}

async function readJsonSafe(p) {
  const txt = await safeRead(p)
  if (!txt) return null
  try {
    return JSON.parse(txt)
  } catch {
    return null
  }
}

const inventory = {
  repo,
  scannedAt: new Date().toISOString(),
  techStack: {},
  modals: [],
  pages: [],
  panes: [],
  views: [],
  stores: [],
  pricingFiles: [],
  routerFiles: [],
  externalDeps: new Set(),
  oauthProviders: new Set(),
  envVars: new Set(),
}

const pkg = await readJsonSafe(path.join(repo, 'package.json'))
if (pkg) {
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  inventory.techStack = {
    name: pkg.name,
    version: pkg.version,
    framework:
      deps.next ? 'Next.js' :
      deps.react ? 'React' :
      deps.vue ? 'Vue' :
      deps.svelte ? 'Svelte' :
      'unknown',
    bundler: deps.vite ? 'Vite' : deps.webpack ? 'Webpack' : (deps.next ? 'Next built-in' : 'unknown'),
    typescript: !!deps.typescript,
    uiLib:
      deps.tailwindcss ? 'Tailwind CSS' :
      deps.antd ? 'Ant Design' :
      deps['@mui/material'] ? 'MUI' :
      deps['shadcn-ui'] ? 'shadcn/ui' :
      'unknown',
    stateMgmt:
      deps.zustand ? 'zustand' :
      deps['@reduxjs/toolkit'] ? 'redux toolkit' :
      deps.jotai ? 'jotai' :
      deps.recoil ? 'recoil' :
      'unknown',
    notableDeps: Object.keys(deps).filter((d) =>
      /^(stripe|@stripe|next-auth|@auth|firebase|supabase|playwright|playwright-core)/.test(d)
    ),
  }
}

const REL_FROM = (p) => path.relative(repo, p).replace(/\\/g, '/')

const URL_RE = /https?:\/\/[A-Za-z0-9._\-/?#=&%~+:]+/g
const ENV_RE = /process\.env\.([A-Z0-9_]+)|import\.meta\.env\.([A-Z0-9_]+)/g

for await (const file of walk(repo)) {
  const rel = REL_FROM(file)
  const ext = path.extname(file).toLowerCase()

  if (/(?:^|\/)(src|app)\/.*Modal\.(t|j)sx?$/i.test(rel)) inventory.modals.push(rel)
  if (/(?:^|\/)(src|app)\/.*Dialog\.(t|j)sx?$/i.test(rel)) inventory.modals.push(rel)
  if (/(?:^|\/)(src|app)\/.*Drawer\.(t|j)sx?$/i.test(rel)) inventory.modals.push(rel)
  if (/(?:^|\/)(src|app)\/.*Popover\.(t|j)sx?$/i.test(rel)) inventory.modals.push(rel)

  if (/(?:^|\/)(src|app)\/pages\/.+\.(t|j)sx?$/i.test(rel)) inventory.pages.push(rel)
  if (/(?:^|\/)app\/.+\/page\.(t|j)sx?$/i.test(rel)) inventory.pages.push(rel)
  if (/(?:^|\/)(src|app)\/.*Pane\.(t|j)sx?$/i.test(rel)) inventory.panes.push(rel)
  if (/(?:^|\/)(src|app)\/.*View\.(t|j)sx?$/i.test(rel)) inventory.views.push(rel)

  if (/(?:^|\/)(src|app)\/(store|slices|stores)\//i.test(rel) && /\.(t|j)sx?$/.test(rel)) {
    inventory.stores.push(rel)
  }

  if (/(?:^|\/)(src|app)\/constants\/pricing/i.test(rel)) inventory.pricingFiles.push(rel)
  if (/(?:^|\/)(src|app)\/(router|routes|App)\.(t|j)sx?$/i.test(rel)) inventory.routerFiles.push(rel)
  if (/(?:^|\/)(src|app)\/router\//i.test(rel) && /\.(t|j)sx?$/.test(rel)) inventory.routerFiles.push(rel)

  if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) continue
  const content = await safeRead(file)
  if (!content) continue

  let m
  while ((m = URL_RE.exec(content)) !== null) {
    const u = m[0].replace(/[.,;'")\]}]+$/, '')
    try {
      const host = new URL(u).host
      if (!/(localhost|127\.0\.0\.1|example\.com|github\.io)/.test(host)) {
        inventory.externalDeps.add(host)
      }
    } catch { /* ignore */ }
  }
  while ((m = ENV_RE.exec(content)) !== null) {
    inventory.envVars.add(m[1] || m[2])
  }

  if (/google.*(?:oauth|signin|login)|GOOGLE_CLIENT_ID/i.test(content)) inventory.oauthProviders.add('Google')
  if (/apple.*(?:oauth|signin|login)|APPLE_CLIENT_ID/i.test(content)) inventory.oauthProviders.add('Apple')
  if (/discord.*(?:oauth|signin|login)|DISCORD_CLIENT_ID/i.test(content)) inventory.oauthProviders.add('Discord')
  if (/github.*(?:oauth|signin|login)|GITHUB_CLIENT_ID/i.test(content)) inventory.oauthProviders.add('GitHub')
  if (/wechat|weixin/i.test(content)) inventory.oauthProviders.add('WeChat')
}

inventory.externalDeps = [...inventory.externalDeps].sort()
inventory.oauthProviders = [...inventory.oauthProviders].sort()
inventory.envVars = [...inventory.envVars].sort()
const dedup = (a) => [...new Set(a)].sort()
inventory.modals = dedup(inventory.modals)
inventory.pages = dedup(inventory.pages)
inventory.panes = dedup(inventory.panes)
inventory.views = dedup(inventory.views)
inventory.stores = dedup(inventory.stores)
inventory.pricingFiles = dedup(inventory.pricingFiles)
inventory.routerFiles = dedup(inventory.routerFiles)

await fs.mkdir(OUT_DIR, { recursive: true })
const jsonPath = path.join(OUT_DIR, 'inventory.json')
await fs.writeFile(jsonPath, JSON.stringify(inventory, null, 2), 'utf8')

const md = `# 反向挖掘结果（待用户确认）

> 由 \`scripts/scan_codebase.mjs\` 自动生成，扫描时间 ${inventory.scannedAt}
> 仓库：\`${inventory.repo}\`

## 技术栈

| 项 | 值 |
| --- | --- |
| 项目名 | ${inventory.techStack.name || '—'} |
| 版本 | ${inventory.techStack.version || '—'} |
| 框架 | ${inventory.techStack.framework || '—'} |
| 构建 | ${inventory.techStack.bundler || '—'} |
| TypeScript | ${inventory.techStack.typescript ? '✓' : '✗'} |
| UI 库 | ${inventory.techStack.uiLib || '—'} |
| 状态管理 | ${inventory.techStack.stateMgmt || '—'} |
| 显著依赖 | ${(inventory.techStack.notableDeps || []).join(', ') || '—'} |

## 候选模块（顶层路由 / 页面 / Pane）

### 路由文件
${inventory.routerFiles.map((p) => `- \`${p}\``).join('\n') || '_未发现明显路由文件_'}

### Page / Pane / View 组件
${[...inventory.pages, ...inventory.panes, ...inventory.views].map((p) => `- \`${p}\``).join('\n') || '_未发现_'}

## 候选功能点（Modal / Dialog / Drawer / Popover）
${inventory.modals.map((p) => `- \`${p}\``).join('\n') || '_未发现_'}

## 业务实体（store / slices）
${inventory.stores.map((p) => `- \`${p}\``).join('\n') || '_未发现_'}

## 计费 / 配额 常量文件
${inventory.pricingFiles.map((p) => `- \`${p}\``).join('\n') || '_未发现_'}

## 外部依赖（grep https:// + fetch + axios 推得）
${inventory.externalDeps.map((d) => `- ${d}`).join('\n') || '_未发现外部域名_'}

## OAuth provider
${inventory.oauthProviders.map((d) => `- ${d}`).join('\n') || '_未发现_'}

## 环境变量（process.env / import.meta.env）
${inventory.envVars.map((d) => `- \`${d}\``).join('\n') || '_未发现_'}

---

请确认：

1. 哪些 page/pane 是 PRD 一级模块？建议按用户路径排序（登录 → 工作区 → 创作 → 文件 → 计费）。
2. 每个 modal/dialog 落到哪个模块下？是否有需要合并 / 拆分的？
3. 外部依赖里哪些是真正接入的，哪些只是占位 / Mock？
4. 是否有页面级功能（无 Modal）需要补到功能点清单里？

确认后我用 \`templates/prd.md\` 起骨架，逐个功能点按 \`feature-point-template.md\` 填写。
`

await fs.writeFile(path.join(OUT_DIR, 'inventory.md'), md, 'utf8')

console.log(`[scan] inventory:    ${jsonPath}`)
console.log(`[scan] confirmation: ${path.join(OUT_DIR, 'inventory.md')}`)
console.log(`[scan] modals: ${inventory.modals.length}, pages: ${inventory.pages.length}, panes: ${inventory.panes.length}, stores: ${inventory.stores.length}, externalDeps: ${inventory.externalDeps.length}`)
