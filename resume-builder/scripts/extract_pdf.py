"""extract_pdf.py — extract text + render page images from a source resume PDF.

Use when the user attaches an existing PDF resume and asks for an incremental
edit. Produces:

  output/origin_pages/page_XX.png   — high-DPI page image (visual fallback)
  output/origin_resume.md           — extracted text (may be empty for image PDFs)
  output/origin_spans.json          — per-span font/size/bbox dump (layout audit)

Usage:
  python scripts/extract_pdf.py <path/to/source.pdf>

Empty text output usually means the PDF was rendered by jsPDF/Canva as
images — fall back to reading origin_pages/page_01.png visually.
"""
import json
import os
import sys

import fitz  # PyMuPDF


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python scripts/extract_pdf.py <source.pdf>", file=sys.stderr)
        return 2
    src = sys.argv[1]
    if not os.path.exists(src):
        print(f"file not found: {src}", file=sys.stderr)
        return 2

    skill_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(skill_root, "output")
    pages_dir = os.path.join(out_dir, "origin_pages")
    os.makedirs(pages_dir, exist_ok=True)

    doc = fitz.open(src)
    print(f"Pages: {doc.page_count}")
    print(f"Metadata: {json.dumps(doc.metadata, ensure_ascii=False)}")

    all_text: list[str] = []
    all_blocks: list[dict] = []
    for i, page in enumerate(doc):
        print(f"\n=== Page {i + 1} ===")
        print(f"Size: {page.rect}")

        txt = page.get_text("text")
        print(f"text len: {len(txt)}")
        all_text.append(f"## Page {i + 1}\n\n{txt}")

        blocks = page.get_text("dict")
        spans: list[dict] = []
        for b in blocks.get("blocks", []):
            if b.get("type") != 0:
                continue
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    spans.append({
                        "text": span.get("text", ""),
                        "font": span.get("font", ""),
                        "size": span.get("size", 0),
                        "color": span.get("color", 0),
                        "bbox": span.get("bbox", []),
                        "flags": span.get("flags", 0),
                    })
        all_blocks.append({"page": i + 1, "spans": spans})

        pix = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5))
        pix.save(os.path.join(pages_dir, f"page_{i + 1:02d}.png"))
        print(f"PNG saved: {pix.width}x{pix.height}")

    with open(os.path.join(out_dir, "origin_resume.md"), "w", encoding="utf-8") as f:
        f.write("# Origin Resume — Extracted Text\n\n")
        f.write("\n\n".join(all_text))

    with open(os.path.join(out_dir, "origin_spans.json"), "w", encoding="utf-8") as f:
        json.dump(all_blocks, f, ensure_ascii=False, indent=2)

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
