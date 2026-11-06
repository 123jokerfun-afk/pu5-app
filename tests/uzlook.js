/* ══════════════════════════════════════════════════════════════
   UULZWAR-ЫН НЕОМОРФ ЗАГВАР (v205)
   Цайвар загвар uulzwar_zai-ийн материалаар (#dfe5ed дэвсгэр, #eaeef4
   товгор гадаргуу) зурагдаж, анхдагч болсон эсэх; дарахад 3D хазайлт
   зөв ажиллаж, байрлалдаа transform ашигладаг элементийг хөндөхгүй эсэх;
   бичиг саарал гадаргуу дээр уншигдах эсэх (тодролын харьцаа); харанхуй
   загвар хөндөгдөөгүй эсэхийг шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);

console.log('\nАнхдагч загвар');
const first=await page.evaluate(()=>({th:document.documentElement.getAttribute('data-theme'),
  meta:document.querySelector('meta[name="theme-color"]').content,
  wrap:getComputedStyle(document.querySelector('#loginView .lg-wrap')).backgroundColor,
  img:!!document.querySelector('#loginView .lg-lock img')}));
ok('Сонголт хадгалаагүй үед цайвар (Uulzwar) загвар',first.th==='light',first.th);
ok('Хаягийн мөрний өнгө дэвсгэртэй ижил (#dfe5ed)',first.meta==='#dfe5ed',first.meta);
ok('Нэвтрэх дэлгэц Uulzwar-ын дэвсгэртэй',first.wrap==='rgb(223, 229, 237)',first.wrap);
ok('Нэвтрэх брэндийн тэмдэг нь аппын дүрс',first.img);
await page.evaluate(()=>localStorage.setItem('sg_der_theme','dark'));
await page.reload({waitUntil:'load'});await page.waitForTimeout(600);
ok('Харанхуйг өөрөө сонгосон бол харанхуй хэвээр',
   await page.evaluate(()=>document.documentElement.getAttribute('data-theme')==='dark'));
await page.evaluate(()=>localStorage.removeItem('sg_der_theme'));
await page.reload({waitUntil:'load'});await page.waitForTimeout(600);
// Дахин ачаалахад service worker Firebase-ийн CDN-ийг өөрөө татах гэж
// оролддог; тест орчинд гадаад сүлжээ хаалттай тул ERR_FAILED гардаг —
// аппын алдаа биш. Энэ хүртэлх консолын бичлэгийг цэвэрлэнэ.
errs.length=0;

await B.login(page,'ПД-6');await S.seed(page);
await page.evaluate(()=>{goTab('pass');['errBanner','__errbar'].forEach(id=>{const b=document.getElementById(id);if(b)b.remove()})});
await page.waitForTimeout(600);

console.log('\nМатериал');
const mat=await page.evaluate(()=>{const c=document.querySelector('#homeView .folder-card');
  const cs=getComputedStyle(c);return{body:getComputedStyle(document.body).backgroundColor,
  card:cs.backgroundColor,sh:cs.boxShadow,tab:getComputedStyle(document.getElementById('tabbar')).backgroundColor,
  act:getComputedStyle(document.querySelector('.tab-b[aria-current="true"]')).backgroundImage,
  anim:getComputedStyle(document.querySelector('.tab-b[aria-current="true"] svg')).animationName}});
ok('Дэвсгэр #dfe5ed',mat.body==='rgb(223, 229, 237)',mat.body);
ok('Карт товгор гадаргуу #eaeef4',mat.card==='rgb(234, 238, 244)',mat.card);
ok('Карт хос сүүдэртэй (бараан + цагаан)',/185, 194, 208/.test(mat.sh)&&/255, 255, 255/.test(mat.sh),mat.sh.slice(0,80));
ok('Доод таб цайвар тавцан',/234, 238, 244/.test(mat.tab),mat.tab);
ok('Идэвхтэй таб индиго капсул',/gradient/.test(mat.act),mat.act.slice(0,50));
ok('Идэвхтэй табын дүрс 3D эргэлддэг',mat.anim==='tabFlip3d',mat.anim);

console.log('\nДаралт мэдрэх 3D хазайлт');
const card=(await page.$$('#homeView .folder-card')).pop();
const bb=await card.boundingBox();
await page.mouse.move(bb.x+bb.width*.9,bb.y+bb.height*.8);await page.mouse.down();
await page.waitForTimeout(100);
const p1=await card.evaluate(el=>({on:el.classList.contains('p3d-on'),tf:getComputedStyle(el).transform,
  y:parseFloat(el.style.getPropertyValue('--p3y')),x:parseFloat(el.style.getPropertyValue('--p3x')),
  sh:getComputedStyle(el).boxShadow}));
ok('Дарахад хазайна (3D матриц)',p1.on&&/matrix3d/.test(p1.tf),p1.tf.slice(0,30));
ok('Баруун доод талд дарахад тэр тал руугаа доошилно',p1.y>0&&p1.x<0,JSON.stringify({x:p1.x,y:p1.y}));
// Удаан дарж устгах карт: богино товшилтод улаан хүрээ анивчихгүй
ok('Богино товшилтод улаан хүрээ гарахгүй',!/rgb\(210, 52, 90\)/.test(p1.sh),p1.sh.slice(0,90));
await page.waitForTimeout(450);
const p2=await card.evaluate(el=>getComputedStyle(el).boxShadow);
ok('Удаан дарахад улаан хүрээ гарч ирнэ',/210, 52, 90/.test(p2),p2.slice(0,100));
await page.mouse.move(bb.x+bb.width*.9,bb.y+bb.height*.8+30,{steps:3});
await page.waitForTimeout(60);
ok('Гүйлгэж эхлэхэд суллагдана',await card.evaluate(el=>!el.classList.contains('p3d-on')));
await page.mouse.up();
await page.evaluate(()=>document.querySelectorAll('.del-armed').forEach(c=>c.classList.remove('del-armed')));
// Хор хөнөөлгүй жижиг товч — босгын чип (толгойн эхний товч нь өнгө
// солих товч тул дарвал үлдсэн шалгалт харанхуй загварт явагдана)
await page.evaluate(()=>goTab('home'));await page.waitForTimeout(450);
const btn=await page.$('#homeView .dash-thr-chip');const hb=await btn.boundingBox();
await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();await page.waitForTimeout(60);
ok('Жижиг товч ч хазайна',await btn.evaluate(el=>el.classList.contains('p3d-on')));
await page.mouse.up();await page.waitForTimeout(60);
ok('Хуруу авахад буцаж товойно',await btn.evaluate(el=>!el.classList.contains('p3d-on')));
ok('Шалгалтын турш цайвар загвар хэвээр',await page.evaluate(()=>document.documentElement.getAttribute('data-theme')==='light'));
const excl=await page.evaluate(()=>['.joy-btn','.drow','.sheet','.add-sec-dock','.rec-bottom','#toast']
  .filter(q=>{const e=document.querySelector(q);return e&&(e.matches(P3D_SEL)||e.closest(P3D_SEL))}));
ok('Байрлалдаа transform ашигладаг элемент хамаарахгүй',excl.length===0,excl.join(','));

console.log('\nУншигдах байдал (саарал гадаргуу дээрх тодрол)');
const SCREENS=[['Нүүр',()=>goTab('home')],['Паспорт',()=>goTab('pass')],
  ['Замын дэлгэц',()=>{openFolder('f-test1');openTrack('t1')}],
  ['Бүртгэл',()=>{openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)}],
  ['СШ',()=>goSwHome()],['Мэдэгдэл',()=>goTab('sync')],['Профайл',()=>goTab('prof')],
  ['Дараалсан цэг',()=>{goHome();openFolder('f-test1');openConsecReport()}]];
const low=[];
for(const [nm,fn] of SCREENS){
  await page.evaluate(()=>document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open')));
  await page.evaluate(`(${fn.toString()})()`);await page.waitForTimeout(420);
  const b=await page.evaluate(()=>{
    const P=s=>{const m=(s||'').match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m.length>3?+m[3]:1]:null};
    const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
    const L=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
    const mix=(t,u)=>[0,1,2].map(i=>t[i]*t[3]+u[i]*(1-t[3])).concat(1);
    const bgOf=el=>{const st=[];let e=el;
      while(e&&e.nodeType===1){const cs=getComputedStyle(e);
        if(/gradient/.test(cs.backgroundImage)){const g=(cs.backgroundImage.match(/rgba?\([^)]*\)/g)||[]).map(P);
          if(g.length){st.push([0,1,2].map(i=>g.reduce((s,x)=>s+x[i],0)/g.length).concat(1));break}}
        const c=P(cs.backgroundColor);if(c&&c[3]>0){st.push(c);if(c[3]>=.98)break}
        e=e.parentElement}
      let r=[223,229,237,1];for(let i=st.length-1;i>=0;i--)r=mix(st[i],r);return r};
    const out=[];
    document.querySelectorAll('.view.active *,#tabbar *').forEach(el=>{
      const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
      if(!t)return;const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      let o=1,e=el;while(e){o*=+getComputedStyle(e).opacity;e=e.parentElement}if(o<.6)return;
      const r=el.getBoundingClientRect();if(r.width<4||r.bottom<0||r.top>innerHeight)return;
      const bg=bgOf(el),f=mix(P(cs.color),bg),l1=L(f),l2=L(bg);
      const cr=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
      // Зориуд бүдэг тусламжийн мөр/хувилбарын дугаарт зөөлөн босго
      const need=el.closest('.lp-hint,.build-tag')?2.5:2.75;
      if(cr<need)out.push((el.className||el.tagName).toString().slice(0,20)+'«'+t.slice(0,14)+'» '+cr.toFixed(2))});
    return out});
  b.forEach(x=>low.push(nm+': '+x));
}
ok('Бүх бичиг ≥ 2.75:1 (тусламжийн мөр ≥ 2.5:1)',low.length===0,low.slice(0,6).join(' | '));

console.log('\nИлгээгдээгүй тэмдэг цонхыг халхлахгүй');
await page.evaluate(()=>document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open')));
await page.evaluate(()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);
  DB.tracks[0].sections[0].sleepers[0].type='bad';saveDB();openEditSleeper(5)});
await page.waitForTimeout(700);
const cover=await page.evaluate(()=>{const b=document.getElementById('saveBadge');
  if(!b||getComputedStyle(b).display==='none')return {none:true};
  const r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);
  return {hit:!!(top&&top.closest('#saveBadge')),under:top&&(top.className||top.tagName).toString().slice(0,40)}});
ok('Нээлттэй цонхны дээгүүр тэмдэг гарахгүй (доорх товч дарагдана)',cover.none||!cover.hit,JSON.stringify(cover));
await page.evaluate(()=>document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open')));

console.log('\nХаранхуй загвар хөндөгдөөгүй');
await page.evaluate(()=>{applyTheme('dark');goTab('pass')});await page.waitForTimeout(450);
const dk=await page.evaluate(()=>({card:getComputedStyle(document.querySelector('#homeView .folder-card')).backgroundColor,
  tab:getComputedStyle(document.getElementById('tabbar')).backgroundColor}));
ok('Харанхуйд карт цайвар материалгүй',dk.card!=='rgb(234, 238, 244)',dk.card);
ok('Харанхуйд доод таб хар шилэн хэвээр',/10, 10, 24/.test(dk.tab),dk.tab);
await page.evaluate(()=>applyTheme('light'));

console.log('\nХөдөлгөөн багасгах тохиргоо');
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
const c2=(await page.$$('#homeView .folder-card')).pop();const b2=await c2.boundingBox();
await page.mouse.move(b2.x+b2.width*.9,b2.y+b2.height*.5);await page.mouse.down();await page.waitForTimeout(80);
const rm=await c2.evaluate(el=>getComputedStyle(el).transform);
ok('Хөдөлгөөн багасгасан үед 3D хазайлтгүй (зөвхөн бага зэрэг жижигрэнэ)',!/matrix3d/.test(rm),rm);
await page.mouse.up();

const bad=errs.filter(e=>!/favicon|ERR_REQUEST_RANGE/.test(e));
ok('Консолын алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
const p=R.filter(Boolean).length;
console.log('\nSUMMARY '+p+'/'+R.length);
await br.close();process.exit(p===R.length?0:1);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
