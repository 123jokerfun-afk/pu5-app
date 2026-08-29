const B=require('./base'),T=require('./touch'),S=require('./seed');
const R=[];
function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page);
await S.seed(page);
ok('Seed',await page.evaluate(()=>DB.folders.length)===2);

// ── солих урсгал: дараалсан дэр ──
await page.evaluate(()=>{openFolder('f-test1');openTrack('t1')});
await page.waitForTimeout(300);
await page.evaluate(()=>openSection(DB.tracks[0].sections[0].id));
await page.waitForTimeout(400);
ok('Бүртгэлийн дэлгэц',await page.evaluate(()=>document.getElementById('recordView').classList.contains('active')));

// 6-р дэр (idx 5) = дараалсан bad
await page.evaluate(()=>openEditSleeper(5));
await page.waitForTimeout(250);
ok('Дэр засах цонх',await page.isVisible('#editSleeperModal'));
await page.evaluate(()=>openReplModal());
await page.waitForTimeout(300);
ok('Солих цонх',await page.isVisible('#replModal'));
// Тийм гэж хариулах
const p=page.evaluate(()=>saveRepl('normal'));
await page.waitForTimeout(500);
const cvis=await page.evaluate(()=>document.getElementById('appConfirmModal').classList.contains('open'));
ok('Сийрэгжилт мөн үү? асуулт гарав',cvis,await page.evaluate(()=>document.getElementById('appConfirmMsg').textContent));
await page.evaluate(()=>document.getElementById('appConfirmOkBtn').click());
await p; await page.waitForTimeout(400);
const rep=await page.evaluate(()=>JSON.stringify(DB.tracks[0].sections[0].repl));
ok('Тэмдэглэгээ хадгалагдав',/"5"/.test(rep),rep);
ok('Сийрэгжилтэд тэмдэглэгдэв',await page.evaluate(()=>!!(DB.tracks[0].sections[0].repl[5]&&DB.tracks[0].sections[0].repl[5].s)));
ok('Дэр дээрээ үлдэв (v71)',await page.evaluate(()=>Math.abs(DRM.target-5)<0.6),'DRM.target='+await page.evaluate(()=>DRM.target));

// ── Тайлангууд ──
await page.evaluate(()=>goHome());
await page.waitForTimeout(400);
for(const [fn,id,nm] of [['openReplReport','replReportModal','Солигдсон дэр'],['openConsecReport','consecReportModal','Дараалсан цэг'],['openCarveReport','carveReportModal','Сийрэгжилт']]){
  const exists=await page.evaluate(f=>typeof window[f]==='function',fn);
  if(!exists){ok(nm+' функц',false,'алга');continue}
  await page.evaluate(f=>window[f](),fn);
  await page.waitForTimeout(400);
  const vis=await page.evaluate(i=>{const e=document.getElementById(i);return e&&(e.classList.contains('active')||e.classList.contains('open'))},id);
  ok(nm+' тайлан нээгдэв',vis);
  const ov=await B.overflow(page);
  ok(nm+' хэвтээ халилтгүй',ov.length===0,JSON.stringify(ov.slice(0,3)));
  await page.evaluate(()=>_appBack());
  await page.waitForTimeout(300);
}
console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
