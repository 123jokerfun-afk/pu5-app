const B=require('./base');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
await page.evaluate(()=>{
  const mk=(id,num,head,bad,repl)=>{const t={id,num,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head,it:'',dRepl:{}};
    let it='';for(let i=0;i<head+80;i++)it+=bad.includes(i)?'b':'n';t.it=it;
    (repl||[]).forEach(i=>{t.dRepl[i]={d:'2026-05-12',L:swSlot(t,i).len,o:1};t.it=t.it.slice(0,i)+'n'+t.it.slice(i+1)});return t};
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026'};
  DB.sw=[{id:'sfA',name:'Зун 2026 сумын паспорт',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[mk('sw1',1,4,[5,6,7,20,21,40,55,56,57,58],[5,6,20]),mk('sw2',3,3,[10,30,31,32,33,34,60],[30,31])]},
   {id:'sfB',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
    turnouts:[mk('sw9',7,2,[8,9,10],[])]}];
  saveDB();goSwHome()});
await page.waitForTimeout(1500);
const g=async()=>await page.evaluate(()=>({
  v:['swHsT','swHsD','swHsP','swHsM','swHsMB'].map(i=>document.getElementById(i).textContent.trim()),
  meta:document.getElementById('swHeroMeta').textContent.trim()}));
let s=await g();
ok('Паспорт хаалттай → бүгд 0',JSON.stringify(s.v)===JSON.stringify(['0','0','—','0','0']),JSON.stringify(s.v));
ok('Толгойд "бүх дүн" гэж бичихээ болив',!/бүх дүн/.test(s.meta),s.meta);

await page.evaluate(()=>openSwFolderView('sfA'));await page.waitForTimeout(1500);
s=await g();
ok('Паспорт дарахад тэр паспортын дүн',JSON.stringify(s.v)===JSON.stringify(['2','160','7.1%','631,5','45']),JSON.stringify(s.v));
ok('Толгойд паспортын нэр',/Зун 2026/.test(s.meta),s.meta);

// хаах — 0 руу БУУРЧ гүйх эсэх
const down=await page.evaluate(async()=>{
  const seen=[];closeSwFolder();
  for(let i=0;i<30;i++){await new Promise(r=>requestAnimationFrame(r));
    seen.push(document.getElementById('swHsD').textContent)}
  await new Promise(r=>setTimeout(r,900));
  return {seen:[...new Set(seen)],fin:['swHsT','swHsD','swHsP','swHsM','swHsMB']
    .map(i=>document.getElementById(i).textContent.trim())}});
ok('Хаахад 0 руу буурч гүйнэ',down.seen.length>3&&down.seen[0]!=='0',down.seen.slice(0,6).join(','));
ok('Хаасны дараа бүгд 0',JSON.stringify(down.fin)===JSON.stringify(['0','0','—','0','0']),JSON.stringify(down.fin));

// нөгөө паспорт
await page.evaluate(()=>openSwFolderView('sfB'));await page.waitForTimeout(1500);
s=await g();
ok('Өөр паспорт → өөрийнх нь дүн',s.v[0]==='1'&&s.v[1]==='80',JSON.stringify(s.v));
console.log('\nERRORS:',JSON.stringify(errs.slice(0,2)));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await br.close();
if(R.some(r=>!r.c))process.exit(1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
