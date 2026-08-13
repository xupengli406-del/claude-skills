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

async function launchBrowser() {
  try {
    return await chromium.launch()
  } catch (defaultError) {
    const candidates = [
      process.env.RESUME_BROWSER_PATH,
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ].filter(Boolean)

    for (const executablePath of candidates) {
      try {
        await fs.access(executablePath)
        return await chromium.launch({ executablePath })
      } catch {}
    }

    throw defaultError
  }
}

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

const browser = await launchBrowser()
const context = await browser.newContext({
  viewport: { width: 1240, height: 1754 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()
await page.goto(url.pathToFileURL(HTML).href, { waitUntil: 'networkidle' })
await page.emulateMedia({ media: 'print' })

const layoutChecks = await page.evaluate(() => {
  const skillLabels = [...document.querySelectorAll('.kv-row > div:first-child')]
  const wrappedLabels = skillLabels
    .filter((node) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return range.getClientRects().length !== 1
    })
    .map((node) => node.textContent.trim())
  const pageHeight = document.querySelector('.page').getBoundingClientRect().height
  return { wrappedLabels, pageHeight }
})

if (layoutChecks.wrappedLabels.length) {
  console.error(`[render_pdf] Refusing to render — wrapped skill labels: ${layoutChecks.wrappedLabels.join(', ')}`)
  await browser.close()
  process.exit(1)
}

const a4CssHeight = (297 / 25.4) * 96
if (layoutChecks.pageHeight > a4CssHeight + 1) {
  console.error(`[render_pdf] Refusing to render — content exceeds one A4 page (${layoutChecks.pageHeight.toFixed(1)}px > ${a4CssHeight.toFixed(1)}px)`)
  await browser.close()
  process.exit(1)
}

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
})
await page.screenshot({ path: previewPath, fullPage: true })

try {
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.load(await fs.readFile(pdfPath))
  if (pdfDoc.getPageCount() !== 1) {
    console.error(`[render_pdf] Refusing output — expected 1 PDF page, got ${pdfDoc.getPageCount()}`)
    await browser.close()
    process.exit(1)
  }
} catch (error) {
  console.error(`[render_pdf] PDF page-count verification unavailable: ${error.message}`)
  await browser.close()
  process.exit(1)
}

await browser.close()
console.log(`PDF:     ${pdfPath}`)
console.log(`Preview: ${previewPath}`)
