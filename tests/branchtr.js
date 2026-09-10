/* ══════════════════════════════════════════════════════════════
   САЛБАР ЗАМ — хувийн, бусад байгууллагын зам

   Зөвхөн ПД-4, 5, 7, 8, 11-д байдаг. Замын нэрс албан маягтад
   бичигдсэн жагсаалтаас гарна (дугаар биш НЭР). Паспорт нь энгийнхээс
   `br` тэмдгээр л ялгарна — тэр тэмдэг алдагдвал салбар замын бүртгэл
   ердийн паспортад холилдоно.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();

/* ── Салбар замгүй хэсэг ── */
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-6');
  const r=await page.evaluate(async()=>{
    const has=hasBranch(),n=brNames().length;
    goBrHome();
    await new Promise(r=>setTimeout(r,300));
    return{has,n,view:(document.querySelector('.view.active')||{}).id,
      n4:brNames('ПД-4').length,n5:brNames('ПД-5').length,n7:brNames('ПД-7').length,
      n8:brNames('ПД-8').length,n11:brNames('ПД-11').length,n1:brNames('ПД-1').length}});
  ok('ПД-6-д салбар зам байхгүй',!r.has&&r.n===0,`${r.has} · ${r.n} зам`);
  ok('Салбар замгүй хэсэгт дэлгэц нээгдэхгүй',r.view!=='brHomeView',r.view);
  ok('Зөвхөн 5 хэсэгт салбар зам',
     r.n4===18&&r.n5===7&&r.n7===8&&r.n8===2&&r.n11===1&&r.n1===0,
     `ПД-4:${r.n4} ПД-5:${r.n5} ПД-7:${r.n7} ПД-8:${r.n8} ПД-11:${r.n11} ПД-1:${r.n1}`);
  await page.close();
}

/* ── Салбар замтай хэсэг ── */
{
  const {page,errs}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-4'); await S.seed(page);
  await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

  const nav=await page.evaluate(async()=>{
    goBrHome();
    await new Promise(r=>setTimeout(r,420));
    const v=document.querySelector('.view.active');
    return{view:v?v.id:'',sub:(document.getElementById('brSub')||{}).textContent||''}});
  ok('Салбар замын дэлгэц нээгдэнэ',nav.view==='brHomeView',nav.view);
  ok('Дэд гарчигт замын тоо',/18 зам/.test(nav.sub),nav.sub);

  // Паспорт үүсгэх — дэр ба дүнз хоёулаа
  const mk=await page.evaluate(async()=>{
    const nDer0=derFolders().length,nSw0=swFolders().length;
    openAddFolder(1);await new Promise(r=>setTimeout(r,60));
    document.getElementById('afName').value='Салбар хавар 2026';
    addFolder();
    openAddSwFolder(1);await new Promise(r=>setTimeout(r,60));
    document.getElementById('swfName').value='Салбар сум 2026';
    addSwFolder();
    return{brDer:brFolders().length,brSw:brSwFolders().length,
      derSame:derFolders().length===nDer0,swSame:swFolders().length===nSw0,
      rawSw:(DB.sw||[]).length}});
  ok('Салбар замын дэрийн паспорт үүснэ',mk.brDer===1,String(mk.brDer));
  ok('Салбар замын дүнзний паспорт үүснэ',mk.brSw===1,String(mk.brSw));
  ok('Энгийн паспортын жагсаалтад НЭМЭГДЭХГҮЙ',mk.derSame&&mk.swSame,
     `дэр ${mk.derSame} · дүнз ${mk.swSame}`);
  ok('DB.sw-д үнэхээр хадгалагдав (шүүсэн хуулбар руу бичээгүй)',
     mk.rawSw>=1,String(mk.rawSw));

  // Замын нэрийг хүрдээр сонгоно
  const wh=await page.evaluate(async()=>{
    const f=brFolders()[0];
    showView('homeView');openFolder(f.id);
    await new Promise(r=>setTimeout(r,120));
    openAddTrack();
    await new Promise(r=>setTimeout(r,300));
    const nb=document.getElementById('atNameBox'),qb=document.getElementById('atNumBox');
    const items=[...document.querySelectorAll('#atNameWheel .wh-item')].map(e=>e.textContent);
    addTrack();                         // хүрдний эхний нэр
    const t=(DB.tracks||[])[0]||{};
    return{name:nb?getComputedStyle(nb).display:'?',num:qb?getComputedStyle(qb).display:'?',
      items:items.slice(0,3),n:items.length,last:items[items.length-1]||'',
      track:t.name||'',kind:t.kind||'',lbl:trackLabel(t),isBr:isBrFolder()}});
  ok('Салбар паспортод НЭРийн хүрд гарна, дугаар нуугдана',
     wh.name!=='none'&&wh.num==='none',`нэр ${wh.name} · дугаар ${wh.num}`);
  // Маягтын 18 нэр + төгсгөлд "Өөр нэр…" (маягтад бичигдээгүй зам бүртгэхэд)
  ok('Хүрдэнд маягтын 18 нэр ба "Өөр нэр…"',
     wh.n===19&&/Өөр нэр/.test(wh.last),`${wh.n} · ${wh.last}`);
  ok('Эхний нэрс маягтынхтай тохирно',
     wh.items[0]==='Говь урал'&&wh.items[1]==='Нефть',JSON.stringify(wh.items));
  ok('Зам нэрээрээ нэмэгдэнэ',wh.track==='Говь урал',wh.track);
  ok('Дэр нь өртөөний замтай ижил бүртгэгдэнэ',wh.kind==='station',wh.kind);
  ok('Шошго нь дугаар биш НЭР',wh.lbl==='Говь урал',wh.lbl);

  // Нэмсэн замыг дахин санал болгохгүй
  const again=await page.evaluate(async()=>{
    openAddTrack();await new Promise(r=>setTimeout(r,260));
    const items=[...document.querySelectorAll('#atNameWheel .wh-item')].map(e=>e.textContent);
    closeModal('addTrackModal');
    return{n:items.length,has:items.indexOf('Говь урал')>=0}});
  // 18 нэрээс нэгийг нь нэмсэн тул 17 үлдэнэ, дээр нь "Өөр нэр…"
  ok('Нэмсэн замыг дахин санал болгохгүй',again.n===18&&!again.has,
     `${again.n} нэр · давхардал ${again.has}`);

  // Энгийн паспортод хуучин зан төлөв хэвээр
  const norm=await page.evaluate(async()=>{
    const f=derFolders()[0];
    if(!f)return{skip:1};
    openFolder(f.id);await new Promise(r=>setTimeout(r,80));
    openAddTrack();await new Promise(r=>setTimeout(r,260));
    const nb=document.getElementById('atNameBox'),qb=document.getElementById('atNumBox');
    const o={name:getComputedStyle(nb).display,num:getComputedStyle(qb).display,isBr:isBrFolder()};
    closeModal('addTrackModal');return o});
  ok('Энгийн паспортод дугаарын талбар хэвээр',
     norm.skip||(norm.num!=='none'&&norm.name==='none'&&!norm.isBr),JSON.stringify(norm));

  const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
  ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,2)));
  await page.close();
}

