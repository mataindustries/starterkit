const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();
await p.addInitScript(()=>{window.__shared=[];navigator.canShare=o=>!!(o&&o.files);navigator.share=async o=>{const f=o.files[0];window.__shared.push([f.name,f.type,f.size,"text" in o])};
  localStorage.setItem('enm-starter-v1',JSON.stringify({lang:"en",name:"Arroyo Yard Care",service:"landscaping",area:"Pasadena",phone:"6265550113",screen:"kit",tab:"g",tpl:2,season:"shop"}))});
await p.goto('http://127.0.0.1:8765/');await p.waitForTimeout(1500);
await p.click('[data-share=post]');await p.waitForTimeout(500);await p.click('[data-share=story]');await p.waitForTimeout(500);
const s=await p.evaluate(()=>window.__shared);console.log(JSON.stringify(s));
const ok=s.length===2&&s[0][0]==='arroyo-yard-care-post-shop-small-grid.png'&&s[1][0]==='arroyo-yard-care-story-shop-small-grid.png'&&s.every(x=>x[1]==='image/png'&&x[2]>20000&&!x[3]);
console.log(ok?'native share: PASS':'native share: FAIL');await b.close();process.exit(ok?0:1)})();
