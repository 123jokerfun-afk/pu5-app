/* ══════════════════════════════════════════════════════════════
   ТАТАХ ҮЗЭГДЭЛ — товч ДАРСАН тэр дор (runDlFly) эхэлж, Excel/CSV-ээ
   ЗЭРЭГЦЭЭ бэлдэнэ. dlBlob()-д хүрэхэд sbGate()-ээр хориглогдож, яг
   үзэгдэл дуусахад нь файл өгөгдөнө (санаа: uulzwar_zai сиб апп).
   Өмнө нь dlBlob() өөрөө эхлүүлдэг байсан тул Excel бэлдэх хугацаанд
   (ensureExcel, их тайлан) үзэгдэл ХОЖИМДОЖ эхэлж, товч дарсны дараа
   түр "юу ч болохгүй байна" мэт харагддаг асуудлыг засав.

   iOS-ийн window.open салбарт орохгүйн тулд Android төхөөрөмж
   ашиглана (popup blocked асуудлаас зайлсхийнэ).
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[3]);   // Android small — window.open-гүй зам
await page.emulateMedia({reducedMotion:'no-preference'});
await B.login(page,'ПД-6');
page.on('download',d=>d.cancel().catch(()=>{}));       // жинхэнэ татан авалтыг аюулгүй цуцална

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>{
  const fly=document.getElementById('dlFly');
  return {flyExists:!!fly,flyOn:fly&&fly.classList.contains('on')};
});
ok('#dlFly самбар бэлэн, анхандаа нуугдмал',init.flyExists&&!init.flyOn,JSON.stringify(init));

// ── 2. runDlFly(fn) ДАРСАН тэр дор (sbPlay-ийн эхний frame дотор)
//    үзэгдэл тоглож эхэлнэ — fn өөрөө хэдий хугацаа авсан ч хамаагүй ──
await page.evaluate(()=>{
  window.__delivered=false;
  window.__p=runDlFly(async()=>{
    await new Promise(r=>setTimeout(r,80));     // "Excel бэлдэх" дуурайлга
    await dlBlob(new Blob(['a,b\n1,2'],{type:'text/csv'}),'test.csv');
    window.__delivered=true
  })
});
await page.waitForTimeout(40);   // fn-ийн 80мс дуусахаас өмнө — үзэгдэл АЛЬ ХЭДИЙН тоглож байх ёстой
const early=await page.evaluate(()=>({
  flyOn:document.getElementById('dlFly').classList.contains('on'),
  delivered:window.__delivered
}));
ok('fn дуусахаас ӨМНӨ (40мс) үзэгдэл аль хэдийн тоглож эхэлсэн',early.flyOn,JSON.stringify(early));

await page.waitForTimeout(300);   // fn-ийн 80мс аль хэдийн өнгөрсөн, гэвч үзэгдэл ~2.6с үргэлжилнэ
const mid=await page.evaluate(()=>({
  flyOn:document.getElementById('dlFly').classList.contains('on'),
  delivered:window.__delivered
}));
ok('fn бэлэн болсон ч dlBlob() үзэгдэл дуустал ХҮЛЭЭНЭ, файл ОГТ ӨГӨГДӨӨГҮЙ',
   mid.flyOn&&!mid.delivered,JSON.stringify(mid));

await page.waitForFunction(()=>!document.getElementById('dlFly').classList.contains('on'),
  {timeout:8000});
await page.evaluate(()=>window.__p);
const after=await page.evaluate(()=>({
  flyOn:document.getElementById('dlFly').classList.contains('on'),
  delivered:window.__delivered
}));
ok('Үзэгдэл дуусаад л файл өгөгдөв',after.delivered&&!after.flyOn,JSON.stringify(after));

// ── 3. dlBlob()-г ШУУД (runDlFly-гүй) дуудвал — анимаци огт тоглохгүй,
//    sbGate() шууд өнгөрнө (сэргээгдсэн зан төлөв, хуучин зан биш) ──
const direct=await page.evaluate(async()=>{
  const t0=Date.now();
  await dlBlob(new Blob(['x'],{type:'text/csv'}),'direct.csv');
  return {ms:Date.now()-t0,flyOn:document.getElementById('dlFly').classList.contains('on')}
});
ok('dlBlob() шууд дуудахад (runDlFly-гүй) анимаци тоглохгүй, шууд өнгөрнө',
   direct.ms<300&&!direct.flyOn,JSON.stringify(direct));

// ── 4. sbBusy аль хэдийн завгүй үед runDlFly шууд fn-ээ гүйцэтгэнэ ──
const busyRes=await page.evaluate(async()=>{
  sbBusy=true;
  const t0=Date.now();
  let ran=false;
  await runDlFly(()=>{ran=true});
  const ms=Date.now()-t0;
  sbBusy=false;
  return {ms,ran,flyOn:document.getElementById('dlFly').classList.contains('on')}
});
ok('Өөр үзэгдэл (sbBusy) тоглож байхад шууд алгасаад fn ажиллана (<300мс)',
   busyRes.ms<300&&busyRes.ran,JSON.stringify(busyRes));
ok('Алгассан ч #dlFly тоглоогүй',!busyRes.flyOn);

// ── 5. prefers-reduced-motion: reduce үед шууд гүйцэтгэнэ ──
await page.emulateMedia({reducedMotion:'reduce'});
const calmStart=Date.now();
await page.evaluate(()=>runDlFly(()=>dlBlob(new Blob(['y'],{type:'text/csv'}),'test3.csv')));
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд шууд дуусна (<400мс)',calmMs<400,calmMs+'мс');
await page.emulateMedia({reducedMotion:'no-preference'});

/* ── 6. runCloudReload(btn) — "Үүлнээс дахин татах" товч ӨӨРӨӨ жижиг
   тайз болоод, floating panel биш дотроо шууд SB_DL тоглоно (v185,
   logout-ын зарчмаар товч дотор нь). Нүүр болон тохиргооны хуудсанд
   ижил нэртэй 2 товч бий — энд нүүр дэх товчийг шалгана. ──────────── */
