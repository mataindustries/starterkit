# QA report

**PASS — 28/28 checks passed.**

Final: 20.000 seconds · 1080×1920 · 600 frames · 30 fps · H.264/yuv420p · AAC stereo/48 kHz.
Measured final audio: **-16.92 LUFS**, **-1.21 dBTP**. Original synthesized soundtrack; no third-party recordings.

| Check | Result | Evidence |
|---|---|---|
| final picture | PASS | 1080×1920, h264, yuv420p |
| final duration / cadence | PASS | 20.000000 s; 30/1 fps; 600 decoded frames |
| final audio | PASS | aac, 48000 Hz, 2 channels |
| final full decode | PASS | Complete picture + audio decode without errors |
| final file size | PASS | 1,703,245 bytes; below GitHub individual-file limit |
| proof picture | PASS | 540×960, h264, yuv420p |
| proof duration / cadence | PASS | 20.000000 s; 30/1 fps; 600 decoded frames |
| proof audio | PASS | aac, 48000 Hz, 2 channels |
| proof full decode | PASS | Complete picture + audio decode without errors |
| proof file size | PASS | 848,056 bytes; below GitHub individual-file limit |
| Final loudness | PASS | -16.92 LUFS integrated; LRA 12.10 LU |
| No clipping / true-peak headroom | PASS | -1.21 dBTP after AAC encoding; ceiling ≤ -1 dBTP |
| No unintended black frames | PASS | No ≥99% near-black frame spans of 0.05 s or longer |
| Website preserved | PASS | {"index.html": true, "_headers": true, "README.md": true} |
| Genuine bilingual copy | PASS | {"en": {"messages": 5, "ideas": 7, "bioCharacters": 110}, "es": {"messages": 5, "ideas": 7, "bioCharacters": 121}} |
| Product self-tests | PASS | 20 of 20 passed · AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36 |
| Actual post export / en | PASS | [1080, 1350] |
| Actual post export / es | PASS | [1080, 1350] |
| Actual story export / en | PASS | [1080, 1920] |
| Actual story export / es | PASS | [1080, 1920] |
| thumbnail.png | PASS | [1080, 1920] |
| proof-contact-sheet.png | PASS | [1350, 536] |
| contact-sheet.png | PASS | [1350, 536] |
| Proof rendered before final | PASS | {"proofMtime": 1794556763.434302, "finalMtime": 1794556766.942834} |
| Typography safe areas | PASS | {"frames": 600, "textPlacementsChecked": 4157, "violations": [], "policy": "Main film typography: x >= 72, right <= 900, y >= 180, y + font size <= 1540. Decorative shapes excluded. Embedded captures reviewe… |
| proof Chrome playback | PASS | {"ended": true, "duration": 20, "currentTime": 20, "width": 540, "height": 960, "error": null, "audio": 439436, "playbackQuality": {"totalVideoFrames": 600, "droppedVideoFrames": 0}, "viewport": {"width": 36… |
| final Chrome playback | PASS | {"ended": true, "duration": 20, "currentTime": 20, "width": 1080, "height": 1920, "error": null, "audio": 439436, "playbackQuality": {"totalVideoFrames": 600, "droppedVideoFrames": 0}, "viewport": {"width": … |
| Changes confined to campaign | PASS | All tracked changes and non-ignored additions are inside campaigns/nextcustomer-short/; root file hashes also checked |

## Visual review

- Opening: the first-frame hook is fully visible. The second sentence completes its masked entrance by 1.42 seconds. Both were inspected in decoded proof frames at phone scale.
- Product: corrected the initial session letterboxing before the final proof. Reviewed the real name entry, Make my kit button/tap annotation, complete Post and Story exports, and genuine Bio/Messages/Week 1 crops. The Spanish switch and actual “Llegue a una casa limpia.” output were checked in a decoded frame.
- Ending: the exact three-part CTA is held for four seconds, with a personal first-post-idea invitation and quieter score. Essential type is reserved away from the right-side and bottom Shorts overlays; a final overlay simulation is included.

## Limits and final publication gates

Desktop Chromium played both files continuously from 0 to ended, with audio enabled; FFmpeg decoded every picture frame and audio packet. This is an automated media check, not a human listening session or physical Android test.
Before manual publication, check physical Android playback with sound, add the tool URL to the channel profile, and be ready to personally respond to KIT comments. No deployment, merge, or YouTube publication was performed.

Detailed streams, frame counts, browser results, file hashes, and source hashes: `qa-results.json`.
