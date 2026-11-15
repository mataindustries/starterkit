const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
async function main(){
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    const stat=fs.statSync(file);let start=0,end=stat.size-1,status=200;
    const range=req.headers.range&&req.headers.range.match(/^bytes=(\d+)-(\d*)$/);
    if(range){start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
    res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
    const types={'.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.png':'image/png','.html':'text/html'};
    res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.writeHead(status);fs.createReadStream(file,{start,end}).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  try{
    const page=await browser.newPage({viewport:{width:412,height:915}});
    await page.goto('http://127.0.0.1:'+server.address().port+'/audio-sync-v2/review.html');
    await page.locator('#revision').scrollIntoViewIfNeeded();
    await page.locator('#revision').evaluate(v=>v.play());
    await page.waitForFunction(()=>document.querySelector('#revision').ended,null,{timeout:30000});
    const report=await page.locator('#revision').evaluate(v=>({ended:v.ended,currentTime:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?{code:v.error.code,message:v.error.message}:null,audioDecodedBytes:v.webkitAudioDecodedByteCount,totalFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedFrames:v.getVideoPlaybackQuality().droppedVideoFrames}));
    // Inspect the live review player at actual cut/landing positions after continuous playback.
    const checks=[];
    for(const frame of [18,26,34,167,210,227,282,299,368,376,456,480]){
      await page.locator('#revision').evaluate((v,n)=>new Promise(resolve=>{v.onseeked=()=>resolve();v.currentTime=n/30}),frame);
      checks.push({frame,actualSeconds:await page.locator('#revision').evaluate(v=>v.currentTime)});
    }
    const file=path.join(__dirname,'nextcustomer_audio_sync_v2_proof_540x960.mp4');
    report.proofSha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    report.seekChecks=checks;report.method='Continuous 1x browser playback with audio enabled, followed by seeks to 12 AV anchors. This is not human listening or a physical output-device test.';
    if(!report.ended||report.error||report.duration!==20||report.totalFrames!==600)throw Error(JSON.stringify(report));
    fs.writeFileSync(path.join(__dirname,'browser-playback.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exit(1)});
