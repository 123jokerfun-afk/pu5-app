/* ══════════════════════════════════════════════════════════════
   УТСАНД СУУЛГАХ (PWA)

   v110 хүртэл manifest нь blob: хаягаар үүсгэгддэг байв. Хөтөч
   суулгах шалгуурт manifest-ийг НЭГ ГАРЛЫН жинхэнэ файл байхыг
   шаарддаг тул апп хэзээ ч суугддаггүй байсан. Дүрс нь мөн SVG
   data: URI байсныг Android хүлээж авдаггүй.
   ══════════════════════════════════════════════════════════════ */
const fs=require('fs'),path=require('path');
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const ROOT=path.join(__dirname,'..');

/* ── Эх кодын шалгалт ── */
const H=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
ok('manifest нь жинхэнэ файл (blob: биш)',
   /<link rel="manifest" href="manifest\.webmanifest">/.test(H)
   &&!/rel='manifest'|rel="manifest"[^>]*blob/.test(H)
   &&!/createObjectURL\(blob\);document\.head/.test(H));
for(const f of ['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'])
  ok(f+' байна',fs.existsSync(path.join(ROOT,f)));
const M=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
ok('start_url ба scope харьцангуй',M.start_url==='./'&&M.scope==='./',
   JSON.stringify([M.start_url,M.scope]));
ok('display: standalone',M.display==='standalone',M.display);
const sizes=(M.icons||[]).map(i=>i.sizes);
ok('192 ба 512 дүрс бий',sizes.includes('192x192')&&sizes.includes('512x512'),
   JSON.stringify(sizes));
ok('Бүх дүрс PNG (Android SVG хүлээж авдаггүй)',
   (M.icons||[]).every(i=>i.type==='image/png'),
   JSON.stringify((M.icons||[]).map(i=>i.type)));
ok('maskable дүрс бий',(M.icons||[]).some(i=>/maskable/.test(i.purpose||'')));
// PNG-ийн толгойгоос бодит хэмжээг уншина
const png=f=>{const b=fs.readFileSync(path.join(ROOT,f));
  return {sig:b.slice(1,4).toString()==='PNG',w:b.readUInt32BE(16),h:b.readUInt32BE(20)}};
const p192=png('icon-192.png'),p512=png('icon-512.png');
ok('icon-192.png үнэхээр 192×192 PNG',p192.sig&&p192.w===192&&p192.h===192,
   JSON.stringify(p192));
ok('icon-512.png үнэхээр 512×512 PNG',p512.sig&&p512.w===512&&p512.h===512,
   JSON.stringify(p512));

(async()=>{
const br=await B.launch();
const base=await B.ensureServer();

/* ── 1. Хөтөч manifest ба дүрсийг татаж чадах уу ── */
const {page,errs}=await B.newPage(br,B.DEVICES[5]);   // Pixel — Android UA
await page.waitForTimeout(600);
const net=await page.evaluate(async()=>{
  const out={};
  for(const u of ['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png']){
    try{const r=await fetch(u);out[u]=r.ok}catch(e){out[u]=false}}
  const l=document.querySelector('link[rel=manifest]');
  out.href=l?l.getAttribute('href'):null;
  return out});
ok('Холбоос manifest.webmanifest руу заана',net.href==='manifest.webmanifest',net.href);
ok('Манифест ба гурван дүрс татагдана',
   Object.keys(net).filter(k=>k!=='href').every(k=>net[k]===true),JSON.stringify(net));

/* ── 2. Android — хөтчийн суулгах цонхыг дуудна ── */
const and=await page.evaluate(async()=>{
  const box=document.getElementById('pwaBox');
  const hidden0=getComputedStyle(box).display==='none';
  let prompted=false;
  const ev=new Event('beforeinstallprompt');
  ev.prompt=()=>{prompted=true};
  Object.defineProperty(ev,'userChoice',{value:Promise.resolve({outcome:'accepted'})});
  dispatchEvent(ev);
  await new Promise(r=>setTimeout(r,200));
  const btn=box.querySelector('.pwa-btn');
  const shown=getComputedStyle(box).display!=='none';
  const txt=btn?btn.textContent.trim():'';
  if(btn)btn.click();
  await new Promise(r=>setTimeout(r,350));
  return {hidden0,shown,txt,prompted,after:getComputedStyle(box).display}});
ok('Android: урилга ирэхээс өмнө товч алга',and.hidden0);
ok('Android: урилга ирэхэд товч гарна',and.shown&&/суулгах/i.test(and.txt),and.txt);
ok('Android: дарахад хөтчийн цонх дуудагдана',and.prompted);
ok('Android: суулгасны дараа товч алга болно',and.after==='none',and.after);
await page.close();

/* ── 3. iOS — API байхгүй тул заавар ── */
const {page:pi}=await B.newPage(br,B.DEVICES[1]);     // iPhone UA
await pi.waitForTimeout(600);
const ios=await pi.evaluate(async()=>{
  const box=document.getElementById('pwaBox');
  const btn=box.querySelector('.pwa-btn');
  const r={shown:getComputedStyle(box).display!=='none',
    hint:(box.querySelector('.pwa-hint')||{}).textContent||''};
  btn.click();await new Promise(x=>setTimeout(x,400));
  r.modal=document.getElementById('pwaModal').classList.contains('open');
  r.steps=[...document.querySelectorAll('#pwaSteps .pwa-step')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim());
  return r});
ok('iOS: урилгагүй ч товч гарна',ios.shown);
ok('iOS: сануулга Safari-гийн замыг заана',
   /Хуваалцах/.test(ios.hint)&&/Нүүр дэлгэц/.test(ios.hint),JSON.stringify(ios.hint));
ok('iOS: дарахад заавар нээгдэнэ',ios.modal===true);
ok('iOS: гурван алхам бичигдсэн',ios.steps.length===3,JSON.stringify(ios.steps));
ok('iOS: "Нүүр дэлгэцэд нэмэх" гэж заасан',
   ios.steps.some(s=>/Нүүр дэлгэцэд нэмэх/.test(s)),JSON.stringify(ios.steps[1]));
await pi.close();

/* ── 4. Аль хэдийн суулгасан бол юу ч харуулахгүй ── */
const ctx=await br.newContext({viewport:{width:390,height:844},isMobile:true,
  userAgent:B.DEVICES[1].ua});
await ctx.addInitScript(()=>{Object.defineProperty(navigator,'standalone',{get:()=>true})});
await ctx.addInitScript(B.STUB);
const p2=await ctx.newPage();
await p2.goto(base+'/index.html',{waitUntil:'load'});
await p2.waitForTimeout(900);
const ins=await p2.evaluate(()=>({i:_pwaInstalled(),
  d:getComputedStyle(document.getElementById('pwaBox')).display}));
ok('Суулгасан үед илэрнэ',ins.i===true);
ok('Суулгасан үед товч харагдахгүй',ins.d==='none',ins.d);
await ctx.close();

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
