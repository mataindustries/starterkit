# Audio sync v2 / encoded A/V review

**PASS — 14/14 objective technical and synchronization gates, continuous Chrome playback, and native master/seven-stem repeat rendering.**

The approved H.264 stream and all 600 decoded picture frames are identical. All 58 original campaign files and the production source retain their original SHA-256 hashes. No revised 1080 export was made.

The separate listening WAV and revised proof contain the new DaemonV12 composition. Final proof loudness: **-18.69 LUFS**, **-1.84 dBTP**. All seven native tracks have zero clipped samples; the final 100 ms is silent.

## Actual synchronization review

Reviewed decoded picture anchors and the actual delivered AAC waveform together, not just source-code timestamps. The companion contact sheet pairs 12 actual proof frames with their encoded audio envelope. Chrome then played the complete proof with audio enabled and zero dropped frames, followed by seeks to those 12 anchors.

At 120 BPM/960 PPQ, each 30 fps picture frame is exactly 64 engine ticks / 1,470 native samples / 1,600 delivery samples. The native engine exporter verifies the scheduled sample positions. AAC transport offsets were measured by normalized waveform correlation against the lossless listening master. Acoustic attacks were located in the actual rendered track using positive 2 ms RMS-envelope rise, including envelope/filter behavior. This onset proxy has roughly 1 ms smoothing uncertainty and is not a perceptual listening score.

All 23 scored anchors are within **1.619 frames** of their picture anchors. The broad wipe accounts for the largest value. The Bio uses the preceding montage impact intentionally, one frame early; it does not receive a redundant adjacent hit.

| Event | Picture frame | Seconds | Scheduled offset (f) | Measured acoustic offset (ms / f) | AAC transport (ms) |
|---|---:|---:|---:|---:|---:|
| opening | 0 | 0.000 | +0.000 | +1.270 / +0.038 | +0.000 |
| type-marketing | 18 | 0.600 | +0.000 | +2.653 / +0.080 | +0.000 |
| type-shouldnt | 26 | 0.867 | +0.000 | +1.995 / +0.060 | +0.000 |
| type-job | 34 | 1.133 | +0.000 | +2.154 / +0.065 | +0.000 |
| wipe | 85 | 2.833 | +0.000 | +53.968 / +1.619 | +0.000 |
| app-cut | 90 | 3.000 | +0.000 | +4.104 / +0.123 | +0.000 |
| typing | 93 | 3.100 | +0.000 | +1.111 / +0.033 | +0.000 |
| button-crop | 140 | 4.667 | +0.000 | +1.066 / +0.032 | +0.000 |
| tap-onset | 167 | 5.567 | +0.000 | +1.111 / +0.033 | +0.000 |
| kit-cut | 174 | 5.800 | +0.000 | +1.066 / +0.032 | +0.000 |
| post-cut | 210 | 7.000 | +0.000 | +1.111 / +0.033 | +0.000 |
| post-land | 227 | 7.567 | +0.000 | +1.814 / +0.054 | +0.000 |
| story-cut | 282 | 9.400 | +0.000 | +2.789 / +0.084 | +0.000 |
| story-land | 299 | 9.967 | +0.000 | +1.814 / +0.054 | +0.000 |
| copy-cut | 360 | 12.000 | +0.000 | +2.653 / +0.080 | +0.000 |
| bio-in | 361 | 12.033 | -1.000 | -30.680 / -0.920 | +0.000 |
| messages-in | 368 | 12.267 | +0.000 | +1.610 / +0.048 | +0.000 |
| week-in | 376 | 12.533 | +0.000 | +2.086 / +0.063 | +0.000 |
| spanish-cut | 450 | 15.000 | +0.000 | +2.653 / +0.080 | +0.000 |
| es-toggle | 456 | 15.200 | +0.000 | +1.111 / +0.033 | +0.000 |
| spanish-land | 459 | 15.300 | +0.000 | +1.542 / +0.046 | +0.000 |
| cta-cut | 480 | 16.000 | +0.000 | +1.111 / +0.033 | +0.000 |
| cta-breath | 511 | 17.033 | +0.000 | +13.061 / +0.392 | +0.000 |

## Picture/event interpretation

- Typography: decoded first ink appears at frames 18/26/34, slightly after the nominal `.56/.83/1.10` second animation parameters. The score follows the actual picture.
- Tap: anchor 167 is the displayed frame closest to the annotation’s maximum opacity; the gesture begins at 161. Post and Story get an onset impact and a softer settling latch at 210→227 and 282→299.
- Copy: montage/Bio share the frame-360 accent; Messages and Week 1 get distinct notes at 368 and 376. The actual Spanish toggle, not just its section cut, is accented at 456.
- CTA: all text already appears at frame 480. The music resolves there, leaves the invitation clear, answers softly during the decorative breath, and finishes within the fixed picture boundary.

## Evidence limits and owner gate

This is an objective decoded audiovisual review plus real-time playback, not a claim that an agent heard the music or a human approved its musical feel. Physical headphone/phone listening has not been performed. The owner should listen to the revised proof and the standalone audio; approval precedes any revised 1080×1920 export.

The event map, CSV offsets, native render/analysis manifests, fresh-render hashes, and `PRODUCTION_LOG.md` preserve the underlying evidence. DaemonV12 HEADLINER and the native sampler/production route were used at commit `eee072d71a7581913faebff95c935cae8c9be41b`.
