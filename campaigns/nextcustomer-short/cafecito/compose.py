#!/usr/bin/env python3
"""CAFECITO sketches: synthesizes original instrument WAVs + writes 3 DaemonV12 projects.
No SOLECITO material: new keys (E/A/G major), new hooks, new timbres. Stdlib+numpy only."""
import json, math, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent; A=ROOT/"assets"; SR=44100; rng=np.random.default_rng(20261114)
def write_wav(p, audio):
    p.parent.mkdir(parents=True, exist_ok=True)
    audio=np.clip(audio,-0.98,0.98)
    with wave.open(str(p),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((audio*32767).astype(np.int16).tobytes())
def f(m): return 440*2**((m-69)/12)
def env(t, attack, decay):
    return (1-np.exp(-t/max(attack,1e-4)))*np.exp(-t/max(decay,1e-3))
def tone(m, kind, secs):
    t=np.arange(int(SR*secs))/SR; fq=f(m); y=np.zeros_like(t)
    if kind=="pluck":  # marimba-ish: fast-decaying harmonics
        for a,p,d in [(1,1,.28),(.45,2,.16),(.18,3.01,.09),(.07,4.2,.05)]: y+=a*np.sin(2*np.pi*fq*p*t)*np.exp(-t/d)
        y+=0.03*rng.standard_normal(len(t))*np.exp(-t/.01)
    elif kind=="warmkeys":  # felt keys
        for a,p,d in [(1,1,1.0),(.35,2,.6),(.14,3,.35),(.05,4,.2)]: y+=a*np.sin(2*np.pi*fq*p*t)*np.exp(-t/d)
        y*= (1-np.exp(-t/.008)); y+=0.015*rng.standard_normal(len(t))*np.exp(-t/.015)
    elif kind=="pad":  # breathy reed pad, slow swell
        for a,p in [(1,1),(.28,2),(.12,3),(.06,4.01)]: y+=a*np.sin(2*np.pi*fq*p*t+0.1*np.sin(2*np.pi*0.4*t))
        y*= (1-np.exp(-t/.35))*np.exp(-np.maximum(0,t-secs+0.9)/0.45); y+=0.008*rng.standard_normal(len(t))*(1-np.exp(-t/.3))*np.exp(-t/1.2)
    elif kind=="bass":  # rubber bass
        y=np.sin(2*np.pi*fq*t)+.4*np.sin(2*np.pi*fq*2*t)+.12*np.sin(2*np.pi*fq*3*t); y*=env(t,.004,.22)
    elif kind=="elecbass":
        ph=2*np.pi*fq*t; y=np.tanh(1.8*(np.sin(ph)+.3*np.sin(2*ph)))*env(t,.003,.30)
    elif kind=="spoonlead":  # tuned metallic spoon = melodic percussion
        for a,p,d in [(1,1,.30),(.6,2.76,.18),(.4,5.4,.10),(.2,8.9,.05)]: y+=a*np.sin(2*np.pi*fq*p*t)*np.exp(-t/d)
        y+=0.05*rng.standard_normal(len(t))*np.exp(-t/.006)
    y/= (np.max(np.abs(y))+1e-9); return y*0.9
def perc(name):
    secs={"kick":.28,"clap":.22,"hat":.07,"shaker":.16,"cup":.18,"spoon":.10,"bell":.7,"snap":.09,"knock":.14}[name]
    t=np.arange(int(SR*secs))/SR; n=rng.standard_normal(len(t)); y=np.zeros_like(t)
    if name=="kick": fq=120*np.exp(-t*28)+42; y=np.sin(2*np.pi*np.cumsum(fq)/SR)*np.exp(-t/.09)
    elif name=="clap": y=n*np.exp(-t/.07)*(1+0.6*(t<.02))
    elif name=="hat": y=(n-np.roll(n,2))*np.exp(-t/.025)
    elif name=="shaker": y=(n-np.roll(n,8))*np.sin(np.pi*t/secs)**2*np.exp(-t/.12)
    elif name=="cup": y=(np.sin(2*np.pi*740*t)*.7+np.sin(2*np.pi*1830*t)*.4)*np.exp(-t/.045)+.2*n*np.exp(-t/.008)
    elif name=="spoon": y=(np.sin(2*np.pi*3400*t)+.6*np.sin(2*np.pi*5300*t))*np.exp(-t/.03)+.3*n*np.exp(-t/.004)
    elif name=="bell": y=(np.sin(2*np.pi*1568*t)+.5*np.sin(2*np.pi*2637*t))*np.exp(-t/.35)
    elif name=="snap": y=n*np.exp(-t/.02)
    elif name=="knock": y=np.sin(2*np.pi*310*t)*np.exp(-t/.05)+.3*n*np.exp(-t/.006)
    y/= (np.max(np.abs(y))+1e-9); return y*0.9

INSTR={"pluck":("pluck",0.55),"warmkeys":("warmkeys",1.4),"pad":("pad",2.2),"bass":("bass",0.4),"elecbass":("elecbass",0.45),"spoonlead":("spoonlead",0.5)}
NEEDS={"pluck":[76,78,80,81,83,85,88,71,73],"warmkeys":[45,57,61,64,66,69,71,73,76,81],"pad":[45,47,49,52,54,57,59,61,64,66,68,71,73,76],"bass":[35,40,42,43,45,47,49,50,52],"elecbass":[31,36,38,40,41,43,45,47],"spoonlead":[67,69,71,72,74,76,79,81,83]}
for inst,(kind,secs) in INSTR.items():
    samples=[]
    for m in NEEDS[inst]:
        write_wav(A/inst/f"note-{m}.wav", tone(m,kind,secs)); samples.append({"name":f"note-{m}","pitch":m,"file":f"note-{m}.wav"})
    (A/inst/"kit.json").write_text(json.dumps({"formatVersion":1,"samples":samples},indent=2))
samples=[]
for nm in ["kick","clap","hat","shaker","cup","spoon","bell","snap","knock"]:
    write_wav(A/"perc"/f"{nm}.wav", perc(nm)); samples.append({"name":nm,"pitch":36+len(samples),"file":f"{nm}.wav"})
(A/"perc").mkdir(parents=True,exist_ok=True); (A/"perc"/"kit.json").write_text(json.dumps({"formatVersion":1,"samples":samples},indent=2))

def notes(lst): return [{"start":s,"pitch":p,"velocity":v} for s,p,v in lst]
def track(tid,kit,ns,gain,pan=None,fx=None):
    t={"id":tid,"instrument":{"type":"drumkit","kit":f"assets/{kit}/kit.json"},"mix":{"gainDb":gain,**( {"pan":pan} if pan is not None else {})},"clips":[{"bar":1,"pattern":"main"}],"patterns":[{"id":"main","bars":4,"notes":notes(ns)}]}
    if fx: t["effects"]=fx
    return t
def track3(tid,kit,ns,gain,pan=None,fx=None):  # 3-bar pattern for B
    t=track(tid,kit,ns,gain,pan,fx); t["patterns"][0]["bars"]=3; return t
RV=[{"type":"reverb","roomSize":0.22,"decaySeconds":0.35,"wet":0.08}]

# A — CAFECITO RUSH 132 BPM E major, 4 bars = 7.27s
A_pluck=[("1:1","note-76",.92),("1:1+1/8","note-80",.82),("1:2","note-83",.95),("1:2+3/16","note-80",.78),("1:3+1/8","note-78",.82),("1:4","note-76",.86),
("2:1","note-76",.9),("2:1+1/8","note-80",.8),("2:2","note-83",.92),("2:2+3/16","note-85",.85),("2:3+1/8","note-81",.8),("2:4","note-80",.78),
("3:1","note-71",.8),("3:1+3/16","note-76",.75),("3:2+1/8","note-80",.8),("3:3","note-78",.75),("3:3+3/16","note-76",.8),("3:4+1/8","note-73",.7),
("4:1","note-76",.95),("4:1","note-80",.7),("4:1","note-83",.7),("4:2+1/8","note-85",.9),("4:3","note-83",.85),("4:3+3/16","note-80",.8),("4:4","note-76",.9)]
A_bass=[("1:1","note-40",.9),("1:2+3/16","note-40",.8),("1:3","note-47",.85),("1:4+1/8","note-45",.75),("2:1","note-40",.9),("2:2+3/16","note-42",.8),("2:3","note-47",.85),("2:4+1/8","note-49",.8),("3:1","note-40",.9),("3:2","note-47",.8),("3:3+3/16","note-50",.85),("3:4","note-49",.85),("4:1","note-40",.95),("4:3","note-47",.8),("4:4","note-40",.9)]
A_perc=[]
for b in range(1,5):
    A_perc+=[(f"{b}:1","kick",.95),(f"{b}:2+1/8","kick",.7),(f"{b}:3","kick",.85),(f"{b}:2","clap",.85),(f"{b}:4","clap",.9),(f"{b}:1+1/8","hat",.5),(f"{b}:2+1/8","hat",.45),(f"{b}:3+1/8","hat",.5),(f"{b}:4+1/8","hat",.45),(f"{b}:2+3/16","cup",.65),(f"{b}:4+3/16","spoon",.6)]
A_perc+=[("1:4+3/16","shaker",.5),("2:4+3/16","shaker",.5),("4:4+1/8","bell",.55),("4:4+3/16","cup",.7)]
projA={"formatVersion":1,"title":"CAFECITO A - Cafecito Rush (sketch)","bpm":132,"timeSignature":"4/4","key":"E major","bars":4,"seed":1101,"description":"Sketch A: opening hook 0-1.4s (E5-G#5-B5), syncopated cup/spoon groove; ~5.5s tap/kit-reveal lift = bar4 hook octave + E-major stab. NOT SOLECITO (new key/hook). Film: 0-3 hook, 3s app groove, 5.57 tap in bar4 lift.","render":{"duration":{"seconds":7.6},"tail":"none"},"master":{"gainDb":-3},
"tracks":[track("pluck","pluck",A_pluck,-5,-0.08,RV),track("bass","bass",A_bass,-5,0),track("perc","perc",A_perc,-7,0.06)]}

# B — EL NEGOCIO DESPIERTA 104 BPM A major, 3 bars = 6.92s
B_keys=[("1:1","note-45",.7),("1:1","note-61",.55),("1:2","note-73",.62),("1:3+1/8","note-76",.66),("1:4+1/8","note-81",.6),
("2:1","note-69",.7),("2:1+1/8","note-73",.65),("2:2","note-76",.72),("2:3","note-69",.65),("2:3+1/8","note-66",.6),("2:4","note-64",.62),
("3:1","note-73",.85),("3:1+1/8","note-76",.82),("3:2","note-81",.9),("3:2+1/8","note-81",.88),("3:3","note-76",.8),("3:4","note-73",.85)]
B_pad=[("1:1","note-57",.5),("1:1","note-61",.42),("1:1","note-64",.42),("2:1","note-52",.45),("2:1","note-59",.4),("2:1","note-64",.4),("3:1","note-57",.6),("3:1","note-61",.5),("3:1","note-64",.5),("3:3","note-59",.45),("3:3","note-66",.4),("3:3","note-71",.4)]
B_bass=[("2:1","note-45",.7),("2:3","note-52",.65),("3:1","note-45",.85),("3:2+1/8","note-47",.7),("3:3","note-52",.8),("3:4","note-45",.85)]
B_perc=[("2:1","kick",.6),("2:3","kick",.55),("2:2","snap",.5),("2:4","snap",.5),("2:1+1/8","hat",.35),("2:3+1/8","hat",.35),
("3:1","kick",.8),("3:2","clap",.65),("3:3","kick",.75),("3:4","clap",.7),("3:1+1/8","shaker",.5),("3:2+1/8","shaker",.45),("3:3+1/8","shaker",.5),("3:4+1/8","cup",.55),("3:4+3/16","bell",.5)]
projB={"formatVersion":1,"title":"CAFECITO B - El Negocio Despierta (sketch)","bpm":104,"timeSignature":"4/4","key":"A major","bars":3,"seed":1102,"description":"Sketch B: intimate felt-keys dawn motif C#5-E5-A5 (0-2s), pad/bass wake in bar2, expansive A-major reveal bar3 (~4.6-6.9s = post/CTA energy). NOT SOLECITO.","render":{"duration":{"seconds":7.4},"tail":"none"},"master":{"gainDb":-6.5},
"tracks":[track3("warmkeys","warmkeys",B_keys,-5,-0.05,RV),track3("pad","pad",B_pad,-9,0.05),track3("bass","bass",B_bass,-6,0),track3("perc","perc",B_perc,-8,0)]}

# C — HECHO CON GANAS 126 BPM G major, 4 bars = 7.62s, 3+3+2 spoon hocket
C_spoon=[("1:1","note-79",.9),("1:1+3/16","note-83",.85),("1:2+1/8","note-81",.88),("1:3","note-79",.85),("1:3+3/16","note-76",.8),("1:4+1/8","note-74",.78),
("2:1","note-79",.9),("2:1+3/16","note-83",.88),("2:2+1/8","note-83",.9),("2:3","note-83",.85),("2:3+3/16","note-81",.8),("2:4+1/8","note-79",.85)]
C_spoon+=[("3:1","note-72",.85),("3:1+3/16","note-79",.8),("3:2+1/8","note-72",.75),("3:3","note-74",.8),("3:3+3/16","note-76",.82),("3:4+1/8","note-79",.85),
("4:1","note-79",.95),("4:1","note-83",.65),("4:1","note-74",.65),("4:1+3/16","note-83",.9),("4:2+1/8","note-81",.9),("4:3","note-83",.88),("4:4","note-79",.95),("4:4+3/16","note-76",.8)]
C_bass=[("1:1","note-43",.9),("1:2+1/8","note-43",.85),("1:3+3/16","note-47",.85),("1:4","note-45",.8),("2:1","note-43",.9),("2:2+1/8","note-41",.85),("2:3","note-40",.85),("2:4+1/8","note-43",.9),("4:1","note-43",.95),("4:2+1/8","note-47",.9),("4:3","note-45",.85),("4:4","note-43",.95)]
C_perc=[]
for b in [1,2,4]:
    C_perc+=[(f"{b}:1","kick",.95),(f"{b}:2+1/8","kick",.75),(f"{b}:3","kick",.85),(f"{b}:2","clap",.85),(f"{b}:4","clap",.88),(f"{b}:1+3/16","spoon",.55),(f"{b}:2+3/16","spoon",.5),(f"{b}:3+3/16","spoon",.55),(f"{b}:4+3/16","cup",.65)]
C_perc+=[("3:1","cup",.8),("3:1+3/16","spoon",.7),("3:2+1/8","knock",.75),("3:3","cup",.8),("3:3+3/16","spoon",.7),("3:4+1/8","bell",.7),("4:4+3/16","bell",.6),("4:4+1/8","shaker",.55)]
projC={"formatVersion":1,"title":"CAFECITO C - Hecho Con Ganas (sketch)","bpm":126,"timeSignature":"4/4","key":"G major","bars":4,"seed":1103,"description":"Sketch C: tuned-spoon hocket hook in 3+3+2 (0-1.5s), cup-as-kick kitchen groove, bar3 everyday-sound break (no electronics), bar4 electronic return + G-major stab/bell reveal. NOT SOLECITO.","render":{"duration":{"seconds":7.9},"tail":"none"},"master":{"gainDb":-3},
"tracks":[track("spoonlead","spoonlead",C_spoon,-5,0.08,RV),track("elecbass","elecbass",C_bass,-5,0),track("perc","perc",C_perc,-7,-0.05)]}

for name,proj in [("a-cafecito-rush",projA),("b-el-negocio-despierta",projB),("c-hecho-con-ganas",projC)]:
    (ROOT/f"{name}.json").write_text(json.dumps(proj,indent=2))
print("wrote 3 projects + instruments")
