/* Санамсаргүй үйлдлийн дараалал + ТОГТМОЛУУДЫГ алхам бүрд шалгана.
   Үр дүн давтагдахын тулд үрсэлсэн санамсаргүй тоо ашиглана. */
const B=require('./base'),S=require('./seed');
const SEED=Number(process.argv[2]||1), STEPS=Number(process.argv[3]||160);
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true);
  window.showToast=()=>{};                       // тостыг чимээгүй болгоно
});

await page.evaluate(()=>{
  const mk=(id,lab,n,bad)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[
    {id:'F1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
     tracks:[{id:'T1',num:2,kind:'station',note:'',sections:[
        mk('S1','1-р үе',12,[0,1,5]),mk('S2','2-р үе',10,[3,4,5]),mk('S3','3-р үе',8,[])]},
             {id:'T2',num:3,kind:'station',note:'',sections:[mk('S4','1-р үе',6,[2])]}]},
    {id:'F2',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
     tracks:[{id:'T3',num:2,kind:'station',note:'',sections:[mk('S5','1-р үе',9,[1,2])]}]}];
  DB.main=[{id:'M1',num:681,kind:'main',mat:'tbd',sections:[mk('S6','1-р үе',10,[4])]}];
  DB.sinc=[{id:'D1',d:'2026-05-01',n:120}];
  let it='nnn';for(let i=0;i<30;i++)it+=[0,1,2,9].includes(i)?'b':'n';
  DB.sw=[{id:'W1',name:'Хавар сум',season:'хавар',year:'2026',date:'2026-04-10',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/9',head:3,it,dRepl:{},dPlan:{},slRepl:{},slPlan:{}},
              {id:'w2',num:2,mak:'Р-65',mark:'1/11',head:3,it,dRepl:{},dPlan:{},slRepl:{},slPlan:{}}],
    inc:[{id:'I1',d:'2026-05-01',items:[{L:3,n:8},{L:3.5,n:8},{L:5.5,n:4}]}]}];
  swFolderId='W1';activeFolderId='F1';DB.tracks=DB.folders[0].tracks;
  _revTrk={};_revAsked={};saveDB();goHome()});

/* ── Тогтмолууд ── */
const check=()=>page.evaluate(()=>{
  const bad=[];
  const secs=[];
  (DB.folders||[]).forEach(f=>(f.tracks||[]).forEach(t=>(t.sections||[]).forEach(s=>secs.push([f.name,t.id,s]))));
  (DB.main||[]).forEach(t=>(t.sections||[]).forEach(s=>secs.push(['гол зам',t.id,s])));
  const inRec=(document.querySelector('.view.active')||{}).id==='recordView';
  secs.forEach(([fn,tid,s])=>{
    const n=(s.sleepers||[]).length;
    ['repl','plan'].forEach(k=>{
      Object.keys(s[k]||{}).forEach(x=>{
        const i=parseInt(x,10);
        if(isNaN(i)||i<0||i>=n)bad.push(`${tid}/${s.label}.${k}[${x}] — ${n} дэртэй`)})});
    // Ухарсан тэмдэг зөвхөн бүртгэлийн дэлгэц дээр байж болно
    if(s.rw&&!inRec)bad.push(`${tid}/${s.label} — бүртгэлээс гарсан ч rw үлдсэн`);
    if(!Array.isArray(s.sleepers))bad.push(`${tid}/${s.label} — sleepers массив биш`);
  });
  (DB.sw||[]).forEach(f=>(f.turnouts||[]).forEach(t=>{
    const n=(t.it||'').length,head=t.head||0;
    ['dRepl','dPlan'].forEach(k=>Object.keys(t[k]||{}).forEach(x=>{
      const i=parseInt(x,10);
      if(isNaN(i)||i<head||i>=n)bad.push(`сум${t.num}.${k}[${x}] — head ${head}, урт ${n}`)}));
    ['slRepl','slPlan'].forEach(k=>Object.keys(t[k]||{}).forEach(x=>{
      const i=parseInt(x,10);
      if(isNaN(i)||i<0||i>=Math.max(head,1))bad.push(`сум${t.num}.${k}[${x}] — рам зам ${head}`)}));
  }));
  // Агуулахын тэнцэл
  if(derStock()!==derIncN()-derOutN())bad.push('дэрийн үлдэгдэл зөрүүтэй');
  const st=swStock(),inc=swIncBy(),out=swOutBy();
  Object.keys(st).forEach(L=>{
    if(st[L]!==(inc[L]||0)-(out[L]||0))bad.push('дүнзний үлдэгдэл зөрүүтэй: '+L)});
  // Шахалт → задаргаа
  try{
    const p=_packDB(DB);
    const u=_unpackDB(JSON.parse(JSON.stringify(p)));
    let a=0,b=0;
    (DB.folders||[]).forEach(f=>(f.tracks||[]).forEach(t=>(t.sections||[]).forEach(s=>a+=(s.sleepers||[]).length)));
    (u.folders||[]).forEach(f=>(f.tracks||[]).forEach(t=>(t.sections||[]).forEach(s=>b+=(s.sleepers||[]).length)));
    if(a!==b)bad.push(`шахалт: ${a} → ${b} дэр`);
  }catch(e){bad.push('шахалт унав: '+e.message)}
  // Тоолуурууд дэлгэц дээр
  try{planTotalCount();swPlanTotal();collectPlan();collectSwPlan();derOutRows()}
  catch(e){bad.push('тоолуур унав: '+e.message)}
  return bad});

