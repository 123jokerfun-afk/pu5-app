/* ══════════════════════════════════════════════════════════════
   ТАТАХ ҮЗЭГДЭЛ — Excel/CSV файл бэлэн болоод dlBlob()-д хүрэхэд
   хайрцаг нүх рүү орох үзэгдэл #dlFly дээр тоглоод, ДАРАА НЬ файл
   жинхэнэ өгөгдөнө (санаа: uulzwar_zai сиб апп). PU-5-д экспортын
   товч маш олон, тараагдмал тул dlBlob()-д л холбосон — товч бүрийг
   шалгахгүй, зөвхөн dlBlob()-ийн шинэ зан төлвийг шалгана.

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

// ── 2. dlBlob() дуудахад үзэгдэл тоглоод, дараа нь дуусна ──
await page.evaluate(()=>{
  window.__p=dlBlob(new Blob(['a,b\n1,2'],{type:'text/csv'}),'test.csv')
});
await page.waitForTimeout(250);
const mid=await page.evaluate(()=>({
  flyOn:document.getElementById('dlFly').classList.contains('on'),
  sbBusy:typeof sbBusy!=='undefined'?sbBusy:null
}));
ok('dlBlob дуудахад #dlFly тоглож эхэлнэ',mid.flyOn,JSON.stringify(mid));
ok('sbBusy асав (өөр үзэгдэл давхацахгүй)',mid.sbBusy===true,JSON.stringify(mid));

await page.waitForFunction(()=>!document.getElementById('dlFly').classList.contains('on'),
  {timeout:8000});
let dlErr=null;
try{await page.evaluate(()=>window.__p)}catch(e){dlErr=String(e)}
const after=await page.evaluate(()=>({
  flyOn:document.getElementById('dlFly').classList.contains('on'),
  sbBusy:sbBusy
}));
ok('Үзэгдэл дуусаад dlBlob() алдаагүй гүйцэтгэв',!dlErr,String(dlErr));
ok('Дуусаад #dlFly нуугдаж, sbBusy суллагдав',!after.flyOn&&after.sbBusy===false,JSON.stringify(after));

// ── 3. sbBusy аль хэдийн завгүй үед — үзэгдэл алгасаад шууд өгнө ──
const busyRes=await page.evaluate(async()=>{
  sbBusy=true;
  const t0=Date.now();
  await dlBlob(new Blob(['x'],{type:'text/csv'}),'test2.csv');
  const ms=Date.now()-t0;
  sbBusy=false;
  return {ms,flyOn:document.getElementById('dlFly').classList.contains('on')}
});
ok('Өөр үзэгдэл (sbBusy) тоглож байхад шууд алгасна (<300мс)',
   busyRes.ms<300,busyRes.ms+'мс');
ok('Алгассан ч #dlFly тоглоогүй',!busyRes.flyOn);

// ── 4. prefers-reduced-motion: reduce үед шууд гүйцэтгэнэ ──
await page.emulateMedia({reducedMotion:'reduce'});
const calmStart=Date.now();
await page.evaluate(()=>dlBlob(new Blob(['y'],{type:'text/csv'}),'test3.csv'));
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд шууд дуусна (<400мс)',calmMs<400,calmMs+'мс');
await page.emulateMedia({reducedMotion:'no-preference'});

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
