"""Mux Wonder's approved lossless master with locked picture; never render picture."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
CAMPAIGN = ROOT.parent
BASE = 'a0162f10111cf1237410d97631727e2df4b75139'
WAV = CAMPAIGN / 'cafecito/renders/cafecito-rush-final/cafecito-rush-final.wav'
PROJECT = CAMPAIGN / 'cafecito/cafecito-rush-final.json'
SIZES = {'proof': '540x960', 'release': '1080x1920'}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def paths(kind):
    size = SIZES[kind]
    source = CAMPAIGN / (f'nextcustomer_launch_short_{"proof_" if kind == "proof" else ""}{size}.mp4')
    output = ROOT / f'nextcustomer_cafecito_rush_{kind}_{size}.mp4'
    return source, output

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=SIZES)
    args = parser.parse_args()
    manifest = json.loads((WAV.parent / 'cafecito-rush-final.render.json').read_text())
    assert sha(WAV) == manifest['wav']['sha256'], 'Approved master hash mismatch'
    assert sha(PROJECT) == manifest['project']['sha256'], 'Composition hash mismatch'
    source, output = paths(args.kind)
    command = ['ffmpeg', '-v', 'error', '-xerror', '-y', '-i', str(source), '-i', str(WAV),
               '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '-1',
               '-c:v', 'copy', '-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '256k',
               '-ar', '48000', '-ac', '2', '-t', '20', '-movflags', '+faststart',
               '-metadata', 'title=NextCustomer - CAFECITO RUSH - owner review',
               '-metadata', 'comment=Approved picture stream copied; Wonder lossless CAFECITO master; no musical edits; publication pending owner review.', str(output)]
    subprocess.run(command, check=True)
    record = {'startingCommit': BASE, 'kind': args.kind,
              'picture': {'path': str(source.relative_to(CAMPAIGN)), 'sha256': sha(source)},
              'audio': {'path': str(WAV.relative_to(CAMPAIGN)), 'sha256': sha(WAV)},
              'composition': {'path': str(PROJECT.relative_to(CAMPAIGN)), 'sha256': sha(PROJECT)},
              'output': {'path': output.name, 'sha256': sha(output), 'bytes': output.stat().st_size},
              'edits': 'None: no shift, trim within the 20s master, gain, EQ, dynamics, tempo or note changes. Only 44.1 to 48 kHz resampling and AAC encoding.',
              'command': command}
    (ROOT / f'{args.kind}-provenance.json').write_text(json.dumps(record, indent=2) + '\n')
    print(output.name, sha(output))

if __name__ == '__main__':
    main()
