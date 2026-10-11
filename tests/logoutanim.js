/* ══════════════════════════════════════════════════════════════
   ГАРАХ ҮЗЭГДЭЛ — appConfirm("Тийм") дарсны дараа хаалгаар гарч,
   унаж алга болдог CSS-driven дэлгэц #logoutFly дээр тоглоно
   (санаа: uulzwar_zai сиб апп). Бодит гарах логик (state цэвэрлэлт,
   showView) НЬ анимацийг ХҮЛЭЭХГҮЙГЭЭР тэр дор шууд хийгдэнэ —
   doLogout()-г await-гүй (fire-and-forget) дуудаж байгаа одоо
   байсан тестүүд (walk.js, hub.js, perf.js гэх мэт) эвдэхгүйн тул.
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
  const el=document.getElementById('logoutFly');
  return {exists:!!el,on:el&&el.classList.contains('on')};
});
ok('#logoutFly бэлэн, анхандаа нуугдмал',init.exists&&!init.on,JSON.stringify(init));

// ── 2. "Тийм" дарахад: үзэгдэл тоглож эхэлнэ, ТЭР ДОР ШУУД (хүлээхгүй)
//    бодит гарах логик (loginView, цэвэрлэгдсэн DB) хийгдэнэ ──
await page.evaluate(()=>{window.appConfirm=async()=>true});
const quick=await page.evaluate(async()=>{
  doLogout();                               // await-гүй — яг л жинхэнэ onclick шиг
  await new Promise(r=>setTimeout(r,120));  // animation 2.5с үргэлжлэх ч, богино хүлээлт
  return {
    flyOn:document.getElementById('logoutFly').classList.contains('on'),
    view:(document.querySelector('.view.active')||{}).id,
    code:_sectionCode,
    folders:DB.folders.length
  }
});
ok('Богино хугацаанд (120мс) үзэгдэл тоглож байна',quick.flyOn,JSON.stringify(quick));
ok('Үзэгдлийг ХҮЛЭЭЛГҮЙГЭЭР жинхэнэ гарах аль хэдийн хийгдсэн',
   quick.view==='loginView'&&!quick.code&&quick.folders===0,JSON.stringify(quick));

// ── 3. Үзэгдэл бүрэн тоглоод өөрөө дуусна (~2.5с), текст солигдоод буцна ──
await page.waitForTimeout(2050);
const mid=await page.evaluate(()=>({
  text:document.querySelector('#logoutFly .mo-text').textContent,
  flyOn:document.getElementById('logoutFly').classList.contains('on')
}));
ok('~2.1с орчимд "Баяртай!" гарч, тайз хэвээр',
   mid.text==='Баяртай!'&&mid.flyOn,JSON.stringify(mid));
await page.waitForFunction(()=>!document.getElementById('logoutFly').classList.contains('on'),
  {timeout:3000});
const after=await page.evaluate(()=>({
  flyOn:document.getElementById('logoutFly').classList.contains('on'),
  text:document.querySelector('#logoutFly .mo-text').textContent,
  stageClass:document.querySelector('#logoutFly .lo-stage').className
}));
ok('Дуусаад анхны байдалдаа буцна',
   !after.flyOn&&after.text==='Гарч байна…'&&after.stageClass==='lo-stage',
   JSON.stringify(after));

// ── 4. Дахин нэвтрээд, reduced-motion горимд OVERLAY огт гарахгүй ──
await B.login(page,'ПД-6');
await page.evaluate(()=>{window.appConfirm=async()=>true});
await page.emulateMedia({reducedMotion:'reduce'});
const calm=await page.evaluate(async()=>{
  doLogout();
  await new Promise(r=>setTimeout(r,200));
  return {
    flyOn:document.getElementById('logoutFly').classList.contains('on'),
    view:(document.querySelector('.view.active')||{}).id
  }
});
ok('Хөдөлгөөн хязгаарласан горимд OVERLAY огт гарахгүй',!calm.flyOn,JSON.stringify(calm));
ok('Хязгаарласан горимд ч жинхэнэ гарах хийгдэв',calm.view==='loginView',JSON.stringify(calm));
await page.emulateMedia({reducedMotion:'no-preference'});

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
