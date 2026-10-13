const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
function hit(a,b){return a&&b&&!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)}
(async()=>{
const browser=await B.launch();
for(const dev of B.DEVICES){
const {page,ctx}=await B.newPage(browser,dev);
await page.addStyleTag({content:':root{--sat:47px!important;--sab:34px!important}'});
await B.login(page,'ПД-6');await S.seed(page);
await page.addStyleTag({content:':root{--sat:47px!important;--sab:34px!important}'});
await page.evaluate(()=>{_dirtySet();_renderSaveBadge();
  openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)});
await page.waitForTimeout(700);
const res=await page.evaluate(()=>{
  const g=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();
    return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,sw:e.scrollWidth,cw:e.clientWidth}};
  return{badge:g('.save-badge'),pill:g('.nav-pill'),undo:g('.left-controls'),joy:g('.joy-btn'),
         L:g('.jh-left'),Rr:g('.jh-right'),H:innerHeight,W:innerWidth}});
ok(dev.name+' · тэмдэг ↔ Өмнөх/Дараагийн',!hit(res.badge,res.pill));
ok(dev.name+' · тэмдэг ↔ буцаах товч',!hit(res.badge,res.undo));
ok(dev.name+' · Өмнөх/Дараагийн ↔ joystick',!hit(res.pill,res.joy));
ok(dev.name+' · Өмнөх/Дараагийн бичиг багтав',res.pill.sw<=res.pill.cw+1,res.pill.sw+'/'+res.pill.cw);
ok(dev.name+' · зүүн санамж товчны доор ороогүй',res.L.right<=res.joy.left+1,Math.round(res.L.right)+'≤'+Math.round(res.joy.left));
ok(dev.name+' · зүүн санамж багтав',res.L.sw<=res.L.cw+1,res.L.sw+'/'+res.L.cw);
// v192: "Үеийн дэлгэрэнгүй" хүснэгт нарийн утсан дээр өргөн тул ӨӨРӨӨ
// (.stbl-wrap) хажуу тийш гулсдаг, гэхдээ БҮХЭЛ дэлгэц гулсаж болохгүй
// — эс тэгвэл дээрх картууд хамт шилжинэ (v192-с өмнө байсан алдаа).
const sm=await page.evaluate(()=>{
  goHome();openFolder('f-test1');openTrack('t1');showTrackSummary();
  const view=document.getElementById('summaryView'),wrap=document.querySelector('.stbl-wrap');
  return{viewSw:view.scrollWidth,viewCw:view.clientWidth,hasWrap:!!wrap}});
await page.waitForTimeout(250);
ok(dev.name+' · Үеийн дэлгэрэнгүй хүснэгт бүх дэлгэцийг гулсуулахгүй',
   sm.hasWrap&&sm.viewSw<=sm.viewCw+4,sm.viewSw+'/'+sm.viewCw);
await ctx.close();}
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>console.error('FATAL',e.message));
