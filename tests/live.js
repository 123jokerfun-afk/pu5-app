/* АМЬДРАЛЫН МӨЧЛӨГ: ачаалалт → ажил → дахин ачаалалт → экспорт.
   Утас унтарч асахад өгөгдөл бүтэн үлдэх нь ПУ-5-д хамгийн чухал. */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('./node_modules/exceljs')}catch(e){}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
const quiet=()=>page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true);
  window.__b64=null;
  window.dlBlob=function(blob,name){
    return new Promise(r=>{const fr=new FileReader();
      fr.onload=()=>{window.__b64={name,d:String(fr.result).split(',')[1]};r()};
      fr.readAsDataURL(blob)})}});
await quiet();

/* ── 1. Ажил хийгээд ДАХИН АЧААЛНА ── */
console.log('\nДахин ачаалалт');
await page.evaluate(()=>{
  const mk=(id,lab,n,bad)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01',sign:'Б.Болд'};
  DB.folders=[{id:'F1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'T1',num:2,kind:'station',note:'',sections:[
      mk('S1','1-р үе',12,[0,1,2,5]),mk('S2','2-р үе',10,[3,4,5])]}]}];
  DB.main=[{id:'M1',num:681,kind:'main',mat:'tbd',sections:[mk('S6','1-р үе',10,[4])]}];
  DB.sinc=[{id:'D1',d:'2026-05-01',n:120}];
  DB.folders[0].tracks[0].sections[0].plan={0:'tbd',5:'wood'};
  DB.folders[0].tracks[0].sections[0].repl={1:{d:'2026-06-01',t:'normal',m:'wood'}};
  let it='nnn';for(let i=0;i<30;i++)it+=[0,1,2,9].includes(i)?'b':'n';
  DB.sw=[{id:'W1',name:'Хавар сум',season:'хавар',year:'2026',date:'2026-04-10',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/9',head:3,it,dRepl:{},dPlan:{5:3},slRepl:{},slPlan:{1:'wood'}}],
    inc:[{id:'I1',d:'2026-05-01',items:[{L:3,n:8},{L:3.5,n:8}]}]}];
  swFolderId='W1';activeFolderId='F1';DB.tracks=DB.folders[0].tracks;saveDB()});
const before=await page.evaluate(()=>({
  sl:DB.folders[0].tracks[0].sections[0].sleepers.map(s=>s.type).join(','),
  plan:JSON.stringify(DB.folders[0].tracks[0].sections[0].plan),
  repl:JSON.stringify(DB.folders[0].tracks[0].sections[0].repl),
  sinc:derIncN(),inc:JSON.stringify((DB.sw[0]||{}).inc||[]),
  dPlan:JSON.stringify(DB.sw[0].turnouts[0].dPlan),
  slPlan:JSON.stringify(DB.sw[0].turnouts[0].slPlan)}));
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
await B.login(page,'ПД-6');          // дахин ачаалахад нэвтрэлт шаардана
await quiet();
const after=await page.evaluate(()=>({
  sl:DB.folders[0].tracks[0].sections[0].sleepers.map(s=>s.type).join(','),
  plan:JSON.stringify(DB.folders[0].tracks[0].sections[0].plan),
  repl:JSON.stringify(DB.folders[0].tracks[0].sections[0].repl),
  sinc:derIncN(),inc:JSON.stringify((DB.sw[0]||{}).inc||[]),
  dPlan:JSON.stringify(DB.sw[0].turnouts[0].dPlan),
  slPlan:JSON.stringify(DB.sw[0].turnouts[0].slPlan),
  view:(document.querySelector('.view.active')||{}).id}));
ok('Дахин ачаалахад дэрүүд бүтэн',after.sl===before.sl,after.sl.slice(0,50));
ok('Төлөвлөгөө, солилт бүтэн',after.plan===before.plan&&after.repl===before.repl,
   after.plan+' · '+after.repl);
ok('Дэрийн агуулах бүтэн',after.sinc===before.sinc,String(after.sinc));
ok('Дүнзний агуулах, төлөвлөгөө бүтэн',
   after.inc===before.inc&&after.dPlan===before.dPlan&&after.slPlan===before.slPlan,
   after.inc+' · '+after.dPlan+' · '+after.slPlan);
ok('Апп нүүр хуудсан дээр нээгдэв',after.view==='homeView'||after.view==='loginView',after.view);

