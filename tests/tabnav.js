/* ══════════════════════════════════════════════════════════════
   ДООД ТАБ — Салбар зам | Нүүр | Паспорт | Сумууд | Мэдэгдэл | Профайл

   · Апп руу ороход Нүүр анхдагчаар сонгогдоно
   · Салбар зам таб Нүүрийн ЗҮҮН талд, зөвхөн салбар замтай хэсэгт
   · Мэдэгдэл, Профайл доороос гулсаж гарах цонх БИШ — энгийн дэлгэц
   · Хажуу тийш шудрахад табын дарааллаар шилжинэ
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

async function swipe(page,dir){
  return await page.evaluate(async dir=>{
    const v=document.querySelector('.view.active');
    const T=(type,x,y)=>{
      const t=new Touch({identifier:1,target:v,clientX:x,clientY:y});
      v.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],
        changedTouches:[t],bubbles:true,cancelable:true}))};
    const x0=dir<0?330:60,y0=420;
    T('touchstart',x0,y0);
    let lx=x0;
    for(let i=1;i<=20;i++){lx=x0+dir*Math.round(260*i/20);T('touchmove',lx,y0);
      await new Promise(r=>setTimeout(r,10))}
    T('touchend',lx,y0);
    await new Promise(r=>setTimeout(r,450));
    return {view:(document.querySelector('.view.active')||{}).id,tab:_curTab(),
      cur:[...document.querySelectorAll('#tabbar .tab-b')].filter(b=>b.getAttribute('aria-current')==='true').map(b=>b.id)}
  },dir);
}
const state=page=>page.evaluate(()=>({view:(document.querySelector('.view.active')||{}).id,tab:_curTab(),
  open:[...document.querySelectorAll('.overlay.open')].map(o=>o.id),
  cur:[...document.querySelectorAll('#tabbar .tab-b')].filter(b=>b.getAttribute('aria-current')==='true').map(b=>b.id)}));
const visTabs=page=>page.evaluate(()=>[...document.querySelectorAll('#tabbar .tab-b')]
  .filter(b=>getComputedStyle(b).display!=='none').map(b=>b.querySelector('span').textContent.trim()));

(async()=>{
const br=await B.launch();

/* ── ПД-6: салбар замгүй хэсэг ── */
{
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
let s=await state(page);
ok('Нэвтэрмэгц Нүүр таб сонгогдсон',s.view==='homeView'&&s.tab==='home'&&s.cur.join()==='tabHome',JSON.stringify(s));
ok('ПД-6-д Салбар зам таб харагдахгүй (салбар замгүй хэсэг)',
   JSON.stringify(await visTabs(page))===JSON.stringify(['Нүүр','Паспорт','Сумууд','Мэдэгдэл','Профайл']),
   JSON.stringify(await visTabs(page)));

await page.click('#tabSync');await page.waitForTimeout(350);
s=await state(page);
ok('Мэдэгдэл энгийн дэлгэцээр нээгдэнэ (доороос гарах цонх биш)',
   s.view==='syncView'&&!s.open.length&&s.cur.join()==='tabSync',JSON.stringify(s));
ok('Мэдэгдлийн агуулга дүрслэгдсэн',
   await page.evaluate(()=>/үүлэнд|Илгээгээгүй/i.test(document.getElementById('syncBody').textContent)));

await page.click('#tabProf');await page.waitForTimeout(350);
s=await state(page);
ok('Профайл энгийн дэлгэцээр нээгдэнэ',s.view==='profView'&&!s.open.length&&s.cur.join()==='tabProf',JSON.stringify(s));
ok('Профайлд "Гарах" мөр байна',await page.evaluate(()=>/Гарах/.test(document.getElementById('profBody').textContent)));
ok('Профайл дэлгэц дээр доод таб харагдана',await page.evaluate(()=>document.body.classList.contains('has-tabbar')&&!document.body.classList.contains('deep-view')));

await page.evaluate(()=>_appBack());await page.waitForTimeout(350);
s=await state(page);
ok('Буцах товч Профайлаас Нүүр рүү',s.view==='homeView'&&s.tab==='home',JSON.stringify(s));

// Шудралт — табын дарааллаар
await page.evaluate(()=>goTab('home'));await page.waitForTimeout(300);
let w=await swipe(page,1);
ok('ПД-6 Нүүрээс баруун шудрахад шилжихгүй (зүүн талд таб алга)',w.view==='homeView'&&w.tab==='home',JSON.stringify(w));
w=await swipe(page,-1);
ok('Нүүр → (зүүн) → Паспорт',w.tab==='pass'&&w.cur.join()==='tabPass',JSON.stringify(w));
w=await swipe(page,-1);
ok('Паспорт → (зүүн) → Сумууд',w.view==='swHomeView'&&w.cur.join()==='tabSw',JSON.stringify(w));
w=await swipe(page,-1);
ok('Сумууд → (зүүн) → Мэдэгдэл',w.view==='syncView'&&w.cur.join()==='tabSync',JSON.stringify(w));
w=await swipe(page,-1);
ok('Мэдэгдэл → (зүүн) → Профайл',w.view==='profView'&&w.cur.join()==='tabProf',JSON.stringify(w));
w=await swipe(page,-1);
ok('Профайл бол сүүлийнх — цааш шилжихгүй',w.view==='profView',JSON.stringify(w));
w=await swipe(page,1);
ok('Профайл → (баруун) → Мэдэгдэл',w.view==='syncView',JSON.stringify(w));

// Паспорт дээр байхдаа гарч дахин нэвтрэхэд Нүүр анхдагч
await page.evaluate(()=>goTab('pass'));await page.waitForTimeout(250);
await page.evaluate(()=>_doLogoutCore());await page.waitForTimeout(400);
await B.login(page,'ПД-6');
s=await state(page);
ok('Дахин нэвтрэхэд (өмнө нь Паспорт байсан ч) Нүүр сонгогдоно',s.tab==='home'&&s.cur.join()==='tabHome',JSON.stringify(s));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('ПД-6: консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
await page.close();
}

/* ── ПД-7: салбар замтай хэсэг ── */
{
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-7');
const tabs=await visTabs(page);
ok('ПД-7-д Салбар зам таб Нүүрийн зүүн талд',
   JSON.stringify(tabs)===JSON.stringify(['Салбар зам','Нүүр','Паспорт','Сумууд','Мэдэгдэл','Профайл']),JSON.stringify(tabs));
ok('ПД-7 нэвтрэхэд ч Нүүр сонгогдсон',(await state(page)).cur.join()==='tabHome');
let w=await swipe(page,1);
ok('Нүүр → (баруун) → Салбар зам',w.view==='brHomeView'&&w.cur.join()==='tabBr',JSON.stringify(w));
w=await swipe(page,1);
ok('Салбар зам бол эхнийх — цааш шилжихгүй',w.view==='brHomeView',JSON.stringify(w));
w=await swipe(page,-1);
ok('Салбар зам → (зүүн) → Нүүр',w.view==='homeView'&&w.tab==='home',JSON.stringify(w));
await page.click('#tabBr');await page.waitForTimeout(350);
ok('Салбар зам табыг дарахад салбарын дэлгэц',(await state(page)).view==='brHomeView');

// Нарийн утсанд 6 таб багтана (хэвтээ гүйлгээ гарахгүй)
const fit=await page.evaluate(()=>{const b=document.getElementById('tabbar');return b.scrollWidth<=b.clientWidth+1});
ok('6 таб самбарт багтана',fit);
const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('ПД-7: консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
await page.close();
}

/* ── Galaxy Fold (280px): 6 таб багтах ёстой ── */
{
const fold=B.DEVICES.find(d=>/Fold/.test(d.name))||B.DEVICES[4];
const {page}=await B.newPage(br,fold);
await B.login(page,'ПД-7');
const r=await page.evaluate(()=>{const b=document.getElementById('tabbar');
  return {sw:b.scrollWidth,cw:b.clientWidth,
    w:[...b.querySelectorAll('.tab-b')].filter(x=>getComputedStyle(x).display!=='none').map(x=>Math.round(x.getBoundingClientRect().width))}});
ok('Galaxy Fold дээр ч 6 таб хэвтээ гүйлгээгүй багтана',r.sw<=r.cw+1,JSON.stringify(r));
await page.close();
}

console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
