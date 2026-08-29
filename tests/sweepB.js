const B=require('./base'),S=require('./seed');
const OUT=[];
(async()=>{
const browser=await B.launch();
for(const dev of B.DEVICES.slice(4)){
  const {page,errs,ctx}=await B.newPage(browser,dev);
  const probs=[];
  await B.login(page,'ПД-6');
  await S.seed(page);
  // сумын өгөгдөл
  await page.evaluate(()=>{
    DB.sw=[{id:'sf1',name:'Хавар 2026 сумын паспорт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      turnouts:[{id:'sw1',num:1,station:'Багануур',mak:'Р-65',mark:'1/11',proj:'2764',head:4,
        it:'nnnnnnbbbnnnnnnnnnnnnnnnnnnnnnnnnnnnn',dRepl:{8:{d:'2026-05-01',L:3.25,o:1}},slRepl:{}},
       {id:'sw2',num:2,station:'Багануур',mak:'Р-50',mark:'1/11',proj:'2642',head:3,it:'nnnbbbbnnnn'}]}];
    saveDB();
  });
  const screens=[
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
  ];
  const modals=[
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
  ];
  for(const [nm,fn] of [...screens,...modals]){
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
  OUT.push({dev:dev.name,errs:errs.slice(0,5),probs});
  console.log('══ '+dev.name+' ══  errors:'+errs.length+'  problems:'+probs.length);
  probs.forEach(p=>console.log('   ['+p.type+'] '+p.s+'  '+JSON.stringify(p.items||p.msg)));
  errs.slice(0,5).forEach(e=>console.log('   !! '+e.split('\n')[0]));
  await ctx.close();
}
require('fs').writeFileSync(__dirname+'/sweep.json',JSON.stringify(OUT,null,1));
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
