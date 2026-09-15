/* ══════════════════════════════════════════════════════════════
   ӨРТӨӨ ↔ САЛБАР: ӨГӨГДӨЛ ХОЛИЛДОХГҮЙ

   Хоёр нүүр нь ижил `activeFolderId`, `swFolderId` заагчийг
   хуваалцдаг байсан тул салбарт паспорт нээгээд өртөө рүү буцахад
   САЛБАРЫН зам, сум өртөөний паспортын хэсэгт орж ирдэг байв.
   Одоо тал тус бүр өөрийн заагчаа санаж, нүүр солигдох бүрд солино.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-11'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();window.appConfirm=()=>Promise.resolve(true)});
await page.evaluate(()=>{
  const mk=(id,lab,n,bad)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  DB.folders=[
    {id:'DF',name:'Өртөө хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
     tracks:[{id:'DT',num:5,kind:'station',sections:[mk('d1','1-р үе',20,[0])]}]},
    {id:'BF',br:1,name:'Салбар хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
     tracks:[{id:'BT',num:1,kind:'station',name:'Цемент завод',sections:[mk('b1','1-р үе',46,[0,1,2])]}]}];
  let it='nn';for(let i=0;i<20;i++)it+=i<3?'b':'n';
  DB.sw=[
    {id:'DS',name:'Өртөө сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
     turnouts:[{id:'dw',num:7,mak:'Р-65',mark:'1/9',head:2,it,dRepl:{}}]},
    {id:'BS',br:1,name:'Салбар сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
     turnouts:[{id:'bw',num:1,mak:'Р-65',mark:'1/11',head:2,it,dRepl:{}}]}];
  DB.main=[];activeFolderId=null;DB.tracks=[];swFolderId=null;saveDB();goHome()});

/* Өртөөний паспортыг нээгээд, дараа нь салбар руу ороод буцна */
const leak=await page.evaluate(async()=>{
  openFolder('DF');await new Promise(r=>setTimeout(r,320));
  const derTracks=[...document.querySelectorAll('#tracksGrid .track-card')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,18));
  goBrHome();await new Promise(r=>setTimeout(r,320));
  openBrFolder('BF');await new Promise(r=>setTimeout(r,360));
  goDerHome();await new Promise(r=>setTimeout(r,400));
  return{derTracks,
    after:[...document.querySelectorAll('#tracksGrid .track-card')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,18)),
    meta:(document.getElementById('heroMeta')||{}).textContent||'',
    total:(document.getElementById('hsTotal')||{}).textContent||'',
    active:activeFolderId}});
ok('Өртөөний паспортод өөрийн зам харагдана',
   leak.derTracks.length===1&&/5-р зам/.test(leak.derTracks[0]),JSON.stringify(leak.derTracks));
ok('Салбараас буцахад ӨРТӨӨНД салбарын зам ОРЖ ИРЭХГҮЙ',
   leak.after.length===1&&/5-р зам/.test(leak.after[0]),
   JSON.stringify(leak.after)+' · '+leak.active);
ok('Өртөөний толгойд салбарын паспортын нэр гарахгүй',
   !/Салбар/.test(leak.meta),leak.meta);
ok('Өртөөний нийт дэр нь өөрийнх (20)',leak.total==='20',leak.total);

/* Сумын тал */
const swLeak=await page.evaluate(async()=>{
  goSwHome();await new Promise(r=>setTimeout(r,320));
  openSwFolderView('DS');await new Promise(r=>setTimeout(r,340));
  const own=[...document.querySelectorAll('#swTurnoutsGrid .sw-card')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,10));
  goBrHome();await new Promise(r=>setTimeout(r,320));
  brTab('sw');await new Promise(r=>setTimeout(r,260));
  openBrSwFolder('BS');await new Promise(r=>setTimeout(r,360));
  goSwHome();await new Promise(r=>setTimeout(r,400));
  return{own,after:[...document.querySelectorAll('#swTurnoutsGrid .sw-card')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,10)),
    id:swFolderId}});
ok('СШ-ийн паспортод өөрийн сум харагдана',
   swLeak.own.length===1&&/Сум 7/.test(swLeak.own[0]),JSON.stringify(swLeak.own));
ok('Салбараас буцахад СШ-д салбарын сум ОРЖ ИРЭХГҮЙ',
   swLeak.after.length===1&&/Сум 7/.test(swLeak.after[0]),
   JSON.stringify(swLeak.after)+' · '+swLeak.id);


/* ЭСРЭГ ЧИГЛЭЛ: өртөөний паспорт салбар руу орж ирэхгүй */
const back=await page.evaluate(async()=>{
  goBrHome();await new Promise(r=>setTimeout(r,360));
  return{trk:[...document.querySelectorAll('#brTrGrid .track-card')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,18)),
    sw:[...document.querySelectorAll('#brSwTurnouts .sw-card')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,10)),
    f:activeFolderId,s:swFolderId}});
ok('Салбарт буцахад өөрийн зам нь хэвээр (өртөөнийх орж ирэхгүй)',
   back.trk.length===1&&/1-р зам/.test(back.trk[0])&&back.f==='BF',
   JSON.stringify(back.trk)+' · '+back.f);
ok('Салбарын сумын заагч ч хэвээр',back.s==='BS',String(back.s));

/* Хоёр тал хооронд гурав дахин үсрэхэд ч холилдохгүй */
const loop=await page.evaluate(async()=>{
  const out=[];
  for(let i=0;i<3;i++){
    goDerHome();await new Promise(r=>setTimeout(r,240));
    out.push('der:'+activeFolderId+'/'+swFolderId);
    goBrHome();await new Promise(r=>setTimeout(r,240));
    out.push('br:'+activeFolderId+'/'+swFolderId)
  }
  goDerHome();await new Promise(r=>setTimeout(r,300));
  return{out,tracks:[...document.querySelectorAll('#tracksGrid .track-card')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,10))}});
ok('Олон удаа үсрэхэд заагч тогтвортой',
   loop.out.every((x,i)=>i%2?x==='br:BF/BS':x==='der:DF/DS'),JSON.stringify(loop.out));
ok('Эцэст нь өртөөнд өөрийн зам',
   loop.tracks.length===1&&/5-р зам/.test(loop.tracks[0]),JSON.stringify(loop.tracks));

/* Гарч, дахин нэвтрэхэд заагч цэвэрлэгдэнэ */
const out2=await page.evaluate(async()=>{
  goBrHome();await new Promise(r=>setTimeout(r,240));
  doLogout();await new Promise(r=>setTimeout(r,420));
  return{f:activeFolderId,s:swFolderId,hub:_hubBr,
    keep:JSON.stringify([_keepDer,_keepBr])}});
ok('Гарахад хоёр талын заагч тэглэгдэнэ',
   !out2.f&&!out2.s&&!out2.hub&&/null/.test(out2.keep),
   `${out2.f}/${out2.s} · ${out2.keep}`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
