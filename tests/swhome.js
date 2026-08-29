const B=require('./base'),T=require('./touch');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПД-6');
await page.evaluate(()=>{
  const mk=(id,num,head,bad,repl)=>{const t={id,num,station:'Шивээ-говь',mak:'Р-65',mark:'1/11',proj:'2764',head,it:'',dRepl:{}};
    let it='';for(let i=0;i<head+80;i++)it+=bad.includes(i)?'b':'n';t.it=it;
    (repl||[]).forEach(i=>{t.dRepl[i]={d:'2026-05-12',L:swSlot(t,i).len,o:1};t.it=t.it.slice(0,i)+'n'+t.it.slice(i+1)});return t};
  DB.sw=[
   {id:'sfA',name:'Хавар 2026 сумын паспорт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[mk('sw1',1,4,[5,6,7,20,21,40,55,56,57,58],[5,6,20]),mk('sw2',3,3,[10,30,31,32,33,34,60],[30,31])]},
   {id:'sfB',name:'Намар 2026 сумын паспорт',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
    turnouts:[mk('sw9',7,2,[8,9,10],[])]}];
  saveDB();goSwHome()});
await page.waitForTimeout(700);
ok('СШ нүүр нээгдэв',await page.evaluate(()=>document.getElementById('swHomeView').classList.contains('active')));
ok('Эхэндээ сумын жагсаалт нуугдсан',await page.evaluate(()=>getComputedStyle(document.getElementById('swTurnoutsSection')).display==='none'));
let hero=await page.evaluate(()=>['swHsT','swHsD','swHsP','swHeroMeta'].map(i=>document.getElementById(i).textContent.trim()));
ok('Паспорт хаалттай үед бүгд 0',hero[0]==='0'&&hero[1]==='0',JSON.stringify(hero));

// ── Паспорт дээр дарах ──
await page.evaluate(()=>{document.querySelector('#swFolders .folder-card').click()});
await page.waitForTimeout(1100);
ok('Сумын хэсэг доор задарлаа',await page.evaluate(()=>getComputedStyle(document.getElementById('swTurnoutsSection')).display==='block'));
ok('Дэлгэц солигдоогүй (нүүрэн дээрээ)',await page.evaluate(()=>document.getElementById('swHomeView').classList.contains('active')));
hero=await page.evaluate(()=>['swHsT','swHsD','swHsP','swHeroMeta'].map(i=>document.getElementById(i).textContent.trim()));
ok('Дээд тоо тухайн паспортынх болов',hero[0]==='2'&&/Хавар 2026/.test(hero[3]),JSON.stringify(hero));
// Дэрийн нүүртэй яг ижил бүтэц: 3 нүд, тус бүр том тоо + шошго
const geo=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('#swHomeView .hero-stats')];
  return {rows:rows.map(r=>r.children.length),
    sub:document.querySelectorAll('#swHomeView .hero-stat-s').length,
    // нүд бүр том тоо + шошготой (дэрийн нүүртэй ижил). Чимэглэлийн
    // дүрсний тэмдэг (.hero-stat-ic) бичиггүй тул зөвшөөрөгдөнө.
    shape:rows.every(r=>[...r.children].every(c=>{
      const kids=[...c.children];
      const txt=kids.filter(k=>!k.classList.contains('hero-stat-ic'));
      const ic=kids.filter(k=>k.classList.contains('hero-stat-ic'));
      return txt.length===2
        &&txt[0].classList.contains('hero-stat-n')
        &&txt[1].classList.contains('hero-stat-l')
        &&ic.every(k=>!(k.textContent||'').trim())})),
    aligned:rows.every(r=>new Set([...r.querySelectorAll('.hero-stat-l')]
      .map(e=>Math.round(e.getBoundingClientRect().top))).size===1),
    vals:[...document.querySelectorAll('#swHomeView .hero-stat-n')].map(e=>e.textContent)}});
ok('Мөрийн бүтэц 3 + 2 нүд',JSON.stringify(geo.rows)==='[3,2]',JSON.stringify(geo.rows));
ok('Нүд бүр дэрийнхтэй ижил (тоо + шошго)',geo.shape&&geo.sub===0);
ok('Шошгууд мөр бүрдээ нэг шугам дээр',geo.aligned);
ok('Нийт пог/м, тэнцэхгүй пог/м гарав',
   JSON.stringify(geo.vals)===JSON.stringify(['2','160','7.1%','631,5','45']),JSON.stringify(geo.vals));
// пог/м нь паспортын карт болон сумын карт дээр хэвээр
const pm=await page.evaluate(()=>({
  folder:/пог\/м/.test(document.querySelector('#swFolders .folder-meta').textContent),
  card:/пог\/м/.test(document.querySelector('#swTurnoutsGrid .sw-card').textContent)}));
ok('пог/м паспортын карт дээр хэвээр',pm.folder);
ok('пог/м сумын карт дээр хэвээр',pm.card);
ok('Паспорт "нээлттэй" гэж тэмдэглэгдэв',await page.evaluate(()=>!!document.querySelector('#swFolders .folder-card.active-folder')));
const items=await page.evaluate(()=>({
  cards:document.querySelectorAll('#swTurnoutsGrid .sw-card').length,
  folders:document.querySelectorAll('#swFolderWrap .folder-card').length,
  form:!!document.getElementById('swFormBtn'),
  add:[...document.querySelectorAll('#swTurnoutsSection button')].some(b=>/Сум нэмэх/.test(b.textContent))}));
