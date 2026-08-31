---
name: mono-color-showcase-pairs
description: Create a social-media-ready sequence of clean mono-color or duotone style images, each immediately followed by an unexpected real-world application of the same artwork. Use when the user wants to demonstrate where a visual style can be used, test a print/editorial skill across varied subjects and carriers, or make a mother-image-to-mockup carousel. Do not use for one standalone poster or an ordinary single-product mockup.
---

# Mono-color Showcase Pairs

Turn a visual style into a sequence that first earns attention as artwork and then proves its usefulness in context.

## Deliverable

When the user asks for nine groups, create eighteen clean images:

- `A`: a flat style mother image;
- `B`: the same recognizable artwork applied to a real carrier or space.

Keep each pair adjacent in filename and release order. Group numbers may exist in filenames for sorting, but never inside the images. Also deliver an internal contact sheet, the final prompt set, a short recipe list, and a publishing caption when requested.

## Pair invariant

The application image must preserve the mother image's dominant subject, short display phrase, ink roles, and focal composition strongly enough that viewers recognize the connection without explanation. Use the mother image as the reference input for the application image.

The carrier must change how the artwork behaves materially: follow fabric folds, turn around a box edge, cross tram panels, bend over luggage ribs, wrap a room corner, respond to tent seams, or deform over architecture. Avoid simply placing a flat rectangle into a mockup.

## Clean-output rule

Keep publishable images free of group numbers, serials, dates, corner labels, metadata strips, explanatory headers, badges, signatures, brands, URLs, QR codes, and watermarks. One meaningful display phrase may remain when it belongs to the artwork. Do not bake questions, answers, or usage explanations into the image; place that narrative in the caption and release order.

## Diversity before generation

Build a coverage matrix before prompting. Across nine mother images, cover at least six subject families and include clear density and scale contrasts. Across nine applications, avoid repeating the same carrier class.

Read [references/coverage-matrix.md](references/coverage-matrix.md) when planning a multi-pair set. Honor subjects or carriers explicitly requested by the user first.

## Visual grammar

- Use a white, cool-gray, or pale-beige substrate for every mother image.
- Use one printing ink or an assigned two-ink pair; never add an unassigned third ink.
- Preserve exposed paper, mechanical screening, and one strong type-image relationship.
- Vary display voices and composition families across the set instead of applying one template.
- Contemporary editorial is the default. Do not equate halftone with automatic retro aging.
- Treat any external reference as grammar evidence only. Never reuse its artwork, slogan, logo, or distinctive composition.

Application scenes may be naturally photographed in neutral real-world color, but the applied artwork must keep its controlled one- or two-ink identity.

## Generation workflow

1. Resolve all pair concepts and the diversity matrix.
2. Generate and inspect all mother images.
3. Use each approved mother image as the reference for its application image.
4. Correct misspelled or cropped display phrases once. If exact text still fails, use a text-light base rather than pretending it is correct.
5. Standardize the requested ratio and verify every final asset.
6. Save publishable images separately from contact sheets, notes, and rejected variants.

Read [references/prompt-patterns.md](references/prompt-patterns.md) when compiling prompts.

## Quality gate

Before delivery, verify:

- every pair is visibly related at thumbnail size;
- subject families, density, camera logic, and application carriers genuinely vary;
- no image contains internal sequence labels or unexplained editorial metadata;
- no invented brand, venue, route number, product detail, or fake publication mark appears;
- the same design conforms to the carrier rather than floating over it;
- all final images share the requested ratio and are stored in publish order;
- the contact sheet is clearly marked as internal preview only.

## Publishing caption

When the user wants a Chinese self-media package, prefer this reusable shape:

1. a viewer-facing work title that names the visual idea, not an internal label such as experiment, test, workflow, or showcase;
2. five numbered observations explaining how the images were made: palette reduction, source-image translation, composition, continuity into the carrier, and material response;
3. a compact English prompt reference;
4. focused hashtags;
5. a placeholder for the platform link until the post exists.

Write about the visible work and the decisions that produced it. Do not substitute release order, audience psychology, publishing strategy, content sequencing, or project management for creative-process explanation. Write as a creator sharing discoveries, not as a product manual or sales pitch.