/* ── 2. Ухарсан хэвээр унтарсан бол ачаалахдаа ӨӨРӨӨ эргүүлнэ ── */
console.log('\nУнасан үеийн засвар');
await page.evaluate(()=>{
  // Апп унасан мэт: үе эргэсэн, rw тэмдэгтэй хэвээр хадгалагдав
  const s=DB.folders[0].tracks[0].sections[0];
  s.sleepers.reverse();s.rw=1;saveDB()});
const crash=await page.evaluate(()=>DB.folders[0].tracks[0].sections[0].sleepers.map(x=>x.type).join(','));
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
await B.login(page,'ПД-6');
await quiet();
const fixed=await page.evaluate(()=>{
  const s=DB.folders[0].tracks[0].sections[0];
  return{sl:s.sleepers.map(x=>x.type).join(','),rw:!!s.rw}});
ok('Ачаалахдаа эргэсэн үеийг өөрөө засна',
   fixed.sl===before.sl&&!fixed.rw,fixed.sl.slice(0,50)+' · rw='+fixed.rw);
ok('Засахаасаа өмнө үнэхээр эргэсэн байсан',crash!==before.sl,crash.slice(0,40));

/* ── 3. Бүх экспорт ── */
if(ExcelJS){
  console.log('\nБүх экспорт');
  // Дахин ачаалсны дараа идэвхтэй паспорт байхгүй тул сэргээнэ
  await page.evaluate(()=>{
    const f=(DB.folders||[])[0];
    if(f){activeFolderId=f.id;DB.tracks=f.tracks}
    const w=(DB.sw||[])[0];if(w)swFolderId=w.id;
    saveDB();goHome()});
  await page.waitForTimeout(300);
  const grab=async(call,label)=>{
    await page.evaluate(async c=>{window.__b64=null;
      await new Function('return (async()=>{'+c+'})()')()},call);
    try{await page.waitForFunction(()=>window.__b64,{timeout:45000})}
    catch(e){ok(label,false,'файл гарсангүй');return null}
    const r=await page.evaluate(()=>window.__b64);
    try{
      if(/\.csv$/i.test(r.name)){
        const txt=Buffer.from(r.d,'base64').toString('utf8');
        ok(label,txt.split('\n').length>2,`${r.name} · ${txt.split('\n').length} мөр`);
        return null}
      const wb=new ExcelJS.Workbook();
      await wb.xlsx.load(Buffer.from(r.d,'base64'));
      ok(label,wb.worksheets.length>0,`${r.name} · ${wb.worksheets.length} хуудас`);
      return wb
    }catch(e){ok(label,false,'нээгдсэнгүй: '+String(e.message).slice(0,60));return null}
  };
  await grab("exportPu5Book('folder')",'ПУ-5 дэвтэр — паспорт');
  await grab("exportPu5Book('main')",'ПУ-5 дэвтэр — гол зам');
  await grab("exportPlanForm()",'Төлөвлөгөө');
  await page.evaluate(()=>{ // сийрэгжилт гаргахын тулд дараалсан цэгээс сольсон дэр хэрэгтэй
    const s=DB.folders[0].tracks[0].sections[0];
    s.repl={2:{d:'2026-06-01',t:'normal',m:'wood',s:1,o:1}};saveDB()});
  await grab("exportCarveForm()",'Сийрэгжилт (Маягт-1 Хавсралт-4)');
  await grab("exportSwForms()",'Дүнзний маягт (Маягт-2)');
  await page.evaluate(()=>{openThresholdExport()});
  await page.waitForTimeout(250);
  await grab("saveRptAndExport()",'Excel (босго тохируулаад)');
  await grab("exportAllCSV()",'CSV');
}

/* ── 4. Офлайн ── */
console.log('\nОфлайн');
await page.context().setOffline(true);
const off=await page.evaluate(async()=>{
  try{
    openTrack('T1',1);await new Promise(r=>setTimeout(r,200));
    openSection('S1');await new Promise(r=>setTimeout(r,260));
    await record('bad');await new Promise(r=>setTimeout(r,200));
    saveDB();
    return{n:activeSec().sleepers.length,
      ls:!!localStorage.getItem('sg_der_v3_ПД-6'),
      view:(document.querySelector('.view.active')||{}).id}
  }catch(e){return{err:String(e.message)}}});
await page.context().setOffline(false);
ok('Офлайнд бүртгэл хийгдэнэ',!off.err&&off.view==='recordView'&&off.n===13,JSON.stringify(off));
ok('Офлайнд утсанд хадгалагдана',!!off.ls,String(off.ls));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js|net::ERR/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
