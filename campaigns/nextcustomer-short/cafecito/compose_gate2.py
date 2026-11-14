#!/usr/bin/env python3
"""Gate 2: develop winning sketch A into ONE 20s soundtrack. Original sketches/assets untouched.
New warmer v2 instruments synthesized here; projects notes are in bars:beats (132 BPM, 11 bars = 20.000s).
Intentional sync accents (not every event): tap 4:1+1/16=5.569s, kit 4:1+3/16=5.795s, Post stab 4:4+1/10=7.000s,
Post-land 5:1+1/6=7.576s, Story stab 6:1+1/6=9.394s, copy phrase 7:3+1/10=12.000s, Spanish hook 9:2=15.000s,
ES-toggle spoon 9:2+1/10=15.182s (~15.2), CTA chord 9:4+1/20=16.000s. All other events are carried by groove/phrasing."""
import json, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent; A=ROOT/"assets"/"v2"; SR=44100; rng=np.random.default_rng(20261115)
def write_wav(p,a):
    p.parent.mkdir(parents=True,exist_ok=True); a=np.clip(a,-.98,.98)
    with wave.open(str(p),'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a*32767).astype(np.int16).tobytes())
def fq(m): return 440*2**((m-69)/12)
def tone(m,kind,secs):
    t=np.arange(int(SR*secs))/SR; f=fq(m); y=np.zeros_like(t)
    if kind=="woodpluck": # warmer, rounder than sketch pluck: less top harmonic, softer attack
        for a,p,d in [(1,1,.42),(.32,2,.22),(.10,3.01,.11),(.03,4.2,.06)]: y+=a*np.sin(2*np.pi*f*p*t)*np.exp(-t/d)
        y*=(1-np.exp(-t/.004)); y+=.02*rng.standard_normal(len(t))*np.exp(-t/.012)
    elif kind=="warmkeys":
        for a,p,d in [(1,1,1.0),(.35,2,.6),(.14,3,.35),(.05,4,.2)]: y+=a*np.sin(2*np.pi*f*p*t)*np.exp(-t/d)
        y*=(1-np.exp(-t/.008)); y+=.015*rng.standard_normal(len(t))*np.exp(-t/.015)
    elif kind=="pad":
        for a,p in [(1,1),(.28,2),(.12,3),(.06,4.01)]: y+=a*np.sin(2*np.pi*f*p*t+.1*np.sin(2*np.pi*.4*t))
        y*=(1-np.exp(-t/.35))*np.exp(-np.maximum(0,t-secs+.9)/.45); y+=.008*rng.standard_normal(len(t))*(1-np.exp(-t/.3))*np.exp(-t/1.2)
    elif kind=="reedstab": # short brassy-reed payoff stab, ~0.9s
        for a,p,d in [(1,1,.55),(.28,2,.4),(.20,3,.3),(.09,4,.18)]: y+=a*np.sin(2*np.pi*f*p*t)*np.exp(-t/d)
        y*=(1-np.exp(-t/.018)); y+=.01*rng.standard_normal(len(t))*np.exp(-t/.02)
    elif kind=="bass":
        y=np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2*t)+.12*np.sin(2*np.pi*f*3*t); y*=(1-np.exp(-t/.004))*np.exp(-t/.26)
    y/=(np.max(np.abs(y))+1e-9); return y*.9
