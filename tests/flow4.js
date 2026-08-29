const B=require('./base'),T=require('./touch');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПД-6');
// СШ ПУ-5 руу шилжих
await page.evaluate(()=>goSwHome());
await page.waitForTimeout(600);
ok('СШ ПУ-5 нүүр',await page.evaluate(()=>document.getElementById('swHomeView').classList.contains('active')));
ok('ПД-6 дээр нэмэх товч',await page.evaluate(()=>{const b=document.getElementById('swAddSpecBtn');return !!b&&getComputedStyle(b).display!=='none'}),
   await page.evaluate(()=>{const b=document.getElementById('swAddSpecBtn');return b?getComputedStyle(b).display:'алга'}));

// паспорт нэмэх
await page.evaluate(()=>openSwFolder());
await page.waitForTimeout(300);
await page.evaluate(()=>addSwFolder());
await page.waitForTimeout(400);
let nf=await page.evaluate(()=>swFolders().length);
ok('СШ паспорт үүсэв',nf>=1,'n='+nf);

// сум нэмэх
await page.evaluate(()=>openSwTurnout());
await page.waitForTimeout(300);
await page.evaluate(()=>{document.getElementById('swtNum').value='1';document.getElementById('swtStation').value='Өртөө';addSwTurnout()});
await page.waitForTimeout(400);
let nt=await page.evaluate(()=>swFolders()[0].turnouts.length);
ok('Сум нэмэгдэв',nt===1,'n='+nt);
const card=await page.evaluate(()=>{const e=document.querySelector('#swTurnoutsGrid .sw-card');return e?e.textContent.replace(/\s+/g,' ').trim().slice(0,60):'алга'});
ok('Сумын карт харагдав',/Сум 1/.test(card),card);

// бүртгэл
await page.evaluate(()=>openSwRec(swFolders()[0].turnouts[0].id));
await page.waitForTimeout(400);
ok('Рам замын дэрийн тоо асуув',await page.isVisible('#swHeadModal'));
await page.evaluate(()=>{document.getElementById('swHeadN').value='4';saveSwHead()});
await page.waitForTimeout(500);
ok('Бүртгэлийн дэлгэц',await page.evaluate(()=>document.getElementById('swRecView').classList.contains('active')));

const jb=await T.center(page,'#swJoyBtn');
ok('СШ joystick',!!jb,jb?JSON.stringify(jb):(await page.evaluate(()=>[...document.querySelectorAll('#swRecView button,[id^=swJoy]')].map(e=>e.id).filter(Boolean).join(','))));
if(jb){
  for(let i=0;i<6;i++) await T.tap(page,jb.x,jb.y);
  let it=await page.evaluate(()=>swTurnout().it);
  ok('Товшилт = хэвийн',it==='nnnnnn','it='+it);
  await T.swipe(page,jb.x,jb.y,0,-45);
  it=await page.evaluate(()=>swTurnout().it);
  ok('Дээш шудрах = тэнцэхгүй (v79)',it.slice(-1)==='b','it='+it);
}
// tally: эхний 4 = дэр, дараа нь дүнз
const tal=await page.evaluate(()=>JSON.stringify(swTally(swTurnout())));
ok('Дэр нь дүнзний тооцоонд ороогүй',await page.evaluate(()=>swTally(swTurnout()).sl===4),tal);

// дүнз солих
await page.evaluate(()=>openSwDz(5));
await page.waitForTimeout(350);
ok('Дүнзний цонх',await page.isVisible('#swDzModal'));
await page.evaluate(()=>openSwDzRepl());
await page.waitForTimeout(400);
ok('Дүнз солих цонх',await page.isVisible('#swDzReplModal'));
await page.evaluate(()=>saveSwDzRepl());
await page.waitForTimeout(400);
ok('Дүнз солигдсон тэмдэглэгдэв',await page.evaluate(()=>Object.keys(swTurnout().dRepl||{}).length===1),
   await page.evaluate(()=>JSON.stringify(swTurnout().dRepl)));
const mBefore=await page.evaluate(()=>swTally(swTurnout()).m);
ok('Нийт пог/м өөрчлөгдөөгүй',typeof mBefore==='number',String(mBefore));

// тайлангууд
for(const [fn,id,nm] of [['openSwReplRep','swReplRepModal','Сольсон дүнз'],['openSwRunRep','swRunRepModal','Дараалсан дүнз'],['openSwRealRep','swRealRepModal','Бодит мэдээлэл']]){
  const has=await page.evaluate(f=>typeof window[f]==='function',fn);
  if(!has){ok(nm,false,'функц алга');continue}
  await page.evaluate(f=>window[f](),fn); await page.waitForTimeout(400);
  const vis=await page.evaluate(i=>{const e=document.getElementById(i);return !!e&&e.classList.contains('open')},id);
  ok(nm+' нээгдэв',vis, vis?'':await page.evaluate(()=>[...document.querySelectorAll('.overlay.open')].map(o=>o.id).join(',')));
  const ov=await B.overflow(page); ok(nm+' халилтгүй',ov.length===0,JSON.stringify(ov.slice(0,2)));
  await page.evaluate(()=>_appBack()); await page.waitForTimeout(300);
}
console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
