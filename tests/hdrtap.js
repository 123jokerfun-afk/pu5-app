/* ══════════════════════════════════════════════════════════════
   ТОЛГОЙН ТОВЧ ЗӨВ ТОВЧ ДАРАГДАХ УУ — 7 утас, CDP touch

   v205 хүртэл Galaxy Fold (280px) дээр замын дэлгэцийн "эхнээс →"
   товч дарахад "Дүн" нээгддэг байв. Шалтгаан хоёр давхар:
   1. Толгойн мөр 280px-д багтдаггүй (Буцах + гарчиг + 3 товч ≈ 340px),
      товчнууд дэлгэцээс гарч, агших ёстой байдалд байлаа.
   2. initRipple() дарах мөчид товч дээр overflow:hidden тавьдаг байв.
      Flex мөрөнд overflow:hidden болсон элементийн min-width:auto нь 0
      болдог тул товч 83 → 26px болж агшиж, "Дүн" зүүн тийш 57px
      шилждэг. touchstart нь хуучин байрлалд, click нь шинэ байрлалд
      буудаг тул өөр товч дарагддаг.

   Энд дэлгэц бүрийн толгойн товч бүрийг ЖИНХЭНЭ хуруугаар (CDP
   Input.dispatchTouchEvent) төвд нь дарж:
   · товч дэлгэц дотор, төв нь өөрөө (elementFromPoint) байгааг,
   · дарах мөчид мөрийн ямар ч товчны байрлал/өргөн өөрчлөгдөхгүйг,
   · onclick-д бичсэн ЗӨВ функц л дуудагдсаныг шалгана.
   Функцийг spy-аар солих тул дэлгэц шилжихгүй — бүх товчийг ижил
   нөхцөлд дарна. Төгсгөлд нь "эхнээс →", "Дүн"-г жинхэнээр нь дарж
   үр дүнг (цонх, дэлгэц) шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed'),T=require('./touch');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const w=ms=>new Promise(r=>setTimeout(r,ms));

/* Дэлгэц бүрийг бэлдэх. Код нь ПД-7 — салбар зам (BRANCH_TR) бий. */
const SETUP=()=>{
  const ue=(n,k)=>({id:'u'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:k||4},(_,i)=>({type:i===0?'bad':'normal',ts:0}))});
  DB.folders=[
    {id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
      tracks:[{id:'t1',num:2,kind:'station',sections:[ue(1),ue(2),ue(3)]},
              // Урт тэмдэглэлтэй зам — гарчиг урт үед ч товч дэлгэцээс гарахгүй
              {id:'t2',num:14,kind:'station',note:'Шивээговь зөрлөгийн баруун мухар',sections:[ue(1)]}]},
    {id:'bf',br:1,name:'Хавар салбар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
      tracks:[{id:'bt',num:1,kind:'station',name:'17-р зам Мак',sections:[ue(1)]}]}];
  DB.main=[{id:'k1',num:681,kind:'main',mat:'tbd',sections:[ue(1),ue(2)]},
           {id:'k2',num:682,kind:'main',mat:'tbd',sections:[ue(1)]}];
  let it='';for(let i=0;i<12;i++)it+='n';
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-7',
    turnouts:[{id:'w1',num:7,station:'Чойр',mak:'Р-65',mark:'1/11',proj:'2764',head:4,slFast:'CZ',it}]}];
  activeFolderId='f1';DB.tracks=DB.folders[0].tracks;swFolderId='sf';saveDB()};

/* [нэр, нээх код]. Нээсний дараа идэвхтэй дэлгэцийн толгойг шалгана. */
const STATES=[
  ['Зам — эхнээс',          `_brMode=false;activeFolderId='f1';DB.tracks=DB.folders[0].tracks;
                             delete _revTrk.t1;openTrack('t1')`],
  ['Зам — ухарч',           `_revTrk.t1=1;openTrack('t1')`],
  ['Зам — урт тэмдэглэлтэй',`openTrack('t2')`],
  ['Салбар зам',            `openBrTrack('bt')`],
  ['Гол зам (км)',          `_brMode=false;openTrack('k1')`],
  ['Гол замын км жагсаалт', `_brMode=false;openMainKmList()`],
  ['Үеийн бүртгэл',         `_brMode=false;activeFolderId='f1';DB.tracks=DB.folders[0].tracks;
                             openTrack('t1');openSection('u1')`],
  ['Замын дүн',             `openTrack('t1');showTrackSummary()`],
  ['Сумын бүртгэл',         `_brMode=false;openSwRec('w1')`],
  ['Салбар замын нүүр',     `goBrHome()`],
];

/* Мөрийн товч бүрийн хэмжээ: offset* нь transform-оос (3D хазайлт,
   :active scale) хамаардаггүй ЖИНХЭНЭ байрлал — дарах үеийн
   шилжилтийг үүгээр л барина. */
