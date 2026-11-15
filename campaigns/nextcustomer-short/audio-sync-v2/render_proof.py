"""Master the revised audio and STREAM-COPY approved picture into a new proof."""
from pathlib import Path
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parent
CAMPAIGN=ROOT.parent
RAW=ROOT/'native-render/nextcustomer-sync.project.wav'
WAV=ROOT/'nextcustomer_audio_sync_v2.wav'
PROOF=ROOT/'nextcustomer_audio_sync_v2_proof_540x960.mp4'

def run(args):
    r=subprocess.run(['ffmpeg','-hide_banner',*args],capture_output=True,text=True)
    if r.returncode:raise RuntimeError(r.stderr)
    return r
def loudness(file):
    r=run(['-i',str(file),'-af','loudnorm=I=-17:TP=-2:LRA=9:print_format=json','-f','null','-'])
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])

def main():
    measurements=loudness(RAW)
    m=measurements
    af=f"loudnorm=I=-17:TP=-2:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,volume=-0.3dB"
    run(['-loglevel','error','-y','-i',str(RAW),'-af',af,'-ar','48000','-ac','2','-c:a','pcm_s24le','-t','20',str(WAV)])
    # No invocation of the visual renderer; all 600 approved H.264 frames are reused.
    run(['-loglevel','error','-y','-i',str(CAMPAIGN/'nextcustomer_launch_short_proof_540x960.mp4'),'-i',str(WAV),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t','20','-movflags','+faststart','-metadata','title=NextCustomer — audio sync v2 owner proof','-metadata','comment=Audio revision only. Approved picture stream copied without visual changes. Final export pending owner review.',str(PROOF)])
    run(['-loglevel','error','-y','-i',str(WAV),'-c:a','libmp3lame','-b:a','192k',str(ROOT/'nextcustomer_audio_sync_v2.mp3')])
    report={'raw':measurements,'listeningWav':loudness(WAV),'encodedProof':loudness(PROOF),'processing':af,'picturePolicy':'-c:v copy from approved 540×960 proof; no visual renderer invoked','samplePrecision':'Daemon native sources and render are PCM16/44.1 kHz. Delivery mastering is 48 kHz PCM24; this does not recover precision absent from native sources.','files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [WAV,PROOF,ROOT/'nextcustomer_audio_sync_v2.mp3']}}
    (ROOT/'mastering.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
