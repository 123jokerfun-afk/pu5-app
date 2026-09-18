/* ══════════════════════════════════════════════════════════════
   ДЭР ПУ-5 НҮҮРНИЙ ТОЛГОЙ — бетон/тэнцэхгүй тоо

   renderHome() толгойн үндсэн 3 нүдний (Замын тоо/Нийт дэр/
   Тэнцэхгүй %) ДООР нимгэн чипийн эгнээгээр "Тэнцэхгүй дэр",
   "Нийт бетон", "Тэнцэхгүй бетон" гэсэн тоог нэмснийг батална.
   Бүтэн хоёр дахь hero-stats эгнээ БИШ чип болгосон шалтгаан:
   дэрийн толгойн доор "Гол зам"/"Дэрийн агуулах" гэсэн нэмэлт
   агуулга байдаг тул бүтэн эгнээ нэмбэл эхний паспортын карт доод
   табын самбарын ард нуугдаж, товшиж болохоо болдог байсан. ══════ */
const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПД-6');
await S.seed(page);

// Паспорт хаалттай — бүгд 0
let hero=await page.evaluate(()=>['hsTracks','hsTotal','hsPct','hsBad','hsTbd','hsBadTbd']
  .map(i=>document.getElementById(i).textContent.trim()));
ok('Паспорт хаалттай үед бүгд 0',JSON.stringify(hero)===JSON.stringify(['0','0','—','0','0','0']),JSON.stringify(hero));

// Толгойн үндсэн 3 нүд хэвээр — нэг мөр, өөрчлөгдөөгүй
const geo=await page.evaluate(()=>{
  const row=document.getElementById('heroStats');
  return{n:row.children.length,
    chipsExists:!!document.getElementById('heroChips'),
    chipsN:document.querySelectorAll('#heroChips .hero-chip').length}});
ok('Толгойн үндсэн эгнээ 3 нүдтэй хэвээр',geo.n===3,String(geo.n));
ok('Чипийн эгнээ нэмэгдэв, 3 чиптэй',geo.chipsExists&&geo.chipsN===3,JSON.stringify(geo));

// Паспорт нээх — f-test1: t1 (3 үе: 8 bad + 4 bad + 3 tbd/3 bad_tbd), t2 (2 bad)
await page.evaluate(()=>openFolder('f-test1'));
await page.waitForTimeout(1300);
const calc=await page.evaluate(()=>{
  let total=0,bad=0,tbd=0,badTbd=0;
  DB.tracks.filter(t=>!isMainTrack(t)).forEach(t=>{
    const a=analyzeTrack(t);total+=a.total;bad+=a.totalBad;
    tbd+=a.tbd+a.bad_tbd;badTbd+=a.bad_tbd});
  return{total,bad,tbd,badTbd}});
hero=await page.evaluate(()=>({
  tracks:document.getElementById('hsTracks').textContent.trim(),
  total:document.getElementById('hsTotal').textContent.trim(),
  pct:document.getElementById('hsPct').textContent.trim(),
  bad:document.getElementById('hsBad').textContent.trim(),
  tbd:document.getElementById('hsTbd').textContent.trim(),
  badTbd:document.getElementById('hsBadTbd').textContent.trim()}));
ok('Нийт дэр зөв',+hero.total===calc.total,`${hero.total} vs ${calc.total}`);
ok('Тэнцэхгүй дэрийн тоо зөв',+hero.bad===calc.bad,`${hero.bad} vs ${calc.bad}`);
ok('Нийт бетоны тоо зөв',+hero.tbd===calc.tbd,`${hero.tbd} vs ${calc.tbd}`);
ok('Тэнцэхгүй бетоны тоо зөв',+hero.badTbd===calc.badTbd,`${hero.badTbd} vs ${calc.badTbd}`);
ok('Тэнцэхгүй % ажиллав',/%$/.test(hero.pct),hero.pct);

// Паспорт хаахад бүгд 0 руу буцна
await page.evaluate(()=>closeFolder());
await page.waitForTimeout(1300);
hero=await page.evaluate(()=>['hsTracks','hsTotal','hsBad','hsTbd','hsBadTbd']
  .map(i=>document.getElementById(i).textContent.trim()));
ok('Хаахад бүгд 0 болов',hero.every(v=>v==='0'),JSON.stringify(hero));

// Толгойн доор орших эхний паспортын карт болон түүний устгах товч
// доод табын самбарын ард бүрэн нуугдахгүй байх нь чухал —
// нуугдвал урт дарж устгах идэвхжүүлэх боломжгүй болно (flow5.js).
const clear=await page.evaluate(()=>{
  const tb=document.getElementById('tabbar').getBoundingClientRect();
  const fc=document.querySelector('.folder-card.lp-del');
  if(!fc)return null;
  const del=fc.querySelector('.folder-del').getBoundingClientRect();
  return{delCenterY:del.top+del.height/2,tabTop:tb.top}});
ok('Паспортын картын устгах товч табын самбарын дээр байна',
   clear&&clear.delCenterY<clear.tabTop,JSON.stringify(clear));

ok('Консолд алдаа алга',errs.length===0,JSON.stringify(errs.slice(0,3)));
await browser.close();
const fails=R.filter(r=>!r.c);
console.log('SUMMARY '+(R.length-fails.length)+'/'+R.length);
if(fails.length)process.exit(1);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
