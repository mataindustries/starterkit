# NextCustomer holiday pack: review files

Review material for the seasonal presets. None of it is used by the app (`index.html` at the repo root).

- `contact-sheet.png`: all 16 sample exports on one page.
- `exports/`: sample PNGs straight from the app's export engine, at full size (Post 1080 × 1350, Story 1080 × 1920). File names give the preset, format, style, language and trade. Files ending in `-photo` or `-logo` use a simple drawn placeholder image, not a stock photo. Owners add their own photos.
- `screenshots/`: Android Chrome emulation (Pixel 7 user agent, touch) at 320, 360 and 412 px, scale factor 2.

## Copy at a glance

| Preset | English headlines | Spanish headlines (usted) |
|---|---|---|
| Thank You, Neighbors / Gracias, vecinos | Thank you, neighbors. · Thankful for every customer in {town}. · This season, we're grateful for you. | Gracias, vecinos. · Agradecidos con cada cliente de {town}. · En esta temporada, gracias por su preferencia. |
| Shop Small / Apoye lo local | Shop small. Hire local. · Support small. Support {town}. · When you hire local, your neighborhood grows. | Apoye lo local, apoye a su vecino. · Los negocios pequeños hacen grande a {town}. · Cuando contrata local, crece su comunidad. |
| Holiday Ready / Todo listo para las fiestas | Per trade, e.g. cleaning: Holiday guests coming? Let's get your home ready. · detailing: Holiday road trip? Start with a clean car. · landscaping: Holiday ready, from the curb up. | ¿Visitas en las fiestas? Dejemos su casa lista. · ¿Viaje en las fiestas? Empiece con su carro limpio. · Su jardín listo para las fiestas. |

The full copy, calls to action and captions are in the `SEASON` object in `index.html`.

## Re-running the tests

Serve the repo root on port 8765 (for example `python3 -m http.server 8765`), then from `tests/`:

- `node selftest.cjs`: runs the built-in `#selftest` page (25 checks).
- `node e2e.cjs`: full owner flow at 320, 360 and 412 px (131 checks). Screenshots go to `../shots-out/`.
- `node share.cjs`: stubs the Web Share API before load and checks that seasonal Post and Story PNGs are handed to `navigator.share`.
- `node exports.cjs <dir>`: regenerates the sample exports.
- `node pixeldiff.cjs`: compares 145 Everyday renders against `main`. It needs `main`'s `index.html` served on port 8766.

These need Playwright with Chromium. Real Android camera capture and installed share targets still need a manual check on a phone.
