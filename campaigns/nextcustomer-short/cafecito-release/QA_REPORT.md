# CAFECITO RUSH integration QA

**Technical integration: PASS. Final owner listening/viewing approval pending.**

| Check | Result |
|---|---|
| Proof / release candidate | 540×960 / 1080×1920; both 20.000s, 600 frames, 30 fps |
| Locked picture | H.264 stream and all 600 decoded-frame hashes identical to each corresponding original; exact frame timestamps n/30 |
| Source preservation | All 310 starting-branch files unchanged, including original, audio-sync-v2, Wonder sources and approved masters |
| Audio source | Verified final lossless WAV SHA-256 `4de7fd0f93d1e1689ffa16b613e24c25cb56f6b48058b271737bec6e97dc6e08` |
| Processing | No musical edits or gain change; only 44.1→48 kHz resampling and AAC-LC 256 kb/s stereo encoding |
| A/V transport | Zero-sample measured AAC/reference lag at all 23 visual anchors; minimum local waveform correlation 0.976942 |
| Encoded level | −14.57 LUFS, −1.72 dBTP; no new full-scale samples; final 100ms below −70 dBFS |
| Decode / timing | Full FFmpeg decode without errors; no missing picture frames; both streams start at 0; container ends at 20s |
| Android compatibility | H.264 High/yuv420p (proof level 3.1, release level 4.0), AAC-LC stereo 48 kHz, MP4 faststart |
| Remote delivery | Direct raw 1080 MP4 returned HTTP 200; 1,913,544 bytes; downloaded SHA-256 matches release candidate |
| Browser playback | Both files completed at 1× with audio enabled in Chromium 156; 600 frames each, zero dropped frames, no errors; 12 anchor seeks each passed |

AAC raw decoding includes 512 padding samples beyond the 960,000-sample presentation timeline. The MP4 duration/edit metadata presents exactly 20s; waveform correlation verifies that AAC priming does not shift the soundtrack. No use of `-shortest` or picture frame-rate conversion.

## Actual picture events and musical decisions

Decoded proof frames immediately before, at and after the key anchors were inspected in [decoded-event-review.png](decoded-event-review.png). These confirm the real Make my kit crop/tap/result, Post and Story exports, and unchanged CTA. Timing uses Wonder's actual rendered trigger samples, not rounded prose in its listening report.

| Event | Picture frame / time | Rendered cue / scheduled offset |
|---|---|---|
| Make my kit crop | 140 / 4.666667s | Groove carries the crop; no added hit |
| Make my kit tap maximum | 167 / 5.566667s | Cup 5.568186s / +1.519ms |
| Genuine kit result | 174 / 5.800000s | Knock 5.795442s / −4.558ms |
| Post reveal | 210 / 7.000000s | E-major reed/pad/bass 7.000000s / 0ms |
| Post settles | 227 / 7.566667s | Quiet knock/pluck 7.575760s / +9.093ms |
| Story reveal | 282 / 9.400000s | Contrasting B-major reed/pad/bass 9.393923s / −6.077ms |
| Story settles | 299 / 9.966667s | Existing groove carries motion; no added hit |
| CTA | 480 / 16.000000s | E-major resolution 15.999977s / −0.023ms |

The 23 visual anchors plus the separate ending/audio-release row are accounted for in [proof-sync.csv](proof-sync.csv) and [release-sync.csv](release-sync.csv). Typographic entrances, typing, individual cards and decorative motion stay within musical phrases; every visual event is not forced onto a beat. The largest scheduled offset among the deliberate cues is the existing EN→ES toggle spoon at −18.186ms (0.55 picture frames). No offset or tempo adjustment is warranted by these measurements. Cue schedule offsets do not measure perceived attacks; the final audiovisual judgment belongs to the owner.

## Source limitation and review gate

Wonder's original render metadata records **116 clipped samples in the warmkeys track before mastering** (pre-clip peak +1.47291 dBFS). The approved delivered WAV and these encoded outputs have no full-scale clipping and retain −1.72 dBTP headroom. This integration adds no clipping; it cannot remove an inherited track-stage artifact without changing the approved music. The source finding is preserved in both QA JSON files for owner listening review. No approved master or DaemonV12 code was modified.

No human listening approval or physical Android-device test is claimed. Use the direct MP4 downloads in [README.md](README.md) for owner review. No Spanish adaptation, publication, merge or YouTube upload is included.

Machine-readable evidence: [proof QA](proof-qa.json), [release QA](release-qa.json), [proof provenance](proof-provenance.json), [release provenance](release-provenance.json), and [continuous browser playback](browser-playback.json).
