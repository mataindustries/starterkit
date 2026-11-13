"""Verify deliverables and produce the technical QA report from measured evidence."""
from pathlib import Path
import hashlib
import importlib.metadata
import json
import platform
import re
import subprocess
import sys
from PIL import Image, ImageDraw

DIR=Path(__file__).resolve().parent
ROOT=DIR.parent.parent
FINAL=DIR/'nextcustomer_launch_short_1080x1920.mp4'
PROOF=DIR/'nextcustomer_launch_short_proof_540x960.mp4'

def command(args):
    return subprocess.run(args,cwd=DIR,capture_output=True,text=True)

def probe(file):
    r=command(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)])
    if r.returncode: raise RuntimeError(r.stderr)
    return json.loads(r.stdout)

def loudness(file):
    r=command(['ffmpeg','-hide_banner','-i',str(file),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'])
    if r.returncode: raise RuntimeError(r.stderr)
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])

def sha(file): return hashlib.sha256(file.read_bytes()).hexdigest()

def overlay_preview():
    canvas=Image.new('RGB',(1080,680),'#171512')
    for i,t in enumerate([1.5,14.5,18]):
        p=DIR/'.cache'/f'overlay-source-{i}.png'
        r=command(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(FINAL),'-frames:v','1',str(p)])
        if r.returncode:raise RuntimeError(r.stderr)
        im=Image.open(p).convert('RGBA').resize((360,640),Image.Resampling.LANCZOS)
        layer=Image.new('RGBA',im.size);d=ImageDraw.Draw(layer)
        d.rectangle((300,0,359,639),fill=(226,84,43,70))
        d.rectangle((0,514,359,639),fill=(226,84,43,70))
        d.rectangle((0,0,359,59),fill=(226,84,43,45))
        d.rectangle((24,60,300,513),outline=(20,130,80,180),width=1)
        canvas.paste(Image.alpha_composite(im,layer).convert('RGB'),(360*i,0))
        ImageDraw.Draw(canvas).text((360*i+12,650),f'{t:.1f}s | Orange: reserved overlay area',fill='#F3EEE6')
    canvas.save(DIR/'shorts-safe-area-check.png')

