/* БОДИТ ТОВШИЛТ: дэлгэц, цонх бүрийн товч бүрийг ҮНЭХЭЭР дарж үзнэ.
   Дарсны дараа: JS алдаа гарсан уу, апп зөв дэлгэц дээр үлдсэн үү,
   өгөгдөл бүтэн үү гэдгийг шалгана. */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const PROB=[];
(async()=>{
const br=await B.launch();const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
const setup=()=>page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true);
  window.showToast=()=>{};
  window.dlBlob=()=>{};                       // татаж авахыг чимээгүй болгоно
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
    turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/9',head:3,it,dRepl:{},dPlan:{5:3},slRepl:{},slPlan:{1:'wood'}},
              {id:'w2',num:2,mak:'Р-65',mark:'1/11',head:3,it,dRepl:{},dPlan:{},slRepl:{},slPlan:{}}],
    inc:[{id:'I1',d:'2026-05-01',items:[{L:3,n:8},{L:3.5,n:8}]}]}];
  swFolderId='W1';activeFolderId='F1';DB.tracks=DB.folders[0].tracks;
  _revTrk={};_revAsked={};saveDB();goHome()});
await setup();

// Устгах, гарах гэх мэт эргэж буцахгүй товчийг алгасна — тэднийг тусад нь шалгадаг
const SKIP=/устга|гарах|арилга|дахин татах|импорт|logout|delete/i;
async function clickAll(scope,label){
  const list=await page.evaluate(sel=>{
    const root=document.querySelector(sel);if(!root)return null;
    return [...root.querySelectorAll('button')].map((b,i)=>({
      i,txt:(b.textContent||'').replace(/\s+/g,' ').trim().slice(0,30),id:b.id||''}))
  },scope);
  if(!list){PROB.push(label+' — олдсонгүй');return 0}
  let n=0;
  for(const b of list){
    if(SKIP.test(b.txt)||SKIP.test(b.id))continue;
    const before=errs.length;
    try{
      await page.evaluate(({sel,i})=>{
        const root=document.querySelector(sel);if(!root)return;
        const el=[...root.querySelectorAll('button')][i];
        if(!el)return;
        const r=el.getBoundingClientRect();
        if(r.width<2||r.height<2)return;
        el.click()
      },{sel:scope,i:b.i});
    }catch(e){PROB.push(`${label} › ${b.txt||b.id} — ${String(e.message).slice(0,90)}`)}
    await page.waitForTimeout(90);
    const fresh=errs.slice(before).filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
    if(fresh.length)PROB.push(`${label} › ${b.txt||b.id} — ${fresh[0].slice(0,110)}`);
    // Апп амьд үлдсэн эсэх
    const alive=await page.evaluate(()=>{
      const v=document.querySelector('.view.active');
      return !!v&&(v.textContent||'').trim().length>3});
    if(!alive)PROB.push(`${label} › ${b.txt||b.id} — дэлгэц хоосорлоо`);
    n++
  }
  return n
}

let total=0;
/* ── Дэлгэцүүд ── */
const VIEWS=[
 ['#homeView','Нүүр',async()=>{await page.evaluate(()=>{goHome()})}],
 ['#trackView','Зам',async()=>{await page.evaluate(()=>{openTrack('T1',1)})}],
 ['#recordView','Бүртгэл',async()=>{await page.evaluate(()=>{openTrack('T1',1);openSection('S1')})}],
 ['#mainKmView','Гол зам',async()=>{await page.evaluate(()=>{openMainKmList()})}],
 ['#swHomeView','СШ нүүр',async()=>{await page.evaluate(()=>{goSwHome()})}],
 ['#swRecView','Сумын бүртгэл',async()=>{await page.evaluate(()=>{
    goSwHome();swTurnoutId='w1';showView('swRecView');renderSwRec()})}],
 ['#summaryView','Дүн',async()=>{await page.evaluate(()=>{showSummaryAll()})}],
];
for(const [sel,name,go] of VIEWS){
  await setup();await go();await page.waitForTimeout(340);
  total+=await clickAll(sel,name);
  await page.evaluate(()=>document.querySelectorAll('.overlay.open')
    .forEach(o=>o.classList.remove('open')))
}

