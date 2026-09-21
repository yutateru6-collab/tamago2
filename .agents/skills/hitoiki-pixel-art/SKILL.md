---
name: hitoiki-pixel-art
description: Maintain the original Mame pixel companion without regressing art, animation, interface or saved data.
---
# Hitoiki pixel companion production skill
Use the upstream Pixel Art Studio methodology and helper, pinned to Gamezxz/pixel-art-studio at f8c246635c4621a6c2b427833149afdc3dc3c719 (MIT). Upstream: https://github.com/Gamezxz/pixel-art-studio. Read its SKILL.md and references/patterns.md, animation.md, validations.md, sharp_edges.md. Do not install unrelated runtime rendering engines.

## Art contract
- Native 40x44 cell, 4 shades plus hard transparency, ground pivot (20,40).
- Round bean body, short attached limbs, asymmetric sprout, uneven but readable eyes and a tiny tooth. Good and bad evolution must remain the same individual.
- Work silhouette first. Top-left lighting. No dithering on moving parts, blur, noninteger scaling, rotation or stretched image limbs.
- Artwork source is art/mame/build.py, using the pinned pixelstudio.py helper. Changes go into source, never painted over exported PNGs.
- Generate 13 appearances (neutral + good 1..5 + bad 1..5 + egg + farewell), each with 16 actual cels. Runtime need not play every cel in every state.
- Idle is mostly held: intermittent breath, blink, glance and small greeting. Meals must show anticipation -> two chewing cels -> content face -> bow. Sleep is redrawn curled, not a rotated standing sprite. Farewell preserves the soft face and wings, not a block cross.

## Quality gate
Run generator; inspect silhouette, expression strip, all appearances. At least 2 visual revision passes. Check all frame bounds, colors <=4, alpha 0/255, phase identities distinct. Inspect inside actual 390x664 and 320x568 UI. Verify image decoding and both chewing poses; do not use file counts or changed labels as visual proof.

## Integration
features/character.js supplies the existing pet(s,preview) function; sprites.js still exports icon/projectSvg/vignette/pet. Copy assets after the legacy archive build, never into an overwritten root source. Keep menu count, gameplay rules, normal/demo keys and dialogue histories unchanged.

Run existing 62-case developer self-check and character browser checks in Chromium and WebKit. Check motion-reduction behavior and saved data. Match production file hashes before reporting deployment. Always include the playable Cloudflare URL in the completion message.
