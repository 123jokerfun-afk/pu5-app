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
      items:items.slice(0,3),n:items.length,
      track:t.name||'',kind:t.kind||'',lbl:trackLabel(t),isBr:isBrFolder()}});
  ok('Салбар паспортод НЭРийн хүрд гарна, дугаар нуугдана',
     wh.name!=='none'&&wh.num==='none',`нэр ${wh.name} · дугаар ${wh.num}`);
  ok('Хүрдэнд маягтын 18 нэр',wh.n===18,String(wh.n));
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
  ok('Нэмсэн замыг дахин санал болгохгүй',again.n===17&&!again.has,
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

console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
