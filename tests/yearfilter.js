/* ══════════════════════════════════════════════════════════════
   ПРОФАЙЛ — ОНЫ ШУДРАХ ДУГУЙ

   Хэсгийн нэрийн баруун талд байрлах жижиг wheel — тухайн он авто
   таарч, бүртгэл хийсэн онуудаар дээш/доош шудрахад байна. Шудрахад
   ШУУД шүүхгүй — Батлах товч дарсны дараа л Дэр БОЛОН Сум хоёулангийн
   жагсаалт сонгосон оны паспортыг л үзүүлнэ. Энэ бол ХАРАГДАЦЫН
   шүүлтүүр төдий — огноогоор ухарч хайдаг resolveReplMap/
   swResolveDRepl-д НӨЛӨӨЛӨХГҮЙ.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true)});

/* ── 1. Онуудын жагсаалт — зөвхөн бодит паспорттой + энэ жил ── */
console.log('\nОнуудын жагсаалт');
const yrs=await page.evaluate(()=>{
  DB.folders[1].year='2025';DB.folders[1].name='2025 паспорт';saveDB();
  return{opts:_profYearOptions(),thisYear:String(new Date().getFullYear())}});
ok('"Бүгд" эхэнд, дараа нь бодит онууд',
   yrs.opts[0]==='Бүгд'&&yrs.opts.includes('2025')&&yrs.opts.includes('2026'),
   JSON.stringify(yrs.opts));
ok('Энэ жил (2026) байхгүй байсан ч автоматаар нэмэгддэг',
   yrs.opts.includes(yrs.thisYear),JSON.stringify(yrs.opts));

/* ── 2. Дэрийн жагсаалт ── */
console.log('\nДэрийн жагсаалт');
const der=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  const before=[...document.querySelectorAll('#foldersGrid .folder-name')].map(e=>e.textContent.trim());
  openProfSheet();await new Promise(r=>setTimeout(r,300));
  const auto=_pfYearPending;
  const el=document.getElementById('pfYearWheel');
  const opts=_profYearOptions(),idx=opts.indexOf('2025');
  el.scrollTop=idx*_WH_IH;el.dispatchEvent(new Event('scroll'));
  await new Promise(r=>setTimeout(r,260));
  const pendingAfterScroll=_pfYearPending;
  const stillFullList=[...document.querySelectorAll('#foldersGrid .folder-name')].map(e=>e.textContent.trim());
  confirmYearFilter();await new Promise(r=>setTimeout(r,260));
  const afterConfirm=[...document.querySelectorAll('#foldersGrid .folder-name')].map(e=>e.textContent.trim());
  return{before,auto,pendingAfterScroll,stillFullList,afterConfirm,filter:_yearFilter,
    sheetClosed:!document.getElementById('profSheet').classList.contains('open')}});
ok('Профайл нээхэд энэ жил (2026) авто таарна',der.auto==='2026',der.auto);
ok('Шудрахад ГАНЦААРАА жагсаалт хэвээрээ (шүүгдэхгүй)',
   der.stillFullList.length===2,JSON.stringify(der.stillFullList));
ok('Батлах товч дарсны дараа зөвхөн 2025 оны паспорт үлдэнэ',
   der.afterConfirm.length===1&&/2025/.test(der.afterConfirm[0]),
   JSON.stringify(der.afterConfirm));
ok('Батлахад профайл цэс хаагдана',der.sheetClosed,String(der.sheetClosed));

/* ── 3. Сумын жагсаалт ч мөн адил шүүгдэнэ ── */
console.log('\nСумын жагсаалт');
const sw=await page.evaluate(async()=>{
  DB.sw=[
    {id:'sw25',name:'2025 сум',season:'хавар',year:'2025',date:'2025-04-01',sc:'ПЧ-1',turnouts:[],inc:[]},
    {id:'sw26',name:'2026 сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',turnouts:[],inc:[]}
  ];swFolderId=null;saveDB();
  goSwHome();await new Promise(r=>setTimeout(r,300));
  return{cards:[...document.querySelectorAll('#swFolders .folder-name')].map(e=>e.textContent.trim())}});
ok('_yearFilter=2025 идэвхтэй үед сумын жагсаалт ч шүүгдэнэ',
   sw.cards.length===1&&/2025/.test(sw.cards[0]),JSON.stringify(sw.cards));

/* ── 4. "Бүгд" сонгоход шүүлтүүр цуцлагдана ── */
console.log('\n"Бүгд" — цуцлах');
const clr=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  openProfSheet();await new Promise(r=>setTimeout(r,300));
  const el=document.getElementById('pfYearWheel');
  el.scrollTop=0;el.dispatchEvent(new Event('scroll'));
  await new Promise(r=>setTimeout(r,260));
  confirmYearFilter();await new Promise(r=>setTimeout(r,260));
  const der=[...document.querySelectorAll('#foldersGrid .folder-name')].map(e=>e.textContent.trim());
  goSwHome();await new Promise(r=>setTimeout(r,300));
  const sw=[...document.querySelectorAll('#swFolders .folder-name')].map(e=>e.textContent.trim());
  return{filter:_yearFilter,der,sw}});
ok('_yearFilter null болно',clr.filter===null,String(clr.filter));
ok('Дэрийн жагсаалт бүхэлдээ сэргэнэ',clr.der.length===2,JSON.stringify(clr.der));
ok('Сумын жагсаалт ч бүхэлдээ сэргэнэ',clr.sw.length===2,JSON.stringify(clr.sw));

/* ── 5. Огноогоор ухарч хайдаг логикт нөлөөлдөггүй (аюулгүй) ── */
console.log('\nОгноогоор ухарч хайхад нөлөөлдөггүй');
const safe=await page.evaluate(()=>{
  DB.sw=[
    {id:'sw25',name:'2025 сум',season:'хавар',year:'2025',date:'2025-04-01',sc:'ПЧ-1',
      turnouts:[{id:'t25',num:7,mak:'Р-65',mark:'1/9',head:2,it:'nnnnnn',
        dRepl:{2:{d:'2025-06-01',t:'normal',m:'wood'}}}]},
    {id:'sw26',name:'2026 сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',
      turnouts:[{id:'t26',num:7,mak:'Р-65',mark:'1/9',head:2,it:'nnnnnn',dRepl:{}}]}
  ];saveDB();
  _yearFilter='2026';                 // 2025 паспортыг ЖАГСААЛТААС нуусан ч
  swFolderId='sw26';swTurnoutId='t26';
  const map=swResolveDRepl(swTurnout());
  _yearFilter=null;
  return{map}});
ok('2025 паспорт жагсаалтаас нуугдсан ч уламжилсан огноог олдог хэвээр',
   !!(safe.map[2]&&safe.map[2].rec&&safe.map[2].rec.d==='2025-06-01'&&!safe.map[2].own),
   JSON.stringify(safe.map));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
