// render_pdf.mjs — render templates/resume.html to a single-page A4 PDF.
//
// Usage:
//   node scripts/render_pdf.mjs                       # default file names
//   node scripts/render_pdf.mjs --name=李旭鹏 \
//        --role=AIGC产品经理 --suffix=字节_v2          # custom output name
//
// Outputs into ./output/ (auto-created):
//   - <name>_<role>_简历_<suffix>.pdf
//   - preview.png
//
// Expects templates/resume.html to have NO unresolved {{placeholders}}.
// Run from the skill root (`~/.claude/skills/resume-builder/`).

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SKILL_ROOT = path.resolve(__dirname, '..')
const HTML = path.join(SKILL_ROOT, 'templates', 'resume.html')
const OUT_DIR = path.join(SKILL_ROOT, 'output')

function arg(key, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${key}=`))
  return hit ? hit.split('=').slice(1).join('=') : fallback
}

const name = arg('name', '简历')
const role = arg('role', '产品经理')
const suffix = arg('suffix', 'v1')

await fs.mkdir(OUT_DIR, { recursive: true })

const html = await fs.readFile(HTML, 'utf8')
const leftover = html.match(/\{\{[^}]+\}\}/g)
if (leftover) {
  console.error(`[render_pdf] Refusing to render — unresolved placeholders:`)
  console.error(`  ${[...new Set(leftover)].join(', ')}`)
  process.exit(1)
}

const pdfPath = path.join(OUT_DIR, `${name}_${role}_简历_${suffix}.pdf`)
const previewPath = path.join(OUT_DIR, 'preview.png')

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1240, height: 1754 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()
await page.goto(url.pathToFileURL(HTML).href, { waitUntil: 'networkidle' })
await page.emulateMedia({ media: 'print' })

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
})
await page.screenshot({ path: previewPath, fullPage: true })

await browser.close()
console.log(`PDF:     ${pdfPath}`)
console.log(`Preview: ${previewPath}`)
