/* ══════════════════════════════════════════════════════════════
   ШУДРАЛТ — ДЭЛГЭЦ АНИВЧИХ

   v105-д дэр ↔ сум хооронд шудрахад дэлгэц анивчдаг байв. Хоёр
   шалтгаантай:

   1) Шудрах заалтыг touchmove БҮРТ (секундэд ~60) дахин бичдэг
      байсан ба хуруу босгын ойролцоо найгахад асаа/унтраа сольдог.
   2) goSwHome нь renderSwHome-ыг ХОЁР удаа дуудаж, хоёр дахь нь
      шилжилтийн анимацын дунд агуулгыг сэлгэдэг байв.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

/* Бодит хуруу шиг найгалттай шудралт. jitter = босоо найгалт (px) */
async function swipe(viewId,dir,px,jitter,steps){
  return await page.evaluate(async([id,dir,px,jit,steps])=>{
    const v=document.getElementById(id);
    const fl=document.getElementById('swipeFlash');
    const writes=[];
    const mo=new MutationObserver(()=>writes.push(fl.style.opacity));
    mo.observe(fl,{attributes:true,attributeFilter:['style','class']});
    const T=(type,x,y)=>{
      const t=new Touch({identifier:1,target:v,clientX:x,clientY:y});
      v.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],
        changedTouches:[t],bubbles:true,cancelable:true}))};
    const x0=dir<0?330:60, y0=420;
    T('touchstart',x0,y0);
    let lx=x0,ly=y0,label='';
    for(let i=1;i<=steps;i++){
      lx=x0+dir*Math.round(px*i/steps);
      ly=y0+Math.round(Math.sin(i/1.7)*jit);
      T('touchmove',lx,ly);
      if(fl.style.opacity==='1')label=document.getElementById('swipeFlashLabel').textContent;
      await new Promise(r=>setTimeout(r,10));
    }
    T('touchend',lx,ly);
    await new Promise(r=>setTimeout(r,450));
    mo.disconnect();
    let flips=0,prev=null;
    writes.forEach(o=>{const on=o==='1';if(prev!==null&&on!==prev)flips++;prev=on});
    return {writes:writes.length,flips,label,
      view:(document.querySelector('.view.active')||{}).id};
  },[viewId,dir,px,jitter,steps]);
}

/* ── 1. Нүүр → СШ (зүүн тийш) ─────────────────────────────── */
await page.evaluate(()=>goHome()); await page.waitForTimeout(400);
const a=await swipe('homeView',-1,286,9,26);
ok('Нүүрээс зүүн шудрахад СШ рүү оров',a.view==='swHomeView',a.view);
ok('Заалт олон дахин бичигдэхгүй',a.writes<=3,a.writes+' бичлэг');
ok('Заалт анивчихгүй (асаа/унтраа ≤1)',a.flips<=1,a.flips+' удаа');
ok('Заалтын бичиг зөв — "үе" биш дэлгэцийн нэр',/СШ ПУ-5/.test(a.label),JSON.stringify(a.label));

/* ── 2. СШ → Нүүр (баруун тийш) ───────────────────────────── */
await page.waitForTimeout(400);
const b=await swipe('swHomeView',1,286,9,26);
ok('СШ-ээс баруун шудрахад Нүүр рүү буцав',b.view==='homeView',b.view);
ok('Буцахад ч заалт анивчихгүй',b.flips<=1&&b.writes<=3,b.writes+' бичлэг, '+b.flips+' анивчилт');
ok('Буцах заалтын бичиг зөв',/Дэр ПУ-5/.test(b.label),JSON.stringify(b.label));

/* ── 3. ХҮЧТЭЙ найгалт — хамгийн муу тохиолдол ────────────── */
await page.evaluate(()=>goHome()); await page.waitForTimeout(400);
const c=await swipe('homeView',-1,286,26,30);
ok('Хүчтэй найгалттай ч анивчихгүй',c.flips<=1,c.flips+' удаа, '+c.writes+' бичлэг');

/* ── 4. Богино шудралт — шилжихгүй ───────────────────────── */
await page.evaluate(()=>goHome()); await page.waitForTimeout(400);
const d=await swipe('homeView',-1,40,6,10);
ok('Богино шудралтад шилжихгүй',d.view==='homeView',d.view);
ok('Богино шудралтын дараа заалт үлдэхгүй',
   await page.evaluate(()=>document.getElementById('swipeFlash').style.opacity!=='1'));

/* ── 5. Шилжилтийн үед агуулга нэг л удаа дүрслэгдэнэ ─────── */
const rr=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,400));
  let n=0;const orig=window.renderSwHome;
  window.renderSwHome=function(){n++;return orig.apply(this,arguments)};
  goSwHome();
  await new Promise(r=>setTimeout(r,900));
  window.renderSwHome=orig;
  return n});
ok('СШ рүү орход нэг л удаа дүрслэгдэнэ',rr===1,rr+' удаа');

/* ── 6. Бүртгэлийн дэлгэцийн шудралт ч анивчихгүй ────────── */
const rec=await page.evaluate(async()=>{
  goHome();openFolder('f-test1');openTrack('t1');
  openSection(getTrack('t1').sections[0].id);
  await new Promise(r=>setTimeout(r,500));
  const v=document.getElementById('recordView'),fl=document.getElementById('swipeFlash');
  const w=[];const mo=new MutationObserver(()=>w.push(fl.style.opacity));
  mo.observe(fl,{attributes:true,attributeFilter:['style','class']});
  const T=(t2,x,y)=>{const t=new Touch({identifier:1,target:v,clientX:x,clientY:y});
    v.dispatchEvent(new TouchEvent(t2,{touches:t2==='touchend'?[]:[t],
      changedTouches:[t],bubbles:true,cancelable:true}))};
  T('touchstart',60,300);
  let lx=60,ly=300;
  for(let i=1;i<=24;i++){lx=60+i*9;ly=300+Math.round(Math.sin(i/1.5)*14);T('touchmove',lx,ly);
    await new Promise(r=>setTimeout(r,10))}
  T('touchend',lx,ly);
  await new Promise(r=>setTimeout(r,350));
  mo.disconnect();
  let f=0,p=null;w.forEach(o=>{const on=o==='1';if(p!==null&&on!==p)f++;p=on});
  return {writes:w.length,flips:f}});
ok('Бүртгэлийн дэлгэц дээр ч анивчихгүй',rec.flips<=1&&rec.writes<=3,
   rec.writes+' бичлэг, '+rec.flips+' анивчилт');

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
