# NextCustomer audio sync v2 — owner review

This is an **audio-only revision** on PR #3. The approved original remains in the parent folder. All revised files live here.

- `nextcustomer_audio_sync_v2_proof_540x960.mp4`: 20-second revised owner proof; approved picture stream copied unchanged.
- `nextcustomer_audio_sync_v2.wav`: exact 20-second, 48 kHz stereo PCM24 listening file. Source synthesis/rendering is native PCM16; higher delivery word length does not restore precision.
- `nextcustomer_audio_sync_v2.mp3`: convenient listening copy; do not use MP3 padding as the sync clock.
- `review.html`: player, listening file and transition-loop buttons. Serve the **parent campaign folder** and open `/audio-sync-v2/review.html`.
- `event-map.json` / `.csv`: decoded-picture anchors, motion ranges, ticks and sample positions.
- `measured-sync-offsets.csv`, `SYNC_REVIEW.md`, `sync-qa.json`, `decoded-av-sync-review.png`: actual encoded A/V review and measured offsets.
- `headliner.score.json`, `nextcustomer-sync.project.json`, `assets/`, `native-render/`: editable score, original task-generated instruments, native master and seven aligned stems.
- `engine-environment.json`, engine validation/event map/manifests, `determinism.json`: provenance and repeat-render evidence.
- `PRODUCTION_LOG.md`: thesis, focused musical revision, risk pass and listening limits.

## Reproduce

Requires Python dependencies from `../requirements.txt`, Node 22.18+, FFmpeg 7.1.5, and the existing Playwright runtime for browser verification. No new Node packages or FluidSynth are needed for synthesis/rendering. Use DaemonV12 commit `eee072d71a7581913faebff95c935cae8c9be41b`; set `DAEMONV12_ROOT` to that checkout if it is not `../.cache/daemonv12`.

From this folder:

```bash
python3 map_events.py
python3 compose.py
python3 render_proof.py
python3 review_sync.py
node verify_playback.cjs
python3 make_report.py
```

`compose.py` uses the upstream HEADLINER source generator to create task-authored additive instruments, then the unmodified native sampler/production CLI. It generates original paper/contact sounds locally, validates the real project, and resolves its triggers with the engine's sync exporter. A fixed 20-second container includes all tails.

`render_proof.py` masters the new audio and uses `-c:v copy` from the approved proof. It never invokes `../render.cjs`, rewrites an original asset, or creates a revised 1080×1920 MP4. Proof/listening files here can be regenerated; approved originals are checked against `approved-originals.json`.

The engine checkout is intentionally not bundled. Its code license is an owner decision; no upstream code, presets, sample packs or third-party recordings are redistributed here. All musical notes, synthesis parameters and contact sounds were authored for this revision using the owner's requested engine. Original upstream WOFF/product assets remain in the approved parent campaign.

## Review gate

Objective sync analysis, encoded-frame comparison, real-time Chrome playback and determinism checks are recorded separately from subjective listening. Owner approval of this proof is required before a revised 1080×1920 export. Nothing is deployed or published.
