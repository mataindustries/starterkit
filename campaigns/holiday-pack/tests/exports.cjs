const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.addInitScript(()=>{window.__ENM_NO_APP=true});
await p.goto('http://127.0.0.1:8765/');await p.waitForFunction(()=>window.ENMStarter);await p.evaluate(()=>window.ENMStarter.fontsReady);
const jobs=[
 // [file, season, tpl, W,H, lang, service, name, area, phone, handle, img, pal]
 ['thanks-post-editorial-en','thanks',0,1080,1350,'en','cleaning','Bright Path Cleaning','Glendora','6265550142','',null,2],
 ['thanks-story-editorial-es','thanks',0,1080,1920,'es','cleaning','Limpieza Brillante','Glendora','6265550142','',null,2],
 ['thanks-post-poster-es','thanks',1,1080,1350,'es','landscaping','Jardinería Arroyo','Pasadena','6265550113','arroyoyards',null,0],
 ['thanks-post-grid-en','thanks',2,1080,1350,'en','detailing','Foothill Mobile Detail','Azusa','6265550187','',null,4],
 ['shop-post-poster-en','shop',1,1080,1350,'en','handyman','Mata Home Repair','West Covina','6265550199','matahomerepair',null,3],
 ['shop-story-grid-es','shop',2,1080,1920,'es','cleaning','Limpieza Brillante','Glendora','6265550142','limpiezabrillante',null,1],
 ['shop-post-editorial-es','shop',0,1080,1350,'es','pressure','Lavado Valle','San Dimas','6265550160','',null,0],
 ['shop-story-poster-en','shop',1,1080,1920,'en','landscaping','Arroyo Yard Care','Pasadena','6265550113','arroyoyards',null,1],
 ['ready-post-editorial-en-cleaning','ready',0,1080,1350,'en','cleaning','Bright Path Cleaning','Glendora','6265550142','',null,2],
 ['ready-post-poster-es-detailing','ready',1,1080,1350,'es','detailing','Detallado Foothill','Azusa','6265550187','',null,3],
 ['ready-story-grid-en-landscaping','ready',2,1080,1920,'en','landscaping','Arroyo Yard Care','Pasadena','6265550113','arroyoyards',null,1],
 ['ready-story-editorial-es-cleaning','ready',0,1080,1920,'es','cleaning','Limpieza Brillante','Glendora','6265550142','',null,4],
 ['ready-post-editorial-en-photo','ready',0,1080,1350,'en','detailing','Foothill Mobile Detail','Azusa','6265550187','','photo',3],
 ['thanks-post-poster-en-photo','thanks',1,1080,1350,'en','landscaping','Arroyo Yard Care','Pasadena','6265550113','','photo',1],
 ['shop-post-grid-es-photo','shop',2,1080,1350,'es','cleaning','Limpieza Brillante','Glendora','6265550142','','photo',2],
 ['shop-post-poster-en-logo','shop',1,1080,1350,'en','pressure','Valley Wash Co','San Dimas','6265550160','','logo',0],
];
for(const j of jobs){const data=await p.evaluate(j=>{const[file,season,tpl,W,H,lang,service,name,area,phone,handle,img,pal]=j;const A=window.ENMStarter;
  let im=null;if(img==='photo'){im=document.createElement('canvas');im.width=1600;im.height=1200;const c=im.getContext('2d');const g=c.createLinearGradient(0,0,0,1200);g.addColorStop(0,'#b9cfd8');g.addColorStop(.55,'#dfe6e2');g.addColorStop(.56,'#5d7a45');g.addColorStop(1,'#32502a');c.fillStyle=g;c.fillRect(0,0,1600,1200);
    c.fillStyle='#e9e1d2';c.fillRect(420,380,760,320);c.fillStyle='#7a4a33';c.beginPath();c.moveTo(380,390);c.lineTo(800,190);c.lineTo(1220,390);c.fill();c.fillStyle='#3b4c5a';c.fillRect(560,500,120,110);c.fillRect(920,500,120,110);c.fillStyle='#5b3a28';c.fillRect(760,520,90,180);c.fillStyle='#8f8f88';c.fillRect(0,860,1600,90)}
  if(img==='logo'){im=document.createElement('canvas');im.width=im.height=600;const c=im.getContext('2d');c.fillStyle='#1d4b6a';c.beginPath();c.arc(300,300,260,0,7);c.fill();c.fillStyle='#fff';c.font='700 260px sans-serif';c.textAlign='center';c.fillText('VW',300,390)}
  const d=A.deriveData(Object.assign({},A.DEF,{season,tpl,lang,service,name,area,phone,handle,pal,kind:img==='logo'?'logo':'photo'}),im);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;A.render(cv.getContext('2d'),W,H,d,tpl);return cv.toDataURL('image/png')},j);
  fs.writeFileSync(`${OUT}/${j[0]}.png`,Buffer.from(data.split(',')[1],'base64'))}
await b.close()})();
