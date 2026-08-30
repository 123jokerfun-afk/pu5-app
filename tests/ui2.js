// Доод таб, хуудсууд, алдаа харуулагч, хувилбарын харагдац
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);

// ── Алдаа харуулагч (нэвтрэхээс өмнө) ──
ok('Хэвийн үед алдааны мөр алга',await page.evaluate(()=>!document.getElementById('__errbar')));
await page.evaluate(()=>{setTimeout(()=>{null.boom()},5)});
await page.waitForTimeout(400);
const bar=await page.evaluate(()=>{const d=document.getElementById('__errbar');
  return d?{t:d.textContent.slice(0,60),z:+getComputedStyle(d).zIndex}:null});
ok('JS алдаа дэлгэц дээр гарав',!!bar&&/Аппын алдаа/.test(bar.t),bar&&bar.t);
ok('Интро дэлгэцээс дээр',!!bar&&bar.z>9999,bar&&bar.z);
await page.evaluate(()=>{const d=document.getElementById('__errbar');if(d)d.remove()});

await B.login(page,'ПД-6'); await S.seed(page);

// ── Хувилбар: хэрэглэгчид зөвхөн дугаар ──
const ver=await page.evaluate(()=>({v:appVer(),build:APP_BUILD,
  tag:(document.querySelector('.build-tag')||{}).textContent||''}));
ok('appVer богино хэлбэртэй',/^v\d+$/.test(ver.v),ver.v+'  (APP_BUILD='+ver.build+')');
ok('Огноо харагдахгүй',!/20\d\d/.test(ver.v),ver.v);
ok('Нүүрэн дээрх тэмдэг мөн адил',ver.tag===ver.v,JSON.stringify(ver.tag));
const pv=await page.evaluate(()=>{openProfSheet();
  const b=document.getElementById('profBody');
  const t=(b.querySelector('.build-tag')||{}).textContent||'';
  closeModal('profSheet');return t});
ok('Профайл дээр "Хувилбар vN"',/^Хувилбар v\d+$/.test(pv),pv);

// ── Доод таб ──
const tb=await page.evaluate(()=>{
  const bar=document.getElementById('tabbar');
  return {shown:getComputedStyle(bar).display!=='none',
    n:bar.querySelectorAll('.tab-b').length,
    labels:[...bar.querySelectorAll('.tab-b')].map(b=>{
      const sp=[...b.querySelectorAll('span')].filter(x=>!x.classList.contains('tab-dot'));
      return sp.length?sp[sp.length-1].textContent:''})}});
ok('Таб харагдав',tb.shown&&tb.n===5,'мөр='+tb.n);
ok('5 таб зөв нэртэй',
  JSON.stringify(tb.labels.slice(0,5))==='["Нүүр","Паспорт","Сумууд","Мэдэгдэл","Профайл"]',
  JSON.stringify(tb.labels));

const nav=await page.evaluate(async()=>{
  const cur=()=>(document.querySelector('.view.active')||{}).id;
  const out={};
  goTab('sw');   await new Promise(r=>setTimeout(r,400)); out.sw=cur();
  out.swMark=document.getElementById('tabSw').getAttribute('aria-current');
  goTab('home'); await new Promise(r=>setTimeout(r,400)); out.home=cur();
  out.homeMark=document.getElementById('tabHome').getAttribute('aria-current');
  return out});
ok('Сумууд таб → СШ нүүр',nav.sw==='swHomeView'&&nav.swMark==='true',JSON.stringify(nav));
ok('Нүүр таб → дэр нүүр',nav.home==='homeView'&&nav.homeMark==='true');

const sheets=await page.evaluate(async()=>{
  goTab('sync'); await new Promise(r=>setTimeout(r,300));
  const s=document.getElementById('syncSheet').classList.contains('open');
  const txt=document.getElementById('syncBody').textContent;
  closeModal('syncSheet');
  goTab('prof'); await new Promise(r=>setTimeout(r,300));
  const p=document.getElementById('profSheet').classList.contains('open');
  const ptxt=document.getElementById('profBody').textContent;
  closeModal('profSheet');
  return {s,p,meter:/Хамгийн том хэсэг/.test(txt),
    noTest:!/Эрхийг туршиж|Асаалттай|Унтраалттай/.test(txt),
    diag:/Үүлэн дэх бичлэгийг шалгах/.test(ptxt)}});
ok('Мэдэгдэл нээгдэв',sheets.s);
ok('Хэмжигч харагдав',sheets.meter);
ok('Туршилтын мөрүүд УСТСАН',sheets.noTest);
ok('Профайл нээгдэв',sheets.p);
ok('Оношилгоо Профайл дээр',sheets.diag);

// Бүртгэлийн дэлгэц дээр таб нуугдана (хуруунд зай хэрэгтэй)
const hid=await page.evaluate(async()=>{
  openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);
  await new Promise(r=>setTimeout(r,600));
  const b=document.getElementById('tabbar');
  const r=b.getBoundingClientRect();
  const o={top:Math.round(r.top),vh:innerHeight,pe:getComputedStyle(b).pointerEvents};
  goHome(); return o});
/* v105-аас хойш таб нь display:none биш, ДООШ ГУЛСАЖ далдардаг
   (шилжилтийг харуулахын тулд). Тиймээс "яаж" нуугдсаныг биш,
   үнэхээр дэлгэцнээс гарсан бөгөөд дарагдахгүй болсныг шалгана. */
ok('Бүртгэлийн дэлгэц дээр таб дэлгэцнээс гарав',hid.top>=hid.vh,'дээд='+hid.top+' vh='+hid.vh);
ok('Гулссан таб дарагдахгүй',hid.pe==='none',hid.pe);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE|boom/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
