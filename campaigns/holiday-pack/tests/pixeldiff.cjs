const {chromium}=require('playwright');
async function renders(b,url){const p=await b.newPage();await p.addInitScript(()=>{window.__ENM_NO_APP=true});await p.goto(url);
 await p.waitForFunction(()=>window.ENMStarter);await p.evaluate(()=>window.ENMStarter.fontsReady);
 const out=await p.evaluate(()=>{const A=window.ENMStarter,r=[];
  const photo=document.createElement('canvas');photo.width=1200;photo.height=900;{const c=photo.getContext('2d');c.fillStyle='#7a9';c.fillRect(0,0,1200,900);c.fillStyle='#fed';c.fillRect(300,300,500,300)}
  for(const lang of['en','es'])for(const service of A.ORDER)for(let t=0;t<3;t++)for(const[W,H]of[[1080,1350],[1080,1920]])for(const img of[null,photo]){
   const d=A.deriveData(Object.assign({},A.DEF,{lang,service,name:'Bright Path',area:'Glendora',phone:'6265550142',handle:'bp',other:'pool cleaning'}),img);
   const cv=document.createElement('canvas');cv.width=W;cv.height=H;A.render(cv.getContext('2d'),W,H,d,t);r.push(cv.toDataURL())}
  const cv=document.createElement('canvas');cv.width=1080;cv.height=1350;A.tBA(cv.getContext('2d'),A.deriveData(Object.assign({},A.DEF,{name:'X'}),null),photo,photo);r.push(cv.toDataURL());return r});
 await p.close();return out}
(async()=>{const b=await chromium.launch();const a=await renders(b,'http://127.0.0.1:8765/index.html'),m=await renders(b,'http://127.0.0.1:8766/index.html');
 const diff=a.filter((x,i)=>x!==m[i]).length;console.log(`${a.length} everyday renders compared, ${diff} differ from main`);await b.close();process.exit(diff?1:0)})();
