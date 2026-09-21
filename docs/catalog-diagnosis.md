# Catalog / paired-pixel regression, 2026-09-21

## Observed before the fix
- Live main was 339463a5a2b9fe5d530ca542562e7b738d53411a.
- Actions 35578491260 fetched the actual production assets: all six `creatures/{2,3,5,7,10,12}.png` returned HTTP 200, `image/png`, valid PNG signatures, and matched the last built assets. This is NOT evidence of missing deployment files or a relative-path error.
- `openCatalog()` required a capture record even in `?dev=1`. A fresh developer session produced question-mark placeholders, no `img` elements, and disabled buttons. There was no read-only all-image preview.
- The `capture` developer command executed `s.world.captures=[]` on every use. Trying another creature discarded earlier records; consequently their cards went back to hidden. A targeted test reset had leaked into the interactive development experience.
- Slow/error image requests had no loading indicator, source fallback or retry. Every thumbnail requested the full 0.3–0.5 MB PNG. No claim is made that a network failure on the user's specific phone was reproduced.
- Artwork explicitly drew the left eye as 4x6 at y=eyeY-2 and the right as 3x5 at y=eyeY-1. Neutral hands also differed by one row. This was authored into pixels, not an iPhone scaling defect.

## Changes
- Normal play retains discovery-gated images; developer mode has a clearly labelled read-only preview of every image. Preview never awards captures.
- Sequential targeted capture tests preserve prior records and increment repeat encounters. Temporary test prerequisites are discarded before saving the actual result.
- Every thumbnail/report/detail uses the same module-relative URL resolver. Six small thumbnails and six full WebP copies retain the original PNGs as real-image fallback. No unrelated placeholder is labelled as a successful load.
- Explicit loading / slow / error / ready states and retry. A developer image check decodes all 18 thumb/full/original variants.
- Shared eye dimensions/row/highlight pattern and centered mouth/tooth across the 11 living looks. Grounded feet and resting hands are paired. Sprout asymmetry is deliberate; facial misalignment is not.
- Existing artwork source remains `art/mame/build.py`. The generator checks actual eye pixel crops, not only constants, in 165 nonsleeping living cells. Original gameplay, save namespaces, LCD palette and menu count remain unchanged.

## Release gate
`npm test`, `npm run test:character`, `npm run test:lab`, and `npm run test:catalog` must pass against the built output. Catalog regression tests cover developer preview, no false acquisition, 6 sequential captures, persistence, normal save isolation, real image decoding, bad HTTP-200 image bodies, fallback, both sources failing, retry, small layouts and actual atlas paired pixels. The same browser suites run against the real production URL after SHA-256 matching of scripts, artwork and image files.
