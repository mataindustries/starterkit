# ENM Starter Kit — free marketing tool for new local service businesses

One file: `index.html` (about 370 KB). No login, database, tracking, AI, paid APIs, or outside requests. The fonts are built into the file, so the page works the same on every phone and never loads anything from another server.

## What an owner gets
- **Post (1080 × 1350 PNG)** in 4 styles (Editorial, Poster, Grid and Luxury Editorial), with 5 color sets, an editable headline and call to action, and their own logo or photo if they add one.
- **Story (1080 × 1920 PNG)** in the same style. Text stays out of the areas Instagram covers at the top and bottom.
- **Luxury Editorial** is the quiet, premium style for realtors, med spas, estheticians, photographers, interior designers and boutique fitness. It is a centred serif layout with lots of white space. With a photo it is photo-led; without one it becomes an elegant card with the owner's monogram or logo. It uses the same 5 color sets, softened. Design notes and review sheets are in `qa/luxury-editorial/`.
- **Before/after**: a separate image layout for two genuine owner-provided photos, with permission from the client. Photos used for this layout are not saved to the device by the app.
- **Bio**: an Instagram bio (150 characters or fewer) and a longer "About" for a Google Business Profile or Facebook page.
- **5 customer messages**: introduction, estimate follow-up, appointment reminder, review request (no incentives, and it asks everyone, not only happy customers) and referral request.
- **Week 1**: 7 post ideas, each with what to post, how to shoot it on a phone and a starter caption.
- Everything is available in English or natural Mexican Spanish (*usted* with customers). Service types: house cleaning, landscaping, mobile detailing, pressure washing, handyman, or anything else the owner types in.

## Using it on Android (owner instructions)
1. Open the link in **Chrome**. Links opened inside Instagram or Facebook can't save files; if that happens, the page shows a banner telling the owner to tap ⋮ → *Open in Chrome*.
2. Type your business name and tap what you do. Everything else is optional.
3. Tap **Make my kit**.
4. On **Graphics**, pick a style and colors, then tap **Save image** (it goes to your Downloads folder) or **Share** (uses Android's share sheet where supported; if sharing fails, save the PNG and attach it manually).
5. On **Bio**, **Messages** and **Week 1**, tap **Copy** and paste wherever you need it. Fill in anything shown in [brackets] before you send.

Your details are saved only on this phone, so the kit is still there when you come back. **Clear my info** at the bottom of the page erases it (tap twice).

## Tests
Open the page with `#selftest` at the end of the address, for example `https://your-site.pages.dev/#selftest`. It runs 29 checks in your phone's browser and lists pass or fail for each:
- Every English string has a Spanish version, and every service type has complete copy.
- All 24 combinations of language × service × full or minimal details produce 5 messages, 7 ideas and a bio of 150 characters or fewer, with no "undefined" or broken blanks.
- No invented discounts, "free", "#1", "best", star ratings, "licensed/insured" or similar claims anywhere in the copy.
- Review requests contain no incentives and no "if you were happy" gating.
- No contact details appear that the owner didn't type.
- Phone, handle, website and initials formatting work.
- The page policy blocks all network requests, and all 7 embedded fonts load.
- Long text shrinks to fit its box.
- 48 renders (4 styles × post/story × no image/photo/logo × EN/ES, with a very long name and service area) all draw inside their safe areas.
- Luxury Editorial gets 50 more renders: EN/ES × post/story × no image, landscape or portrait photo, transparent or solid logo × normal, long and maximum-length details. These checks confirm that:
  - text stays inside the safe area and side margins, never on the photo, and nothing is cut off;
  - it draws only text the owner typed;
  - edited headlines and calls to action appear;
  - built-in headlines break naturally in both languages;
  - every palette stays muted and readable (WCAG AA);
  - logos are trimmed to their mark;
  - the style is listed in both languages.
- Exports (Luxury included, with and without a photo) are real PNGs at exactly 1080 × 1350 and 1080 × 1920.

Latest automated run: 29/29 built-in self-tests and 68/68 headless checks pass (`qa/run-checks.cjs` in Chromium at 320, 360 and 412px, English and Spanish). The headless checks cover the full owner flow with the Luxury style: pick it, edit, save both images, upload a photo and two logos, and reload. They also confirm that the other styles are pixel-identical to the previous version. An earlier pass, before Luxury was added, also covered the full flow in desktop Chrome at phone sizes: fill in the form, try all 3 styles, save, upload a photo and a logo (each was detected correctly), switch to Spanish, use every tab, reload, and confirm the details persist. Sharing to installed Android apps and real camera uploads still require manual phone testing.

Developer checks (optional, on a computer with Node and Playwright):
- `node qa/run-checks.cjs` runs the self-test plus the real owner flow, uploads and exports in headless Chromium.
- `node qa/contact-sheet.cjs` redraws the review sheets.

See `qa/README.md`.

## Deploying (recommended: Cloudflare Pages)
It's a static file, so any static host works. Cloudflare Pages is free and fits the pages.dev setup you already use.
1. This project is hosted in the existing GitHub repository `mataindustries/starterkit` with `index.html` and `_headers` at the root.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, then choose the repo. Leave the build command empty and set the output directory to `/`.
3. You get a `*.pages.dev` URL; you can add a custom domain later. `_headers` repeats the page's privacy policy as real HTTP headers and prevents other sites from embedding the page in a frame.

Keep Cloudflare Web Analytics turned off for this project. The page policy would block it anyway, and the promise is no tracking.

The app only needs `index.html` and `_headers`. The `campaigns/` and `qa/` folders are for production and review and are not used by the page.

## Editing the copy
All wording is in the `<script>` near the top of the file: `UI` holds the interface text, `SV` holds per-service headlines, descriptions and post-idea details, and `CTAS` holds calls to action. `buildCopy()` assembles the bio, messages and ideas. Edit in `index.html`, then run `#selftest` again.

The graphics styles are the drawing functions `tEditorial`, `tPoster`, `tGrid` and `tLuxury`, listed in `TPL`. Owners' phones save the chosen style by its position, so add new styles at the end.

## Real Android launch gate
Before sharing publicly: run `#selftest` in Android Chrome, export and open a post and Story, test sharing/cancel/fallback with installed apps, upload gallery and camera images, review Spanish outputs, confirm settings survive reopening Chrome, test the before/after layout, and try the Luxury style with a real photo and a real logo.

## Known limits
- Some Samsung phones save photos as HEIC, which Chrome can't open. The app shows a message asking for a JPG or PNG.
- In Stories, no text goes in the bottom ~340 px because Instagram's reply bar covers it. Luxury lets its photo run underneath.
- Fonts: Inter, Inter Display, Lora and Cormorant Garamond are used under the SIL Open Font License 1.1 and subset to Latin characters. Other scripts fall back to the phone's own fonts.

Made with ENM Ventures.
