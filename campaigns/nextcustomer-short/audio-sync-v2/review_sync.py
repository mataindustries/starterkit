"""Review actual encoded picture/audio together, including measured AAC offsets.

This supplies objective AV evidence, not a claim of human listening.
"""
from pathlib import Path
import csv, hashlib, json, subprocess
import numpy as np
from scipy.signal import butter, correlate, sosfilt
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
CAMPAIGN=ROOT.parent
CACHE=CAMPAIGN/'.cache/audio-sync-v2'
PROOF=ROOT/'nextcustomer_audio_sync_v2_proof_540x960.mp4'
WAV=ROOT/'nextcustomer_audio_sync_v2.wav'

def run(args):
    r=subprocess.run(args,capture_output=True)
    if r.returncode:raise RuntimeError(r.stderr.decode())
    return r.stdout
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def mono(file,sr=48000):
    b=run(['ffmpeg','-v','error','-i',str(file),'-vn','-ac','1','-ar',str(sr),'-t','20','-f','f32le','pipe:1'])
    return np.frombuffer(b,dtype='<f4').astype(np.float64)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def stream_hash(p):
    return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-c:v','copy','-f','h264','pipe:1'])).hexdigest()
def frame_hashes(p):
    return run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-an','-f','framemd5','pipe:1']).decode().splitlines()

def transport_lag(decoded,reference,onset):
    # Actual AAC decode versus lossless delivery waveform, not mux start_time metadata.
    pad=3200;length=5760;start=max(0,onset-480)
    ref=np.diff(reference[start:start+length],prepend=reference[start])
    candidate=np.pad(decoded,(pad,pad))[start:start+length+2*pad]
    candidate=np.diff(candidate,prepend=candidate[0])
    score=correlate(candidate,ref,mode='valid',method='fft')
    energy=np.convolve(candidate*candidate,np.ones(len(ref)),mode='valid')
    normalized=score/np.sqrt(np.maximum(1e-25,energy*np.sum(ref*ref)))
    k=int(np.argmax(normalized));return k-pad,float(normalized[k])

def attack_rise(stem,onset):
    # An acoustic onset proxy on the rendered track, including its actual envelopes/effects.
    filtered=sosfilt(butter(2,[180,6500],fs=44100,btype='bandpass',output='sos'),stem)
    w=88
    env=np.sqrt(np.convolve(filtered*filtered,np.ones(w)/w,mode='same'))
    flux=env-np.r_[np.zeros(w),env[:-w]]
    start=max(0,onset-220);end=min(len(stem),onset+2646)
    k=start+int(np.argmax(flux[start:end]))
    return k-onset

