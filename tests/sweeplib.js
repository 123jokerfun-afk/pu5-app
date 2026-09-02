/* ══════════════════════════════════════════════════════════════
   ТӨХӨӨРӨМЖИЙН SWEEP — хуваалцсан бие

   sweepA (эхний 4 утас) · sweepB (үлдсэн 3) · sweepC (хэвтээ ба
   гэрэлтэй загвар) гурвуулаа үүнийг дуудна. Дэлгэцийн жагсаалт нэг
   газар байснаар шинэ дэлгэц нэмэхэд гурвуулаад нь орно.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');

const SCREENS=[
  ['Нүүр',            ()=>{goHome()}],
  ['Паспорт нээсэн',  ()=>{openFolder('f-test1')}],
  ['Замын дэлгэц',    ()=>{openFolder('f-test1');openTrack('t1')}],
  ['Бүртгэл',         ()=>{openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)}],
  ['Гол зам жагсаалт',()=>{goHome();openMainKmList()}],
  ['Гол замын км',    ()=>{goHome();openMainKmList();openTrack(DB.main[0].id)}],
  ['Хураангуй',       ()=>{goHome();openFolder('f-test1');showSummaryAll()}],
  ['СШ нүүр',         ()=>{goSwHome()}],
  ['СШ паспорт нээсэн',()=>{goSwHome();openSwFolderView('sf1')}],
  ['СШ бүртгэл',      ()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1')}],
  ['Нэвтрэх',         ()=>{showView('loginView')}],
];
const MODALS=[
  ['Солигдсон дэр',   ()=>{goHome();openFolder('f-test1');openReplReport()}],
  ['Дараалсан цэг',   ()=>{goHome();openFolder('f-test1');openConsecReport()}],
  ['Сийрэгжилт',      ()=>{goHome();openFolder('f-test1');openCarveReport()}],
  ['Дэр засах',       ()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5)}],
  ['Төрөл',           ()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5);openTypeModal()}],
  ['Солих огноо',     ()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5);openReplModal()}],
  ['Үе нэмэх',        ()=>{goHome();openFolder('f-test1');openTrack('t1');openAddSection('normal')}],
  ['Зам нэмэх',       ()=>{goHome();openFolder('f-test1');openAddTrack()}],
  ['Паспорт нэмэх',   ()=>{goHome();openAddFolder()}],
  ['Км нэмэх',        ()=>{goHome();openMainKmList();openAddKm()}],
  ['СШ сум нэмэх',    ()=>{goSwHome();openSwFolderView('sf1');openSwTurnout()}],
  ['СШ дүнз',         ()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1');openSwDz(6)}],
  ['СШ дүнз солих',   ()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1');openSwDz(6);openSwDzRepl()}],
  ['СШ сольсон дүнз', ()=>{goSwHome();openSwFolderView('sf1');openSwReplRep()}],
  ['СШ дараалсан',    ()=>{goSwHome();openSwFolderView('sf1');openSwRunRep()}],
  ['СШ бодит',        ()=>{goSwHome();openSwFolderView('sf1');openSwRealRep()}],
  ['СШ загвар нэмэх', ()=>{goSwHome();openSwSpecAdd()}],
  ['Рам дэр',         ()=>{goSwHome();openSwFolderView('sf1');openSwRec('sw1');openSwSl(1)}],
  ['Профайл',         ()=>{goHome();openProfSheet()}],
  ['Мэдэгдэл',        ()=>{goHome();openSyncSheet()}],
  ['Суулгах заавар',  ()=>{goHome();pwaHowTo()}],
];

/* devices — B.DEVICES-ийн дэд олонлог
   opts.landscape — өргөн/өндрийг сольж хэвтээ болгоно
   opts.light     — гэрэлтэй загвараар шалгана
   opts.tag       — гарцын нэрэнд нэмэх тэмдэг                      */
