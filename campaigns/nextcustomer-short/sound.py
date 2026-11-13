"""Original, deterministic 20-second score. No samples, stock, or external models."""
from pathlib import Path
import json
import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent
SR = 48000
N = SR * 20
rng = np.random.default_rng(20261113)
mix = np.zeros((N, 2), dtype=np.float64)

def add(at, wave, gain=1, pan=0):
    start = round(at * SR)
    if start < 0:
        wave = wave[-start:]
        start = 0
    wave = wave[:N-start]
    if len(wave):
        mix[start:start+len(wave), 0] += wave * gain * np.sqrt((1-pan)/2)
        mix[start:start+len(wave), 1] += wave * gain * np.sqrt((1+pan)/2)

def kick(at, gain=.62):
    t=np.arange(round(.24*SR))/SR
    phase=2*np.pi*(49*t+(135-49)*.027*(1-np.exp(-t/.027)))
    add(at,np.sin(phase)*np.exp(-t*20)*(1-np.exp(-t*900)),gain)

def wood(at, gain=.2, pan=0):
    t=np.arange(round(.13*SR))/SR
    w=(np.sin(2*np.pi*920*t)+.42*np.sin(2*np.pi*1543*t))*np.exp(-t*72)
    w+=rng.normal(0,.15,len(t))*np.exp(-t*180)
    add(at,w*(1-np.exp(-t*3000)),gain,pan)

def note(at, midi, gain=.22, pan=0, dur=.8):
    t=np.arange(round(dur*SR))/SR
    freq=440*2**((midi-69)/12)
    w=(np.sin(2*np.pi*freq*t)*np.exp(-t*6)+.24*np.sin(2*np.pi*freq*2.003*t)*np.exp(-t*12)+.07*np.sin(2*np.pi*freq*4.01*t)*np.exp(-t*22))
    add(at,w*(1-np.exp(-t*900)),gain,pan)
    add(at+.105,w*.14,gain,-pan)

def sweep(at, duration=.22, gain=.08, rising=True):
    t=np.arange(round(duration*SR))/SR
    noise=rng.normal(0,1,len(t))
    high=noise-np.convolve(noise,np.ones(13)/13,mode='same')
    env=np.sin(np.pi*t/duration)**2
    f0,f1=(220,1800) if rising else (1000,160)
    tone=np.sin(2*np.pi*(f0*t+(f1-f0)*t*t/(2*duration)))
    add(at,(high*.32+tone*.23)*env,gain,-.2 if rising else .2)

# Distinct opening punctuation; each entrance has an audible physical cue.
kick(0,.75);wood(.03,.35,-.2);note(.02,57,.28)
for at in [.62,.90,1.18]: wood(at,.22,.15)
sweep(2.78,.22,.14);kick(3,.65);note(3,64,.26,-.25)
# Sparse original five-note motif over a 120 BPM grid.
melody=[69,72,76,67,72,64,69,76,72,67,76,79]
for i,at in enumerate(np.arange(3.5,15.6,.5)):
    if i%2==0: kick(float(at),.38)
    else: wood(float(at),.16,(-1 if i%4==1 else 1)*.25)
    if i%3!=1: note(float(at),melody[i%len(melody)],.13,(-1 if i%2 else 1)*.3)
for at in [7,9.4,12,13.25,14.3,15.0]:
    sweep(at-.19,.19,.11);wood(at,.27,-.12)
    note(at,76 if at<12 else 72,.18,.18)
# Typing accents echo the genuine input interaction.
for i in range(12): wood(3.48+i*.085,.045,(i%3-1)*.25)
# CTA: a quiet resolved chord, no busy beat under the invitation.
sweep(15.78,.22,.1,False);kick(16,.34)
for midi,pan in [(57,-.3),(64,0),(72,.3)]:note(16.02,midi,.13,pan,2.4)
wood(17.05,.10,-.15);note(18.0,76,.095,.2,1.6)
mix*=np.minimum(1,np.arange(N)/240)[:,None]
mix*=np.minimum(1,(N-1-np.arange(N))/(SR*.45))[:,None]
peak=float(np.max(np.abs(mix)))
mix*=.79/peak
out=ROOT/'assets'/'original-soundtrack.wav'
wavfile.write(out,SR,(mix*32767).astype(np.int16))
(ROOT/'assets'/'sound-provenance.json').write_text(json.dumps({
    'authoring':'Original synthesis by sound.py; no third-party recordings or music.',
    'seed':20261113,'sample_rate':SR,'duration_seconds':20,'bpm':120,
    'sources':['exponential sine kick','damped wood resonators','inharmonic tonal plucks','filtered seeded noise'],
    'master':'FFmpeg two-pass loudnorm at -16 LUFS / -1.5 dBTP, then -0.4 dB AAC headroom trim; measured final peak must stay <= -1 dBTP'
},indent=2)+'\n')
print(out)
