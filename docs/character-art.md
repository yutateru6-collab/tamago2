# Mame character art
Original artwork by this project. Renderer: existing SVG scene with native pixel sprite atlas. No PixiJS/Phaser rewrite; no runtime external asset service.

Used tool: Pixel Art Studio by Gamezxz, MIT, commit f8c246635c4621a6c2b427833149afdc3dc3c719. Its Python/Pillow Sprite API is used by art/mame/build.py for pixel drawing, layer/frame inspection, tagged sprite sheet export, editable project export and strict palette/alpha checks. The workflow fetches the pinned helper and retains its license alongside review artifacts. Source: https://github.com/Gamezxz/pixel-art-studio

The app keeps its cream/LCD UI. Four coordinated greens separate the face from the background. Same sprout/face lineage across neutral, 5 good and 5 bad states. Bad 5 remains recoverable; farewell art does not alter death rules. Meals change actual cels; sleeping has its own silhouette. No application data migration is introduced.

Review passes: (1) silhouette/expressions revealed identical neutral/good-1 and weak bad-5 separation; (2) neutral sprout reduced, bad-2 lowered, bad-4 sprout drooped and bad-5 curled lower; (3) inspect actual mobile UI and animation during browser verification before merge.

Runtime sprite file assets/mame-sheet.png is generated, compact indexed PNG. assets/mame-sheet.json defines cell/poses/look order and SHA-256. Generated original art may be regenerated without a graphics service; upstream helper license applies to the helper, not the original artwork. See .agents/skills/hitoiki-pixel-art/SKILL.md for the durable workflow.
