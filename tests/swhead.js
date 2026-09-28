/* ══════════════════════════════════════════════════════════════
   СУМЫН УРД ДЭР (рам зам төмрийн эхний дэр) — ТБД (CZ/APC) бүртгэл

   Өмнө нь толгойн дэр зөвхөн Хэвийн/Тэнцэхгүй (мод) 2 төрөлтэй байсан.
   Одоо гол замын дэртэй адил 4 төрөлтэй болно: Хэвийн мод, Тэнцэхгүй
   мод, Тэнцэх ТБД, Тэнцэхгүй ТБД — гэхдээ бэхэлгээ (CZ/APC) нь дэр
   бүрээр биш, СУМ БҮРЭЭР нэг л удаа "Схем сонго" цонхоор сонгогдоно.
   Толгойн дэрийн ТБД төлөв сумын өөрийн тэнцэх/тэнцэхгүй хувьд
   нөлөөлөхгүй хэвээр байх ёстой (зөвхөн дүнз тооцогддог дүрэм).
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),T=require('./touch');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

// ── Сум бэлдэж (head=4, 4 дэр + 8 дүнз), схемгүй (хуучин өгөгдөл) ──
await page.evaluate(()=>{
  let it='';for(let i=0;i<12;i++)it+='n';
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',
      head:4,it}]}];
  swFolderId='sf';swTurnoutId='w1';saveDB();
});

ok('Схемгүй (хуучин) сум CZ гэж автоматаар тооцогдоно',
   await page.evaluate(()=>swSlFast(DB.sw[0].turnouts[0])==='CZ'));

// ── Шинэ сум үүсгэх дуураймал: head тоог зөвшөөрсний дараа Схем сонго
//    цонх АВТОМАТААР гарна ──
const auto=await page.evaluate(async()=>{
  const t=DB.sw[0].turnouts[0];
  t.head=null;delete t.slFast;saveDB();
  openSwRec('w1');
  await new Promise(r=>setTimeout(r,150));
  document.getElementById('swHeadN').value='4';
  saveSwHead();
  await new Promise(r=>setTimeout(r,150));
  return {schemeOpen:document.getElementById('swSchemeModal').classList.contains('open'),
    head:DB.sw[0].turnouts[0].head}});
ok('Head тоо баталгаажсаны дараа Схем сонго цонх нээгдэнэ',
   auto.schemeOpen&&auto.head===4,JSON.stringify(auto));

const picked=await page.evaluate(async()=>{
  pickSwScheme('APC');
  await new Promise(r=>setTimeout(r,150));
  return {fast:DB.sw[0].turnouts[0].slFast,
    schemeOpen:document.getElementById('swSchemeModal').classList.contains('open'),
    view:(document.querySelector('.view.active')||{}).id}});
ok('Схем сонгосны дараа slFast хадгалагдана',picked.fast==='APC',JSON.stringify(picked));
ok('Схем сонгосны дараа цонх хаагдаж, бүртгэлийн дэлгэц рүү очно',
   !picked.schemeOpen&&picked.view==='swRecView',JSON.stringify(picked));

// ── Дэр (head) байрлал дээр 4 чиглэлтэй жойстик. Хуучин бичлэгтэй
//    зөрчилдөхгүй байхын тулд (аль хэдийн бүртгэсэн мөр дээр өөр утга
//    бол баталгаажуулах цонх асуудаг — тэр урсгал swrec.js-д тусад нь
//    шалгагдсан) толгойн бичлэгийг хоослоод ЗАЛГААД бичнэ ──
await page.evaluate(()=>{const t=DB.sw[0].turnouts[0];t.it='';saveDB();renderSwRec()});
const jb=await T.center(page,'#swJoyBtn');
ok('Жойстик байрлал олдов',!!jb,jb?JSON.stringify(jb):'олдсонгүй');
if(jb){
  await T.swipe(page,jb.x,jb.y,45,0);      // #1 баруун = ТБД (APC) тэнцэх
  let it=await page.evaluate(()=>DB.sw[0].turnouts[0].it);
  ok('Дэр #1 баруун шудрахад ТБД тэнцэх (t) болно',it[0]==='t',it);

  await T.swipe(page,jb.x,jb.y,-45,0);     // #2 зүүн = ТБД (APC) тэнцэхгүй
  it=await page.evaluate(()=>DB.sw[0].turnouts[0].it);
  ok('Дэр #2 зүүн шудрахад ТБД тэнцэхгүй (x) болно',it[1]==='x',it);

  await T.swipe(page,jb.x,jb.y,0,-45);     // #3 дээш = мод тэнцэхгүй (b)
  it=await page.evaluate(()=>DB.sw[0].turnouts[0].it);
  ok('Дэр #3 дээш шудрахад модон тэнцэхгүй (b) болно',it[2]==='b',it);

  await T.tap(page,jb.x,jb.y);             // #4 товшилт = мод хэвийн (n), head дуусна
  it=await page.evaluate(()=>DB.sw[0].turnouts[0].it);
  ok('Дэр #4 товшилт хэвийн (n) болно, head 4 дүүрнэ',it==='txbn',it);

  // ── Дүнз (head-ээс цааш, #5) дээр БАРУУН/ЗҮҮН нөлөөгүй — 2 чиглэлтэй хэвээр ──
  await T.swipe(page,jb.x,jb.y,45,0);      // баруун — дүнзэнд юу ч хийхгүй
  const dzAfterRight=await page.evaluate(()=>DB.sw[0].turnouts[0].it.length);
  ok('Дүнзэнд баруун шудрах нөлөөгүй (мөр нэмэгдэхгүй)',dzAfterRight===4,dzAfterRight+' мөр');
  await T.swipe(page,jb.x,jb.y,0,-45);     // дээш — дүнзний тэнцэхгүй хэвээр ажиллана
  const dzIt=await page.evaluate(()=>DB.sw[0].turnouts[0].it);
  ok('Дүнзэнд дээш шудрах хэвээрээ Тэнцэхгүй бичнэ',dzIt==='txbnb',dzIt);
}

// ── Толгойн ТБД-ийн тэнцэхгүй нь сумын (дүнзний) хувьд нөлөөлөхгүй:
//    it='txbnb' — 4 дэр (t,x,b,n) + 1 дүнз (b). Нийт/пог/м-д ЗӨВХӨН
//    тэр 1 дүнз ордог, 4 дэр огт хамаарахгүй ──
const tally=await page.evaluate(()=>{
  const t=DB.sw[0].turnouts[0];return {a:swTally(t),headBad:swHeadBad(t)}
});
ok('Толгойн дэр сумын нийт/пог/м тооцоонд ОРОХГҮЙ (зөвхөн 1 дүнз ордог)',
   tally.a.total===1&&tally.a.pct===100,JSON.stringify(tally.a));
ok('swHeadBad нь b БОЛОН x хоёуланг тооцно (2)',tally.headBad===2,String(tally.headBad));
ok('swTally.slBad нь b БОЛОН x хоёуланг тооцно (2)',tally.a.slBad===2,String(tally.a.slBad));

// ── Дэр засах цонх: 4 товч, тухайн схемийн бэхэлгээгээр шошголсон ──
const editModal=await page.evaluate(()=>{
  openSwSl(0);
  return {
    fastT:document.getElementById('swSlFastT').textContent,
    fastX:document.getElementById('swSlFastX').textContent,
    selT:document.getElementById('swSlBt').classList.contains('sel'),
    selN:document.getElementById('swSlBn').classList.contains('sel')
  }
});
ok('Засах цонхны бэхэлгээний шошго APC',
   editModal.fastT==='APC'&&editModal.fastX==='APC',JSON.stringify(editModal));
ok('Одоогийн төлөв (t) сонгогдсон харагдана',
   editModal.selT&&!editModal.selN,JSON.stringify(editModal));

// ── Дараа нь схемийг өөрчлөх боломжтой (заавал биш үед) ──
const changed=await page.evaluate(async()=>{
  closeModal('swSlModal');
  openSwSchemeModal(false);
  pickSwScheme('CZ');
  await new Promise(r=>setTimeout(r,150));
  return {fast:DB.sw[0].turnouts[0].slFast,view:(document.querySelector('.view.active')||{}).id}
});
ok('Схемийг дараа нь ч өөрчилж болно',changed.fast==='CZ',JSON.stringify(changed));
ok('Схем өөрчлөхөд бүртгэлийн дэлгэцэд үлдэнэ',changed.view==='swRecView',JSON.stringify(changed));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