ok('Сумын карт 2',items.cards===2,JSON.stringify(items));
ok('Сольсон/Дараалсан/Бодит 3 хавтас',items.folders===3);
ok('Дүнзний маягт татах товч',items.form);
ok('Сум нэмэх товч',items.add);

// ── Тоо 0-с гүйж гарах эсэх ──
const anim=await page.evaluate(async()=>{
  closeSwFolder();await new Promise(r=>setTimeout(r,400));
  const el=document.getElementById('swHsD');
  el.textContent='0';el.dataset.cv=0;
  openSwFolderView('sfA');
  const seen=[];
  for(let i=0;i<9;i++){await new Promise(r=>requestAnimationFrame(r));seen.push(el.textContent)}
  await new Promise(r=>setTimeout(r,900));
  return {seen:seen.slice(0,5),final:el.textContent}});
ok('Тоо 0-с эхлэн гүйж гарав',anim.seen[0]!==anim.final&&anim.final==='160',JSON.stringify(anim));

// ── Гүйх зуур бутархай гарахгүй байх (0.4 сум гэж харагдаж байсан) ──
const whole=await page.evaluate(async()=>{
  closeSwFolder();await new Promise(r=>setTimeout(r,500));
  ['swHsT','swHsD','swHsP','swHsM','swHsMB'].forEach(i=>{
    const e=document.getElementById(i);e.dataset.cv=0;if(e._ct){cancelAnimationFrame(e._ct);e._ct=0}});
  const T=[],D=[],P=[],M=[];
  openSwFolderView('sfA');
  for(let i=0;i<40;i++){await new Promise(r=>requestAnimationFrame(r));
    T.push(document.getElementById('swHsT').textContent);
    D.push(document.getElementById('swHsD').textContent);
    P.push(document.getElementById('swHsP').textContent);
    M.push(document.getElementById('swHsM').textContent)}
  await new Promise(r=>setTimeout(r,900));
  return {T:[...new Set(T)],D:[...new Set(D)],
    Pok:P.every(x=>x==='—'||/^\d+\.\d%$/.test(x)),
    Mmid:M.filter(x=>x.indexOf(',')>=0&&x!=='631,5'),
    fin:['swHsT','swHsD','swHsP','swHsM','swHsMB'].map(i=>document.getElementById(i).textContent)}});
ok('Сумын тоо бүхлээр гүйнэ',whole.T.every(x=>/^\d+$/.test(x)),whole.T.join(','));
ok('Дүнзний тоо бүхлээр гүйнэ',whole.D.every(x=>/^\d+$/.test(x)),whole.D.slice(0,6).join(',')+'…');
ok('Хувь зөв хэлбэртэй',whole.Pok);
ok('пог/м гүйх зуур бүхлээр',whole.Mmid.length===0,JSON.stringify(whole.Mmid.slice(0,3)));
ok('Эцсийн утга яг таг',JSON.stringify(whole.fin)===JSON.stringify(['2','160','7.1%','631,5','45']),JSON.stringify(whole.fin));

// ── Өөр паспорт руу шилжих ──
await page.evaluate(()=>openSwFolderView('sfB'));
await page.waitForTimeout(900);
hero=await page.evaluate(()=>['swHsT','swHsD','swHsP'].map(i=>document.getElementById(i).textContent.trim()));
ok('Өөр паспорт сонгоход дүн солигдов',hero[0]==='1',JSON.stringify(hero));

// ── Сум дээр дарж бүртгэл рүү орох, буцах ──
await page.evaluate(()=>{document.querySelector('#swTurnoutsGrid .sw-card').click()});
await page.waitForTimeout(600);
ok('Бүртгэлийн дэлгэц нээгдэв',await page.evaluate(()=>document.getElementById('swRecView').classList.contains('active')));
await page.evaluate(()=>swBackFromRec());
await page.waitForTimeout(800);
ok('Буцахад нүүр + паспорт нээлттэй',await page.evaluate(()=>
  document.getElementById('swHomeView').classList.contains('active')&&
  getComputedStyle(document.getElementById('swTurnoutsSection')).display==='block'));

// ── Хаах товч ──
await page.evaluate(()=>{const b=[...document.querySelectorAll('#swFolders button')].find(x=>/Хаах/.test(x.textContent));if(b)b.click()});
await page.waitForTimeout(600);
ok('Хаах товч ажиллав',await page.evaluate(()=>!swFolderId&&getComputedStyle(document.getElementById('swTurnoutsSection')).display==='none'));

// ── Арын товч ──
await page.evaluate(()=>openSwFolderView('sfA'));await page.waitForTimeout(700);
await page.evaluate(()=>_appBack());await page.waitForTimeout(500);
ok('Back → эхлээд паспортыг хаана',await page.evaluate(()=>!swFolderId&&document.getElementById('swHomeView').classList.contains('active')));
await page.evaluate(()=>_appBack());await page.waitForTimeout(600);
ok('Дахин Back → Дэр ПУ-5',await page.evaluate(()=>document.getElementById('homeView').classList.contains('active')));

console.log('\nERRORS:',JSON.stringify(errs.slice(0,3),null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
