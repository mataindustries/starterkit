# NEXTCUSTOMER — CAFECITO (sketches, HARD CHECKPOINT)

Branch: `experiment/nextcustomer-cafecito-wonder` · Engine: DaemonV12 (local CLI, MCP tools returned unsupported in this session) · No video frames, production audio, or approved masters changed. No SOLECITO melody reused (new keys/hooks below vs. its D-minor D5→A5→F5).

Film read (600f/30fps): 0–3s typography hook window, 3s real app, 5.57s tap → 5.8s kit reveal, 7s Post, 9.4s Story, 12s Bio/Messages/Week 1, 15s Spanish, 16s CTA. Sketches demo the opening→first-reveal arc only; do not mechanically hit every event.

## Listen (WAV + MP3 in `renders/<name>/`)
| Sketch | File | Identity | Hook (first 2s) | Arc |
|---|---|---|---|---|
| A CAFECITO RUSH | `a-cafecito-rush.json` 132 BPM, E major, 7.6s | Syncopated marimba-pluck, rubber bass, cup/spoon answers | E5–G#5–B5–G#5 (0–1.4s) | Groove at app entry; bar 4 (~5.5s) = tap/reveal lift, E-major stab |
| B EL NEGOCIO DESPIERTA | `b-el-negocio-despierta.json` 104 BPM, A major, 7.4s | Felt keys + breathy pad, waking bass/percussion | C#5–E5–A5 dawn rise (0–2s) | Intimate bar 1 → wake bar 2 → expansive A-major reveal bar 3 |
| C HECHO CON GANAS | `c-hecho-con-ganas.json` 126 BPM, G major, 7.9s | Tuned-spoon hocket (3+3+2), cup-as-kick, electronic bass | G5–B5–A5–G5 spoon melody (0–1.5s) | Kitchen groove → bar-3 everyday-sound break → electronic return + bell/G stab |

Mastering comparable/restrained: −14.5/−14.6/−14.6 LUFS, no clipping (engine `*.analysis.json` in each render dir).

## Reproduce
`python3 compose.py` (synthesizes all original instrument WAVs/kits into `assets/`, writes the 3 project JSONs — instrument recipes are the synthesis parameters in that file) then:
`node /workspaces/daemonv12/bin/daemonv12.js render <project>.json --format wav,mp3 --out-dir renders/<name>`

**STOP — awaiting owner choice of A, B, or C before any 20-second development, sync verification, or video render.**

## GATE 2 — FINAL (awaiting owner listening/viewing approval)
ONE soundtrack only: `cafecito-rush-final.json` (132 BPM, E major, 11 bars = 20.000s), built by `compose_gate2.py` with warmer `assets/v2/` instruments (wood pluck, felt keys, reed stab; original sketch assets/projects/renders untouched).
Journey: bars1–2 signature hook+groove · bars3–4 app build, tap 5.569s / kit 5.795s accents · Post E-major payoff stab 7.000s, celebration bar5 · Story B-major payoff stab 9.394s (contrast) · bars7–8 stripped words/cards contrast (copy-phrase note 12.000s, cards NOT individually hit) · Spanish hook return 15.000s, toggle spoon 15.182s · CTA E chord 16.000s, bar10 celebration (E–A–B–E), bar11 victory signature, last onset 18.86s.
Deliverables in `renders/cafecito-rush-final/`: WAV + MP3 + `cafecito-rush-final_review_540x960.mp4` (video stream copied, framemd5 identical to approved sync-v2 proof, 600 frames, 540×960).
Check: 20.000s, −14.57 LUFS, peak −1.72 dBFS, no clipping, final 100ms silent. No 1080 export. STOP for approval.