/* ── Цонхнууд ── */
const MODALS=[
 ['addFolderModal','openAddFolder()'],['locModal','editLocation()'],
 ['rptModal','openRptSettings()'],['reportSettingsModal','openReportSettings()'],
 ['derIncModal','openDerInc()'],['derIncAddModal','openDerIncAdd()'],
 ['derOutModal','openDerOut()'],['threshModal','openThresholdExport()'],
 ['planRepModal','openPlanReport()'],['replReportModal','openReplReport()'],
 ['consecReportModal','openConsecReport()'],['carveReportModal','openCarveReport()'],
 ['pwaModal','pwaHowTo()'],['syncSheet','openSyncSheet()'],['profSheet','openProfSheet()'],
 ['addTrackModal','openTrack("T1",1);openAddTrack()'],
 ['addSecModal','openTrack("T1",1);openAddSection("normal")'],
 ['walkModal','openTrack("T1",1);askWalk()'],
 ['bulkModal','openTrack("T1",1);openSection("S1");openBulkModal()'],
 ['secTypeModal','openTrack("T1",1);openSection("S1");openSecType()'],
 ['editSleeperModal','openTrack("T1",1);openSection("S1");openEditSleeper(3)'],
 ['typeModal','openTrack("T1",1);openSection("S1");openEditSleeper(3);openTypeModal()'],
 ['planModal','openTrack("T1",1);openSection("S1");openEditSleeper(3);openPlanModal()'],
 ['replModal','openTrack("T1",1);openSection("S1");openEditSleeper(3);openReplModal()'],
 ['verifModal','openTrack("T1",1);openSection("S1");openVerifModal("S1")'],
 ['overrideModal','openTrack("T1",1);openOverrideModal("S1")'],
 ['addKmModal','openMainKmList();openAddKm()'],
 ['kmBulkModal','openMainKmList();openKmBulkModal()'],
 ['swFolderModal','goSwHome();openAddSwFolder()'],
 ['swTurnoutModal','goSwHome();openSwTurnout()'],
 ['swSpecModal','goSwHome();openSwSpecAdd()'],
 ['swIncModal','goSwHome();openSwInc()'],['swIncAddModal','goSwHome();openSwIncAdd()'],
 ['swOutModal','goSwHome();openSwOut()'],['swPlanRepModal','goSwHome();openSwPlanRep()'],
 ['swReplRepModal','goSwHome();openSwReplRep()'],['swRunRepModal','goSwHome();openSwRunRep()'],
 ['swRealRepModal','goSwHome();openSwRealRep()'],
 ['swDzModal','goSwHome();swTurnoutId="w1";showView("swRecView");renderSwRec();openSwDz(5)'],
 ['swPlanModal','goSwHome();swTurnoutId="w1";showView("swRecView");renderSwRec();openSwDz(5);openSwDzPlan()'],
 ['swDzReplModal','goSwHome();swTurnoutId="w1";showView("swRecView");renderSwRec();openSwDz(5);openSwDzRepl()'],
 ['swSlModal','goSwHome();swTurnoutId="w1";showView("swRecView");renderSwRec();openSwSl(1)'],
];
for(const [id,open] of MODALS){
  await setup();
  try{await page.evaluate(async c=>{await new Function('return (async()=>{'+c+'})()')()},open)}
  catch(e){PROB.push(id+' — нээхэд: '+String(e.message).slice(0,90));continue}
  await page.waitForTimeout(320);
  const isOpen=await page.evaluate(i=>{
    const e=document.getElementById(i);return !!e&&e.classList.contains('open')},id);
  if(!isOpen){PROB.push(id+' — нээгдсэнгүй');continue}
  total+=await clickAll('#'+id,id);
  await page.evaluate(()=>document.querySelectorAll('.overlay.open')
    .forEach(o=>o.classList.remove('open')))
}
ok(`${total} товч ҮНЭХЭЭР дарагдав — алдаа алга`,PROB.length===0,
   PROB.length?'\n      '+PROB.slice(0,10).join('\n      '):'');
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
