const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
for(const dev of [B.DEVICES[1],B.DEVICES[4]]){
const {page,errs,ctx}=await B.newPage(browser,dev);
// iPhone-ийн notch + home indicator дуурайлгах
await page.addStyleTag({content:':root{--sat:47px!important;--sab:34px!important}'});
await B.login(page,'ПД-6'); await S.seed(page);
await page.addStyleTag({content:':root{--sat:47px!important;--sab:34px!important}'});
const screens=[['Нүүр',()=>goHome()],
  ['Бүртгэл',()=>{openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id)}],
  ['СШ нүүр',()=>goSwHome()]];
for(const [nm,fn] of screens){
  await page.evaluate(`(${fn.toString()})()`);await page.waitForTimeout(700);
  // дээд 47px, доод 34px-д чухал элемент орсон эсэх
  const bad=await page.evaluate(()=>{
    const out=[],H=innerHeight;
    document.querySelectorAll('.view.active button,.view.active .hero-text-title,.view.active .pg-title,.view.active .cnt-n,.view.active .hero-stat-n,.view.active .joystick,.view.active .nav-pill,.view.active .left-controls').forEach(el=>{
      const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;
      const r=el.getBoundingClientRect();if(!r.height)return;
      if(r.bottom<=0||r.top>=H)return;              // дэлгэцнээс гадуур — алгасна
      // Гүйдэг жагсаалт дотор бол доош гүйлгээд харагдана — алгасна
      let p=el.parentElement,scrollable=false;
      while(p&&p!==document.body){const pc=getComputedStyle(p);
        if((pc.overflowY==='auto'||pc.overflowY==='scroll')&&p.scrollHeight>p.clientHeight+2){scrollable=true;break}
        if(pc.position==='fixed'||pc.position==='sticky')break;
        p=p.parentElement}
      if(scrollable)return;
      if(r.top<47||r.bottom>H-34)out.push({cls:(el.className||'').toString().slice(0,30),top:Math.round(r.top),bot:Math.round(r.bottom),H,t:(el.textContent||'').trim().slice(0,18)})
    });
    const s=new Set(),o=[];out.forEach(x=>{const k=x.cls+x.t;if(s.has(k))return;s.add(k);o.push(x)});return o.slice(0,5)
  });
  const sat=await page.evaluate(()=>[getComputedStyle(document.documentElement).getPropertyValue('--sat'),
     getComputedStyle(document.querySelector('.view.active .hero')||document.body).paddingTop,
     (()=>{const j=document.querySelector('.view.active .joystick-wrap');return j?getComputedStyle(j).bottom:'-'})()]);
  ok(dev.name+' · '+nm+' — notch/indicator дор орсонгүй',bad.length===0,JSON.stringify(bad)+' sat='+JSON.stringify(sat));
}
await ctx.close();
}
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e.message)});
