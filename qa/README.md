# QA tools (developer only)

The app doesn't need any of these files; they are for checking changes before a release. Everything
runs locally in headless Chromium against `index.html` served from 127.0.0.1, with the same headers
as production. Nothing is sent anywhere.

Requirements: Node 18+ and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`,
or set `CHROMIUM_PATH` to an existing Chromium).

```bash
node qa/run-checks.cjs
```

That runs the page's own `#selftest`, then the owner flow at 320/360/412 px in English and Spanish
(pick Luxury, edit headline and CTA, save post and story, reload), then real uploads, then timing.
It writes `qa/luxury-editorial/results.json` and exits non-zero if anything fails.

```bash
git show origin/main:index.html > /tmp/main.html && node qa/run-checks.cjs --baseline /tmp/main.html
```

Also checks that Editorial, Poster, Grid, before/after and the setup-screen examples render
pixel-identical to the baseline copy.

```bash
node qa/contact-sheet.cjs
```

Redraws the review sheets in `qa/luxury-editorial/` with the app's own drawing code.

```bash
git show 3a79c2d:index.html > /tmp/before.html && node qa/phone-view.cjs --before /tmp/before.html
```

Exports a realistic Luxury post and story through the real app (fill in, upload, Save image). It then
shows them 360 px wide, as on an Android phone, with the on-screen size of every text element, and
writes `sample-post.png`, `sample-story.png` and `phone-view-360.png`. `--before` is optional and adds
an older copy of the page that already has Luxury; 3a79c2d is the version before the readability pass.

`fixtures/` holds synthetic stand-in photos and logos (no real people, places or brands). Rebuild them
with `python3 qa/fixtures/make_fixtures.py` (needs numpy and Pillow).
