/* ══════════════════════════════════════════════════════════════
   УСТГАХ ТОВЧНЫ ҮЗЭГДЭЛ — logoutModal-ын зарчмаар: #delModal
   баталгаажуулах цонх нь үзэгдлийн ТУРШИД нээлттэй үлдэж, "Устгах"
   товч ӨӨРӨӨ жижиг тайз болоод дотроо шууд SB_DEL (хогийн сав руу
   хийгч) тоглоно. Цонх зөвхөн үзэгдэл БҮРЭН дууссаны дараа хаагдаж,
   жинхэнэ устгалт (trashedAt тэмдэглэл) хийгдэнэ (санаа: uulzwar_zai
   сиб апп). Өмнө нь бүх дэлгэцийн доорх тусдаа #delFly хөвөгч
   самбар дээр тоглодог байсныг (v183 хүртэл) энэ зарчмаар сольсон.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await page.emulateMedia({reducedMotion:'no-preference'});
await B.login(page,'ПД-6');

await page.evaluate(()=>{
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[{id:'s1',type:'normal',label:'1-р үе',
      sleepers:[{type:'normal',ts:0},{type:'bad',ts:0}]}]}]}];
  DB.main=[];DB.sw=[];saveDB()
});

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>{
  const m=document.getElementById('delModal');
  const yes=document.getElementById('delYesBtn');
  return {open:m&&m.classList.contains('open'),
    noExists:!!document.getElementById('delNoBtn'),
    yesLabel:yes&&yes.textContent.trim()};
});
ok('#delModal бэлэн, анхандаа хаалттай',init.noExists&&!init.open,JSON.stringify(init));
ok('"Устгах" товчны бичиг анхандаа зөв',init.yesLabel==='Устгах',init.yesLabel);

// ── 2. deleteFolder() дуудахад ЦОНХ НЭЭГДЭЖ, нэрийг нь зурагт үзүүлнэ,
//    жинхэнэ устгалт ХАРАХАН хийгдэхгүй ──
await page.evaluate(()=>{window.__delPromise=deleteFolder('f1')});   // await-гүй — онклик шиг
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
const opened=await page.evaluate(()=>({
  open:document.getElementById('delModal').classList.contains('open'),
  msg:document.getElementById('delMsg').textContent,
  trashedYet:!!DB.folders[0].trashedAt
}));
ok('Цонх нээгдэж, устгах зүйлийн НЭР зурагт гарав',
   opened.open&&/Хавар 2026/.test(opened.msg),JSON.stringify(opened));
ok('Цонх нээгдсэн ч устгалт ХАРАХАН хийгдээгүй',!opened.trashedYet,JSON.stringify(opened));

// ── 3. "Болих" дарвал: анимаци ОГТ тоглохгүй, цонх хаагдаад устгагдаагүй ──
await page.click('#delNoBtn');
await page.waitForTimeout(150);
const cancelled=await page.evaluate(()=>({
  open:document.getElementById('delModal').classList.contains('open'),
  sbOn:document.getElementById('delYesBtn').classList.contains('sb-on'),
  trashed:!!DB.folders[0].trashedAt
}));
ok('"Болих" дарвал цонх хаагдаад, анимаци тоглоогүй, устгагдаагүй',
   !cancelled.open&&!cancelled.sbOn&&!cancelled.trashed,JSON.stringify(cancelled));
await page.evaluate(()=>window.__delPromise);

// ── 4. "Устгах" дарвал: үзэгдэл ТЭР ДОР "Устгах" товч дотроо эхэлнэ,
//    ЦОНХ НЭЭЛТТЭЙ хэвээр, товч хоёул түгжигдэнэ, устгалт ХАРАХАН
//    хийгдэхгүй ──
await page.evaluate(()=>{window.__delPromise2=deleteFolder('f1')});
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
await page.click('#delYesBtn');
await page.waitForTimeout(80);
const early=await page.evaluate(()=>({
  open:document.getElementById('delModal').classList.contains('open'),
  sbOn:document.getElementById('delYesBtn').classList.contains('sb-on'),
  yesDisabled:document.getElementById('delYesBtn').disabled,
  noDisabled:document.getElementById('delNoBtn').disabled,
  trashed:!!DB.folders[0].trashedAt
}));
ok('"Устгах" дарсны дараа ШУУД (80мс): цонх нээлттэй, үзэгдэл эхэлсэн, товч түгжсэн',
   early.open&&early.sbOn&&early.yesDisabled&&early.noDisabled,JSON.stringify(early));
ok('Үзэгдэл эхэлсэн ч устгалт ХАРАХАН хийгдээгүй',!early.trashed,JSON.stringify(early));

// ── 5. Үзэгдэл БҮРЭН дуусаад: цонх ХААГДАНА, жинхэнэ устгалт хийгдэнэ,
//    товч дараагийн удаад зориулж анхны байдалдаа буцна ──
await page.waitForFunction(()=>!document.getElementById('delModal').classList.contains('open'),
  {timeout:8000});
await page.evaluate(()=>window.__delPromise2);
const after=await page.evaluate(()=>({
  open:document.getElementById('delModal').classList.contains('open'),
  sbOn:document.getElementById('delYesBtn').classList.contains('sb-on'),
  yesDisabled:document.getElementById('delYesBtn').disabled,
  noDisabled:document.getElementById('delNoBtn').disabled,
  active:derFolders().map(f=>f.id),
  trashed:!!DB.folders[0].trashedAt
}));
ok('Үзэгдэл дуусаад л жинхэнэ устгалт (trashedAt) хийгдэв',
   after.trashed&&after.active.length===0,JSON.stringify(after));
ok('Товч дараагийн удаад зориулж анхны байдалдаа буцав',
   !after.open&&!after.sbOn&&!after.yesDisabled&&!after.noDisabled,JSON.stringify(after));

// ── 6. Сум: ижил зарчим (delSwFolderById) ──
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Сум 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',turnouts:[]}];
  saveDB();
  window.__delPromise3=delSwFolderById('sf1')
});
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
const swMsg=await page.evaluate(()=>document.getElementById('delMsg').textContent);
ok('Сум: цонхны мессеж нэрийг агуулна',/Сум 2026/.test(swMsg),swMsg);
await page.click('#delYesBtn');
await page.waitForFunction(()=>!document.getElementById('delModal').classList.contains('open'),
  {timeout:8000});
await page.evaluate(()=>window.__delPromise3);
ok('Сум: дуусаад устгалт хийгдэв',await page.evaluate(()=>!!DB.sw[0].trashedAt));

// ── 7. sbBusy аль хэдийн завгүй үед анимаци алгасаад шууд устгана ──
await page.evaluate(()=>{
  DB.folders=[{id:'f2',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',tracks:[]}];
  saveDB();
  window.__delPromise4=deleteFolder('f2')
});
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
const busyRes=await page.evaluate(async()=>{
  sbBusy=true;
  const t0=Date.now();
  document.getElementById('delYesBtn').click();
  await window.__delPromise4;
  sbBusy=false;
  return {ms:Date.now()-t0,trashed:!!DB.folders[0].trashedAt,
    open:document.getElementById('delModal').classList.contains('open')}
});
ok('Өөр үзэгдэл (sbBusy) тоглож байхад анимаци алгасаад шууд устгана (<400мс)',
   busyRes.ms<400&&busyRes.trashed&&!busyRes.open,JSON.stringify(busyRes));

// ── 8. prefers-reduced-motion: reduce үед шууд гүйцэтгэнэ ──
await page.evaluate(()=>{
  DB.folders=[{id:'f3',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',tracks:[]}];
  saveDB()
});
await page.emulateMedia({reducedMotion:'reduce'});
await page.evaluate(()=>{window.__delPromise5=deleteFolder('f3')});
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
const calmStart=Date.now();
await page.click('#delYesBtn');
await page.waitForFunction(()=>!document.getElementById('delModal').classList.contains('open'),
  {timeout:1000});
await page.evaluate(()=>window.__delPromise5);
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд шууд гүйцэтгэнэ (<500мс)',calmMs<500,calmMs+'мс');
ok('Хязгаарласан горимд ч устгалт зөв хийгдэв',await page.evaluate(()=>!!DB.folders[0].trashedAt));
await page.emulateMedia({reducedMotion:'no-preference'});

// ── 9. Санамсаргүй гадна/зураасаар хаагдахгүй (баталгаажуулалт заавал) ──
await page.evaluate(()=>{
  DB.folders=[{id:'f4',name:'Өвөл 2026',season:'өвөл',year:'2026',date:'2026-12-01',sc:'ПД-6',tracks:[]}];
  saveDB();
  window.__delPromise6=deleteFolder('f4')
});
await page.waitForFunction(()=>document.getElementById('delModal').classList.contains('open'),
  {timeout:2000});
await page.evaluate(()=>{
  const ov=document.getElementById('delModal');
  ov.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
  ov.dispatchEvent(new MouseEvent('click',{bubbles:true}))
});
await page.waitForTimeout(150);
const stillOpen=await page.evaluate(()=>document.getElementById('delModal').classList.contains('open'));
ok('Дэвсгэр дээр дарахад ХААГДАХГҮЙ (_NO_DISMISS)',stillOpen,String(stillOpen));
await page.click('#delNoBtn');
await page.evaluate(()=>window.__delPromise6);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
