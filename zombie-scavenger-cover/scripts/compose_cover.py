#!/usr/bin/env python3
"""Deterministically typeset a Zombie Scavenger cover over a no-text plate."""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFont
except ImportError as exc:
    raise SystemExit(
        "Pillow is required. In Codex, call load_workspace_dependencies and run this "
        "script with the returned Python executable."
    ) from exc


PALETTE = {
    "red": "#952819",
    "deep_red": "#8E2B22",
    "cream": "#DFCBAA",
    "paper": "#C7AE92",
    "charcoal": "#1D1610",
}

SKILL_ROOT = Path(__file__).resolve().parents[1]
FONT_CANDIDATES = {
    "cjk_hero": [
        str(SKILL_ROOT / "assets/fonts/NotoSansCJKsc-Black.otf"),
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
    ],
    "cjk_condensed": [
        str(SKILL_ROOT / "assets/fonts/NotoSansCJKsc-Black.otf"),
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
    ],
    "latin_hero": [
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        str(SKILL_ROOT / "assets/fonts/BowlbyOneSC-Regular.ttf"),
    ],
    "latin_condensed": [
        str(SKILL_ROOT / "assets/fonts/Anton-Regular.ttf"),
        "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf",
    ],
}

LAYOUTS = {
    "standing-poster": {
        "title": (0.028, 0.140, 0.380, 0.550),
        "eyebrow": (0.045, 0.055, 0.41, 0.15),
        "rotation": 2.4,
        "line_indent": 0.015,
    },
    "sofa-tableau": {
        "title": (0.028, 0.095, 0.520, 0.360),
        "eyebrow": (0.05, 0.035, 0.43, 0.13),
        "rotation": 5.0,
        "line_indent": 0.020,
    },
}


def has_cjk(text: str) -> bool:
    return any("\u3400" <= ch <= "\u9fff" for ch in text)


def resolve_font(explicit: str | None, text: str, role: str = "hero") -> str:
    if explicit:
        path = Path(explicit).expanduser()
        if not path.exists():
            raise SystemExit(f"Font not found: {path}")
        return str(path)
    family = ("cjk" if has_cjk(text) else "latin") + "_" + role
    for candidate in FONT_CANDIDATES[family]:
        if Path(candidate).exists():
            return candidate
    raise SystemExit(f"No usable {family} font found; pass --font explicitly.")


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def measure(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, stroke: int = 0) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt, stroke_width=stroke)
    return box[2] - box[0], box[3] - box[1]


def wrap_headline(text: str, layout: str, mode: str, max_lines: int = 2) -> list[str]:
    if "|" in text:
        return [part.strip() for part in text.split("|") if part.strip()][:max_lines]
    text = text.strip()
    if not text:
        return []
    if mode == "single" or (mode == "auto" and layout == "sofa-tableau"):
        return [text.upper() if not has_cjk(text) else text]
    if has_cjk(text):
        if len(text) <= 3:
            return [text]
        cut = max(2, round(len(text) * 0.45))
        return [text[:cut], text[cut:]][:max_lines]
    words = text.split()
    if len(words) == 1:
        return [text.upper()]
    if len(words) == 2:
        return [words[0].upper(), words[1].upper()]
    best = 1
    best_delta = len(text)
    for idx in range(1, len(words)):
        delta = abs(len(" ".join(words[:idx])) - len(" ".join(words[idx:])))
        if delta < best_delta:
            best, best_delta = idx, delta
    return [" ".join(words[:best]).upper(), " ".join(words[best:]).upper()]


def fit_title_font(lines: list[str], path: str, max_w: int, max_h: int, stroke: int) -> tuple[ImageFont.FreeTypeFont, int, int]:
    probe = ImageDraw.Draw(Image.new("L", (8, 8)))
    for size in range(int(max_h * 0.62), max(18, int(max_h * 0.16)), -2):
        fnt = font(path, size)
        dims = [measure(probe, line, fnt, stroke) for line in lines]
        line_gap = -max(2, int(size * 0.08))
        total_h = sum(h for _, h in dims) + line_gap * (len(lines) - 1)
        if max(w for w, _ in dims) <= max_w and total_h <= max_h * 0.94:
            return fnt, size, line_gap
    fnt = font(path, max(18, int(max_h * 0.16)))
    return fnt, fnt.size, 0


