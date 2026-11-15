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
(pick Luxury, edit headline and CTA, save post and story, reload), then the marketing goals at the
same widths (pick each goal, type a headline and switch goal, save, copy a caption, reload, tap the
goal again to clear it), uploads and before/after with a goal picked, a kit saved before goals
existed, real uploads, and timing. It also checks that `index.html` still has no outside resources
or network code. It writes `qa/luxury-editorial/results.json` and the goal-selector screenshots in
`qa/goals/`, and exits non-zero if anything fails.

```bash
git show origin/main:index.html > /tmp/main.html && node qa/run-checks.cjs --baseline /tmp/main.html
```

Also checks against the baseline copy that every graphics style (Luxury included), before/after and
the setup-screen examples render pixel-identical; that with no goal picked every bio, About, message,
Week 1 idea, headline and CTA is word for word the same; and that a kit saved by the baseline page
opens unchanged.

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

```bash
node qa/goal-compare.cjs
```

Writes `qa/goals/COMPARISON.md` and `plans-en.png` / `plans-es.png`: the three goals' 7-day plans and
graphics suggestions side by side for one fictional business, made with the app's own copy and drawing
code.

`fixtures/` holds synthetic stand-in photos and logos (no real people, places or brands). Rebuild them
with `python3 qa/fixtures/make_fixtures.py` (needs numpy and Pillow).
