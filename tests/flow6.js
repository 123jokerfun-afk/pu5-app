const B=require('./base'),T=require('./touch'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПЧ-1'); await S.seed(page);

// ── Уламжлал: хавар паспортад сольсон → намар паспортад тэмдэглэгээ ──
await page.evaluate(()=>{
  const f=DB.folders.find(x=>x.id==='f-test1');
  const s=f.tracks[0].sections[0];
  s.repl={5:{d:'2026-04-20',t:'normal',m:'wood',o:1,s:1}};
  s.sleepers[5].type='normal';
  saveDB()});
await page.evaluate(()=>{openFolder('f-test2');openTrack('t1b')});
await page.waitForTimeout(300);
const inh=await page.evaluate(()=>{
  const t=activeTrack(),s=t.sections[0];
  const m=resolveReplMap(t,s);
  return JSON.stringify(Object.keys(m).map(k=>({i:k,own:m[k].own,d:m[k].rec.d})))});
ok('Өмнөх паспортын сольсон огноо уламжлагдав',/2026-04-20/.test(inh)&&/"own":false/.test(inh),inh);

// ── Хадгалалтын тэмдэг ──
const badge=await page.evaluate(()=>{const b=document.querySelector('.save-badge');return b?b.textContent.trim():'алга'});
ok('Хадгалалтын тэмдэг байна',badge!=='алга',badge);
await page.evaluate(()=>{_dirtySet();_renderSaveBadge()});
await page.waitForTimeout(300);
ok('Илгээгдээгүй төлөв харагдав',await page.evaluate(()=>{const b=document.querySelector('.save-badge');return b&&/лгээ/.test(b.textContent)}),
   await page.evaluate(()=>{const b=document.querySelector('.save-badge');return b?b.textContent.trim():'алга'}));

// ── Баталгаажуулах горим ──
await page.evaluate(()=>{openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)});
await page.waitForTimeout(400);
await page.evaluate(()=>openVerifModal(activeSectionId));
await page.waitForTimeout(300);
ok('Баталгаажуулах цонх',await page.isVisible('#verifModal'));
await page.evaluate(()=>startVerification());
await page.waitForTimeout(400);
ok('Баталгаажуулах горим асав',await page.evaluate(()=>!!_verifMode));
await page.evaluate(()=>endVerification());
await page.waitForTimeout(300);
ok('Баталгаажуулах горим унтрав',await page.evaluate(()=>!_verifMode));

// ── Гол зам: км нэмэх + бөөнөөр ──
await page.evaluate(()=>{goHome();openMainKmList();openAddKm()});
await page.waitForTimeout(300);
await page.evaluate(()=>{document.getElementById('akFrom').value='20';document.getElementById('akTo').value='22';addKm()});
await page.waitForTimeout(500);
ok('Км нэмэгдэв',await page.evaluate(()=>DB.main.length>=4),'main='+await page.evaluate(()=>DB.main.length));
await page.evaluate(()=>{openTrack(DB.main.find(t=>t.num===20).id)});
await page.waitForTimeout(400);
ok('Км дэлгэц нээгдэв',await page.evaluate(()=>document.getElementById('trackView').classList.contains('active')));
await page.evaluate(()=>{openSection(activeTrack().sections[0].id)});
await page.waitForTimeout(400);
ok('Км-ийн үе нээгдэв',await page.evaluate(()=>document.getElementById('recordView').classList.contains('active')));
ok('Гол замд Төрөл товч харагдав',await page.evaluate(()=>{const b=document.getElementById('secTypeBtn');return b&&b.style.display!=='none'}));
await page.evaluate(()=>openBulkModal());
await page.waitForTimeout(300);
await page.evaluate(()=>{setBulkN(46);applyBulk()});
await page.waitForTimeout(700);
if(await page.evaluate(()=>document.getElementById('appConfirmModal').classList.contains('open')))
  await page.evaluate(()=>document.getElementById('appConfirmOkBtn').click());
await page.waitForTimeout(600);
ok('Бөөнөөр 46 дэр орлоо',await page.evaluate(()=>activeSec().sleepers.length===46),'n='+await page.evaluate(()=>activeSec().sleepers.length));

// ── Хураангуй ──
await page.evaluate(()=>{goHome();openFolder('f-test1');showSummaryAll()});
await page.waitForTimeout(600);
ok('Хураангуй дэлгэц',await page.evaluate(()=>document.getElementById('summaryView').classList.contains('active')));
const st=await page.evaluate(()=>document.getElementById('sumBody').innerText.slice(0,180));
ok('Хураангуй агуулгатай',st.length>30,st.replace(/\n/g,' | ').slice(0,120));

console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