def perc(name):
    secs={"kick":.28,"clap":.22,"hat":.07,"shaker":.18,"cup":.18,"spoon":.10,"bell":.7,"snap":.09,"knock":.14,"wood":.12,"brush":.32}[name]
    t=np.arange(int(SR*secs))/SR; n=rng.standard_normal(len(t)); y=np.zeros_like(t)
    if name=="kick": ff=120*np.exp(-t*28)+42; y=np.sin(2*np.pi*np.cumsum(ff)/SR)*np.exp(-t/.09)
    elif name=="clap": y=n*np.exp(-t/.07)*(1+.6*(t<.02))
    elif name=="hat": y=(n-np.roll(n,2))*np.exp(-t/.025)
    elif name=="shaker": y=(n-np.roll(n,8))*np.sin(np.pi*t/secs)**2*np.exp(-t/.13)
    elif name=="cup": y=(np.sin(2*np.pi*740*t)*.7+np.sin(2*np.pi*1830*t)*.4)*np.exp(-t/.045)+.2*n*np.exp(-t/.008)
    elif name=="spoon": y=(np.sin(2*np.pi*3400*t)+.6*np.sin(2*np.pi*5300*t))*np.exp(-t/.03)+.3*n*np.exp(-t/.004)
    elif name=="bell": y=(np.sin(2*np.pi*1568*t)+.5*np.sin(2*np.pi*2637*t))*np.exp(-t/.35)
    elif name=="snap": y=n*np.exp(-t/.02)
    elif name=="knock": y=np.sin(2*np.pi*310*t)*np.exp(-t/.05)+.3*n*np.exp(-t/.006)
    elif name=="wood": y=np.sin(2*np.pi*920*t)*np.exp(-t/.04)+.25*n*np.exp(-t/.005)
    elif name=="brush": y=(n-np.roll(n,16))*np.sin(np.pi*t/secs)*np.exp(-t/.25)
    y/=(np.max(np.abs(y))+1e-9); return y*.9
INSTR={"woodpluck":("woodpluck",.6),"warmkeys":("warmkeys",1.4),"pad":("pad",2.2),"reedstab":("reedstab",.95),"bass":("bass",.5)}
NEEDS={"woodpluck":[64,66,68,71,73,76,78,80,83,85,86,88],"warmkeys":[52,57,61,64,66,68,69,71,73,74,76],"pad":[47,51,52,54,56,57,59,61,63,64,66],"reedstab":[71,75,76,78,80,83],"bass":[35,40,42,44,45,47,49,52]}
for inst,(kind,secs) in INSTR.items():
    s=[]
    for m in NEEDS[inst]: write_wav(A/inst/f"note-{m}.wav",tone(m,kind,secs)); s.append({"name":f"note-{m}","pitch":m,"file":f"note-{m}.wav"})
    (A/inst/"kit.json").write_text(json.dumps({"formatVersion":1,"samples":s},indent=2))
s=[]
for nm in ["kick","clap","hat","shaker","cup","spoon","bell","snap","knock","wood","brush"]:
    write_wav(A/"perc"/f"{nm}.wav",perc(nm)); s.append({"name":nm,"pitch":36+len(s),"file":f"{nm}.wav"})
(A/"perc").mkdir(parents=True,exist_ok=True); (A/"perc"/"kit.json").write_text(json.dumps({"formatVersion":1,"samples":s},indent=2))
def track(tid,kit,ns,gain,pan=None,fx=None):
    t={"id":tid,"instrument":{"type":"drumkit","kit":f"assets/v2/{kit}/kit.json"},"mix":{"gainDb":gain,**({"pan":pan} if pan is not None else {})},"clips":[{"bar":1,"pattern":"main"}],"patterns":[{"id":"main","bars":11,"notes":[{"start":a,"pitch":b,"velocity":c} for a,b,c in ns]}]}
    if fx:t["effects"]=fx
    return t
