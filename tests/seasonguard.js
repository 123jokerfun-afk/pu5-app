/* ══════════════════════════════════════════════════════════════
   ИЖИЛ ОН+УЛИРЛЫН ДАВХАРДСАН ПАСПОРТ — хориглоно

   Хогийн сангийн паспортыг СЭРГЭЭДЭГГҮЙ болсон тул (trash.js-ийг үз)
   идэвхтэй паспорт үргэлж season+year-ээр өвөрмөц байх ёстой — рам
   замын дэрийг дэр↔сум паспорт хооронд улирлаар зөв хослуулах
   архитектур үүн дээр тулгуурална. Хоёр давхаргатай хамгаалалт:
   (1) "Паспорт нэмэх" цонхны Улирал сонголтоос ашигласан хослолыг
       идэвхгүй/нуугдсан болгоно, (2) addFolder()/addSwFolder() дотор
       нөөц шалгалт.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
await page.evaluate(()=>{window.appConfirm=()=>Promise.resolve(true)});

// ── Дэр: хавар/2026 аль хэдийн байна ──
await page.evaluate(()=>{
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',tracks:[]}];
  DB.sw=[{id:'sf1',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',turnouts:[]}];
  saveDB();
});

// 1. seasonYearTaken() цэвэр функц
const taken=await page.evaluate(()=>({
  der:seasonYearTaken(DB.folders,'хавар','2026'),
  derOther:seasonYearTaken(DB.folders,'намар','2026'),
  derYr:seasonYearTaken(DB.folders,'хавар','2027'),
  sw:seasonYearTaken(DB.sw,'хавар','2026')
}));
ok('seasonYearTaken: хавар/2026 дэр авсан гэж үзнэ',taken.der===true,JSON.stringify(taken));
ok('seasonYearTaken: намар/2026 чөлөөтэй',taken.derOther===false,JSON.stringify(taken));
ok('seasonYearTaken: хавар/2027 чөлөөтэй (өөр он)',taken.derYr===false,JSON.stringify(taken));
ok('seasonYearTaken: сум талд мөн адил',taken.sw===true,JSON.stringify(taken));

// 2. "Паспорт нэмэх" цонх нээхэд Улирал сонголтоос авсан хослол хасагдана
const sel=await page.evaluate(()=>{
  openAddFolder(0);
  const opt=o=>({val:o.value,disabled:o.disabled,hidden:o.hidden,text:o.textContent});
  return {
    season:document.getElementById('afSeason').value,
    options:Array.from(document.getElementById('afSeason').options).map(opt)
  }
});
ok('2026 онд "хавар" автоматаар сонгогдохгүй (аль хэдийн байгаа)',sel.season!=='хавар',sel.season);
const havarOpt=sel.options.find(o=>o.val==='хавар');
ok('"хавар" сонголт идэвхгүй+нуугдсан болно',havarOpt.disabled&&havarOpt.hidden,JSON.stringify(havarOpt));
const namarOpt=sel.options.find(o=>o.val==='намар');
ok('"намар" сонголт хэвээр идэвхтэй',!namarOpt.disabled&&!namarOpt.hidden,JSON.stringify(namarOpt));

// 3. Он өөрчлөхөд дахин шалгагдана (жишээ 2027 бол бүгд чөлөөтэй)
const sel2027=await page.evaluate(()=>{
  document.getElementById('afYear').value='2027';
  updateFolderName();
  return Array.from(document.getElementById('afSeason').options).map(o=>o.disabled)
});
ok('Он 2027 болгоход бүх улирал дахин чөлөөлөгдөнө',sel2027.every(d=>!d),JSON.stringify(sel2027));

// 4. Нөөц хамгаалалт: UI-г тойрч шууд addFolder() дуудахад ч хориглоно
const guard=await page.evaluate(()=>{
  const before=DB.folders.length;
  document.getElementById('afSeason').value='хавар';   // UI-г тойрч шууд оруулав
  document.getElementById('afYear').value='2026';
  document.getElementById('afName').value='Хавар 2026 (давхардсан)';
  addFolder();
  return {before,after:DB.folders.length,modalOpen:_modalOpen('addFolderModal')}
});
ok('Давхардсан (хавар,2026) дэр паспорт нэмэгдээгүй',guard.before===guard.after,JSON.stringify(guard));
ok('Цонх хаагдаагүй (татгалзсан тул)',guard.modalOpen===true,JSON.stringify(guard));
await page.evaluate(()=>closeModal('addFolderModal'));

// 5. Өөр улирал/он бол хэвийн нэмэгдэнэ
const ok5=await page.evaluate(()=>{
  openAddFolder(0);
  document.getElementById('afSeason').value='намар';
  document.getElementById('afYear').value='2026';
  document.getElementById('afName').value='Намар 2026';
  const before=DB.folders.length;
  addFolder();
  return {before,after:DB.folders.length,modalOpen:_modalOpen('addFolderModal')}
});
ok('Өөр улирал (намар,2026) дэр паспорт нэмэгдлээ',ok5.after===ok5.before+1,JSON.stringify(ok5));
ok('Амжилттай нэмэгдэхэд цонх хаагдана',ok5.modalOpen===false,JSON.stringify(ok5));

// 6. Трэшинд байгаа паспорт давхардалд тооцогдохгүй (дахин үүсгэж болно)
const trashCase=await page.evaluate(()=>{
  DB.folders=[{id:'ftr',name:'Зун 2026 (трэш)',season:'зун',year:'2026',tracks:[],
    trashedAt:new Date().toISOString()}];
  saveDB();
  return seasonYearTaken(DB.folders,'зун','2026')
});
ok('Трэшинд байгаа паспорт давхардалд ОРОХГҮЙ',trashCase===false,String(trashCase));

// ── Сум тал: ижил зарчим (товч шалгалт) ──
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',turnouts:[]}];
  saveDB();
});
const swSel=await page.evaluate(()=>{
  openSwFolder();
  return {
    season:document.getElementById('swfSeason').value,
    havarDisabled:Array.from(document.getElementById('swfSeason').options).find(o=>o.value==='хавар').disabled
  }
});
ok('Сум: 2026 онд "хавар" автоматаар сонгогдохгүй',swSel.season!=='хавар',swSel.season);
ok('Сум: "хавар" сонголт идэвхгүй',swSel.havarDisabled===true,JSON.stringify(swSel));

const swGuard=await page.evaluate(()=>{
  const before=DB.sw.length;
  document.getElementById('swfSeason').value='хавар';
  document.getElementById('swfYear').value='2026';
  document.getElementById('swfName').value='Хавар 2026 сум (давхардсан)';
  addSwFolder();
  return {before,after:DB.sw.length}
});
ok('Сум: давхардсан (хавар,2026) паспорт нэмэгдээгүй',swGuard.before===swGuard.after,JSON.stringify(swGuard));
await page.evaluate(()=>closeModal('swFolderModal'));

const swOk=await page.evaluate(()=>{
  openSwFolder();
  document.getElementById('swfSeason').value='намар';
  document.getElementById('swfYear').value='2026';
  document.getElementById('swfName').value='Намар 2026 сум';
  const before=DB.sw.length;
  addSwFolder();
  return {before,after:DB.sw.length}
});
ok('Сум: өөр улирал (намар,2026) паспорт нэмэгдлээ',swOk.after===swOk.before+1,JSON.stringify(swOk));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
