const B=require('./base'),T=require('./touch');
const R=[];
function ok(n,c,d){R.push({n,c:!!c,d:d||''});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {ctx,page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page);
ok('Нэвтрэлт',true);

// ── 1. Паспорт нэмэх ──
await page.click('text=Шинэ паспорт нэмэх');
await page.waitForTimeout(300);
ok('Паспорт нэмэх цонх нээгдэв',await page.isVisible('#addFolderModal'));
await page.click('#addFolderModal .btn-ok, #addFolderModal button:has-text("Нэмэх")').catch(async()=>{
  await page.evaluate(()=>addFolder())});
await page.waitForTimeout(400);
let nf=await page.evaluate(()=>DB.folders.length);
ok('Паспорт үүсэв',nf===1,'folders='+nf);

// ── 2. Зам нэмэх ──
await page.evaluate(()=>openAddTrack());
await page.waitForTimeout(200);
await page.fill('#atNum','3');
await page.evaluate(()=>addTrack());
await page.waitForTimeout(300);
let nt=await page.evaluate(()=>DB.tracks.length);
ok('Зам нэмэгдэв',nt===1,'tracks='+nt);

// ── 3. Үе нэмэх ──
await page.evaluate(()=>{openTrack(DB.tracks[0].id)});
await page.waitForTimeout(300);
ok('Замын дэлгэц',await page.evaluate(()=>document.getElementById('trackView').classList.contains('active')));
await page.evaluate(()=>openAddSection('normal'));
await page.waitForTimeout(250);
await page.evaluate(()=>addSection());
await page.waitForTimeout(400);
ok('Бүртгэлийн дэлгэц нээгдэв',await page.evaluate(()=>document.getElementById('recordView').classList.contains('active')));

// ── 4. Joystick-ээр бүртгэх ──
const opn=await page.evaluate(()=>[...document.querySelectorAll('.overlay.open')].map(o=>o.id));
ok('Нээлттэй цонх үлдээгүй',opn.length===0,JSON.stringify(opn));
const jb=await T.center(page,'#joyBtn');
ok('Joystick байрлал',!!jb,jb?JSON.stringify(jb):'олдсонгүй');
if(jb){
  for(let i=0;i<10;i++) await T.tap(page,jb.x,jb.y);          // 10 хэвийн
  let c=await page.evaluate(()=>activeSec().sleepers.length);
  ok('Товшилт = хэвийн ×10',c===10,'count='+c);
  await T.swipe(page,jb.x,jb.y,0,-45);                         // дээш = тэнцэхгүй
  let last=await page.evaluate(()=>{const s=activeSec().sleepers;return s[s.length-1].type});
  ok('Дээш шудрах = тэнцэхгүй',last==='bad','type='+last);
  await T.swipe(page,jb.x,jb.y,45,0);                          // баруун = ТБД
  last=await page.evaluate(()=>{const s=activeSec().sleepers;return s[s.length-1].type});
  ok('Баруун = ТБД',last==='tbd','type='+last);
  await T.swipe(page,jb.x,jb.y,-45,0);                         // зүүн = ТБД тэнцэхгүй
  last=await page.evaluate(()=>{const s=activeSec().sleepers;return s[s.length-1].type});
  ok('Зүүн = ТБД тэнцэхгүй',last==='bad_tbd','type='+last);
  await T.swipe(page,jb.x,jb.y,0,45);                          // доош = ТБД APC
  last=await page.evaluate(()=>{const s=activeSec().sleepers;return s[s.length-1].type});
  ok('Доош = ТБД (APC)',last==='tbd','type='+last);
}
// ── 5. Буцаах ──
let before=await page.evaluate(()=>activeSec().sleepers.length);
await page.evaluate(()=>undoLast());
await page.waitForTimeout(200);
let after=await page.evaluate(()=>activeSec().sleepers.length);
ok('Буцаах товч',after===before-1,before+'→'+after);

// ── 6. 3 дараалсан тэнцэхгүй үүсгээд шалгах ──
await page.evaluate(()=>{for(let i=0;i<3;i++)record('bad',null)});
await page.waitForTimeout(300);
let runs=await page.evaluate(()=>{const t=activeTrack();return findConsecutiveBadForTrack(dataSections(t)).length});
ok('Дараалсан тэнцэхгүй илрэв',runs>=1,'runs='+runs);

console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('\nSUMMARY: '+R.filter(r=>r.c).length+'/'+R.length+' passed');
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
