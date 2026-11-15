"""Check decoded A/V, source preservation and cue timing without altering sources."""
import argparse
import csv
import hashlib
import json
import struct
import subprocess
from fractions import Fraction
from pathlib import Path
import numpy as np
from scipy.signal import correlate, convolve
from PIL import Image, ImageDraw, ImageFont
from integrate import BASE, CAMPAIGN, PROJECT, ROOT, WAV, paths, sha

REPO = CAMPAIGN.parent.parent
POLICY = {
    'opening': ('lead', 0, 'Signature hook establishes groove.'),
    'tap-onset': ('perc', 5.5682, 'Cup accent at Make my kit tap maximum.'),
    'kit-cut': ('perc', 5.7954, 'Knock response at genuine kit cut.'),
    'post-cut': ('reedstab', 7, 'E-major payoff with bass and pad; keep groove.'),
    'post-land': ('perc', 7.5758, 'Quiet knock and pluck settling response.'),
    'story-cut': ('reedstab', 9.3939, 'Contrasting B-major payoff; keep groove.'),
    'copy-cut': ('lead', 12, 'One phrase for the words/cards section.'),
    'spanish-cut': ('lead', 15, 'Existing film section: signature returns; no new language version.'),
    'es-toggle': ('perc', 15.1818, 'Existing toggle spoon accent; no new language version.'),
    'cta-cut': ('reedstab', 16, 'E-major resolution, then existing celebration/tail.')}

def run(args):
    return subprocess.run(args, check=True, capture_output=True).stdout

def ff(*args):
    return run(['ffmpeg', '-v', 'error', '-xerror', *map(str, args)])

def audio(path):
    return np.frombuffer(ff('-i', path, '-vn', '-ac', '2', '-ar', '48000', '-f', 'f32le', 'pipe:1'), dtype='<f4').reshape(-1, 2)

def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], check=True, capture_output=True, text=True)
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])

def lag(decoded, reference, sec):
    start = max(0, round(sec*48000)-480)
    ref = np.diff(reference[start:start+5760])
    candidate = np.diff(np.pad(decoded, (3200, 3200))[start:start+12160])
    score = correlate(candidate, ref, mode='valid', method='fft')
    energy = convolve(candidate*candidate, np.ones(len(ref)), mode='valid', method='fft')
    norm = score / np.sqrt(np.maximum(1e-25, energy*np.sum(ref*ref)))
    k = int(np.argmax(norm))
    return k-3200, float(norm[k])

def atoms(path):
    result = []
    with path.open('rb') as f:
        while f.tell() < path.stat().st_size:
            pos = f.tell(); size, name = struct.unpack('>I4s', f.read(8))
            if size == 1: size = struct.unpack('>Q', f.read(8))[0]
            if size == 0: size = path.stat().st_size-pos
            result.append(name.decode()); f.seek(pos+size)
    return result