const btnInit=await page.evaluate(()=>{
  const b=document.querySelector('.add-track-btn[onclick^="runCloudReload"]');
  return {exists:!!b,sbOn:b&&b.classList.contains('sb-on')}
});
ok('Нүүр дэх "Үүлнээс дахин татах" товч бэлэн, анхандаа тоглоогүй',
   btnInit.exists&&!btnInit.sbOn,JSON.stringify(btnInit));

await page.evaluate(()=>{
  window.__crp=runCloudReload(document.querySelector('.add-track-btn[onclick^="runCloudReload"]'))
});
await page.waitForTimeout(80);
const crEarly=await page.evaluate(()=>({
  sbOn:document.querySelector('.add-track-btn[onclick^="runCloudReload"]').classList.contains('sb-on'),
  disabled:document.querySelector('.add-track-btn[onclick^="runCloudReload"]').disabled
}));
ok('Дарсны дараа ШУУД (80мс) товч дотроо үзэгдэл тоглож эхэлсэн',
   crEarly.sbOn&&crEarly.disabled,JSON.stringify(crEarly));
await page.waitForFunction(()=>!document.querySelector('.add-track-btn[onclick^="runCloudReload"]').classList.contains('sb-on'),
  {timeout:8000});
await page.evaluate(()=>window.__crp);
const crAfter=await page.evaluate(()=>({
  sbOn:document.querySelector('.add-track-btn[onclick^="runCloudReload"]').classList.contains('sb-on'),
  disabled:document.querySelector('.add-track-btn[onclick^="runCloudReload"]').disabled
}));
ok('Үзэгдэл дуусаад товч анхны байдалдаа буцав',!crAfter.sbOn&&!crAfter.disabled,JSON.stringify(crAfter));

// ── 7. sbBusy үед runCloudReload анимаци алгасаад cloudReload()-оо ХИЙНЭ ──
const crBusy=await page.evaluate(async()=>{
  sbBusy=true;
  const t0=Date.now();
  await runCloudReload(document.querySelector('.add-track-btn[onclick^="runCloudReload"]'));
  const ms=Date.now()-t0;
  sbBusy=false;
  return {ms,sbOn:document.querySelector('.add-track-btn[onclick^="runCloudReload"]').classList.contains('sb-on')}
});
ok('Өөр үзэгдэл (sbBusy) тоглож байхад анимацигүйгээр шууд дуусна (<1000мс)',
   crBusy.ms<1000&&!crBusy.sbOn,JSON.stringify(crBusy));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
