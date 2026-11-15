"""Inspect the LOCKED encoded picture, not merely nominal scene timestamps."""
from pathlib import Path
import csv, hashlib, json, math, subprocess
import numpy as np

ROOT=Path(__file__).resolve().parent
CAMPAIGN=ROOT.parent
CACHE=CAMPAIGN/'.cache/audio-sync-v2'
CACHE.mkdir(parents=True,exist_ok=True)
APPROVED=CAMPAIGN/'nextcustomer_launch_short_1080x1920.mp4'
FPS=30

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def decode():
    p=CACHE/'approved-gray.npy'
    if p.exists():return np.load(p)
    r=subprocess.run(['ffmpeg','-v','error','-i',str(APPROVED),'-an','-vf','scale=270:480,format=gray','-f','rawvideo','pipe:1'],capture_output=True,check=True)
    frames=np.frombuffer(r.stdout,dtype=np.uint8).reshape((-1,480,270)).copy()
    assert len(frames)==600
    np.save(p,frames)
    return frames

def first_changed(frames,roi,start,end,baseline,minimum=12):
    x,y,w,h=roi
    ref=frames[baseline,y:y+h,x:x+w].astype(np.int16)
    result=[]
    for n in range(start,end+1):
        count=int(np.count_nonzero(np.abs(frames[n,y:y+h,x:x+w].astype(np.int16)-ref)>18))
        result.append({'frame':n,'changedPixels':count})
    found=next((r['frame'] for r in result if r['changedPixels']>=minimum),None)
    if found is None:raise RuntimeError(f'No picture change found: {roi}, {start}..{end}')
    return found,{'method':'decoded picture ROI vs local pre-event reference; |luma delta| > 18 and >= '+str(minimum)+' pixels','roiAt270x480':roi,'baselineFrame':baseline,'measurements':result}