async function sweep(devices,opts){
  opts=opts||{};
  const OUT=[];
  const browser=await B.launch();
  for(const d of devices){
    const dev=opts.landscape
      ? Object.assign({},d,{vp:{width:d.vp.height,height:d.vp.width}})
      : d;
    const {page,errs,ctx}=await B.newPage(browser,dev);
    const probs=[];
    await B.login(page,'ПД-6');
    await S.seed(page);
    if(opts.light)await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
    // сумын өгөгдөл
    await page.evaluate(()=>{
      DB.sw=[{id:'sf1',name:'Хавар 2026 сумын паспорт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
        turnouts:[{id:'sw1',num:1,station:'Багануур',mak:'Р-65',mark:'1/11',proj:'2764',head:4,
          it:'nnnnnnbbbnnnnnnnnnnnnnnnnnnnnnnnnnnnn',dRepl:{8:{d:'2026-05-01',L:3.25,o:1}},slRepl:{}},
         {id:'sw2',num:2,station:'Багануур',mak:'Р-50',mark:'1/11',proj:'2642',head:3,it:'nnnbbbbnnnn'}]}];
      saveDB();
    });
    for(const [nm,fn] of [...SCREENS,...MODALS]){
      try{
        await page.evaluate(`(${fn.toString()})()`);
      }catch(e){probs.push({s:nm,type:'THROW',msg:e.message.split('\n')[0]});continue}
      await page.waitForTimeout(700);
      const ov=await B.overflow(page);
      if(ov.length)probs.push({s:nm,type:'OVERFLOW',items:ov.slice(0,3)});
      const tt=await B.tapTargets(page);
      if(tt.length)probs.push({s:nm,type:'SMALL-TAP',items:tt.slice(0,3)});
      // текст таслагдсан эсэх (clipped)
      const clip=await page.evaluate(()=>{
        const out=[];
        document.querySelectorAll('.view.active *, .overlay.open *').forEach(el=>{
          if(el.children.length)return;
          const cs=getComputedStyle(el);
          if(cs.display==='none')return;
          if(el.scrollWidth>el.clientWidth+2&&cs.overflow!=='visible'&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.textOverflow!=='ellipsis')
            out.push({cls:(el.className||'').toString().slice(0,36),sw:el.scrollWidth,cw:el.clientWidth,t:(el.textContent||'').trim().slice(0,26)})
        });
        const s=new Set(),o=[];out.forEach(x=>{const k=x.cls+x.t;if(s.has(k))return;s.add(k);o.push(x)});
        return o.slice(0,6)
      });
      if(clip.length)probs.push({s:nm,type:'CLIP',items:clip});
      // цонх хаах
      await page.evaluate(()=>{document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'))});
    }
    // ── Удирдлагын дэлгэц: үүлэнд өгөгдөл хэрэгтэй ──
    try{
      await page.evaluate(async()=>{
        const mk=(id,lbl,n,bad)=>({id,type:'normal',label:lbl,note:'',date:'2026-05-01',
          sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
        const y=String(new Date().getFullYear());
        const db={location:'Шивээговь',v:3,rpt:{},main:[],tracks:[],folders:[
          {id:'fs',name:'Хавар',season:'хавар',year:y,date:y+'-04-01',
           tracks:[{id:'t1',num:1,kind:'station',sections:[
             mk('s1','1-р үе',46,Array.from({length:14},(_,i)=>i*3)),
             mk('s2','2-р үе',46,[10,11,12])]}]}]};
        const col=fbDb.collection('sections').doc('ПД-6').collection(PARTS_COL);
        const parts=_splitDB(_packDB(db));
        const b=fbDb.batch();
        Object.keys(parts).forEach(k=>b.set(col.doc(k),parts[k]));
        await b.commit();
        await fbDb.collection('sections').doc('ПД-6').set({archivedAt:Date.now()});
        _isAdmin=true;_sectionCode='ADMIN';goTab('home');
      });
      await page.waitForTimeout(1600);
      // Хэсэг ба доторх гурван хавтсыг дэлгэнэ
      await page.evaluate(()=>{
        const n=document.querySelectorAll('.adm-sec').length;
        for(let i=0;i<n;i++){admToggle('s'+i);admToggle('s'+i+'c');
          admToggle('s'+i+'r');admToggle('s'+i+'p')}
      });
      await page.waitForTimeout(800);
      const ov=await B.overflow(page);
      if(ov.length)probs.push({s:'Удирдлага',type:'OVERFLOW',items:ov.slice(0,3)});
      const tt=await B.tapTargets(page);
      if(tt.length)probs.push({s:'Удирдлага',type:'SMALL-TAP',items:tt.slice(0,3)});
    }catch(e){probs.push({s:'Удирдлага',type:'THROW',msg:(e.message||'').split('\n')[0]})}

    const nm=dev.name+(opts.tag?' '+opts.tag:'');
    OUT.push({dev:nm,errs:errs.slice(0,5),probs});
    console.log('══ '+nm+' ══  errors:'+errs.length+'  problems:'+probs.length);
    probs.forEach(p=>console.log('   ['+p.type+'] '+p.s+'  '+JSON.stringify(p.items||p.msg)));
    errs.slice(0,5).forEach(e=>console.log('   !! '+e.split('\n')[0]));
    await ctx.close();
  }
  await browser.close();
  return OUT
}
module.exports={sweep,SCREENS,MODALS};