RV=[{"type":"reverb","roomSize":.22,"decaySeconds":.35,"wet":.07}]
# Lead: A signature, sparse in groove bars to reduce arcade repetition
lead=[("1:1","note-76",.92),("1:1+1/8","note-80",.82),("1:2","note-83",.95),("1:2+3/16","note-80",.78),("1:3+1/8","note-78",.82),("1:4","note-76",.86),
("2:1","note-76",.88),("2:1+1/8","note-80",.8),("2:2","note-83",.9),("2:2+3/16","note-85",.85),("2:3+1/8","note-83",.82),
("3:1","note-73",.78),("3:2+1/8","note-76",.75),("3:3","note-78",.78),("3:4+1/8","note-76",.72),
("4:1","note-76",.85),("4:2","note-80",.85),("4:3","note-83",.88),("4:3+3/16","note-85",.85),
("5:1+1/6","note-76",.5),("5:2","note-88",.9),("5:2+1/8","note-85",.85),("5:3","note-83",.85),("5:3+3/16","note-80",.8),("5:4","note-83",.85),
("6:2+1/8","note-83",.82),("6:3","note-80",.8),("6:4","note-83",.82),
("7:3+1/10","note-76",.75),
("8:1","note-73",.78),("8:1+1/8","note-76",.8),("8:2","note-80",.82),("8:3","note-78",.8),("8:4","note-76",.78),
("9:2","note-85",.9),("9:2+1/8","note-88",.88),("9:3","note-85",.85),("9:3+3/16","note-83",.82),("9:4","note-80",.8),
("10:2","note-76",.9),("10:2+1/8","note-80",.85),("10:3","note-83",.92),("10:4","note-80",.82),
("11:1","note-76",.9),("11:2","note-83",.9),("11:2+1/8","note-88",.95)]
keys=[("1:1","note-64",.55),("1:3","note-68",.5),("2:1","note-66",.55),("2:3","note-71",.55),
("3:1","note-64",.7),("3:1+1/8","note-68",.65),("3:2","note-71",.7),("3:2+3/16","note-68",.6),("3:3","note-66",.65),("3:4","note-64",.6),
("4:1","note-64",.68),("4:1+1/8","note-66",.6),("4:2","note-68",.65),("4:3","note-71",.68),
("5:1","note-64",.7),("5:1","note-68",.6),("5:1","note-71",.6),("5:3","note-69",.65),("5:3","note-73",.6),
("6:3","note-64",.65),("6:3","note-68",.55),("6:3","note-71",.55),
("7:1","note-57",.6),("7:2","note-61",.55),("7:3+1/10","note-76",.6),("7:4","note-73",.6),("8:1","note-71",.62),
("8:2","note-69",.6),("8:2+1/8","note-73",.6),("8:3","note-76",.65),("8:4","note-71",.6),
("9:1","note-64",.6),("9:1","note-68",.55),("9:3","note-73",.65),
("10:1","note-64",.7),("10:1","note-68",.6),("10:1","note-71",.6),("10:2","note-69",.65),("10:2","note-73",.6),("10:3","note-66",.65),("10:3","note-71",.6),("10:3","note-74",.55),("10:4","note-64",.7),("10:4","note-68",.6),("10:4","note-71",.6),
("11:1","note-52",.7),("11:1","note-64",.65),("11:1","note-68",.6),("11:1","note-71",.6)]
pad=[("4:4+1/10","note-52",.6),("4:4+1/10","note-56",.5),("4:4+1/10","note-59",.5),("4:4+1/10","note-64",.45),
("5:1","note-52",.5),("5:1","note-59",.45),
("6:1+1/6","note-47",.6),("6:1+1/6","note-51",.5),("6:1+1/6","note-54",.5),("6:1+1/6","note-59",.45),("6:3","note-52",.45),("6:3","note-59",.4),
("9:2","note-52",.5),("9:2","note-56",.45),("9:2","note-59",.45),
("9:4+1/20","note-52",.65),("9:4+1/20","note-56",.55),("9:4+1/20","note-59",.55),("9:4+1/20","note-64",.5),
("10:2","note-57",.5),("10:2","note-61",.45),("10:2","note-64",.45),("10:3","note-59",.5),("10:3","note-63",.45),("10:3","note-66",.45)]
reed=[("4:4+1/10","note-76",.8),("4:4+1/10","note-80",.7),("4:4+1/10","note-83",.7),
("6:1+1/6","note-71",.85),("6:1+1/6","note-75",.75),("6:1+1/6","note-78",.75),
("9:4+1/20","note-76",.85),("9:4+1/20","note-80",.75),("9:4+1/20","note-83",.75)]
bass=[("1:1","note-40",.9),("1:2+3/16","note-40",.8),("1:3","note-47",.85),("1:4+1/8","note-45",.75),
("2:1","note-40",.9),("2:2+3/16","note-42",.8),("2:3+3/20","note-47",.9),("2:4+1/8","note-49",.8),
("3:1","note-40",.9),("3:2+3/16","note-40",.82),("3:3","note-47",.85),("3:4+1/8","note-45",.78),
("4:1","note-40",.9),("4:2","note-47",.85),("4:3","note-49",.85),("4:3+3/16","note-52",.8),("4:4+1/10","note-40",.95),
("5:1","note-40",.92),("5:2+1/8","note-47",.85),("5:3","note-45",.85),("5:3+3/16","note-49",.8),("5:4","note-40",.88),
("6:1","note-35",.9),("6:1+1/6","note-35",.95),("6:2","note-42",.85),("6:3","note-40",.88),("6:4","note-47",.85),
("7:1","note-45",.7),("7:3+1/10","note-45",.75),
("8:1","note-45",.8),("8:2","note-52",.8),("8:3","note-47",.82),("8:4","note-40",.85),
("9:1","note-40",.9),("9:2","note-40",.9),("9:3","note-47",.85),("9:4+1/20","note-40",.95),
("10:1","note-40",.9),("10:2","note-45",.85),("10:3","note-47",.85),("10:4","note-40",.9),("11:1","note-40",.95)]
perc=[]
for b in range(1,5): # opening/app groove, alternating hand sounds for organic feel
    hand="clap" if b%2 else "snap"
    perc+=[(f"{b}:1","kick",.92),(f"{b}:2+1/8","kick",.68),(f"{b}:3","kick",.85),(f"{b}:2",hand,.82),(f"{b}:4",hand,.85),(f"{b}:1+1/8","hat",.45),(f"{b}:2+1/8","hat",.4),(f"{b}:3+1/8","hat",.45),(f"{b}:4+1/8","hat",.4),(f"{b}:2+3/16","cup",.6),(f"{b}:4+3/16","spoon",.55),(f"{b}:3+3/16","shaker",.42)]
