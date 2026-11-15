# Audio sync revision / production record

## Six-line musical thesis

1. **Hook:** three uneven copper/felt syllables, D5 → A5 → F5, triggered by the three actual typography entrances; reuse their identity at Post and Story.
2. **Rhythm:** contact-led hocket and intentional rests, following the picture rather than running a half-second loop. 120 BPM is the exact engine clock; one picture frame is 64 ticks.
3. **Low end:** short, centered rubber-like notes own the bass. Body impacts stay above it; phone identity also lives in the 300–2500 Hz pitched attacks.
4. **Contrast:** dry UI/typing, a grounded D Post impact, a lifted G Story body and higher motif, then sparse descending copy-card notes.
5. **Payoff:** the Spanish switch gets its own precise click; the CTA stops the rhythmic layers and answers in D with warm root/fifth resolution.
6. **Ending:** soft E → D/A answer, finite room tail, then quiet space before the 20-second boundary. No new CTA text entrances are invented.

## Why the original felt separate: evidence, not a listening claim

- `sound.py` ran a half-second pattern over the UI. The actual button crop is frame 140 and the kit-result cut is frame 174, so those contacts had no dedicated musical answer.
- The original later wood accents at 13.25 and 14.3 seconds did not follow the actual Messages and Week 1 entrances at frames 368 (12.267 s) and 376 (12.533 s).
- Both original export accents used effectively the same wood/tone gesture. The revision gives Post and Story distinct body/register/harmonic roles and separate latches as their blooms settle.

## Engine investigation and verified route

`mataindustries/daemonv12` is available at `eee072d71a7581913faebff95c935cae8c9be41b`. A shallow, blob-filtered, sparse checkout avoided the repository's large media libraries. Composer skill and production references were read. Native sampler/production, FFmpeg analysis, and HEADLINER additive instrument generation work. FluidSynth and the MCP dependency set are unavailable; neither is needed for this route, so nothing was installed.

The documented HEADLINER `build.ts` route created a separate composition package with task-authored instruments and notes. The ordinary Daemon CLI validated/rendered it and exported authoritative sample/tick timing. No engine code was modified or included in the delivery. `engine-environment.json` records exact runtime and generator/skill identities. `instrument-recipes.json` includes the upstream foundation's historical engine-base field; the actual running commit is the one above.

## Focused iterations

- **VA1:** complete 20-second event-led composition. Passed timing/technical checks. Retained locally at `.cache/audio-sync-v2/va1/` for comparison.
- **VA2, delivered:** retain the exact motif, rhythm, arrangement and picture. Retune the Post body's principal resonances from 184/371 Hz to D3/D4 (146.832/293.665 Hz), with an A upper contact. Score inspection identified the former F-sharp region against a D-minor motif as an avoidable tonal conflict. This is a specific score-based correction, not claimed listening feedback.
- **Early stop:** no defensible third musical edit emerged from the objective review. Additional complete variants were not manufactured. Owner listening should decide whether the palette/contour works before more musical changes or a revised 1080 export.

## Risk pass / review

**Risk:** withhold the bass and regular beat before the Post, leaving paper air to set up a resonant contact. Upside: a more tactile, memorable arrival. Risk: it may feel sparse. The actual bass stem is silent over 6.5–6.7 seconds; the Post contact and theme return together at frame 210. Kept provisionally because the setup and consequence match the picture. This is an arrangement/evidence judgment; owner listening remains decisive.

Opening 0–1/3/5-second continuity was reviewed through the preserved D identity, exact three-stroke cadence, paper wipe, and lower-register app response. The Post/Story setup and settle were inspected in decoded picture plus actual encoded waveform. The last three seconds move E to D/A, with a finite tail and a silent final 100 ms. Mono/phone translation is a proxy based on centered low end, audible harmonic attacks, differing musical registers and modest room effects; no physical-device or human hearing test is claimed.

The original 58 campaign files, root website source, renderer, timeline, original sound source, original MP4s, thumbnail and CTA were preserved. The revised proof copies the approved H.264 stream. There is no revised 1080×1920 export.
