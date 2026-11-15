"""Compose to decoded picture anchors using DaemonV12 HEADLINER + native sampler.

Never writes any approved original. Engine code stays in the ignored checkout.
"""
from pathlib import Path
from fractions import Fraction
import hashlib, json, os, shutil, subprocess, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parent
CAMPAIGN=ROOT.parent
CACHE=CAMPAIGN/'.cache/audio-sync-v2'
ENGINE=Path(os.environ.get('DAEMONV12_ROOT',str(CAMPAIGN/'.cache/daemonv12'))).resolve()
RATE=44100
SEED=1202602
rng=np.random.default_rng(SEED)

def write(p,obj):p.write_text(json.dumps(obj,indent=2)+'\n')
def call(*args):
    r=subprocess.run([str(x) for x in args],cwd=ENGINE,capture_output=True,text=True)
    if r.returncode:raise RuntimeError(r.stdout+'\n'+r.stderr)
    return r.stdout
def position(frame):
    tick=int(frame)*64
    remainder=tick%960
    return f'{tick//3840+1}:{tick%3840//960+1}'+(f'+{remainder}/3840' if remainder else '')
def add_track(score,id,instrument,notes,gain=-6,pan=0):
    score['tracks'].append({'id':id,'instrument':instrument,'gainDb':gain,'pan':pan,'sections':{'picture':[{'beat':frame/15,'midi':midi,'velocity':velocity} for frame,midi,velocity in notes]}})

def sfx(name,seconds,kind):
    t=np.arange(round(seconds*RATE))/RATE
    n=rng.normal(0,1,len(t))
    high=sosfilt(butter(2,[700,6500],btype='bandpass',fs=RATE,output='sos'),n)
    if kind=='click':
        a=(.18*high+.35*np.sin(2*np.pi*1220*t)+.18*np.sin(2*np.pi*2370*t))*np.exp(-t*85)*(1-np.exp(-t*2200))
    elif kind=='post':
        a=(.43*np.sin(2*np.pi*146.832384*t)*np.exp(-t*13)+.23*np.sin(2*np.pi*293.664768*t)*np.exp(-t*25)+.11*np.sin(2*np.pi*880*t)*np.exp(-t*55)+.11*high*np.exp(-t*60))*(1-np.exp(-t*2200))
    elif kind=='story':
        a=(.34*np.sin(2*np.pi*196*t)*np.exp(-t*10)+.16*np.sin(2*np.pi*587*t)*np.exp(-t*14)+.13*np.sin(2*np.pi*1189*t)*np.exp(-t*22)+.07*high*np.exp(-t*65))*(1-np.exp(-t*2200))
    elif kind=='latch':
        a=(.21*np.sin(2*np.pi*1468*t)+.1*np.sin(2*np.pi*2300*t)+.05*high)*np.exp(-t*55)*(1-np.exp(-t*1800))
    elif kind=='fold':
        a=(.21*high+.15*np.sin(2*np.pi*520*t))*np.exp(-t*40)*(1-np.exp(-t*1800))
    elif kind=='wipe':
        a=high*.18*np.sin(np.pi*t/seconds)**.7
        a+=.07*np.sin(2*np.pi*(420*t+1600*t*t/(2*seconds)))*np.sin(np.pi*t/seconds)
    elif kind=='air':
        a=(.12*high+.035*np.sin(2*np.pi*(360*t+1800*t*t/(2*seconds))))*np.sin(np.pi*t/seconds)**1.5
    else:raise ValueError(kind)
    a*=np.minimum(1,(len(a)-1-np.arange(len(a)))/max(1,round(.008*RATE)))
    assert np.max(np.abs(a))<1
    p=ROOT/'assets/sfx'/f'{name}.wav';p.parent.mkdir(parents=True,exist_ok=True)
    wavfile.write(p,RATE,(a*32767).astype(np.int16))
    return {'name':name,'file':p.name}

