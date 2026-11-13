/* Frame-exact 20-second composition. All UI and output art comes from capture.cjs. */
const fs=require('node:fs');
const path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const crypto=require('node:crypto');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const DIR=__dirname,A=path.join(DIR,'assets'),CACHE=path.join(DIR,'.cache');
fs.mkdirSync(CACHE,{recursive:true});
const P='#F3EEE6',I='#171512',O='#E2542B',M='#857C71';
const FPS=30,FRAMES=600;
const data=JSON.parse(fs.readFileSync(path.join(A,'outputs.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(A,'capture-manifest.json')));
for(const f of fs.readdirSync(path.join(A,'fonts')).filter(x=>x.endsWith('.woff'))){
  const family=f.startsWith('InterDisplay')?'Film Display':f.startsWith('Inter-')?'Film Sans':'Film Serif';
  if(!GlobalFonts.registerFromPath(path.join(A,'fonts',f),family))throw Error('Could not load embedded font: '+f);
}
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-Math.pow(1-clamp(x),3);
const lerp=(a,b,t)=>a+(b-a)*t;
const assets={};
const measured=[];
function run(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{cwd:DIR,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r;}
function text(c,s,x,y,size=40,color=I,weight=600,family='Film Sans',maxWidth=824){
  c.font=`${weight} ${size}px "${family}"`;c.textBaseline='top';c.fillStyle=color;
  const width=c.measureText(s).width;
  if(width>maxWidth+.5)throw Error(`Text overflow: ${s}: ${width} > ${maxWidth}`);
  c.fillText(s,x,y);
  measured.push({s,x,y,width,size});
}
function line(c,x,y,w,col=I,alpha=.16){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.fillRect(x,y,w,2);c.restore()}
function rect(c,x,y,w,h,r=0,color=P){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function mark(c,x,y,size,color=I){c.fillStyle=color;c.beginPath();c.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);c.fill();c.fillStyle=O;c.beginPath();c.arc(x+size/2,y+size*.72,size*.31,Math.PI,0);c.fill()}
function header(c,section='LOCAL BUSINESS, LESS BUSYWORK',dark=false){
  const ink=dark?P:I;mark(c,76,184,44,ink);
  text(c,'NEXTCUSTOMER',137,191,25,ink,600,'Film Sans',700);
  line(c,76,253,824,ink,.22);
  text(c,section,76,272,21,dark?'#BEB5A9':M,600,'Film Sans');
}
function footer(c,dark=false){
  text(c,'LUNA CLEANING · ILLUSTRATIVE BUSINESS',76,1510,19,dark?'#BEB5A9':M,600,'Film Sans');
}
function paper(c,img,x,y,w,h,rotation=0){
  c.save();c.translate(x+w/2,y+h/2);c.rotate(rotation);
  c.shadowColor='rgba(23,21,18,.18)';c.shadowBlur=32;c.shadowOffsetY=18;
  c.drawImage(img,-w/2,-h/2,w,h);c.restore();
}
function crop(c,img,sx,sy,sw,sh,x,y,w,h,r=20){
  c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();c.drawImage(img,sx,sy,sw,sh,x,y,w,h);c.restore();
}
function reveal(c,s,x,y,size,at,t,col=I,weight=900,fam='Film Display',width=824){
  const p=ease((t-at)/.32);c.save();c.beginPath();c.rect(x-5,y-6,width+10,size*1.25);c.clip();
  text(c,s,x,y+(1-p)*size*1.25,size,col,weight,fam,width);c.restore();
}
function sun(c,cx,cy,r,color=O){
  c.save();c.fillStyle=color;c.beginPath();c.arc(cx,cy,r,Math.PI,0);c.closePath();c.fill();
  c.globalCompositeOperation='destination-out';for(let k=0;k<5;k++)c.fillRect(cx-r,cy-r*.43+k*r*.11,r*2,7+k*2);c.restore();
}
function cleanSun(c,cx,cy,r,color=O,bg=P){
  c.fillStyle=color;c.beginPath();c.arc(cx,cy,r,Math.PI,0);c.closePath();c.fill();
  c.fillStyle=bg;for(let k=0;k<5;k++)c.fillRect(cx-r,cy-r*.43+k*r*.11,r*2,7+k*2);
}
function background(c,dark=false){rect(c,0,0,1080,1920,0,dark?I:P);}

// Single-source timeline: 0–3 hook; 3–7 session; 7–12 exports; 12–16 copy + ES; 16–20 CTA.
async function frame(c,t){
  measured.length=0;background(c);
  if(t<3){
    header(c);
    text(c,'YOU RUN',76,366,112,I,900,'Film Display');
    text(c,'THE',76,482,112,I,900,'Film Display');
    text(c,'BUSINESS.',76,598,112,O,900,'Film Display');
    reveal(c,'MARKETING',76,846,74,.56,t);
    reveal(c,"SHOULDN’T BE",76,932,74,.83,t);
    reveal(c,'ANOTHER JOB.',76,1018,74,1.10,t);
    cleanSun(c,490,1448,320);
    text(c,'Made for the work you do.',76,1510,30,M,400,'Film Sans');
    // Orange editorial wipe into actual product.
    if(t>2.8)rect(c,1080*(1-ease((t-2.8)/.2)),0,1080,1920,0,O);
  }else if(t<7){
    header(c,'A REAL KIT. FROM YOUR DETAILS.');
    text(c,'ONE BUSINESS.',76,338,82,I,900,'Film Display');
    text(c,'A WHOLE KIT.',76,432,82,O,900,'Film Display');
    let srcTime;
    const typing=manifest.events.find(x=>x.name==='typing-start').seconds;
    const tap=manifest.events.find(x=>x.name==='make-kit').seconds;
    if(t<4.65)srcTime=typing-.15+(t-3)*.96;
    else if(t<5.8)srcTime=tap-.65+(t-4.65)*.55;
    else srcTime=tap+1.05+(t-5.8)*.42;
    const img=await videoFrame(srcTime);
    // Crops are from the continuous real session, including actual typing and click.
    const sy=t<4.65?0:t<5.8?880:0;
    crop(c,img,0,sy,824,Math.min(900,1830-sy),76,565,824,900);
    footer(c);
    if(t>=5.35&&t<5.8){
      const p=(t-5.35)/.45;c.save();c.globalAlpha=Math.sin(p*Math.PI)*.75;c.strokeStyle=O;c.lineWidth=5;c.beginPath();c.arc(625,1380,26+40*p,0,Math.PI*2);c.stroke();c.restore();
    }
  }else if(t<9.4){
    header(c,'01 / POST · REAL PNG EXPORT');
    reveal(c,'YOUR POST.',76,338,94,7,t);
    text(c,'Your name. Your service. Your details.',76,451,29,M,400,'Film Sans');
    const p=ease((t-7)/.55),w=lerp(690,796,p),h=w*1.25;
    paper(c,assets['post-en'],76+(796-w)/2,500+lerp(80,0,p),w,h,lerp(-.018,0,p));footer(c);
  }else if(t<12){
    header(c,'02 / STORY · REAL PNG EXPORT');
    reveal(c,'YOUR STORY.',76,338,88,9.4,t);
    cleanSun(c,890,1340,440,O,P);
    const p=ease((t-9.4)/.55),w=lerp(530,590,p),h=w*1920/1080;
    paper(c,assets['story-en'],165+(590-w)/2,438+lerp(75,0,p),w,h,lerp(.025,0,p));footer(c);
  }else if(t<15.0){
    header(c,'03 / WORDS FOR THE REST OF YOUR WEEK');
    text(c,'AND THE WORDS.',76,338,75,I,900,'Film Display');
    const rows=[
      {name:'bio-en',label:'BIO',at:12,y:515,sy:146,sh:165},
      {name:'messages-en',label:'MESSAGES',at:12.25,y:845,sy:243,sh:145},
      {name:'week-en',label:'WEEK 1 · 7 IDEAS',at:12.50,y:1130,sy:35,sh:300}
    ];
    for(const row of rows){
      const p=ease((t-row.at)/.34);if(p<=0)continue;
      c.save();c.globalAlpha=p;const y=row.y+(1-p)*35;
      text(c,row.label,76,y-58,26,O,600,'Film Sans');
      rect(c,76,y,824,row.sh*824/744+40,20,'#FBF8F3');
      crop(c,assets[row.name],24,row.sy,696,row.sh,98,y+20,780,row.sh*780/696,4);
      c.restore();
    }
    footer(c);
  }else if(t<16){
    header(c,'ENGLISH / ESPAÑOL');
    text(c,'TAMBIÉN EN',76,338,79,I,900,'Film Display');
    text(c,'ESPAÑOL.',76,426,79,O,900,'Film Display');
    const switchAt=manifest.events.find(x=>x.name==='spanish-switch').seconds;
    const v=await videoFrame(switchAt-.25+(t-15)*1.1);
    crop(c,v,0,0,824,124,76,559,824,124,0);
    const p=ease((t-15)/.28);
    paper(c,assets['post-es'],168,715+(1-p)*20,620,775,0);
    // Keep all headline content above the Shorts overlay; bottom of the export is decorative context.
    footer(c);
  }else{
    background(c,true);header(c,'FOR THE PEOPLE WHO KEEP OUR NEIGHBORHOODS GOING',true);
    // The invitation is held from the first CTA frame, with restrained supporting motion.
    text(c,'FREE TOOL FOR',76,363,46,P,600,'Film Sans');
    text(c,'LOCAL BUSINESSES',76,421,46,P,600,'Film Sans');
    line(c,76,518,824,P,.25);
    text(c,'COMMENT',76,590,91,P,900,'Film Display');
    text(c,"'KIT'",76,683,178,O,900,'Film Display');
    text(c,'+ YOUR',76,892,91,P,900,'Film Display');
    text(c,'BUSINESS',76,985,91,P,900,'Film Display');
    text(c,'I’ll reply with a first-post idea.',76,1174,33,P,400,'Film Sans');
    text(c,'EN / ES · NO LOGIN',76,1270,26,'#BEB5A9',600,'Film Sans');
    rect(c,76,1394,824,98,12,O);
    text(c,'LINK IN CHANNEL PROFILE',103,1424,33,P,600,'Film Sans',768);
    // Subtle arc repeats the opening visual motif and ties the loop together.
    cleanSun(c,880,1850,220+Math.sin((t-16)*1.5)*8,O,I);
  }
}
async function videoFrame(seconds){
  const n=Math.max(1,Math.min(352,Math.floor(seconds*25)+1));
  return loadImage(path.join(CACHE,'session',String(n).padStart(4,'0')+'.jpg'));
}
async function init(){
  for(const name of ['post-en','post-es','story-en','bio-en','messages-en','week-en'])assets[name]=await loadImage(path.join(A,name+'.png'));
  const session=path.join(CACHE,'session');fs.mkdirSync(session,{recursive:true});
  const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(A,'real-session.webm'))).digest('hex');
  const hashFile=path.join(session,'source.sha256');
  if(!fs.existsSync(hashFile)||fs.readFileSync(hashFile,'utf8')!==sourceHash){
    for(const f of fs.readdirSync(session))fs.unlinkSync(path.join(session,f));
    run(['-y','-i',path.join(A,'real-session.webm'),'-vf','scale=824:1830:flags=lanczos','-q:v','2',path.join(session,'%04d.jpg')]);
    fs.writeFileSync(hashFile,sourceHash);
  }
}
function normalizedAudioFilter(){
  const r=spawnSync('ffmpeg',['-hide_banner','-i',path.join(A,'original-soundtrack.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
  if(r.status!==0)throw Error(r.stderr);
  const m=JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'),r.stderr.lastIndexOf('}')+1));
  fs.writeFileSync(path.join(A,'audio-normalization.json'),JSON.stringify(m,null,2)+'\n');
  return `loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary,volume=-0.4dB`;
}
async function contact(file,mode){
  const times=[0,4.5,9,14.5,18];const w=270,h=480;
  const cv=createCanvas(w*5,h+56),c=cv.getContext('2d');rect(c,0,0,w*5,h+56,0,I);
  for(let j=0;j<times.length;j++){
    const out=path.join(CACHE,mode+'-qa-'+j+'.png');run(['-y','-ss',String(times[j]),'-i',file,'-frames:v','1',out]);
    c.drawImage(await loadImage(out),j*w,0,w,h);
    text(c,times[j].toFixed(1)+'s',j*w+14,h+16,22,P,600,'Film Sans',240);
  }
  fs.writeFileSync(path.join(DIR,mode==='proof'?'proof-contact-sheet.png':'contact-sheet.png'),cv.toBuffer('image/png'));
}
async function thumbnail(){
  const cv=createCanvas(1080,1920),c=cv.getContext('2d');background(c);header(c,'FREE · ENGLISH / ESPAÑOL');
  text(c,'YOUR BUSINESS.',76,345,81,I,900,'Film Display');
  text(c,'READY TO POST.',76,440,81,O,900,'Film Display');
  paper(c,assets['post-en'],113,599,744,930,-.012);
  fs.writeFileSync(path.join(DIR,'thumbnail.png'),cv.toBuffer('image/png'));
}
async function main(){
  await init();const mode=process.argv[2]||'proof';
  if(!['proof','final','still'].includes(mode))throw Error('Use proof, final, or still');
  if(mode==='still'){
    const cv=createCanvas(1080,1920);await frame(cv.getContext('2d'),Number(process.argv[3]||18));
    fs.writeFileSync(path.join(CACHE,'still.png'),cv.toBuffer('image/png'));return;
  }
  const scale=mode==='proof'?.5:1,W=1080*scale,H=1920*scale;
  const silent=path.join(CACHE,mode+'-silent.mp4');
  const out=path.join(DIR,mode==='proof'?'nextcustomer_launch_short_proof_540x960.mp4':'nextcustomer_launch_short_1080x1920.mp4');
  if(!process.argv.includes('--mux-only')){
  const cv=createCanvas(W,H),c=cv.getContext('2d');
  const args=['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',W+'x'+H,'-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset',mode==='proof'?'veryfast':'medium','-crf',mode==='proof'?'22':'18','-pix_fmt','yuv420p','-threads','4',silent];
  const proc=spawn('ffmpeg',args,{stdio:['pipe','inherit','inherit']});
  const completion=new Promise((res,rej)=>{proc.on('error',rej);proc.on('exit',code=>code===0?res():rej(Error('FFmpeg exit '+code)))});
  const layout={frames:FRAMES,textPlacementsChecked:0,violations:[],policy:'Main film typography: x >= 72, right <= 900, y >= 180, y + font size <= 1540. Decorative shapes excluded. Embedded captures reviewed visually.'};
  for(let f=0;f<FRAMES;f++){
    c.save();c.scale(scale,scale);await frame(c,f/FPS);c.restore();
    for(const box of measured){layout.textPlacementsChecked++;if(box.x<72||box.x+box.width>900.5||box.y<180||box.y+box.size>1540.5)layout.violations.push({frame:f,...box});}
    if(!proc.stdin.write(cv.data()))await once(proc.stdin,'drain');
    if(f%90===0)console.log(mode+': '+f+'/'+FRAMES);
  }
  proc.stdin.end();await completion;
  if(layout.violations.length)throw Error('Film text safe-area violations: '+JSON.stringify(layout.violations.slice(0,3)));
  fs.writeFileSync(path.join(DIR,mode+'-layout-check.json'),JSON.stringify(layout,null,2)+'\n');
  }
  run(['-y','-i',silent,'-i',path.join(A,'original-soundtrack.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-af',normalizedAudioFilter(),'-t','20','-movflags','+faststart','-metadata','title=NextCustomer — You run the business','-metadata','comment=Original motion and sound. Actual local Starter Kit UI and exports. Illustrative business.',out]);
  await contact(out,mode);await thumbnail();
  fs.writeFileSync(path.join(DIR,'timeline.json'),JSON.stringify({fps:FPS,frames:FRAMES,duration:20,palette:{cream:P,ink:I,orange:O},safeArea:{left:72,right:900,top:180,bottom:1540},segments:[['hook',0,3],['real-session',3,7],['post',7,9.4],['story',9.4,12],['copy',12,15],['spanish',15,16],['cta',16,20]]},null,2)+'\n');
  console.log(out);
}
main().catch(e=>{console.error(e);process.exit(1)});
