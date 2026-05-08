---
name: resume-builder
description: >-
  Builds and maintains the user's personal Chinese resume as a single-page A4
  PDF, using a consistent black/white minimalist layout, senior-HR writing
  voice, and pixel-locked HTML+Playwright pipeline. Use when the user mentions
  resume, CV, 简历, 改简历, 补简历, 加经历, 投某公司/某岗位, 简历定制, 重新出一版简历,
  or attaches/refers to an existing resume PDF/HTML.
---

# resume-builder

Sustains the user's personal resume as a versioned product. Every output is
a **single-page A4 PDF** with a fixed black/white visual identity and senior
HR writing voice, regardless of which job/company it targets.

## Trigger scenarios

Apply this skill when the user asks to:

- Add, remove, or rewrite an experience block (project / job / award).
- Tailor the resume for a specific role or company.
- Refresh wording (tone, verbs, density) without changing structure.
- Convert a fresh source (Feishu doc, code repo, interview notes) into resume bullets.
- Re-render the PDF after any textual change.

If the user already attached a previous PDF/HTML, treat it as the **base
version** and do an incremental edit. Otherwise, start from
[templates/resume.html](templates/resume.html).

## Five-stage workflow

```
Task progress (copy + check off):
- [ ] 1. Intake     — collect raw material, identify base version
- [ ] 2. Position   — pick role × company variant via version-strategy.md
- [ ] 3. Write      — draft / rewrite each bullet per style-guide.md
- [ ] 4. Layout     — fill templates/resume.html, respect layout-spec.md
- [ ] 5. Render     — node scripts/render_pdf.mjs, verify single-page A4
```

### Stage 1 — Intake

Goal: lock down a single source of truth before writing.

- If user provides an existing PDF: run `python scripts/extract_pdf.py <pdf>`
  to render high-DPI page images and try text extraction. Image-only PDFs
  (jsPDF/Canva exports) yield empty text — read the rendered PNG visually.
- If user references a Feishu doc: use the `user-feishu-mcp` MCP server's
  `fetch-doc` tool to pull markdown; for inline images use `fetch-file` with
  the image_token (see scripts/README.md for the bulk-download recipe).
- If user references a code repository: read README, `package.json`,
  feature directories, and `pricing/` constants to derive product capabilities.
- Confirm with the user: name, phone, email, target position, education,
  any new content to add, and which existing block to remove (if any).

### Stage 2 — Position

Read [version-strategy.md](version-strategy.md). Decide:

- Which role variant (AIGC PM / Agent PM / Senior PM / Multimodal PM …).
- Which company variant (Big-Tech / Startup / Unicorn).
- The intersection determines which bullets get pulled forward, which get
  trimmed, and what tone to use.

Always tell the user the chosen variant before writing.

### Stage 3 — Write

Follow [style-guide.md](style-guide.md) strictly. The non-negotiables:

- Each bullet starts with a **bold capability label** (`<b>能力名：</b>...`).
- Abstract tasks into capabilities, not the reverse.
- Quantify whenever possible (`20+ 玩家`, `4 场首届黑客松`, `双轨变现模型`).
- Forbid: 熟稔, 精湛, 深谙, v1.0, 13 周, "负责了…工作".
- Prefer: 精通, 深度使用, 重度使用者, 主导, 牵头, 沉淀, 闭环.
- "等" is a deliberate signal — list 3–4 strongest items, append "等".
- Sort projects newest-first; sort awards inside one bullet by prestige.

### Stage 4 — Layout

Edit [templates/resume.html](templates/resume.html). Do NOT touch the
`<style>` block — the CSS is calibrated for A4 single-page. Replace
`{{placeholder}}` tokens only.

Layout invariants (see [layout-spec.md](layout-spec.md) for the full grid):

- A4, 13mm side margin, 12mm bottom margin, 9.5pt body, 1.45 line-height.
- Section title: black inline-block, white text, 12pt, 1px letter-spacing.
- Bullet marker: 4×4px solid square, never round dot, never `•`.
- Header is `flex space-between`: name+contact left, target position right.

### Stage 5 — Render

```bash
node scripts/render_pdf.mjs
```

Outputs:
- `output/<name>_<role>_简历_<version>.pdf` — the deliverable.
- `output/preview.png` — full-page screenshot for visual QA.

After rendering, **always read `output/preview.png` yourself** to confirm:
1. It is exactly one page (no overflow into page 2).
2. The header line, section blocks, and bullets are aligned as expected.
3. No `{{placeholder}}` leaked through.

If overflow happens, trim in this order: (a) shorten the longest bullet,
(b) drop the weakest project's tail bullet, (c) merge two adjacent jobs.
Never reduce the font-size or margins — those are fixed brand assets.

## Deliverables to user

Return all three:

1. The PDF (file path).
2. The `preview.png` rendered screenshot.
3. A short changelog: which bullets changed and why (so the user can audit
   the senior-HR rewrites in 30 seconds).

## Project structure

```
resume-builder/
├── SKILL.md              ← you are here
├── style-guide.md        senior-HR writing rules
├── layout-spec.md        A4 single-page visual grammar
├── version-strategy.md   role × company tailoring matrix
├── templates/
│   └── resume.html       placeholder template, edit only the body
└── scripts/
    ├── render_pdf.mjs    Playwright HTML→PDF
    ├── extract_pdf.py    PyMuPDF reference extractor
    └── README.md         deps + usage
```

## Anti-patterns (do not do)

- Do not invent experiences the user never confirmed. Always ask.
- Do not let the resume spill to page 2 — single-page is the brand.
- Do not list every model/tool the user knows. Pick 3–5 most relevant.
- Do not put the same award in two sections (de-dupe across 核心优势 / 项目 / 荣誉).
- Do not use emoji or color accents — black/white minimalist is the identity.
- Do not edit `<style>` block in `templates/resume.html` — break visual lock.
