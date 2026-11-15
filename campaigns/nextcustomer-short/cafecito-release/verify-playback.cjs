// Continuous real-time browser decoding of both encoded deliverables with audio enabled.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http'), crypto=require('node:crypto');
const {chromium}=require('playwright');
async function main(){
  const root=__dirname;
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    const stat=fs.statSync(file);let start=0,end=stat.size-1,status=200;
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){start=+range[1];if(range[2])end=Math.min(end,+range[2]);status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
    res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
    res.setHeader('Content-Type',file.endsWith('.mp4')?'video/mp4':file.endsWith('.html')?'text/html':'text/plain');
    res.writeHead(status);fs.createReadStream(file,{start,end}).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
    const page=await browser.newPage({viewport:{width:412,height:915}});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${server.address().port}/review.html`);
    const results=[];
    for(const id of ['proof','release']){
      const video=page.locator('#'+id);await video.scrollIntoViewIfNeeded();
      await video.evaluate(v=>{v.muted=false;v.volume=1;v.playbackRate=1;return v.play();});
      await page.waitForFunction(id=>document.getElementById(id).ended,id,{timeout:30000});
      const result=await video.evaluate(v=>({src:v.getAttribute('src'),ended:v.ended,currentTime:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,volume:v.volume,playbackRate:v.playbackRate,error:v.error?{code:v.error.code,message:v.error.message}:null,audioDecodedBytes:v.webkitAudioDecodedByteCount,totalFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedFrames:v.getVideoPlaybackQuality().droppedVideoFrames}));
      result.sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,result.src))).digest('hex');
      result.seeks=[];
      for(const frame of [140,167,174,210,227,282,299,360,450,456,480,599]){
        await video.evaluate((v,n)=>new Promise(resolve=>{v.onseeked=resolve;v.currentTime=n/30}),frame);
        result.seeks.push({frame,actualSeconds:await video.evaluate(v=>v.currentTime)});
      }
      result.pass=result.ended&&!result.error&&result.duration===20&&result.totalFrames===600&&result.droppedFrames===0&&result.audioDecodedBytes>0&&!result.muted;
      results.push(result);
    }
    const report={status:results.every(r=>r.pass)&&!errors.length?'PASS':'FAIL',browserVersion:browser.version(),viewport:{width:412,height:915},errors,results,method:'Continuous 1x unmuted desktop Chromium playback followed by anchor seeks. No human listening or physical Android-device test claimed.'};
    fs.writeFileSync(path.join(root,'browser-playback.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    if(report.status!=='PASS')throw Error('Playback QA failed');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
