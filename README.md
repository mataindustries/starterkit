# ENM Starter Kit — free marketing tool for new local service businesses

One file: `index.html` (about 300 KB). No login, database, tracking, AI, paid APIs, or outside requests. The fonts are built into the file, so the page works the same on every phone and never loads anything from another server.

## What an owner gets
- **Post (1080 × 1350 PNG)** in 3 styles (Editorial, Poster, Grid), with 5 color sets, an editable headline and call to action, and their own logo or photo if they add one.
- **Story (1080 × 1920 PNG)** in the same style. Text stays out of the areas Instagram covers at the top and bottom.
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
Open the page with `#selftest` at the end of the address, for example `https://your-site.pages.dev/#selftest`. It runs 18 checks in your phone's browser and lists pass or fail for each:
- Every English string has a Spanish version, and every service type has complete copy.
- All 24 combinations of language × service × full or minimal details produce 5 messages, 7 ideas and a bio of 150 characters or fewer, with no "undefined" or broken blanks.
- No invented discounts, "free", "#1", "best", star ratings, "licensed/insured" or similar claims anywhere in the copy.
- Review requests contain no incentives and no "if you were happy" gating.
- No contact details appear that the owner didn't type.
- Phone, handle, website and initials formatting work.
- The page policy blocks all network requests, and all 6 embedded fonts load.
- Long text shrinks to fit its box.
- 36 renders (3 styles × post/story × no image/photo/logo × EN/ES, with a very long name and service area) all draw inside their safe areas.
- Exports are real PNGs at exactly 1080 × 1350 and 1080 × 1920.

Opus reported 18/18 built-in self-tests and 50/50 browser checks passing in desktop Chrome with phone-sized viewports (320, 360 and 412px). Sharing to installed Android apps and real camera uploads still require manual phone testing. I also ran the full flow there: fill in the form, try all 3 styles, save, upload a photo and a logo (each was detected correctly), switch to Spanish, use every tab, reload, and confirm the details persist.

## Deploying (recommended: Cloudflare Pages)
It's a static file, so any static host works. Cloudflare Pages is free and fits the pages.dev setup you already use.
1. This project is hosted in the existing GitHub repository `mataindustries/starterkit` with `index.html` and `_headers` at the root.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, then choose the repo. Leave the build command empty and set the output directory to `/`.
3. You get a `*.pages.dev` URL; you can add a custom domain later. `_headers` repeats the page's privacy policy as real HTTP headers and prevents other sites from embedding the page in a frame.

Keep Cloudflare Web Analytics turned off for this project. The page policy would block it anyway, and the promise is no tracking.

## Editing the copy
All wording is in the `<script>` near the top of the file: `UI` holds the interface text, `SV` holds per-service headlines, descriptions and post-idea details, and `CTAS` holds calls to action. `buildCopy()` assembles the bio, messages and ideas. Edit in `index.html`, then run `#selftest` again.

## Real Android launch gate
Before sharing publicly: run `#selftest` in Android Chrome, export and open a post and Story, test sharing/cancel/fallback with installed apps, upload gallery and camera images, review Spanish outputs, confirm settings survive reopening Chrome, and test the before/after layout.

## Known limits
- Some Samsung phones save photos as HEIC, which Chrome can't open. The app shows a message asking for a JPG or PNG.
- In Stories, the bottom ~340 px is deliberately left empty because Instagram's reply bar covers it.
- Fonts: Inter, Inter Display and Lora are used under the SIL Open Font License 1.1 and subset to Latin characters. Other scripts fall back to the phone's own fonts.

Made with ENM Ventures.
