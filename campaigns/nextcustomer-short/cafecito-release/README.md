# NextCustomer — CAFECITO RUSH release candidate

Ready for final owner audiovisual review; publication is not authorized by this package.

- [Android-friendly 1080×1920 MP4 download](https://github.com/mataindustries/starterkit/raw/refs/heads/release/nextcustomer-cafecito-rush/campaigns/nextcustomer-short/cafecito-release/nextcustomer_cafecito_rush_release_1080x1920.mp4)
- [540×960 audiovisual proof](https://github.com/mataindustries/starterkit/raw/refs/heads/release/nextcustomer-cafecito-rush/campaigns/nextcustomer-short/cafecito-release/nextcustomer_cafecito_rush_proof_540x960.mp4)
- [Concise QA report](QA_REPORT.md) · [Decoded event review](decoded-event-review.png)
- [Approved Wonder lossless master](../cafecito/renders/cafecito-rush-final/cafecito-rush-final.wav) · [Composition](../cafecito/cafecito-rush-final.json) · [Composition source](../cafecito/compose_gate2.py)

Branch `release/nextcustomer-cafecito-rush` starts at `a0162f10111cf1237410d97631727e2df4b75139` on `experiment/nextcustomer-cafecito-wonder`. That commit contains the final Wonder WAV and composition sources and descends from PR #3's picture/event-map commit `8425fecce9532669ce35aa4bfa0f4b16b0c92649`. Their availability and hashes were verified before integration.

No musical changes proved necessary. The WAV is used at unity gain and zero offset. Groove, notes, instrumentation, tempo and master are unchanged. The original H.264 streams are copied separately from the approved 540×960 and 1080×1920 files. No product capture or visual renderer runs. All 310 starting-branch files, including original exports, audio-sync-v2 and CAFECITO masters, retain their original Git blob hashes. DaemonV12 is neither invoked nor modified.

## Reproduce

Requires Python with NumPy, SciPy, Pillow, FFmpeg/ffprobe, and Node with Playwright/Chromium (available in the task environment). From the repository root:

```bash
python3 campaigns/nextcustomer-short/cafecito-release/integrate.py proof
python3 campaigns/nextcustomer-short/cafecito-release/verify.py proof
# Inspect decoded-event-review.png and the proof before preparing the candidate.
python3 campaigns/nextcustomer-short/cafecito-release/integrate.py release
python3 campaigns/nextcustomer-short/cafecito-release/verify.py release
node campaigns/nextcustomer-short/cafecito-release/verify-playback.cjs
```

The scripts write only this new directory. Reversing the integration means removing this additive package or reverting its commit. Approved originals need no restoration. Mux provenance records hashes and exact commands; verification records frame and stream hashes, decoded AAC measurements, preservation checks and cue decisions. AAC output can vary across encoder versions; the committed hashes identify the reviewed files.

To review locally, serve this directory with `python3 -m http.server 8080 --bind 127.0.0.1` and open `http://127.0.0.1:8080/review.html`. No site is deployed. The existing film's brief EN/ES feature demonstration remains among the locked frames; no Spanish version was created. No merge, YouTube upload or other publication is performed.
