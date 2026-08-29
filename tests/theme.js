const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
const SCREENS=[
 ['Нүүр',()=>{goHome()}],
 ['Паспорт нээсэн',()=>{openFolder('f-test1')}],
 ['Замын дэлгэц',()=>{openFolder('f-test1');openTrack('t1')}],
 ['Бүртгэл',()=>{openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)}],
 ['Гол зам',()=>{goHome();openMainKmList()}],
 ['Хураангуй',()=>{goHome();openFolder('f-test1');showSummaryAll()}],
 ['СШ нүүр',()=>{goSwHome()}],
 ['СШ паспорт',()=>{goSwHome();openSwFolderView('sf1')}],
 ['СШ бүртгэл',()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1')}],
 ['Дэр засах',()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5)}],
 ['Солих огноо',()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5);openReplModal()}],
 ['Сийрэгжилт',()=>{goHome();openFolder('f-test1');openCarveReport()}],
 ['Дараалсан цэг',()=>{goHome();openFolder('f-test1');openConsecReport()}],
 ['СШ дүнз солих',()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1');openSwDz(6);openSwDzRepl()}],
 ['СШ загвар нэмэх',()=>{goSwHome();openSwSpecAdd()}],
];
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const mk=(id,num,head,bad,repl)=>{const t={id,num,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head,it:'',dRepl:{}};
    let it='';for(let i=0;i<head+80;i++)it+=bad.includes(i)?'b':'n';t.it=it;
    (repl||[]).forEach(i=>{t.dRepl[i]={d:'2026-05-12',L:swSlot(t,i).len,o:1};t.it=t.it.slice(0,i)+'n'+t.it.slice(i+1)});return t};
  DB.sw=[{id:'sf1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[mk('sw1',1,4,[5,6,7,20,21,40],[5,6])]}];saveDB()});

// ── 1. Сэлгэлт ──
await page.evaluate(()=>applyTheme('light'));await page.waitForTimeout(200);
ok('Гэрэлтэй анхдагч',await page.evaluate(()=>document.documentElement.getAttribute('data-theme')==='light'));
await page.evaluate(()=>toggleTheme());await page.waitForTimeout(300);
ok('Товч дарахад харанхуй',await page.evaluate(()=>document.documentElement.getAttribute('data-theme')==='dark'));
ok('theme-color шинэчлэгдэв',await page.evaluate(()=>document.querySelector('meta[name="theme-color"]').content==='#1B1046'),
   await page.evaluate(()=>document.querySelector('meta[name="theme-color"]').content));
ok('Сонголт утсанд хадгалагдав',await page.evaluate(()=>localStorage.getItem('sg_der_theme')==='dark'));
await page.reload({waitUntil:'load'});await page.waitForTimeout(1200);
ok('Дахин нээхэд харанхуй хэвээр',await page.evaluate(()=>document.documentElement.getAttribute('data-theme')==='dark'));
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const mk=(id,num,head,bad,repl)=>{const t={id,num,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head,it:'',dRepl:{}};
    let it='';for(let i=0;i<head+80;i++)it+=bad.includes(i)?'b':'n';t.it=it;
    (repl||[]).forEach(i=>{t.dRepl[i]={d:'2026-05-12',L:swSlot(t,i).len,o:1};t.it=t.it.slice(0,i)+'n'+t.it.slice(i+1)});return t};
  DB.sw=[{id:'sf1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[mk('sw1',1,4,[5,6,7,20,21,40],[5,6])]}];saveDB();
  const e=document.getElementById('errBanner');if(e)e.remove()});

// ── 2. Харанхуйд цайрч үлдсэн гадаргуу байгаа эсэх ──
const bright=[];
for(const [nm,fn] of SCREENS){
  try{await page.evaluate(`(${fn.toString()})()`)}catch(e){continue}
  await page.waitForTimeout(420);
  const b=await page.evaluate(()=>{
    const L=s=>{const m=(s||'').match(/[\d.]+/g);if(!m)return null;
      if(m.length>3&&+m[3]<0.5)return null;            // маш тунгалаг — алгасна
      const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
      return .2126*f(+m[0])+.7152*f(+m[1])+.0722*f(+m[2])};
    const out=[];
    document.querySelectorAll('.view.active *,.overlay.open *').forEach(el=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      const r=el.getBoundingClientRect();
      if(r.width<24||r.height<12||r.bottom<0||r.top>innerHeight)return;
      const lum=L(cs.backgroundColor);
      if(lum!==null&&lum>0.55)                          // цайвар гадаргуу
        out.push({cls:(el.className||'').toString().slice(0,34)||el.tagName,
                  bg:cs.backgroundColor,t:(el.textContent||'').trim().slice(0,18)});
    });
    const s=new Set(),o=[];out.forEach(x=>{const k=x.cls+x.t;if(s.has(k))return;s.add(k);o.push(x)});
    return o.slice(0,4)});
  if(b.length)bright.push({nm,b});
  await page.evaluate(()=>{document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'))});
}
ok('Харанхуйд цайрсан гадаргуу алга',bright.length===0,
   bright.map(x=>x.nm+':'+JSON.stringify(x.b)).join(' | ').slice(0,400));

// ── 3. Гэрэлтэй загвар хэвээрээ ──
await page.evaluate(()=>{applyTheme('light');goHome()});await page.waitForTimeout(400);
ok('Гэрэлтэй загварт буцаж болно',await page.evaluate(()=>
  getComputedStyle(document.body).backgroundColor!=='rgb(8, 11, 24)'&&
  document.documentElement.getAttribute('data-theme')==='light'));
console.log('\nERRORS:',JSON.stringify(errs.slice(0,3)));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await br.close();
if(R.some(r=>!r.c))process.exit(1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