def main():
    CACHE.mkdir(parents=True,exist_ok=True)
    eventmap=json.loads((ROOT/'event-map.json').read_text())
    e={x['id']:x['anchorFrame'] for x in eventmap['events']}
    # Freeze all original tracked files before authoring; original renderers never run.
    baseline=ROOT/'approved-originals.json'
    if not baseline.exists():
        files=subprocess.check_output(['git','ls-files'],cwd=CAMPAIGN,text=True).splitlines()
        write(baseline,{p:hashlib.sha256((CAMPAIGN/p).read_bytes()).hexdigest() for p in files if (CAMPAIGN/p).is_file() and not p.startswith('audio-sync-v2/')})
    score={
        'title':'NextCustomer / Paper, Copper, Motion — picture-locked audio revision',
        'bpm':120,'key':'D minor','seed':SEED,
        'instruments':{
            'felt':{'partials':[1,.38,.19,.04],'attackSeconds':.001,'decaySeconds':.075,'sampleSeconds':.22,'noise':.012},
            'copper':{'partials':[.55,.16,.33,.12,.06,.08],'attackSeconds':.001,'decaySeconds':.13,'sampleSeconds':.42,'noise':.002},
            'rubber':{'partials':[1,.5,.2,.05],'attackSeconds':.003,'decaySeconds':.10,'sampleSeconds':.32,'noise':0},
            'reed':{'partials':[.8,.14,.08,.025],'attackSeconds':.012,'decaySeconds':.42,'sampleSeconds':1.0,'noise':.003}
        },
        'phrases':{},'sections':[{'id':'picture','bars':10,'development':'Locked 600-frame motion: irregular three-syllable hook; source UI hocket; Post/Story impacts; descending copy answers; root-resolved CTA.'}],
        'tracks':[],'variations':{}
    }
    # One original three-note identity; returns at the two export blooms.
    copper=[(e['type-marketing'],74,.84),(e['type-shouldnt'],81,.78),(e['type-job'],77,.88),
            (e['app-cut'],62,.68),(104,69,.36),(112,65,.42),
            (e['kit-cut'],74,.62),(182,81,.35),(190,77,.42),
            (e['post-cut'],74,.82),(218,81,.55),(e['post-land'],77,.64),
            (244,72,.33),(252,69,.31),(260,65,.32),
            (e['story-cut'],86,.66),(290,81,.53),(e['story-land'],77,.6),
            (318,76,.28),(326,74,.3),
            (e['copy-cut'],74,.7),(e['messages-in'],72,.63),(e['week-in'],69,.75),
            (e['spanish-cut'],74,.64),(e['es-toggle'],81,.48),(e['spanish-land'],77,.48)]
    felt=[(0,50,.60),(e['type-marketing'],62,.38),(e['type-shouldnt'],69,.34),(e['type-job'],65,.4),
          (e['app-cut'],62,.64),(124,57,.35),(e['button-crop'],65,.59),
          (e['tap-onset'],74,.63),(e['kit-cut'],62,.6),(198,69,.25),
          (e['post-cut'],62,.76),(e['post-land'],65,.42),(237,69,.25),
          (e['story-cut'],57,.74),(e['story-land'],64,.38),(337,69,.3),
          (e['copy-cut'],62,.55),(e['messages-in'],60,.42),(e['week-in'],57,.5),
          (e['spanish-cut'],62,.57),(e['cta-cut'],50,.5)]
    bass=[(0,38,.75),(e['app-cut'],38,.8),(e['kit-cut'],45,.62),(e['post-cut'],38,.95),
          (e['story-cut'],43,.92),(e['copy-cut'],45,.58),(e['spanish-cut'],45,.63),(e['cta-cut'],38,.72)]
    resolve=[(e['cta-cut'],50,.62),(e['cta-cut'],57,.42),(e['cta-cut'],65,.35),
             (e['cta-breath'],64,.40),(540,62,.39),(540,69,.22)]
    add_track(score,'copper','copper',copper,-6,-.12)
    add_track(score,'felt','felt',felt,-6,.1)
    add_track(score,'bass','rubber',bass,-5,0)
    add_track(score,'resolve','reed',resolve,-8,0)
    write(ROOT/'headliner.score.json',score)
    temporary=Path(tempfile.mkdtemp(prefix='bank-',dir=CACHE))/'package'
    call('node',ENGINE/'production/headliner/build.ts',ROOT/'headliner.score.json',temporary)
    # Copy only OUR generated instruments and recipes; do not redistribute engine code.
    for p in (temporary/'assets').iterdir():shutil.copytree(p,ROOT/'assets'/p.name,dirs_exist_ok=True)
    bank=json.loads((temporary/'catalog.json').read_text())
    bank.pop('license',None)
    bank['note']='Original task-authored parameters and notes. Generated with owner-authorized HEADLINER workflow; engine source is not bundled.'
    write(ROOT/'instrument-recipes.json',bank)
    project=json.loads((temporary/'main.json').read_text())
    project['title']='NextCustomer / Paper, Copper, Motion / sync-v2 owner proof'
    project['render']={'duration':{'seconds':20},'tail':'none'}
    project['master']={'gainDb':-3}
    for t in project['tracks']:
        if t['id']=='copper':t['effects']=[{'type':'highpass','frequencyHz':330},{'type':'reverb','roomSize':.18,'decaySeconds':.26,'wet':.06}]
        if t['id']=='felt':t['effects']=[{'type':'highpass','frequencyHz':150}]
        if t['id']=='bass':t['effects']=[{'type':'lowpass','frequencyHz':900}]
        if t['id']=='resolve':t['effects']=[{'type':'reverb','roomSize':.35,'decaySeconds':.65,'wet':.14}]
    kit=[]
    for name,seconds,kind in [('tap',.075,'click'),('post-body',.36,'post'),('story-body',.48,'story'),('latch',.12,'latch'),('fold',.12,'fold'),('wipe',5/30,'wipe'),('post-air',6/30,'air'),('story-air',8/30,'air')]:
        item=sfx(name,seconds,kind);item['pitch']=len(kit);kit.append(item)
    write(ROOT/'assets/sfx/kit.json',{'formatVersion':1,'samples':kit})
    # Impacts and movement live on separate stems so masking and timing can be reviewed.
    fx=[(0,'post-body',.55),(e['button-crop'],'fold',.55),(e['tap-onset'],'tap',.83),(e['kit-cut'],'fold',.62),
        (e['post-cut'],'post-body',1),(e['post-land'],'latch',.43),(e['story-cut'],'story-body',1),
        (e['story-land'],'latch',.38),(e['copy-cut'],'fold',.45),(e['messages-in'],'fold',.25),
        (e['week-in'],'fold',.28),(e['spanish-cut'],'fold',.43),(e['es-toggle'],'tap',.55),(e['cta-cut'],'post-body',.45)]
    movement=[(e['wipe'],'wipe',.85),(204,'post-air',.65),(274,'story-air',.75),(444,'post-air',.35),(474,'post-air',.3)]
    typing_changes=next(x for x in eventmap['events'] if x['id']=='typing')['evidence']['changes']
    # The actual encoded name changes define the cluster, never a free-running tick loop.
    typing=[(x['frame'],'tap',.12) for x in typing_changes if x['frame']<130]
    for id,notes,gain,pan in [('contacts',fx,-7,0),('movement',movement,-9,.1),('typing',typing,-12,-.1)]:
        project['tracks'].append({'id':id,'instrument':{'type':'drumkit','kit':'assets/sfx/kit.json'},'mix':{'gainDb':gain,'pan':pan},'patterns':[{'id':'picture','bars':10,'notes':[{'start':position(f),'pitch':hit,'velocity':vel} for f,hit,vel in notes]}],'clips':[{'bar':1,'pattern':'picture'}],'effects':[{'type':'highpass','frequencyHz':180}]})
    write(ROOT/'nextcustomer-sync.project.json',project)
    engine_commit=call('git','rev-parse','HEAD').strip()
    write(ROOT/'engine-environment.json',{'repository':'https://github.com/mataindustries/daemonv12','commit':engine_commit,'headlinerGeneratorSha256':hashlib.sha256((ENGINE/'production/headliner/build.ts').read_bytes()).hexdigest(),'composerSkillSha256':hashlib.sha256((ENGINE/'plugins/daemonv12-composer/skills/daemonv12-composer/SKILL.md').read_bytes()).hexdigest(),'node':call('node','--version').strip(),'doctor':json.loads(subprocess.run(['node',str(ENGINE/'bin/daemonv12.js'),'doctor','--json'],capture_output=True,text=True).stdout),'route':'HEADLINER original instruments -> native Daemon sampler/production CLI; no GM or MCP required','durationPolicy':'explicit 20 seconds including all tails; no picture changes'})
    validation=call('node',ENGINE/'bin/daemonv12.js','validate',ROOT/'nextcustomer-sync.project.json','--json')
    (ROOT/'engine-validation.json').write_text(validation)
    call('node',ENGINE/'bin/daemonv12.js','sync',ROOT/'nextcustomer-sync.project.json','--project','--fps','30/1','--out',ROOT/'engine-event-map.json','--json')
    out=ROOT/'native-render'
    result=call('node',ENGINE/'bin/daemonv12.js','render',ROOT/'nextcustomer-sync.project.json','--out-dir',out,'--stems','--format','wav','--json')
    (ROOT/'engine-render-result.json').write_text(result)
    parsed=json.loads(result)
    print(json.dumps({'ok':parsed['ok'],'summary':parsed['summary'],'artifacts':parsed['artifacts'],'masterAnalysis':parsed.get('analysis',{}).get('master')},indent=2))

if __name__=='__main__':main()