/* ── ПД-12: салбар зам бий ч албан маягтад хараахан бичигдээгүй ──
   Хүрдэнд нэр байхгүй ч дэлгэц нээгдэж, нэрийг нь гараар бичиж
   болох ёстой. Эс тэгвэл маягт шинэчлэгдэх хүртэл бүртгэл хийж
   чадахгүй. */
{
  const {page,errs}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-12');
  const r=await page.evaluate(async()=>{
    const has=hasBranch(),names=brNames().slice();
    goBrHome();await new Promise(r=>setTimeout(r,320));
    const view=(document.querySelector('.view.active')||{}).id;
    openAddFolder(1);addFolder();await new Promise(r=>setTimeout(r,320));
    openAddTrack();await new Promise(r=>setTimeout(r,280));
    const wheel=[...document.querySelectorAll('#atNameWheel .wh-item')].map(e=>e.textContent);
    const oth=document.getElementById('atNameOther');
    const shown=getComputedStyle(oth).display;
    // Хоосон нэрээр нэмэхийг зөвшөөрөхгүй
    oth.value='  ';addTrack();
    const after0=(DB.tracks||[]).length;
    oth.value='Лут чулуу 2-р зам';addTrack();
    await new Promise(r=>setTimeout(r,300));
    return{has,names,view,wheel,shown,after0,
      tracks:(DB.tracks||[]).map(t=>t.name),
      lbl:DB.tracks[0]?trackLabel(DB.tracks[0]):'',
      kind:DB.tracks[0]?DB.tracks[0].kind:''}});
  ok('ПД-12-т салбар замын дэлгэц нээгдэнэ',r.has&&r.view==='brHomeView',
     `hasBranch=${r.has} · ${r.view}`);
  ok('ПД-12-ийн маягтын жагсаалт хоосон',r.names.length===0,JSON.stringify(r.names));
  ok('Хүрдэнд "Өөр нэр…" сонголт гарна',
     r.wheel.length===1&&/Өөр нэр/.test(r.wheel[0]),JSON.stringify(r.wheel));
  ok('"Өөр нэр…" сонгосон тул бичих талбар нээлттэй',r.shown!=='none',r.shown);
  ok('Хоосон нэрээр зам нэмэгдэхгүй',r.after0===0,r.after0+' зам');
  ok('Гараар бичсэн нэрээр зам нэмэгдэнэ',
     r.tracks.length===1&&r.tracks[0]==='Лут чулуу 2-р зам',JSON.stringify(r.tracks));
  ok('Салбар зам нь өртөөний замын журмаар бүртгэгдэнэ',
     r.kind==='station'&&r.lbl==='Лут чулуу 2-р зам',`${r.kind} · ${r.lbl}`);

  // ПД-4-т маягтын нэрс хэвээр, төгсгөлд нь "Өөр нэр…" нэмэгдсэн
  const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
  ok('ПД-12 консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,2)));
  await page.close();
}
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-4');
  const r=await page.evaluate(async()=>{
    goBrHome();await new Promise(r=>setTimeout(r,300));
    openAddFolder(1);addFolder();await new Promise(r=>setTimeout(r,320));
    openAddTrack();await new Promise(r=>setTimeout(r,280));
    const wheel=[...document.querySelectorAll('#atNameWheel .wh-item')].map(e=>e.textContent);
    const shown=getComputedStyle(document.getElementById('atNameOther')).display;
    closeModal('addTrackModal');
    return{wheel,shown,n:brNames().length}});
  ok('ПД-4-т маягтын нэрс хэвээр, эцэст нь "Өөр нэр…"',
     r.wheel.length===r.n+1&&r.wheel[0]==='Говь урал'&&/Өөр нэр/.test(r.wheel[r.wheel.length-1]),
     `${r.wheel.length} мөр · ${r.wheel[0]} … ${r.wheel[r.wheel.length-1]}`);
  ok('Жагсаалтын нэр сонгосон үед бичих талбар нуугдана',r.shown==='none',r.shown);
  await page.close();
}

console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