def main():
    frames=decode();events=[]
    def event(id,label,kind,first,end=None,anchor=None,cue=None,evidence=None):
        anchor=first if anchor is None else anchor
        events.append({'id':id,'label':label,'kind':kind,'firstFrame':first,'anchorFrame':anchor,'endFrame':end if end is not None else first,'seconds':round(anchor/FPS,6),'timecode':f'00:00:{anchor//30:02d}:{anchor%30:02d}', 'engineSampleFrame':anchor*1470,'sample48k':anchor*1600,'engineTick':anchor*64,'cue':cue,'evidence':evidence or {'method':'source condition cross-checked against encoded frames'}})
    event('opening','First-frame YOU RUN THE BUSINESS','static-first-frame',0,cue='low stamp + prepared pluck')
    for id,label,roi,start,end,baseline in [
        ('type-marketing','MARKETING masked entrance',(19,210,206,25),16,23,15),
        ('type-shouldnt',"SHOULDN’T BE masked entrance",(19,238,206,19),24,31,23),
        ('type-job','ANOTHER JOB masked entrance',(19,258,206,22),32,39,31)]:
        first,evidence=first_changed(frames,roi,start,end,baseline)
        event(id,label,'typography',first,math.ceil(({'type-marketing':.56,'type-shouldnt':.83,'type-job':1.10}[id]+.32)*30),cue='dry copper/felt signature syllable',evidence=evidence)
    event('wipe','Orange wipe into real app','transition',85,89,cue='paper draw accelerating to app cut')
    event('app-cut','ONE BUSINESS / real session cut','cut',90,cue='focused low arrival + hook answer')
    # Quantization follows the actual render loop, including source-video stepping at 25 fps.
    name_roi=(47,212,115,14)
    last=frames[90,name_roi[1]:name_roi[1]+name_roi[3],name_roi[0]:name_roi[0]+name_roi[2]]
    typed=[]
    for f in range(91,136):
        x,y,w,h=name_roi;now=frames[f,y:y+h,x:x+w]
        count=int(np.count_nonzero(np.abs(now.astype(np.int16)-last.astype(np.int16))>24))
        if count>=5:typed.append({'frame':f,'changedPixels':count})
        last=now
    # Save observed text changes for optional typing accents, without assigning the caret as a keystroke.
    event('typing','Actual business-name entry','captured-ui',90,139,anchor=typed[0]['frame'] if typed else 94,cue='restrained mechanical typing cluster',evidence={'method':'successive decoded name-field ROI differences; may include cursor/compression; not all changes are keys','roiAt270x480':name_roi,'changes':typed})
    event('button-crop','Cut to Make my kit button','cut',140,cue='short paper fold / muted rim')
    event('tap-onset','Tap annotation starts','tap-motion',161,173,anchor=167,cue='single tactile click at ring opacity maximum',evidence={'method':'sinusoidal ring opacity from render.cjs; peak at 5.575 s, nearest displayed frame 167; decoded-frame review'})
    event('kit-cut','Genuine kit result cut','cut',174,cue='pitched response + centered knock')
    event('post-cut','Post export + title reveal / zoom','reveal',210,227,cue='low body + copper attack; rising paper release')
    event('post-land','Post bloom and rotation settle','motion-settle',227,cue='small resonant latch, lower than reveal impact')
    event('story-cut','Story export + title reveal / zoom','reveal',282,299,cue='different impact: deep bloom + wide glass answer')
    event('story-land','Story bloom and rotation settle','motion-settle',299,cue='light upward harmonic latch')
    event('copy-cut','AND THE WORDS / montage cut','cut',360,cue='dry stop + felt syllable')
    event('bio-in','Bio card opacity/position entrance','reveal',361,371,cue='small first step of descending three-note answer')
    event('messages-in','Messages card entrance','reveal',368,378,cue='second dry step, exact card cadence')
    event('week-in','Week 1 card entrance','reveal',376,386,cue='third dry step + warm body')
    event('spanish-cut','Spanish title / Post movement','cut',450,459,cue='hook returns in higher register + short inhale')
    # Detect actual selected ES state, separately from the section cut.
    es=[]
    for f in range(450,470):
        # ES button face at (roughly) x=200..214,y=145..157 in the quarter-size picture.
        es.append((f,float(frames[f,145:157,200:214].mean())))
    selected=next((f for f,m in es if m<110),None)
    if selected is not None:
        event('es-toggle','Actual EN to ES selection','captured-ui',selected,cue='precise dry switch click',evidence={'method':'decoded ES button face crosses mean luma < 110','measurements':[{'frame':f,'meanLuma':round(m,3)} for f,m in es]})
    event('spanish-land','Spanish Post motion settles','motion-settle',459,cue='soft landing, omit if toggle is within two frames')
    event('cta-cut','Final CTA hard cut; all CTA text already present','cut',480,cue='resolved root / open fifth, rhythmic layer stops')
    event('cta-breath','First decorative sun breath maximum','decorative-motion',511,cue='quiet residual harmonic answer; no new impact')
    event('ending','Natural tail complete; picture still holds','audio-release',596,599,cue='finish before frame 600, no hard tail chop')
    source={'approvedMasterSha256':sha(APPROVED),'approvedProofSha256':sha(CAMPAIGN/'nextcustomer_launch_short_proof_540x960.mp4'),'rendererSha256':sha(CAMPAIGN/'render.cjs'),'timelineSha256':sha(CAMPAIGN/'timeline.json'),'originalSoundSourceSha256':sha(CAMPAIGN/'sound.py'),'fps':30,'pictureFrames':600,'engineRate':44100,'engineTempoMicroseconds':500000,'ticksPerQuarter':960,'mapping':'1 picture frame = 1470 native samples = 1600 delivery samples = 64 ticks; zero-based picture frames','noVisualChanges':True}
    output={'source':source,'events':sorted(events,key=lambda e:(e['anchorFrame'],e['id']))}
    (ROOT/'event-map.json').write_text(json.dumps(output,indent=2)+'\n')
    with (ROOT/'event-map.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['id','label','kind','firstFrame','anchorFrame','endFrame','seconds','timecode','engineSampleFrame','engineTick','cue'],lineterminator='\n')
        writer.writeheader();writer.writerows({k:e[k] for k in writer.fieldnames} for e in output['events'])
    print('\n'.join(f"{e['anchorFrame']:3d} {e['seconds']:8.3f}s {e['id']} ({e['firstFrame']}–{e['endFrame']})" for e in output['events']))

if __name__=='__main__':main()