const MEASURE=()=>{
  const v=document.querySelector('.view.active');
  const row=v&&v.querySelector('.pg-hdr-row');
  if(!row)return{view:v&&v.id,btns:[]};
  const vw=document.documentElement.clientWidth;
  const ttl=row.querySelector('.pg-title');
  const btns=[...row.children].filter(e=>e.tagName==='BUTTON'&&getComputedStyle(e).display!=='none')
    .map((b,i)=>{
      const r=b.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const hit=document.elementFromPoint(cx,cy);
      const fn=((b.getAttribute('onclick')||'').match(/^\s*([A-Za-z_$][\w$]*)\s*\(/)||[])[1]||'';
      return{i,fn,lbl:(b.getAttribute('aria-label')||b.textContent||'').trim().slice(0,14),
        x:cx,y:cy,left:r.left,right:r.right,w:r.width,h:r.height,
        ol:b.offsetLeft,ow:b.offsetWidth,
        own:!!hit&&(hit===b||b.contains(hit))}});
  return{view:v.id,vw,btns,ttlW:ttl?ttl.getBoundingClientRect().width:0,
    ttl:ttl?ttl.textContent.trim().slice(0,30):''}};

(async()=>{
const br=await B.launch();
for(const dev of B.DEVICES){
  console.log('\n'+dev.name);
  const {page,errs}=await B.newPage(br,dev);
  await B.login(page,'ПД-7');await S.seed(page);
  await page.evaluate(()=>{
    ['__errbar','errBanner'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove()})});
  await page.evaluate(`(${SETUP})()`);

  for(const [name,open] of STATES){
    await page.evaluate(`(()=>{${open}})()`);
    await w(450);                     // дэлгэц шилжих хөдөлгөөн дуусах
    await page.evaluate(()=>{
      ['errBanner','saveBadge'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove()})});
    const m=await page.evaluate(`(${MEASURE})()`);
    const tag=name;
    if(!m.btns.length){ok(`${tag}: толгойн товч олдсонгүй`,false,m.view);continue}

    // 1. Товч бүр дэлгэц дотор, төв нь өөрөө
    const out=m.btns.filter(b=>b.left<-0.5||b.right>m.vw+0.5);
    ok(`${tag}: ${m.btns.length} товч бүгд дэлгэц дотор`,out.length===0,
       out.map(b=>`${b.lbl} ${Math.round(b.left)}–${Math.round(b.right)}/${m.vw}`).join(', '));
    const hid=m.btns.filter(b=>!b.own);
    ok(`${tag}: товчны төвд өөр зүйл хучаагүй`,hid.length===0,hid.map(b=>b.lbl).join(', '));
    const small=m.btns.filter(b=>b.w<28||b.h<28);
    ok(`${tag}: товч хуруунд багтана (≥28px)`,small.length===0,
       small.map(b=>`${b.lbl} ${Math.round(b.w)}×${Math.round(b.h)}`).join(', '));
    // Гарчиг товчны дунд дарагдаж алга болохгүй
    if(m.ttl)ok(`${tag}: гарчигт зай үлдсэн (≥60px)`,m.ttlW>=60,`${Math.round(m.ttlW)}px «${m.ttl}»`);

    // 2. Товч бүрийг хуруугаар дарна
    const names=[...new Set(m.btns.map(b=>b.fn).filter(Boolean))];
    for(const b of m.btns){
      await page.evaluate(ns=>{
        window.__calls=[];window.__orig=window.__orig||{};
        ns.forEach(n=>{if(!window.__orig[n])window.__orig[n]=window[n];
          window[n]=function(){window.__calls.push(n)}})},names);
      const c=await T.cdp(page);
      await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x,y:b.y,id:1}]});
      await w(60);
      // Хуруу хүрсэн ЯГ тэр мөчийн байрлал
      const mid=await page.evaluate(`(${MEASURE})()`);
      const ov=await page.evaluate(i=>{
        const v=document.querySelector('.view.active');
        const el=[...v.querySelector('.pg-hdr-row').children].filter(e=>e.tagName==='BUTTON'&&
          getComputedStyle(e).display!=='none')[i];
        return el?getComputedStyle(el).overflow:'?'},b.i);
      await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await w(160);
      const calls=await page.evaluate(ns=>{
        const r=window.__calls.slice();ns.forEach(n=>{window[n]=window.__orig[n]});return r},names);
      const moved=mid.btns.filter((x,k)=>{const y=m.btns[k];
        return !y||Math.abs(x.ol-y.ol)>0.5||Math.abs(x.ow-y.ow)>0.5});
      ok(`${tag}: «${b.lbl}» дарах мөчид мөр хөдлөхгүй`,moved.length===0&&mid.btns.length===m.btns.length,
         moved.map(x=>{const y=m.btns[x.i];return `${x.lbl} ${y.ow}→${x.ow}px @${y.ol}→${x.ol}`}).join(', '));
      ok(`${tag}: «${b.lbl}» дарахад overflow хөндөгдөхгүй`,ov==='visible',ov);
      ok(`${tag}: «${b.lbl}» → ${b.fn}()`,calls.length===1&&calls[0]===b.fn,JSON.stringify(calls));
      await w(320);                   // давхар товшилт гэж ойлгогдохгүй
    }
  }

  /* 3. Жинхэнэ үр дүн — алдааны тайланд яг бичигдсэн дараалал */
  await page.evaluate(()=>{_brMode=false;activeFolderId='f1';DB.tracks=DB.folders[0].tracks;
    delete _revTrk.t1;openTrack('t1')});
  await w(450);
  let c=await T.center(page,'#walkBtn');
  await T.tap(page,c.x,c.y);await w(350);
  const r1=await page.evaluate(()=>({view:document.querySelector('.view.active').id,
    walk:document.getElementById('walkModal').classList.contains('open')}));
  ok('«эхнээс →» → явах чиглэлийн цонх нээгдэнэ (Дүн биш)',r1.view==='trackView'&&r1.walk,JSON.stringify(r1));
  await page.evaluate(()=>closeModal('walkModal'));await w(350);
  c=await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#trackView .pg-hdr-row .icon-btn')]
      .find(e=>/showTrackSummary/.test(e.getAttribute('onclick')||''));
    const r=b.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  await T.tap(page,c.x,c.y);await w(450);
  const r2=await page.evaluate(()=>document.querySelector('.view.active').id);
  ok('«Дүн» → замын дүн нээгдэнэ',r2==='summaryView',r2);

  const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
  ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
  await page.context().close();
}
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
