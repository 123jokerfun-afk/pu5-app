/* ══════════════════════════════════════════════════════════════
   ГАРАХ ҮЗЭГДЭЛ — "Тийм, гарах" товч өөрөө жижиг тайз: #logoutModal
   баталгаажуулах цонх нь үзэгдлийн ТУРШИД нээлттэй үлдэж, товч
   дотроо хаалгаар гарч, унаж алга болдог хүний дүрс тоглоно. Цонх
   зөвхөн үзэгдэл БҮРЭН дууссаны дараа хаагдаж, жинхэнэ гарах хийгдэнэ
   (санаа: uulzwar_zai сиб апп — бодит бичлэгээр баталгаажуулсан).
   Өмнө нь бүтэн дэлгэцийг халхласан #logoutFly дээр тоглодог байсныг
   (v181/v182) энэ зарчмаар сольсон (v183).
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await page.emulateMedia({reducedMotion:'no-preference'});
await B.login(page,'ПД-6');

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>{
  const m=document.getElementById('logoutModal');
  const yes=document.getElementById('logoutYesBtn');
  return {open:m&&m.classList.contains('open'),
    noExists:!!document.getElementById('logoutNoBtn'),
    label:yes&&yes.querySelector('.lo-label').textContent};
});
ok('#logoutModal бэлэн, анхандаа хаалттай',init.noExists&&!init.open,JSON.stringify(init));
ok('"Тийм, гарах" товчны бичиг анхандаа зөв',init.label==='Тийм, гарах',init.label);

// ── 2. doLogout() дуудахад ЦОНХ НЭЭГДЭНЭ, жинхэнэ гарах ХАРАХАН хийгдэхгүй ──
await page.evaluate(()=>{doLogout()});    // await-гүй — яг л жинхэнэ onclick шиг
await page.waitForFunction(()=>document.getElementById('logoutModal').classList.contains('open'),
  {timeout:2000});
const opened=await page.evaluate(()=>({
  open:document.getElementById('logoutModal').classList.contains('open'),
  view:(document.querySelector('.view.active')||{}).id,
  code:_sectionCode
}));
ok('Цонх нээгдэв, state өөрчлөгдөөгүй',
   opened.open&&opened.view!=='loginView'&&!!opened.code,JSON.stringify(opened));

// ── 3. "Үгүй" дарвал: анимаци ОГТ тоглохгүй, цонх хаагдаад state хэвээр ──
await page.click('#logoutNoBtn');
await page.waitForTimeout(150);
const cancelled=await page.evaluate(()=>({
  open:document.getElementById('logoutModal').classList.contains('open'),
  stageClass:document.querySelector('#logoutYesBtn .lo-stage').className,
  view:(document.querySelector('.view.active')||{}).id,
  code:_sectionCode
}));
ok('"Үгүй" дарвал цонх хаагдаад, state хэвээр, анимаци тоглоогүй',
   !cancelled.open&&cancelled.stageClass==='lo-stage'&&
   cancelled.view!=='loginView'&&!!cancelled.code,JSON.stringify(cancelled));

// ── 4. "Тийм, гарах" дарвал: үзэгдэл ТЭР ДОР эхэлнэ, ЦОНХ НЭЭЛТТЭЙ хэвээр,
//    товч хоёул түгжигдэнэ, жинхэнэ гарах ХАРАХАН хийгдэхгүй ──
await page.evaluate(()=>{doLogout()});
await page.waitForFunction(()=>document.getElementById('logoutModal').classList.contains('open'),
  {timeout:2000});
await page.click('#logoutYesBtn');
await page.waitForTimeout(80);
const early=await page.evaluate(()=>({
  open:document.getElementById('logoutModal').classList.contains('open'),
  stageClass:document.querySelector('#logoutYesBtn .lo-stage').className,
  yesDisabled:document.getElementById('logoutYesBtn').disabled,
  noDisabled:document.getElementById('logoutNoBtn').disabled,
  view:(document.querySelector('.view.active')||{}).id,
  code:_sectionCode
}));
ok('"Тийм" дарсны дараа ШУУД (80мс): цонх нээлттэй, үзэгдэл эхэлсэн, товч түгжсэн',
   early.open&&/clicked/.test(early.stageClass)&&early.yesDisabled&&early.noDisabled,
   JSON.stringify(early));
ok('Үзэгдэл эхэлсэн ч жинхэнэ гарах ХАРАХАН хийгдээгүй',
   early.view!=='loginView'&&!!early.code,JSON.stringify(early));

// ── 5. ~1с-д: доргиж, хүн document.body-д шилжин унаж эхэлнэ, ЦОНХ ХЭВЭЭР нээлттэй
//    (.sheet-ийн overflow:auto-д тасдагдахгүйн тул body руу шилждэг ёстой) ──
await page.waitForTimeout(950);
const mid=await page.evaluate(()=>{
  const person=document.querySelector('.mo-person');
  return {
    open:document.getElementById('logoutModal').classList.contains('open'),
    personInBody:!!person&&person.parentNode===document.body,
    falling:!!person&&person.classList.contains('mo-falling'),
    fixedPos:!!person&&getComputedStyle(person).position==='fixed'
  }
});
ok('~1с-д хүн унаж эхлээд body-д шилжсэн, цонх ХЭВЭЭР нээлттэй',
   mid.open&&mid.personInBody&&mid.falling&&mid.fixedPos,JSON.stringify(mid));

// ── 6. ~2.2с-д: "Гарлаа" гэж бичиг солигдоно, ЦОНХ ХЭВЭЭР нээлттэй ──
await page.waitForTimeout(1250);
const label=await page.evaluate(()=>({
  open:document.getElementById('logoutModal').classList.contains('open'),
  label:document.querySelector('#logoutYesBtn .lo-label').textContent
}));
ok('~2.2с-д "Гарлаа" гэж бичиг солигдоно, цонх ХЭВЭЭР нээлттэй',
   label.open&&label.label==='Гарлаа',JSON.stringify(label));

// ── 7. Үзэгдэл бүрэн дуусаад (~2.6с): цонх ХААГДАНА, жинхэнэ гарах хийгдэнэ,
//    товч/тайз дараагийн удаад бэлэн байдалдаа буцна ──
await page.waitForFunction(()=>!document.getElementById('logoutModal').classList.contains('open'),
  {timeout:3000});
await page.waitForTimeout(100);
const done=await page.evaluate(()=>({
  view:(document.querySelector('.view.active')||{}).id,
  code:_sectionCode,
  folders:DB.folders.length,
  stageClass:document.querySelector('#logoutYesBtn .lo-stage').className,
  label:document.querySelector('#logoutYesBtn .lo-label').textContent,
  personBack:!!document.querySelector('#logoutYesBtn .lo-stage .mo-person'),
  yesDisabled:document.getElementById('logoutYesBtn').disabled,
  noDisabled:document.getElementById('logoutNoBtn').disabled
}));
ok('Үзэгдэл дуусаад жинхэнэ гарах хийгдэв',
   done.view==='loginView'&&!done.code&&done.folders===0,JSON.stringify(done));
ok('Товч/тайз дараагийн удаад зориулж анхны байдалдаа буцав',
   done.stageClass==='lo-stage'&&done.label==='Тийм, гарах'&&done.personBack&&
   !done.yesDisabled&&!done.noDisabled,JSON.stringify(done));

// ── 8. Дахин нэвтрээд, reduced-motion горимд цонх шууд (анимацигүй) хаагдаж гарна ──
await B.login(page,'ПД-6');
await page.emulateMedia({reducedMotion:'reduce'});
await page.evaluate(()=>{doLogout()});
await page.waitForFunction(()=>document.getElementById('logoutModal').classList.contains('open'),
  {timeout:2000});
await page.click('#logoutYesBtn');
await page.waitForFunction(()=>!document.getElementById('logoutModal').classList.contains('open'),
  {timeout:1000});
const calm=await page.evaluate(()=>({
  view:(document.querySelector('.view.active')||{}).id,
  stageClass:document.querySelector('#logoutYesBtn .lo-stage').className
}));
ok('Хөдөлгөөн хязгаарласан горимд цонх шууд (анимацигүй) хаагдаж гарна',
   calm.view==='loginView'&&calm.stageClass==='lo-stage',JSON.stringify(calm));
await page.emulateMedia({reducedMotion:'no-preference'});

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
