# NextCustomer launch Short

Media-only implementation of [issue #2](https://github.com/mataindustries/starterkit/issues/2). One 20-second film, not alternate concepts. Root `index.html`, `_headers`, and `README.md` are untouched. No deployment or YouTube publication is part of this pipeline.

## Deliverables

- `nextcustomer_launch_short_1080x1920.mp4`: final H.264/AAC, 1080×1920, 30 fps.
- `nextcustomer_launch_short_proof_540x960.mp4`: complete lightweight proof, reviewed before the final render.
- `thumbnail.png`, `proof-contact-sheet.png`, `contact-sheet.png`.
- `QA_REPORT.md`, `qa-results.json`, and `UPLOAD_COPY.md`.
- `assets/`: actual app exports, actual UI captures, continuous source session, EN/ES text, embedded fonts, original audio, and provenance.
- `nextcustomer-source.zip`: the source/capture bundle, rebuilt with `python3 build-source.py`; excludes MP4 renders and caches.
- `review.html`: local playable review surface. Serve this folder; it is not deployed.

## Dependencies

Verified with Node 24.22.1, Python 3.12.14, FFmpeg/ffprobe 7.1.5, Chromium 156, Playwright 1.62.1, @napi-rs/canvas 0.1.100, NumPy, SciPy, and Pillow. The managed runtime already supplies these; no dependency installation was needed. Exact Python versions are in `qa-results.json`.

On another machine, install the Node versions pinned in `package.json` and Python dependencies from `requirements.txt`. Install FFmpeg and Chromium through your system package manager. Set `CHROMIUM_PATH` if Chromium is not `/usr/bin/chromium`; the capture script reuses `/usr/bin/ffmpeg` for Playwright recording. On managed Codex, Chromium needs an approved command outside the restrictive sandbox because of blocked socket setup; ordinary media rendering runs inside the sandbox.

## Reproduce

Run from this folder:

```bash
node capture.cjs
python3 sound.py
node render.cjs proof
```

Play the proof with sound and inspect its contact sheet before the final render. Then:

```bash
node render.cjs final
node verify-browser.cjs
python3 qa.py
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/review.html`. `node render.cjs still 15.5` renders one full-resolution diagnostic frame into `.cache/still.png`. `.cache/` is disposable and excluded from Git.

`capture.cjs` starts its own temporary localhost server and closes it on completion. It reads the original `../../index.html` without altering it, enters Luna Cleaning, selects House cleaning, adds San Gabriel Valley and a reserved fictional telephone number, clicks Make my kit, selects Editorial/Terracotta, and uses the actual Save image buttons. It records real video at CSS viewport resolution and screenshots at 2× pixel density; the film enlarges the real video with Lanczos interpolation. Its manifest contains source hashes, action times, and self-test results. If only rerendering, the committed captures suffice; no network or product execution is required.

`render.cjs` uses frame-exact Canvas composition and pipes raw RGBA frames to FFmpeg. Main titles and CTA remain inside x=72–900, y=180–1540. UI crops and time-compressed cuts retain the genuine content. An orange tap ring is editorial annotation. No invented product screens, metrics, customer photos, or results are used. All displayed copy excerpts originate in `assets/outputs.json` and the corresponding UI screenshots. NextCustomer titles intentionally coexist with the actual app's Starter Kit branding.

`sound.py` synthesizes every sound from seeded noise and oscillators. FFmpeg applies measured two-pass loudness normalization during the final mux. No third-party music, samples, voice clones, or stock recordings are included.

## Fonts and permissions

Inter / Inter Display: Copyright 2016 The Inter Project Authors. Lora: Copyright 2011 The Lora Project Authors, with Reserved Font Name "Lora". The original WOFF files were extracted unchanged from the existing app. Both use SIL OFL 1.1; see `assets/fonts/OFL.txt`. New motion, sound, and copy in this campaign were created for this task.

## Transfer

All deliverables are ordinary files below GitHub's individual-file limit and are included on the media branch. Clone or download the PR branch to retain playable MP4s and all sources. Raw MP4 links also support download without a build. `DELIVERY.md` records exact task paths and repository links.

Physical Android playback and the owner's channel-profile link setup remain manual checks before publication; desktop Chrome decoding, playback, and technical media QA are recorded separately. No claim of physical-device testing is made.
