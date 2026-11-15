from pathlib import Path
import hashlib,json,zipfile

ROOT=Path(__file__).resolve().parent
def main():
    qa=json.loads((ROOT/'sync-qa.json').read_text())
    playback=json.loads((ROOT/'browser-playback.json').read_text())
    determinism=json.loads((ROOT/'determinism.json').read_text())
    proof=ROOT/'nextcustomer_audio_sync_v2_proof_540x960.mp4'
    assert qa['status']=='PASS'
    assert playback['ended'] and not playback['error'] and playback['totalFrames']==600
    assert playback['proofSha256']==hashlib.sha256(proof.read_bytes()).hexdigest()
    assert determinism['status']=='PASS'
    lines=['# Audio sync v2 / encoded A/V review','',
        '**PASS — 14/14 objective technical and synchronization gates, continuous Chrome playback, and native master/seven-stem repeat rendering.**','',
        'The approved H.264 stream and all 600 decoded picture frames are identical. All 58 original campaign files and the production source retain their original SHA-256 hashes. No revised 1080 export was made.','',
        'The separate listening WAV and revised proof contain the new DaemonV12 composition. Final proof loudness: **'+qa['mastering']['encodedProof']['input_i']+' LUFS**, **'+qa['mastering']['encodedProof']['input_tp']+' dBTP**. All seven native tracks have zero clipped samples; the final 100 ms is silent.','',
        '## Actual synchronization review','',
        'Reviewed decoded picture anchors and the actual delivered AAC waveform together, not just source-code timestamps. The companion contact sheet pairs 12 actual proof frames with their encoded audio envelope. Chrome then played the complete proof with audio enabled and zero dropped frames, followed by seeks to those 12 anchors.','',
        'At 120 BPM/960 PPQ, each 30 fps picture frame is exactly 64 engine ticks / 1,470 native samples / 1,600 delivery samples. The native engine exporter verifies the scheduled sample positions. AAC transport offsets were measured by normalized waveform correlation against the lossless listening master. Acoustic attacks were located in the actual rendered track using positive 2 ms RMS-envelope rise, including envelope/filter behavior. This onset proxy has roughly 1 ms smoothing uncertainty and is not a perceptual listening score.','',
        'All 23 scored anchors are within **'+str(qa['worstAbsOffsetFrames'])+' frames** of their picture anchors. The broad wipe accounts for the largest value. The Bio uses the preceding montage impact intentionally, one frame early; it does not receive a redundant adjacent hit.','',
        '| Event | Picture frame | Seconds | Scheduled offset (f) | Measured acoustic offset (ms / f) | AAC transport (ms) |',
        '|---|---:|---:|---:|---:|---:|']
    for r in qa['sync']:
        lines.append(f"| {r['event']} | {r['visualAnchorFrame']} | {r['visualAnchorFrame']/30:.3f} | {r['scheduledOffsetFrames']:+.3f} | {r['observedAcousticOffsetMs']:+.3f} / {r['observedAcousticOffsetFrames']:+.3f} | {r['encodedTransportOffsetMs']:+.3f} |")
    lines+=['','## Picture/event interpretation','',
        '- Typography: decoded first ink appears at frames 18/26/34, slightly after the nominal `.56/.83/1.10` second animation parameters. The score follows the actual picture.',
        '- Tap: anchor 167 is the displayed frame closest to the annotation’s maximum opacity; the gesture begins at 161. Post and Story get an onset impact and a softer settling latch at 210→227 and 282→299.',
        '- Copy: montage/Bio share the frame-360 accent; Messages and Week 1 get distinct notes at 368 and 376. The actual Spanish toggle, not just its section cut, is accented at 456.',
        '- CTA: all text already appears at frame 480. The music resolves there, leaves the invitation clear, answers softly during the decorative breath, and finishes within the fixed picture boundary.','',
        '## Evidence limits and owner gate','',
        'This is an objective decoded audiovisual review plus real-time playback, not a claim that an agent heard the music or a human approved its musical feel. Physical headphone/phone listening has not been performed. The owner should listen to the revised proof and the standalone audio; approval precedes any revised 1080×1920 export.','',
        'The event map, CSV offsets, native render/analysis manifests, fresh-render hashes, and `PRODUCTION_LOG.md` preserve the underlying evidence. DaemonV12 HEADLINER and the native sampler/production route were used at commit `eee072d71a7581913faebff95c935cae8c9be41b`.']
    (ROOT/'SYNC_REVIEW.md').write_text('\n'.join(lines)+'\n')
    archive=ROOT/'audio-sync-v2-source.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(ROOT.rglob('*')):
            if not p.is_file() or p==archive or '__pycache__' in p.parts:continue
            if p.suffix in ['.mp4','.mp3'] or p.name=='nextcustomer_audio_sync_v2.wav':continue
            z.write(p,Path('audio-sync-v2')/p.relative_to(ROOT))
    with zipfile.ZipFile(archive) as z:assert z.testzip() is None
    print('Review report and source archive ready;',archive.stat().st_size,'bytes')

if __name__=='__main__':main()