/* ── Үйлдлүүд ── */
const OPS=[
 'goHome();',
 'openFolder(DB.folders[_r(DB.folders.length)].id);',
 'closeFolder();',
 'if(DB.tracks.length)openTrack(DB.tracks[_r(DB.tracks.length)].id,1);',
 'if(activeTrack()&&activeTrack().sections.length)openSection(activeTrack().sections[_r(activeTrack().sections.length)].id);',
 'if(activeTrack())pickWalk(_r(2)===1);',
 'if(activeSec())navNextSection();',
 'if(activeSec())navPrevSection();',
 'if(activeSec())await record(["normal","bad","tbd","bad_tbd"][_r(4)]);',
 'if(activeSec()&&activeSec().sleepers.length)undoLast();',
 'if(activeSec()&&activeSec().sleepers.length){editIdx=_r(activeSec().sleepers.length);openTypeModal();editSleeper(["normal","bad","tbd","bad_tbd"][_r(4)]);}',
 'if(activeSec()&&activeSec().sleepers.length){editIdx=_r(activeSec().sleepers.length);_replY=2026;_replM=1+_r(12);_replD=1+_r(28);openReplModal();await saveRepl(_r(2)?"normal":"tbd");}',
 'if(activeSec()&&activeSec().sleepers.length){editIdx=_r(activeSec().sleepers.length);openReplModal();clearRepl();}',
 'if(activeSec()&&activeSec().sleepers.length){editIdx=_r(activeSec().sleepers.length);openPlanModal();savePlan(_r(2)?"wood":"tbd");}',
 'if(activeSec()&&activeSec().sleepers.length){editIdx=_r(activeSec().sleepers.length);openPlanModal();clearPlan();}',
 'if(activeSec()&&activeSec().sleepers.length>1){editIdx=_r(activeSec().sleepers.length);await deleteSleeper();}',
 'if(activeSec()){document.getElementById("bulkN").value=_r(20);await applyBulk();}',
 'if(activeTrack())navTrk(_r(2)?1:-1);',
 'goSwHome();',
 'if(swFolder()&&swFolder().turnouts.length){swTurnoutId=swFolder().turnouts[_r(swFolder().turnouts.length)].id;showView("swRecView");renderSwRec();}',
 'if(swTurnout()){swTap(_r((swTurnout().it||"").length));}',
 'if(swTurnout()&&(swTurnout().it||"").length>4){openSwDz(3+_r(10));}',
 'if(swTurnout()){_swDzIdx=(swTurnout().head||0)+_r(8);openSwDzRepl();if(_modalOpen("swDzReplModal"))saveSwDzRepl();}',
 'if(swTurnout()){_swDzIdx=(swTurnout().head||0)+_r(8);openSwDzPlan();if(_modalOpen("swPlanModal"))saveSwDzPlan();}',
 'if(swTurnout()){_swDzIdx=(swTurnout().head||0)+_r(8);clearSwDzPlan();}',
 'if(swTurnout()&&swTurnout().head){_swSlIdx=_r(swTurnout().head);openSwSl(_swSlIdx);openSwSlPlan();savePlan(_r(2)?"wood":"tbd");}',
 'if(swTurnout()&&swTurnout().head){_swSlIdx=_r(swTurnout().head);openSwSlRepl();await saveRepl("normal");}',
 'if(swTurnout()){swUndo();}',
 'openDerInc();openDerIncAdd();document.getElementById("derIncN").value=1+_r(50);saveDerInc();',
 'if(derInc().length)await delDerInc(derInc()[_r(derInc().length)].id);',
 'openSwInc();openSwIncAdd();_incL=SW_LENS[_r(SW_LENS.length)];_incN=1+_r(5);_incAdd();saveSwInc();',
 'openPlanReport();',
 'openSwPlanRep();',
 'openDerOut();',
 'openSwOut();',
 'openReplReport();',
 'openConsecReport();',
 'goDerHome();',
 'goTab(["home","pass","sw"][_r(3)]);',
 'showSummaryAll();',
 'document.querySelectorAll(".overlay.open").forEach(o=>o.classList.remove("open"));',
];
await page.evaluate(s=>{window.__seed=s;window._r=n=>{
  // xorshift — үрээс хамаарсан давтагдах санамсаргүй
  window.__seed^=window.__seed<<13;window.__seed^=window.__seed>>>17;window.__seed^=window.__seed<<5;
  return Math.abs(window.__seed)%Math.max(1,n)}},SEED);

let firstFail=null,done=0;
for(let k=0;k<STEPS;k++){
  const pick=await page.evaluate(ops=>ops[_r(ops.length)],OPS);
  try{
    await page.evaluate(async c=>{
      await new Function('return (async()=>{'+c+'})()')()
    },pick);
  }catch(e){
    if(!firstFail)firstFail={step:k,op:pick,err:String(e.message||e).slice(0,200)};
    break
  }
  await page.waitForTimeout(30);
  const bad=await check();
  if(bad.length){
    if(!firstFail)firstFail={step:k,op:pick,err:'ТОГТМОЛ ЭВДРЭВ: '+bad.slice(0,3).join(' ; ')};
    break
  }
  done++
}
ok(`${done}/${STEPS} алхам (үр ${SEED}) — тогтмолууд хэвээр`,!firstFail,
   firstFail?`алхам ${firstFail.step}\n      үйлдэл: ${firstFail.op}\n      ${firstFail.err}`:'');
const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