def distressed_fill(
    size: tuple[int, int],
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    color: str,
    seed: int,
    wear: float,
) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.text(xy, text, font=fnt, fill=color)
    if wear <= 0:
        return layer

    rng = random.Random(seed)
    alpha = layer.getchannel("A")
    holes = Image.new("L", size, 0)
    hole_draw = ImageDraw.Draw(holes)
    bbox = alpha.getbbox()
    if bbox:
        area = max(1, (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
        count = int(area * wear / max(6, fnt.size * 0.05) ** 2)
        min_r = max(1, int(fnt.size * 0.008))
        max_r = max(min_r + 1, int(fnt.size * 0.025))
        for _ in range(count):
            x = rng.randint(bbox[0], max(bbox[0], bbox[2] - 1))
            y = rng.randint(bbox[1], max(bbox[1], bbox[3] - 1))
            r = rng.randint(min_r, max_r)
            hole_draw.ellipse((x - r * 2, y - r, x + r * 2, y + r), fill=255)
        alpha = ImageChops.subtract(alpha, ImageChops.multiply(alpha, holes))
        layer.putalpha(alpha)
    return layer


def bend_layer(layer: Image.Image, rise_px: int) -> Image.Image:
    """Bend a complete outlined title line into a shallow upward arch.

    The center is lifted while both ends remain lower. Supersampling keeps the
    cream keyline and hard shadow continuous instead of producing stair steps.
    """
    if rise_px <= 0:
        return layer
    width, height = layer.size
    rise_px = min(rise_px, max(1, round(height * 0.18)))
    scale = 2
    source = layer.resize((width * scale, height * scale), Image.Resampling.LANCZOS)
    bent = Image.new("RGBA", (width * scale, (height + rise_px) * scale), (0, 0, 0, 0))
    center = max(1.0, (source.width - 1) / 2)
    for x in range(source.width):
        normalized = abs((x - center) / center)
        y = round(rise_px * scale * normalized ** 1.85)
        column = source.crop((x, 0, x + 1, source.height))
        bent.alpha_composite(column, (x, y))
    return bent.resize((width, height + rise_px), Image.Resampling.LANCZOS)


def render_scaled_title_line(
    text: str,
    font_path: str,
    target_w: int,
    target_h: int,
    fill: str,
    stroke: int,
    shadow: int,
    seed: int,
    wear: float,
    arc_ratio: float = 0.0,
) -> tuple[Image.Image, int]:
    """Render one outlined line, then scale it to the measured reference silhouette."""
    probe = ImageDraw.Draw(Image.new("L", (8, 8)))
    chosen = max(24, int(target_h * 1.25))
    while chosen > 18:
        fnt = font(font_path, chosen)
        _, raw_h = measure(probe, text, fnt, stroke)
        if raw_h + shadow + stroke * 2 <= target_h:
            break
        chosen -= 2
    fnt = font(font_path, chosen)
    bbox = probe.textbbox((0, 0), text, font=fnt, stroke_width=stroke)
    raw_w = bbox[2] - bbox[0]
    raw_h = bbox[3] - bbox[1]
    pad = stroke + shadow + 8
    size = (raw_w + pad * 2 + shadow, raw_h + pad * 2 + shadow)
    xy = (pad - bbox[0], pad - bbox[1])
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.text(
        (xy[0] + shadow, xy[1] + shadow), text, font=fnt,
        fill=PALETTE["charcoal"], stroke_width=stroke, stroke_fill=PALETTE["charcoal"]
    )
    draw.text(
        xy, text, font=fnt, fill=PALETTE["cream"],
        stroke_width=stroke, stroke_fill=PALETTE["cream"]
    )
    if has_cjk(text):
        # The bundled Noto Black already has the correct heavy skeleton. Medium
        # fallbacks need stronger same-color expansion, never speckled distress.
        is_true_black = "black" in Path(font_path).stem.lower()
        ink_expand = max(1, round(target_h * (0.006 if is_true_black else 0.014)))
        ink = Image.new("RGBA", size, (0, 0, 0, 0))
        ImageDraw.Draw(ink).text(
            xy, text, font=fnt, fill=fill,
            stroke_width=ink_expand, stroke_fill=fill
        )
        layer.alpha_composite(ink)
    else:
        layer.alpha_composite(distressed_fill(size, text, xy, fnt, fill, seed, wear))
    alpha_box = layer.getchannel("A").getbbox()
    if alpha_box:
        layer = layer.crop(alpha_box)
    arc_px = max(0, round(target_h * arc_ratio))
    base_h = max(1, target_h - arc_px)
    layer = layer.resize((target_w, base_h), Image.Resampling.LANCZOS)
    layer = bend_layer(layer, arc_px)
    return layer, chosen


def rough_paper_strip(width: int, height: int, seed: int) -> Image.Image:
    rng = random.Random(seed)
    strip = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(strip)
    jitter = max(2, height // 18)
    points = [(0, rng.randint(0, jitter)), (width, rng.randint(0, jitter)),
              (width, height - rng.randint(0, jitter)), (0, height - rng.randint(0, jitter))]
    draw.polygon(points, fill=PALETTE["paper"])
    for _ in range(max(8, width // 35)):
        x = rng.randint(0, max(0, width - 1))
        y = rng.randint(0, max(0, height - 1))
        r = rng.randint(1, max(2, height // 35))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(92, 68, 49, rng.randint(20, 60)))
    return strip


def add_print_finish(image: Image.Image, amount: float) -> Image.Image:
    if amount <= 0:
        return image
    rgb = image.convert("RGB")
    grain = Image.effect_noise(rgb.size, 9.0).convert("RGB")
    warm = Image.new("RGB", rgb.size, "#B99A72")
    grain = Image.blend(grain, warm, 0.46)
    out = Image.blend(rgb, grain, min(0.12, amount))
    return ImageEnhance.Contrast(out).enhance(0.98)


def compose(args: argparse.Namespace) -> dict:
    background = Image.open(args.background).convert("RGB")
    width, height = background.size
    layout = LAYOUTS[args.layout]
    x0, y0, x1, y1 = layout["title"]
    box = (int(x0 * width), int(y0 * height), int(x1 * width), int(y1 * height))
    box_w, box_h = box[2] - box[0], box[3] - box[1]

    lines = wrap_headline(args.headline, args.layout, args.title_mode)
    if not lines:
        raise SystemExit("--headline must not be empty")
    stroke = max(3, round(height * 0.007))
    shadow = max(5, round(height * 0.010))
    title_has_cjk = any(has_cjk(line) for line in lines)
    arc_ratio = args.arc if args.arc is not None else (0.072 if not title_has_cjk else 0.018)

    pad = max(stroke + shadow + 8, round(height * 0.02))
    tile_w = box_w + pad * 2
    tile_h = box_h + pad * 2
    tile = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)
    y = pad
    title_boxes = []
    title_fonts = []
    title_sizes = []
    if len(lines) == 2:
        width_targets = [box_w, int(box_w * 0.86)]
        height_targets = [int(height * 0.235), int(height * 0.155)]
        x_offsets = [0, int(width * layout["line_indent"])]
        y_offsets = [0, int(height * 0.215)]
        for idx, line in enumerate(lines):
            explicit = args.font if idx == 0 else (args.font_secondary or args.font)
            role = "hero" if idx == 0 else "condensed"
            line_font_path = resolve_font(explicit, line, role)
            fill = PALETTE["red"] if idx == 0 or args.monochrome_title else PALETTE["charcoal"]
            line_layer, line_size = render_scaled_title_line(
                line, line_font_path, width_targets[idx], height_targets[idx], fill,
                stroke, shadow, args.seed + idx, args.wear,
                arc_ratio * (1.0 if idx == 0 else 0.72),
            )
            lx, ly = pad + x_offsets[idx], pad + y_offsets[idx]
            tile.alpha_composite(line_layer, (lx, ly))
            title_boxes.append([
                box[0] + x_offsets[idx], box[1] + y_offsets[idx],
                box[0] + x_offsets[idx] + width_targets[idx],
                box[1] + y_offsets[idx] + height_targets[idx],
            ])
            title_fonts.append(line_font_path)
            title_sizes.append(line_size)
        y = pad + max(y_offsets[i] + height_targets[i] for i in range(2))
    else:
        title_font_path = resolve_font(args.font, args.headline, "hero")
        target_h = min(int(box_h * 0.78), int(height * 0.215))
        line_layer, title_size = render_scaled_title_line(
            lines[0], title_font_path, box_w, target_h, PALETTE["red"],
            stroke, shadow, args.seed, args.wear, arc_ratio,
        )
        tile.alpha_composite(line_layer, (pad, pad))
        title_boxes.append([box[0], box[1], box[0] + box_w, box[1] + target_h])
        y = pad + target_h
        title_fonts = [title_font_path]
        title_sizes = [title_size]

    if args.subheadline:
        subtitle_font_path = resolve_font(args.font, args.subheadline, "condensed")
        sub_size = max(22, int(height * 0.048))
        sub_font = font(subtitle_font_path, sub_size)
        sub_draw = ImageDraw.Draw(Image.new("L", (8, 8)))
        sub_w, sub_h = measure(sub_draw, args.subheadline, sub_font)
        max_sub_w = box_w - pad // 2
        while sub_w > max_sub_w and sub_size > 18:
            sub_size -= 2
            sub_font = font(subtitle_font_path, sub_size)
            sub_w, sub_h = measure(sub_draw, args.subheadline, sub_font)
        strip_w = min(box_w, sub_w + int(height * 0.065))
        strip_h = sub_h + int(height * 0.04)
        strip = rough_paper_strip(strip_w, strip_h, args.seed + 100)
        ImageDraw.Draw(strip).text(
            (int(height * 0.025), int(height * 0.012)), args.subheadline,
            font=sub_font, fill=PALETTE["deep_red"]
        )
        tile.alpha_composite(strip, (pad, min(tile_h - strip_h - pad // 2, y + int(height * 0.025))))

    angle = args.rotation if args.rotation is not None else layout["rotation"]
    tile = tile.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    overlay = Image.new("RGBA", background.size, (0, 0, 0, 0))
    overlay.alpha_composite(tile, (box[0] - pad, box[1] - pad))

    if args.eyebrow:
        ex0, ey0, ex1, ey1 = layout["eyebrow"]
        eyebrow_path = resolve_font(args.font, args.eyebrow, "condensed")
        eyebrow_size = max(20, int(height * 0.046))
        eyebrow_font = font(eyebrow_path, eyebrow_size)
        edraw = ImageDraw.Draw(overlay)
        max_ew = int((ex1 - ex0) * width)
        ew, _ = measure(edraw, args.eyebrow, eyebrow_font)
        while ew > max_ew and eyebrow_size > 16:
            eyebrow_size -= 2
            eyebrow_font = font(eyebrow_path, eyebrow_size)
            ew, _ = measure(edraw, args.eyebrow, eyebrow_font)
        edraw.text((int(ex0 * width), int(ey0 * height)), args.eyebrow,
                   font=eyebrow_font, fill=PALETTE["cream"])

    background_rgba = background.convert("RGBA")
    composed_rgba = Image.alpha_composite(background_rgba, overlay)
    foreground_mask_path = None
    if args.foreground_mask:
        foreground_mask_path = str(Path(args.foreground_mask).expanduser().resolve())
        mask_source = Image.open(foreground_mask_path)
        if mask_source.mode in {"RGBA", "LA"} and mask_source.getchannel("A").getextrema() != (255, 255):
            foreground_mask = mask_source.getchannel("A")
        else:
            foreground_mask = mask_source.convert("L")
        if foreground_mask.size != background.size:
            foreground_mask = foreground_mask.resize(background.size, Image.Resampling.LANCZOS)
        composed_rgba = Image.composite(background_rgba, composed_rgba, foreground_mask)
    composed = composed_rgba.convert("RGB")
    composed = add_print_finish(composed, args.grain)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    composed.save(output, quality=95)

    preview = Path(args.preview) if args.preview else output.with_name(output.stem + "-preview-320.png")
    preview_h = round(height * 320 / width)
    composed.resize((320, preview_h), Image.Resampling.LANCZOS).save(preview)

    metadata_path = Path(args.metadata) if args.metadata else output.with_name(output.stem + "-layout.json")
    metadata = {
        "background": str(Path(args.background).resolve()),
        "output": str(output.resolve()),
        "preview": str(preview.resolve()),
        "layout": args.layout,
        "canvas": [width, height],
        "headline": args.headline,
        "headline_lines": lines,
        "subheadline": args.subheadline,
        "eyebrow": args.eyebrow,
        "title_box": list(box),
        "line_boxes_approx": title_boxes,
        "fonts": title_fonts,
        "font_sizes": title_sizes,
        "palette": PALETTE,
        "stroke_px": stroke,
        "shadow_offset_px": shadow,
        "rotation_degrees_counterclockwise": angle,
        "arc_rise_ratio": arc_ratio,
        "foreground_mask": foreground_mask_path,
        "overlap_policy": "subject-over-title-with-mask" if foreground_mask_path else "no-face-overlap-safe-zone",
        "wear": args.wear,
        "seed": args.seed,
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--background", required=True, help="No-text plate image")
    parser.add_argument("--output", required=True, help="Final cover path")
    parser.add_argument("--headline", required=True, help="Use | to force a line break")
    parser.add_argument("--subheadline", default="")
    parser.add_argument("--eyebrow", default="")
    parser.add_argument("--layout", choices=sorted(LAYOUTS), default="standing-poster")
    parser.add_argument("--font", help="Optional explicit font file")
    parser.add_argument("--font-secondary", help="Optional font for the lower title line")
    parser.add_argument("--title-mode", choices=["auto", "dual", "single"], default="auto")
    parser.add_argument("--rotation", type=float, help="Counterclockwise degrees; default comes from layout")
    parser.add_argument("--arc", type=float, help="Shallow upward arch rise as a fraction of line height; 0 disables")
    parser.add_argument("--foreground-mask", help="White/opaque subject mask composited back above the title")
    parser.add_argument("--wear", type=float, default=0.0, help="Reserved compatibility flag; must stay 0 for solid title fill")
    parser.add_argument("--grain", type=float, default=0.045, help="Global print-grain blend, 0–0.12")
    parser.add_argument("--seed", type=int, default=1957)
    parser.add_argument("--monochrome-title", action="store_true", help="Keep all title lines red")
    parser.add_argument("--preview")
    parser.add_argument("--metadata")
    args = parser.parse_args(argv)
    if args.wear != 0:
        parser.error("--wear must be 0; this style uses solid title fill without spots or holes")
    if not 0 <= args.grain <= 0.12:
        parser.error("--grain must be between 0 and 0.12")
    if args.arc is not None and not 0 <= args.arc <= 0.18:
        parser.error("--arc must be between 0 and 0.18")
    return args


if __name__ == "__main__":
    result = compose(parse_args(sys.argv[1:]))
    print(json.dumps(result, ensure_ascii=False, indent=2))
