# NextCustomer delivery

All files are in `/workspace/starterkit/campaigns/nextcustomer-short/` in this task. The production website is unchanged.

| Deliverable | File |
|---|---|
| Playable final | `nextcustomer_launch_short_1080x1920.mp4` |
| Lightweight proof | `nextcustomer_launch_short_proof_540x960.mp4` |
| Thumbnail | `thumbnail.png` |
| Five-frame sheets | `proof-contact-sheet.png`, `contact-sheet.png` |
| Shorts overlay check | `shorts-safe-area-check.png` |
| Sources and genuine captures | `nextcustomer-source.zip`, plus the unpacked source scripts and `assets/` |
| QA | `QA_REPORT.md`, `qa-results.json`, `browser-playback.json` |
| Upload title, description, pinned comment | `UPLOAD_COPY.md` |
| Local player | `review.html` |

## Durable repository transfer

Branch: `media/nextcustomer-short-issue-2` in [mataindustries/starterkit](https://github.com/mataindustries/starterkit/tree/media/nextcustomer-short-issue-2/campaigns/nextcustomer-short).

- [Final MP4](https://github.com/mataindustries/starterkit/raw/refs/heads/media/nextcustomer-short-issue-2/campaigns/nextcustomer-short/nextcustomer_launch_short_1080x1920.mp4)
- [Proof MP4](https://github.com/mataindustries/starterkit/raw/refs/heads/media/nextcustomer-short-issue-2/campaigns/nextcustomer-short/nextcustomer_launch_short_proof_540x960.mp4)
- [Source archive](https://github.com/mataindustries/starterkit/raw/refs/heads/media/nextcustomer-short-issue-2/campaigns/nextcustomer-short/nextcustomer-source.zip)
- [QA report](https://github.com/mataindustries/starterkit/blob/media/nextcustomer-short-issue-2/campaigns/nextcustomer-short/QA_REPORT.md)

Download the individual files above or clone the branch:

```bash
git clone --branch media/nextcustomer-short-issue-2 --single-branch https://github.com/mataindustries/starterkit.git
cd starterkit/campaigns/nextcustomer-short
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/review.html` for native video controls and downloads. The archive contains sources, genuine captures, fonts, audio, and QA; download the two MP4s separately. Every deliverable is below GitHub's individual-file limit.

No YouTube upload, merge, or deployment has been performed. Physical Android playback and channel-profile link setup are identified as manual publication checks in the QA report.
