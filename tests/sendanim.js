/* ══════════════════════════════════════════════════════════════
   ИЛГЭЭХ ТОВЧНЫ ҮЗЭГДЭЛ — "Илгээгдээгүй" тэмдэг дарахад ачигч
   мотоцикльд ачаагаа ачаад жолооч замдаа гарна (санаа: uulzwar_zai
   сиб апп). Тэмдэг жижиг тул үзэгдлийг #sendFly хөвөгч самбар дээр
   тоглуулдаг тул тэрийг шалгана.

   Сүлжээг flow9.js-ийн адил fbDb.batch/doc.set-ийг дарж бичдэг —
   жинхэнэ stub нь шууд амжилттай болдог тул бодит сүлжээний
   хоцролтыг дуурайхгүй.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const base=await B.ensureServer();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await page.emulateMedia({reducedMotion:'no-preference'});
await B.login(page,'ПЧ-1');
await S.seed(page);
await page.waitForTimeout(2200);          // анхны auto-save бүрэн суутал хүлээнэ

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>{
  const fly=document.getElementById('sendFly');
  return {flyExists:!!fly,flyOn:fly&&fly.classList.contains('on'),
    badge:!!document.getElementById('saveBadge')};
});
ok('#sendFly самбар бэлэн, анхандаа нуугдмал',init.flyExists&&!init.flyOn,JSON.stringify(init));
ok('Цэвэр үед тэмдэг харагдахгүй',!init.badge,JSON.stringify(init));

// ── 2. Сүлжээгүй болгоод бичлэг хийх (flow9.js-ийн адил монки-патч) ──
await page.evaluate(()=>{
  window.__sent=0;
  const ob=fbDb.batch;
  fbDb.batch=function(){
    const b=ob.call(fbDb);const oc=b.commit;
    b.commit=function(){
      if(window.__offline)return Promise.reject(new Error('offline'));
      window.__sent++;return oc.call(b)};
    return b};
  const orig=fbDb.collection;
  fbDb.collection=function(c){const r=orig.call(fbDb,c);const od=r.doc;
    r.doc=function(id){const d=od.call(r,id);const os=d.set;
      d.set=function(v,o){if(window.__offline)return Promise.reject(new Error('offline'));
        window.__sent++;return os.call(d,v,o)};return d};return r}
});
await page.evaluate(()=>{window.__offline=true;
  openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);
  record('bad',null);record('bad',null)});
await page.waitForTimeout(1500);
const dirty1=await page.evaluate(()=>!!_dirtyAt());
ok('Сүлжээгүйд "илгээгдээгүй" тэмдэг асав',dirty1);
const badgeTxt=await page.evaluate(()=>{const b=document.querySelector('.save-badge');
  return b?b.textContent.replace(/\s+/g,' ').trim():'алга'});
ok('Тэмдэг хэрэглэгчид харагдав',/лгээгдээгүй/.test(badgeTxt),badgeTxt);

// ── 3. Тэмдгийг дарах — сүлжээгүй тул татгалзана ──
await page.click('#saveBadge');
await page.waitForTimeout(150);
const midFail=await page.evaluate(()=>({
  flyOn:document.getElementById('sendFly').classList.contains('on'),
  badgeOpacity:document.getElementById('saveBadge').style.opacity
}));
ok('Дарсны дараа үзэгдэл самбар дээр тоглож, тэмдэг түр нуугдана',
   midFail.flyOn&&midFail.badgeOpacity==='0',JSON.stringify(midFail));
// Татгалзсан хариу шууд ирэх тул үзэгдэл эрт зогсоод бүдгэрнэ — үргэлжлэл дуустал хүлээнэ
await page.waitForFunction(()=>!document.getElementById('sendFly').classList.contains('on'),
  {timeout:8000});
await page.waitForTimeout(150);
const afterFail=await page.evaluate(()=>({
  dirty:!!_dirtyAt(),badgeOpacity:(document.getElementById('saveBadge')||{}).style&&
    document.getElementById('saveBadge').style.opacity,
  badgeExists:!!document.getElementById('saveBadge')
}));
ok('Татгалзсаны дараа тэмдэг хэвээр, дахин харагдана',
   afterFail.dirty&&afterFail.badgeExists&&afterFail.badgeOpacity==='',JSON.stringify(afterFail));

// ── 4. Онлайн болгоод дахин дарах — амжилттай болно ──
await page.evaluate(()=>{window.__offline=false});
const nSent=await page.evaluate(()=>window.__sent);
await page.click('#saveBadge');
await page.waitForTimeout(150);
const midOk=await page.evaluate(()=>document.getElementById('sendFly').classList.contains('on'));
ok('Амжилттай оролдлого ч самбар дээр тоглоно',midOk);
await page.waitForFunction(()=>!document.getElementById('sendFly').classList.contains('on'),
  {timeout:8000});
await page.waitForTimeout(150);
const afterOk=await page.evaluate(()=>({dirty:!!_dirtyAt(),
  badgeExists:!!document.getElementById('saveBadge')}));
ok('Амжилттай илгээсний дараа тэмдэг арилна',
   !afterOk.dirty&&!afterOk.badgeExists,JSON.stringify(afterOk));
ok('Жинхэнэ бичилт явсан',await page.evaluate(()=>window.__sent)>nSent);

// ── 5. prefers-reduced-motion: reduce үед тайз тоглохгүй, шууд гүйцэтгэнэ ──
await page.evaluate(()=>{window.__offline=true;
  openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);
  record('bad',null)});
await page.waitForTimeout(1200);
ok('Дахин сүлжээгүй дарааллаар тэмдэг асав',await page.evaluate(()=>!!_dirtyAt()));
await page.emulateMedia({reducedMotion:'reduce'});
const calmStart=Date.now();
await page.click('#saveBadge');
await page.waitForFunction(()=>!document.getElementById('sendFly').classList.contains('on'),
  {timeout:5000});
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд үзэгдэл шууд дуусна (<500мс)',calmMs<500,calmMs+'мс');
await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>{window.__offline=false});
await page.waitForTimeout(1600);         // дараагийн оролдлого (автомат/гараар) амжилттай болтол

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e)&&!/offline/.test(e));
ok('Консолд (сүлжээгүйгээс өөр) алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