def main():
    anchors=json.loads((ROOT/'event-map.json').read_text())
    schedule=json.loads((ROOT/'engine-event-map.json').read_text())
    stems={p.stem:mono(p,44100) for p in (ROOT/'native-render/nextcustomer-sync.project.stems').glob('*.wav')}
    decoded=mono(PROOF);reference=mono(WAV)
    pairing={
        'opening':'contacts','type-marketing':'copper','type-shouldnt':'copper','type-job':'copper',
        'wipe':'movement','app-cut':'felt','typing':'typing','button-crop':'contacts','tap-onset':'contacts',
        'kit-cut':'contacts','post-cut':'contacts','post-land':'contacts','story-cut':'contacts','story-land':'contacts',
        'copy-cut':'copper','bio-in':'copper','messages-in':'copper','week-in':'copper','spanish-cut':'copper',
        'es-toggle':'contacts','spanish-land':'copper','cta-cut':'contacts','cta-breath':'resolve'
    }
    rows=[]
    for event in anchors['events']:
        id=event['id']
        if id not in pairing:continue
        track=pairing[id];target=event['engineSampleFrame']
        actual=min((x for x in schedule['events'] if x['trackId']==track),key=lambda x:abs(x['sampleFrame']-target))
        assert abs(actual['sampleFrame']-target)<=2940,(id,actual)
        delta=actual['sampleFrame']-target
        sample48=round(actual['sampleFrame']*48000/44100)
        lag,similarity=transport_lag(decoded,reference,sample48)
        rise=attack_rise(stems[track],actual['sampleFrame'])
        offset=1000*(delta+rise)/44100+lag/48
        row={'event':id,'visualAnchorFrame':event['anchorFrame'],'audioTrack':track,'scheduledEngineSample':actual['sampleFrame'],'scheduledOffsetFrames':round(delta/1470,6),'stemAttackRiseMs':round(rise/44.1,3),'encodedTransportOffsetMs':round(lag/48,3),'encodedCorrelation':round(similarity,5),'observedAcousticOffsetMs':round(offset,3),'observedAcousticOffsetFrames':round(offset*30/1000,4),'withinTwoFrames':abs(offset)<=2000/30,'measurement':'actual rendered stem positive 2 ms RMS-envelope rise + decoded AAC/reference correlation; 1 ms envelope smoothing uncertainty, not a perceptual listening score'}
        rows.append(row)
    original=CAMPAIGN/'nextcustomer_launch_short_proof_540x960.mp4'
    picture={'h264Original':stream_hash(original),'h264Revised':stream_hash(PROOF),'allDecodedFrameHashesIdentical':frame_hashes(original)==frame_hashes(PROOF)}
    baseline=json.loads((ROOT/'approved-originals.json').read_text())
    originals={p:sha(CAMPAIGN/p)==digest for p,digest in baseline.items()}
    product=json.loads((CAMPAIGN/'assets/capture-manifest.json').read_text())['baseline']
    roots={p:sha(CAMPAIGN.parent.parent/p)==digest for p,digest in product.items()}
    native=json.loads((ROOT/'native-render/nextcustomer-sync.project.render.json').read_text())
    overload=[{'track':t['trackId'],'clippedSamples':t['clippedSamples'],'preClipPeakDbfs':t['preClipPeakDbfs']} for t in native['production']['tracks']]
    mastering=json.loads((ROOT/'mastering.json').read_text())
    info=probe(PROOF);v=next(x for x in info['streams'] if x['codec_type']=='video');a=next(x for x in info['streams'] if x['codec_type']=='audio')
    decode=run(['ffmpeg','-v','error','-xerror','-i',str(PROOF),'-f','null','-'])
    checks={
        'allImportantCuesWithinTwoFrames':all(x['withinTwoFrames'] for x in rows),
        'AACWaveformCorrelationReliable':min(x['encodedCorrelation'] for x in rows)>.75,
        'identicalApprovedH264':picture['h264Original']==picture['h264Revised'],
        'all600FramesIdentical':picture['allDecodedFrameHashesIdentical'] and int(v['nb_frames'])==600,
        'all58ApprovedFilesUnchanged':all(originals.values()) and len(originals)==58,
        'productionSourceUnchanged':all(roots.values()),
        'durationAndDimensions':abs(float(info['format']['duration'])-20)<.001 and (v['width'],v['height'])==(540,960) and v['r_frame_rate']=='30/1',
        'AACStereo48k':a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2,
        'masterHeadroom':float(mastering['encodedProof']['input_tp'])<=-1,
        'reasonableListeningLevel':-20<=float(mastering['encodedProof']['input_i'])<=-15,
        'noTrackStageClipping':all(x['clippedSamples']==0 and x['preClipPeakDbfs']<0 for x in overload),
        'silentFinal100ms':float(np.max(np.abs(reference[-4800:])))<10**(-70/20),
        'allAudioSamplesDecoded':len(decoded)==960000,
        'allStems20Seconds':all(len(s)==882000 for s in stems.values())
    }
    report={'checks':checks,'status':'PASS' if all(checks.values()) else 'FAIL','picture':picture,'originalFiles':originals,'productionFiles':roots,'sync':rows,'worstAbsOffsetFrames':max(abs(x['observedAcousticOffsetFrames']) for x in rows),'mastering':mastering,'trackOverload':overload,'reviewMethod':'Picture anchors measured from decoded approved MP4 and render conditions; real generated track envelopes; actual final AAC waveform cross-correlation; joint picture/waveform contact sheet; real-time browser playback recorded separately. No human listening or perceptual quality approval claimed.','ownerGate':'Owner must listen to the revised proof before any revised 1080×1920 export.'}
    (ROOT/'sync-qa.json').write_text(json.dumps(report,indent=2)+'\n')
    with (ROOT/'measured-sync-offsets.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
    # Review actual proof frames beside their own encoded audio, not standalone charts.
    selected=['type-marketing','type-shouldnt','type-job','tap-onset','post-cut','post-land','story-cut','story-land','messages-in','week-in','es-toggle','cta-cut']
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
    small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
    sheet=Image.new('RGB',(1080,1830),'#171512');draw=ImageDraw.Draw(sheet)
    for i,id in enumerate(selected):
        row=next(x for x in rows if x['event']==id);f=row['visualAnchorFrame'];x=(i%4)*270;y=(i//4)*610
        p=CACHE/(id+'.png')
        run(['ffmpeg','-v','error','-y','-i',str(PROOF),'-vf',f'select=eq(n\\,{f}),scale=270:480','-frames:v','1',str(p)])
        sheet.paste(Image.open(p).convert('RGB'),(x,y))
        draw.text((x+8,y+484),f'{id} | f{f}',font=font,fill='#F3EEE6')
        center=f*1600;start=max(0,center-3200);stop=min(len(decoded),center+3200)
        chunk=decoded[start:stop];rms=np.sqrt(np.convolve(chunk*chunk,np.ones(96)/96,mode='same'))
        points=[(x+8+j*254/255,y+562-float(rms[min(len(rms)-1,round(j*(len(rms)-1)/255))])*42/max(1e-6,float(rms.max()))) for j in range(256)]
        draw.line(points,fill='#E2542B',width=2);draw.line((x+135,y+517,x+135,y+570),fill='#7FC3A0',width=1)
        draw.text((x+8,y+575),f"attack {row['observedAcousticOffsetFrames']:+.2f}f | AAC {row['encodedTransportOffsetMs']:+.2f}ms",font=small,fill='#F3EEE6')
    sheet.save(ROOT/'decoded-av-sync-review.png')
    print(report['status'],json.dumps(checks))
    for row in rows:print(f"{row['event']:18s} f{row['visualAnchorFrame']:3d}: {row['observedAcousticOffsetFrames']:+.3f}f, AAC {row['encodedTransportOffsetMs']:+.3f}ms")
    if not all(checks.values()):raise SystemExit(1)

if __name__=='__main__':main()
