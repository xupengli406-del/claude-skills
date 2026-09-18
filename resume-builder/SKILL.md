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
HR writing voice, regardless of which job/company it targets. Include an
available, suitable photo of the user by default; keep the no-photo layout
when none is available or the user/application explicitly requests no photo.

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
- Check the supplied personal-materials folder for a suitable portrait even
  when the old resume has none. Prefer the user-selected business/headshot
  photo; inspect it visually before use. Do not use an identity-document scan
  as a headshot. Keep the original intact and apply the photo rules in
  layout-spec.md. No suitable photo is not a blocker to drafting the resume.
- Reuse facts already supported by the materials or confirmed in this conversation.
  Ask only for missing or conflicting details that materially affect the target role;
  do not reconfirm settled contact details or responsibilities.
- A reply such as “这些我都做过，直接补充” confirms the specific activities
  just listed in the question. It permits rewriting those activities, not inventing
  their scale, methods, outcomes, or a broader job title.

### Stage 2 — Position

Read [version-strategy.md](version-strategy.md). Decide:

- Which role variant (AIGC PM / Agent PM / Senior PM / Multimodal PM …).
- Which company variant (Big-Tech / Startup / Unicorn).
- Read the actual target JD/HC and map its most important responsibilities to
  supported projects, personal actions, and known results. Use the role matrix as
  a starting point; the actual work takes priority over company stereotypes.
- The intersection determines which bullets get pulled forward, which get
  expanded or trimmed, and what tone to use. Do not stop at changing the title
  and skill keywords while leaving the core projects generic.

Always tell the user the chosen variant before writing.

### Stage 3 — Write

Follow [style-guide.md](style-guide.md) strictly. The non-negotiables:

- Each bullet starts with a **bold capability label** (`<b>能力名：</b>...`).
- Abstract tasks into capabilities, not the reverse.
- Quantify when supported by the materials or user confirmation; preserve uncertainty such as “约”, and never copy example numbers into a resume.
- Allocate detail by target relevance and evidence strength: usually 3–4 bullets for the strongest project, 2 for differentiated evidence, 1 or a merged mention for supporting work. These are starting points, not quotas.
- Expand a thin core-project section using confirmed scope, personal actions, decisions, stakeholder coordination, and known results/follow-up; follow style-guide.md section 5. “写得丰满/顶级” requests stronger evidence and expression, not invented achievements.
- Treat a sustained entrepreneurial/independent period as a formal work entry when it explains an employment gap; never invent unconfirmed months.
- Use “FDE 型产品实践” only with customer-site discovery, workflow decomposition, scoping, prototype/solution validation, and field-feedback iteration. Never rename the user's role to FDE.
- Forbid: 熟稔, 精湛, 深谙, v1.0, 13 周, "负责了…工作".
- Prefer: 精通, 深度使用, 重度使用者, 主导, 牵头, 沉淀, 闭环.
- "等" is a deliberate signal — list 3–4 strongest items, append "等".
- For a targeted application, rank core projects by job relevance, then newest-first within comparable relevance; keep work history newest-first. Sort awards inside one bullet by prestige.

### Stage 4 — Layout

Edit the body of [templates/resume.html](templates/resume.html). Do NOT touch
the `<style>` block — the CSS is calibrated for A4 single-page. Fill the
`{{placeholder}}` tokens; when a suitable portrait is available, apply the
optional header photo layout from layout-spec.md instead of copying the
old no-photo header unchanged.

Layout invariants (see [layout-spec.md](layout-spec.md) for the full grid):

- A4, 12.5mm side margin, 9mm bottom margin, 9.15pt body, 1.42 line-height.
- Section title: black inline-block, white text, 10.7pt, 1px letter-spacing.
- Bullet marker: 3.5×3.5px solid square, never round dot, never `•`.
- No-photo header: name+contact left, target position right. With a portrait:
  name+contact+target left, portrait right; follow layout-spec.md for sizing.
  The photo may retain its original color; typography and accents stay black/white.

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
4. Every `.kv-row` label (especially `Vibe Coding`) stays on one line.
5. The actual PDF has exactly one page; do not infer this only from the browser screenshot.
6. The page is substantively filled: check the last content position and whether
   target-relevant confirmed experience remains omitted. Apply layout-spec.md
   section 7 for underfilled pages as well as overflow. One page alone is not acceptance.
7. If a photo is used, it is the intended user portrait, visible and embedded
   in the actual PDF, with no distortion, clipped face, overlaid text, or
   collision with the name/contact/target. A browser preview alone is insufficient.

If overflow happens, trim in this order: (a) shorten the longest bullet,
(b) drop the weakest project's tail bullet, (c) merge two adjacent jobs.
Never reduce the font-size or margins — those are fixed brand assets.

## Deliverables to user

Return all three:

1. The PDF (file path).
2. The `preview.png` rendered screenshot.
3. A short changelog: which bullets changed and why (so the user can audit
   the senior-HR rewrites in 30 seconds).

## Repository retention policy

- `resumes/` is the canonical GitHub location for the user's current,
  application-ready PDFs.
- Keep only the latest active variants in `resumes/`; replace superseded PDFs
  instead of accumulating versioned history files.
- Keep `SKILL.md`, the templates, layout/writing rules, and rendering scripts
  beside the current resumes because they are the reproducible maintenance
  system for those deliverables.

## Project structure

```
resume-builder/
├── README.md             current resumes and retention policy
├── SKILL.md              ← you are here
├── style-guide.md        senior-HR writing rules
├── layout-spec.md        A4 single-page visual grammar
├── version-strategy.md   role × company tailoring matrix
├── resumes/              latest application-ready PDFs only
├── templates/
│   └── resume.html       placeholder template, edit only the body
└── scripts/
    ├── render_pdf.mjs    Playwright HTML→PDF
    ├── extract_pdf.py    PyMuPDF reference extractor
    └── README.md         deps + usage
```

## Anti-patterns (do not do)

- Do not invent experience or results. Reuse explicit confirmations; ask a focused
  follow-up only when essential evidence is still missing.
- Do not pad an underfilled page with repeated claims, unverified metrics, generic
  JD wording, extra tool names, or changes to font size and spacing.
- Do not let the resume spill to page 2 — single-page is the brand.
- Do not list every model/tool the user knows. Pick 3–5 most relevant.
- Do not put the same award in two sections (de-dupe across 核心优势 / 项目 / 荣誉).
- Do not use emoji or colored typography/accents — black/white minimalist is
  the identity. An included user portrait may retain its original colors.
- Do not omit an available suitable portrait just because the base resume
  has none; honor an explicit no-photo preference or application requirement.
- Do not edit `<style>` block in `templates/resume.html` — break visual lock.