perc+=[("4:1+1/16","cup",.9),("4:1+3/16","knock",.85)] # tap + kit-reveal response (only precise UI sync)
perc+=[("5:1","kick",.9),("5:2","clap",.85),("5:3","kick",.88),("5:4","clap",.88),("5:1+1/6","knock",.55),("5:1+1/8","shaker",.5),("5:2+1/8","shaker",.45),("5:3+1/8","shaker",.5),("5:4+1/8","wood",.6),("5:4+3/16","spoon",.55),
("6:1","kick",.9),("6:2","wood",.8),("6:3","kick",.85),("6:3","bell",.5),("6:4","clap",.85),("6:1+1/8","shaker",.5),("6:3+1/8","shaker",.5),("6:4+3/16","spoon",.55),
("7:1","brush",.6),("7:2","cup",.55),("7:3+1/10","knock",.7),("7:4","spoon",.5), # stripped words/cards break
("8:1","kick",.75),("8:2","snap",.7),("8:3","kick",.72),("8:4","snap",.72),("8:1+1/8","shaker",.45),("8:3+1/8","shaker",.45),("8:4+3/16","cup",.55),
("9:1","kick",.9),("9:2","clap",.85),("9:2+1/10","spoon",.85),("9:3","kick",.88),("9:4","clap",.88),("9:1+1/8","hat",.45),("9:3+1/8","hat",.45),("9:4+3/16","cup",.6),
("10:2","snap",.75),("10:4","snap",.75),("10:1+1/8","shaker",.5),("10:2+1/8","shaker",.45),("10:3+1/8","shaker",.5),("10:4+1/8","shaker",.45),
("11:1","shaker",.5),("11:2+1/8","cup",.6)]
proj={"formatVersion":1,"title":"CAFECITO RUSH - NextCustomer 20s final (Gate 2)","bpm":132,"timeSignature":"4/4","key":"E major","bars":11,"seed":1201,
"description":"Gate2 development of sketch A only. Sections: bars1-2 hook/groove (0-3.6s), bars3-4 app build+tap/kit (3.6-7.3s), bar5 Post payoff E (7.0 stab), bar6 Story payoff B (9.39 stab), bars7-8 stripped words/cards contrast (10.9-14.5s), bar9 Spanish return (15.0) + CTA chord 16.0, bar10 CTA celebration, bar11 victory signature + tail ending by 19.1s, silent final 100ms. No hits forced on typing/button/bio/messages/week/landings except copy-phrase note.",
"render":{"duration":{"seconds":20},"tail":"none"},"master":{"gainDb":-7.5},
"tracks":[track("lead","woodpluck",lead,-5,-.06,RV),track("warmkeys","warmkeys",keys,-6,.05,RV),track("pad","pad",pad,-11,0),track("reedstab","reedstab",reed,-7,.03,RV),track("bass","bass",bass,-5,0),track("perc","perc",perc,-7,0)]}
(ROOT/"cafecito-rush-final.json").write_text(json.dumps(proj,indent=2)); print("wrote final project")