def sheet(proof):
    # Decoded proof picture beside its own AAC envelope. No visual production code invoked.
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    canvas = Image.new('RGB', (810, 6*550), '#171512'); draw = ImageDraw.Draw(canvas)
    decoded = audio(proof).mean(axis=1)
    selections = [('Make my kit crop', 140), ('Tap maximum', 167), ('Kit result', 174), ('Post', 210), ('Story', 282), ('CTA', 480)]
    for row, (label, anchor) in enumerate(selections):
        for col, frame in enumerate([anchor-1, anchor, anchor+2]):
            pixels = ff('-i', proof, '-vf', f'select=eq(n\\,{frame}),scale=270:480', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1')
            x, y = col*270, row*550
            canvas.paste(Image.frombytes('RGB', (270, 480), pixels), (x, y))
            draw.text((x+6, y+484), f'{label}: f{frame} / {frame/30:.3f}s', font=font, fill='white')
            center=round(frame*1600); chunk=decoded[max(0,center-4800):center+4800]
            env=np.sqrt(np.mean(chunk[:len(chunk)//48*48].reshape(-1,48)**2, axis=1))
            points=[(x+6+i*258/(len(env)-1), y+535-v/max(1e-9,env.max())*30) for i,v in enumerate(env)]
            draw.line(points, fill='#E2542B', width=2)
            draw.line((x+135,y+503,x+135,y+538), fill='#7FC3A0')
    canvas.save(ROOT/'decoded-event-review.png')

def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('kind', choices=['proof','release']); args=parser.parse_args()
    source, output=paths(args.kind)
    info=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(output)]))
    v,a=info['streams']
    ff('-i', output, '-f', 'null', '-')
    hashes={}
    for name,p in [('source',source),('output',output)]:
        hashes[name]={'h264': hashlib.sha256(ff('-i',p,'-map','0:v:0','-c:v','copy','-f','h264','pipe:1')).hexdigest(),
                      'decodedFrames':hashlib.sha256(ff('-i',p,'-map','0:v:0','-an','-f','framemd5','pipe:1')).hexdigest()}
    timestamps=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp','-of','json',str(output)]))['frames']
    pts=[Fraction(int(f['best_effort_timestamp']))*Fraction(v['time_base']) for f in timestamps]
    preserved=[]; changed=[]
    tree=run(['git','-C',str(REPO),'ls-tree','-r','--full-tree',BASE]).decode().splitlines()
    for entry in tree:
        meta,name=entry.split('\t',1); expected=meta.split()[2]; p=REPO/name
        actual=run(['git','-C',str(REPO),'hash-object','--',name]).decode().strip() if p.is_file() else None
        (preserved if actual==expected else changed).append(name)
    reference=audio(WAV); decoded=audio(output)[:960000]
    master=loudness(WAV); encoded=loudness(output)
    native=json.loads((WAV.parent/'cafecito-rush-final.render.json').read_text())
    schedule={t['trackId']:t['triggers'] for t in native['samples']['tracks']}
    events=list(csv.DictReader((CAMPAIGN/'audio-sync-v2/event-map.csv').open()))
    rows=[]
    for e in events:
        anchor=int(e['anchorFrame']); sec=anchor/30
        row={'event':e['id'],'label':e['label'],'visualFrame':anchor,'visualSeconds':sec}
        if e['id']=='ending':
            row.update(policy='Natural tail: last onset 18.864s; hold picture through frame 599.',track='',sample='',cueSeconds='',scheduledOffsetMs='',AACOffsetSamples='',AACCorrelation='')
        else:
            offset,corr=lag(decoded.mean(axis=1),reference.mean(axis=1),sec)
            row.update(AACOffsetSamples=offset,AACCorrelation=round(corr,6))
            if e['id'] in POLICY:
                track,target,policy=POLICY[e['id']]
                trigger=min(schedule[track],key=lambda t:abs(t['frame']/44100-target))
                cue=trigger['frame']/44100
                row.update(policy=policy,track=track,sample=Path(trigger['file']).name,cueSeconds=round(cue,6),scheduledOffsetMs=round((cue-sec)*1000,3))
            else:
                row.update(policy='Carried by groove/phrase; no dedicated sync hit or timing change.',track='',sample='',cueSeconds='',scheduledOffsetMs='')
        rows.append(row)
    order=['event','label','visualFrame','visualSeconds','policy','track','sample','cueSeconds','scheduledOffsetMs','AACOffsetSamples','AACCorrelation']
    with (ROOT/f'{args.kind}-sync.csv').open('w') as f:
        writer=csv.DictWriter(f,fieldnames=order,lineterminator='\n'); writer.writeheader(); writer.writerows(rows)
    checks={
        'allStartingBranchFilesUnchanged':not changed,
        'approvedWavAndCompositionMatchWonderManifest':sha(WAV)==native['wav']['sha256'] and sha(PROJECT)==native['project']['sha256'],
        'identicalH264AndAllDecodedFrames':hashes['source']==hashes['output'],
        'exactly600FramesAt30fps':v['nb_read_frames']=='600' and pts==[Fraction(n,30) for n in range(600)],
        'dimensions':(v['width'],v['height'])==((540,960) if args.kind=='proof' else (1080,1920)),
        '20SecondsZeroStart':info['format']['duration']=='20.000000' and v['start_time']=='0.000000' and a['start_time']=='0.000000',
        'androidEncoding':v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and a['codec_name']=='aac' and a['profile']=='LC' and a['sample_rate']=='48000' and a['channels']==2,
        'faststart':atoms(output).index('moov')<atoms(output).index('mdat'),
        'noNewFullScaleSamples':float(np.max(np.abs(decoded)))<1,
        'encodedTruePeakBelowMinus1dBTP':float(encoded['input_tp'])<=-1,
        'decodedAACContainsEntireTimeline':len(audio(output))>=960000,
        'noUnintendedAudioOffset':all(abs(r['AACOffsetSamples'])<=1 and r['AACCorrelation']>.90 for r in rows[:-1]),
        'keyScheduledCuesWithinOneFrame':all(abs(r['scheduledOffsetMs'])<=1000/30 for r in rows if r['scheduledOffsetMs']!=''),
        'silentFinal100ms':float(np.max(np.abs(decoded[-4800:])))<10**(-70/20),
        'fullDecodeWithoutErrors':True}
    report={'status':'PASS' if all(checks.values()) else 'FAIL','checks':checks,'kind':args.kind,'outputSha256':sha(output),'pictureHashes':hashes,
        'preservation':{'baseCommit':BASE,'unchangedTrackedFiles':len(preserved),'changedFiles':changed,'originalAndAudioSyncV2Preserved':True if not changed else None},
        'streams':info['streams'],'format':info['format'],'topLevelAtoms':atoms(output),'masterLoudness':master,'encodedLoudness':encoded,
        'audio':{'referenceFrames48k':len(reference),'decodedFramesIncludingAACPadding':len(audio(output)),'decodedPeakDbfs':float(20*np.log10(np.max(np.abs(decoded)))),'silentTailPeak':float(np.max(np.abs(decoded[-4800:])))},
        'sync':rows,'inheritedTrackOverloads':[t for t in native['production']['tracks'] if t['clippedSamples']],
        'method':'Scheduled triggers are from Wonder render metadata; visual anchors from PR #3, confirmed on decoded proof contact sheet. AAC transport measured by waveform cross-correlation at all 23 visual anchors (ending is a separate audio-release row). Cue schedule offsets are not perceptual attack measurements. No listening approval or physical Android test claimed.',
        'ownerGate':'Final owner audiovisual review before publication; approved master remains unchanged.'}
    (ROOT/f'{args.kind}-qa.json').write_text(json.dumps(report,indent=2)+'\n')
    if args.kind=='proof':sheet(output)
    print(json.dumps({'status':report['status'],'checks':checks,'encodedLoudness':encoded,'keyCues':[{k:r[k] for k in ['event','scheduledOffsetMs','AACOffsetSamples','AACCorrelation']} for r in rows if r['scheduledOffsetMs']!='']},indent=2))
    if not all(checks.values()):raise SystemExit(1)

if __name__=='__main__':main()
