/* Exercise real-time browser playback. No production service is contacted. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
async function main(){
  const root=__dirname;
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/review.html':pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    const stat=fs.statSync(file);let start=0,end=stat.size-1,status=200;
    const range=req.headers.range&&req.headers.range.match(/^bytes=(\d+)-(\d*)$/);
    if(range){start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
    res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
    const ext=path.extname(file);res.setHeader('Content-Type',ext==='.mp4'?'video/mp4':ext==='.png'?'image/png':ext==='.html'?'text/html':'text/plain');
    res.writeHead(status);fs.createReadStream(file,{start,end}).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const resultsFile=path.join(root,'browser-playback.json');
  const results=fs.existsSync(resultsFile)?JSON.parse(fs.readFileSync(resultsFile)):{};
  try{
    for(const kind of (process.argv[2]?[process.argv[2]]:['proof','final'])){
      const page=await browser.newPage({viewport:{width:360,height:800}});
      await page.goto('http://127.0.0.1:'+server.address().port+'/review.html');
      const selector='#'+kind;await page.locator(selector).scrollIntoViewIfNeeded();
      await page.locator(selector).evaluate(v=>{v.currentTime=0;return v.play()});
      await page.waitForFunction(sel=>document.querySelector(sel).ended,selector,{timeout:30000});
      const report=await page.locator(selector).evaluate(v=>({
        ended:v.ended,duration:v.duration,currentTime:v.currentTime,width:v.videoWidth,height:v.videoHeight,
        error:v.error?{code:v.error.code,message:v.error.message}:null,
        audio:('webkitAudioDecodedByteCount' in v)?v.webkitAudioDecodedByteCount:null,
        playbackQuality:v.getVideoPlaybackQuality().toJSON?.()||{totalVideoFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedVideoFrames:v.getVideoPlaybackQuality().droppedVideoFrames}
      }));
      report.viewport={width:360,height:800};report.method='Continuous 1x playback from 0 to ended in Chromium; audio enabled. Automated decoding check, not a human listening test.';
      if(!report.ended||report.error||Math.abs(report.duration-20)>.06)throw Error('Playback failed: '+JSON.stringify(report));
      results[kind]=report;fs.writeFileSync(resultsFile,JSON.stringify(results,null,2)+'\n');
      console.log(kind,JSON.stringify(report));await page.close();
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exit(1)});