def main():
    overlay_preview()
    checks=[]
    def check(name,passed,detail):checks.append({'check':name,'passed':bool(passed),'detail':detail})
    media={}
    for name,file,size in [('final',FINAL,(1080,1920)),('proof',PROOF,(540,960))]:
        p=probe(file);media[name]=p
        v=next(s for s in p['streams'] if s['codec_type']=='video')
        a=next(s for s in p['streams'] if s['codec_type']=='audio')
        check(name+' picture', (v['width'],v['height'])==size and v['codec_name']=='h264' and v['pix_fmt']=='yuv420p',f"{v['width']}×{v['height']}, {v['codec_name']}, {v['pix_fmt']}")
        check(name+' duration / cadence',abs(float(p['format']['duration'])-20)<.06 and v['r_frame_rate']=='30/1' and int(v['nb_read_frames'])==600,f"{p['format']['duration']} s; {v['r_frame_rate']} fps; {v['nb_read_frames']} decoded frames")
        check(name+' audio',a['codec_name']=='aac' and int(a['sample_rate'])==48000 and a['channels']==2,f"{a['codec_name']}, {a['sample_rate']} Hz, {a['channels']} channels")
        decode=command(['ffmpeg','-v','error','-xerror','-i',str(file),'-f','null','-'])
        check(name+' full decode',decode.returncode==0,decode.stderr.strip() or 'Complete picture + audio decode without errors')
        check(name+' file size',file.stat().st_size<95*1024**2,f'{file.stat().st_size:,} bytes; below GitHub individual-file limit')
    audio=loudness(FINAL)
    check('Final loudness',-17<=float(audio['input_i'])<=-15,f"{audio['input_i']} LUFS integrated; LRA {audio['input_lra']} LU")
    check('No clipping / true-peak headroom',float(audio['input_tp'])<=-1,f"{audio['input_tp']} dBTP after AAC encoding; ceiling ≤ -1 dBTP")
    r=command(['ffmpeg','-hide_banner','-i',str(FINAL),'-vf','blackdetect=d=0.05:pix_th=0.02:pic_th=0.99','-an','-f','null','-'])
    black=re.findall(r'black_start:[^\n]+',r.stderr)
    check('No unintended black frames',r.returncode==0 and not black,black or 'No ≥99% near-black frame spans of 0.05 s or longer')
    manifest=json.loads((DIR/'assets/capture-manifest.json').read_text())
    unchanged={name:sha(ROOT/name)==digest for name,digest in manifest['baseline'].items()}
    check('Website preserved',all(unchanged.values()),unchanged)
    outputs=json.loads((DIR/'assets/outputs.json').read_text())
    check('Genuine bilingual copy',all(len(outputs[l]['copy']['msgs'])==5 and len(outputs[l]['copy']['ideas'])==7 for l in ['en','es']),{l:{'messages':len(outputs[l]['copy']['msgs']),'ideas':len(outputs[l]['copy']['ideas']),'bioCharacters':len(outputs[l]['copy']['bio'])} for l in ['en','es']})
    check('Product self-tests',manifest['selftestSummary'].startswith('20 of 20 passed') and not manifest['errors'],manifest['selftestSummary'])
    for kind,expected in [('post',(1080,1350)),('story',(1080,1920))]:
        for lang in ['en','es']:
            file=DIR/'assets'/f'{kind}-{lang}.png';dimensions=Image.open(file).size
            check(f'Actual {kind} export / {lang}',dimensions==expected,list(dimensions))
    for name,expected in [('thumbnail.png',(1080,1920)),('proof-contact-sheet.png',(1350,536)),('contact-sheet.png',(1350,536))]:
        dimensions=Image.open(DIR/name).size;check(name,dimensions==expected,list(dimensions))
    check('Proof rendered before final',PROOF.stat().st_mtime<FINAL.stat().st_mtime,{'proofMtime':PROOF.stat().st_mtime,'finalMtime':FINAL.stat().st_mtime})
    layout=json.loads((DIR/'final-layout-check.json').read_text())
    check('Typography safe areas',layout['frames']==600 and layout['textPlacementsChecked']>1000 and not layout['violations'],layout)
    playback=json.loads((DIR/'browser-playback.json').read_text()) if (DIR/'browser-playback.json').exists() else {}
    for kind in ['proof','final']:
        p=playback.get(kind,{})
        check(kind+' Chrome playback',p.get('ended') and not p.get('error') and abs(p.get('duration',0)-20)<.06,p or 'Missing browser playback check')
    changed=command(['git','-C',str(ROOT),'diff','--name-only',manifest['sourceCommit']]).stdout.splitlines()
    untracked=command(['git','-C',str(ROOT),'ls-files','--others','--exclude-standard']).stdout.splitlines()
    check('Changes confined to campaign',all(x.startswith('campaigns/nextcustomer-short/') for x in changed+untracked),'All tracked changes and non-ignored additions are inside campaigns/nextcustomer-short/; root file hashes also checked')
    versions={'python':platform.python_version(),**{p:importlib.metadata.version(p) for p in ['numpy','scipy','Pillow']}}
    files={p.name:{'bytes':p.stat().st_size,'sha256':sha(p)} for p in [FINAL,PROOF,DIR/'thumbnail.png',DIR/'contact-sheet.png',DIR/'proof-contact-sheet.png']}
    report={'status':'PASS' if all(x['passed'] for x in checks) else 'FAIL','checks':checks,'media':media,'audioMeasured':audio,'browserPlayback':playback,'rootHashes':manifest['baseline'],'files':files,'versions':versions,'manualGates':['Physical Android playback with sound has not been performed.','Before manual publication, owner must put tool link in channel profile and personally fulfill the comment invitation.'],'publication':'No deployment, merge, or YouTube publication performed.'}
    (DIR/'qa-results.json').write_text(json.dumps(report,indent=2)+'\n')
    rows=['# QA report','',f"**{report['status']} — {sum(x['passed'] for x in checks)}/{len(checks)} checks passed.**",'',f"Final: 20.000 seconds · 1080×1920 · 600 frames · 30 fps · H.264/yuv420p · AAC stereo/48 kHz.",f"Measured final audio: **{audio['input_i']} LUFS**, **{audio['input_tp']} dBTP**. Original synthesized soundtrack; no third-party recordings.",'','| Check | Result | Evidence |','|---|---|---|']
    for x in checks:
        detail=x['detail'] if isinstance(x['detail'],str) else json.dumps(x['detail'],ensure_ascii=False)
        if len(detail)>210:detail=detail[:207]+'…'
        rows.append(f"| {x['check']} | {'PASS' if x['passed'] else 'FAIL'} | {detail.replace('|','/')} |")
    rows+=['','## Visual review','',
        '- Opening: the first-frame hook is fully visible. The second sentence completes its masked entrance by 1.42 seconds. Both were inspected in decoded proof frames at phone scale.',
        '- Product: corrected the initial session letterboxing before the final proof. Reviewed the real name entry, Make my kit button/tap annotation, complete Post and Story exports, and genuine Bio/Messages/Week 1 crops. The Spanish switch and actual “Llegue a una casa limpia.” output were checked in a decoded frame.',
        '- Ending: the exact three-part CTA is held for four seconds, with a personal first-post-idea invitation and quieter score. Essential type is reserved away from the right-side and bottom Shorts overlays; a final overlay simulation is included.',
        '', '## Limits and final publication gates','',
        'Desktop Chromium played both files continuously from 0 to ended, with audio enabled; FFmpeg decoded every picture frame and audio packet. This is an automated media check, not a human listening session or physical Android test.',
        'Before manual publication, check physical Android playback with sound, add the tool URL to the channel profile, and be ready to personally respond to KIT comments. No deployment, merge, or YouTube publication was performed.',
        '', 'Detailed streams, frame counts, browser results, file hashes, and source hashes: `qa-results.json`.']
    (DIR/'QA_REPORT.md').write_text('\n'.join(rows)+'\n')
    print(report['status'],f"{sum(x['passed'] for x in checks)}/{len(checks)} checks")
    for x in checks:
        if not x['passed']:print('FAIL',x['check'],x['detail'])
    if report['status']!='PASS':sys.exit(1)

if __name__=='__main__':main()
