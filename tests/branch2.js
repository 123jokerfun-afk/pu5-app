/* ══════════════════════════════════════════════════════════════
   САЛБАР ЗАМЫН НҮҮР — БҮХ АЖИЛ ТЭНД

   Өмнө нь паспорт дээр дарахад өртөөний нүүр рүү, сумын паспорт
   нээхэд СШ-ийн нүүр рүү үсэрч, хэрэглэгч хаана байгаагаа алддаг
   байв. Одоо салбар зам бүхэлдээ өөрийн дэлгэцэнд төвлөрнө.
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
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?(i%2?'bad_tbd':'bad'):(i%3?'tbd':'normal'),ts:0}))});
  DB.folders=[{id:'BF',br:1,name:'Хавар салбар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
    tracks:[{id:'BT1',num:1,kind:'station',name:'Цемент завод',sections:[mk('b1','1-р үе',10,[0,1])]},
            {id:'BT2',num:2,kind:'station',name:'Агуулах',sections:[mk('b2','1-р үе',8,[3])]}]}];
  let it='nn';for(let i=0;i<20;i++)it+=i<3?'b':'n';
  DB.sw=[{id:'BS',br:1,name:'Хавар салбар сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-11',
    turnouts:[{id:'bw1',num:1,mak:'Р-65',mark:'1/9',station:'Цемент',head:2,it,dRepl:{},dPlan:{}}],
    inc:[{id:'i1',d:'2026-05-01',items:[{L:3,n:5}]}]}];
  DB.main=[];activeFolderId=null;DB.tracks=[];swFolderId=null;saveDB();goHome()});

const t1=await page.evaluate(async()=>{
  goBrHome();await new Promise(r=>setTimeout(r,360));
  return{view:(document.querySelector('.view.active')||{}).id,
    tabs:[...document.querySelectorAll('.br-tab')].map(e=>e.textContent.replace(/\s+/g,' ').trim()),
    trPane:getComputedStyle(document.getElementById('brTrPane')).display,
    swPane:getComputedStyle(document.getElementById('brSwPane')).display,
    hint:document.getElementById('brTrStats').textContent.trim()}});
ok('Салбар замын дэлгэц нээгдэнэ',t1.view==='brHomeView',t1.view);
ok('Дээр нь Зам, Сум хоёр цонх',t1.tabs.length===2&&/Зам/.test(t1.tabs[0])&&/Сум/.test(t1.tabs[1]),
   JSON.stringify(t1.tabs));
ok('Эхлээд Зам цонх нээлттэй',t1.trPane!=='none'&&t1.swPane==='none',`${t1.trPane}/${t1.swPane}`);
ok('Паспорт сонгоогүй бол зөвлөмж гарна',/Паспорт дээр дарж/.test(t1.hint),t1.hint.slice(0,40));

const t2=await page.evaluate(async()=>{
  openBrFolder('BF');await new Promise(r=>setTimeout(r,380));
  return{view:(document.querySelector('.view.active')||{}).id,
    open:getComputedStyle(document.getElementById('brTrOpen')).display,
    stats:[...document.querySelectorAll('#brTrStats .br-st')].map(e=>
      e.querySelector('.br-st-l').textContent+'='+e.querySelector('.br-st-n').textContent),
    trks:[...document.querySelectorAll('#brTrGrid .track-card')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,28)),
    folders:[...document.querySelectorAll('#brTrFolders .folder-name')].map(e=>e.textContent.trim()),
    der:[...document.querySelectorAll('#brDerWrap .folder-name')].map(e=>e.textContent.trim())}});
ok('Паспорт дарахад ӨРТӨӨНИЙ нүүр рүү ҮСРЭХГҮЙ',t2.view==='brHomeView',t2.view);
ok('Паспортын доор бүртгэлийн дүн гарна',
   t2.stats.length===6&&/ЗАМ=2/i.test(t2.stats[0])&&/НИЙТ ДЭР=18/i.test(t2.stats[1]),
   JSON.stringify(t2.stats));
ok('Замууд нь тэндээ жагсана',t2.trks.length===2&&/Цемент завод/.test(t2.trks[0]),
   JSON.stringify(t2.trks));
ok('Хавтаснууд байна',t2.folders.length===3&&/Солигдсон дэр/.test(t2.folders[0]),
   JSON.stringify(t2.folders));
ok('Дэрийн агуулах байна',t2.der.length===2&&/Орлого/.test(t2.der[0]),JSON.stringify(t2.der));

const t3=await page.evaluate(async()=>{
  openBrTrack('BT1');await new Promise(r=>setTimeout(r,360));
  const v1=(document.querySelector('.view.active')||{}).id;
  backFromTrack();await new Promise(r=>setTimeout(r,380));
  return{v1,v2:(document.querySelector('.view.active')||{}).id}});
ok('Зам дээр дарахад бүртгэл рүү орно',t3.v1==='trackView',t3.v1);
ok('Буцахад САЛБАР руугаа эргэнэ',t3.v2==='brHomeView',t3.v2);

const t4=await page.evaluate(async()=>{
  brTab('sw');await new Promise(r=>setTimeout(r,360));
  const before={trPane:getComputedStyle(document.getElementById('brTrPane')).display,
    swPane:getComputedStyle(document.getElementById('brSwPane')).display};
  openBrSwFolder('BS');await new Promise(r=>setTimeout(r,380));
  return{...before,view:(document.querySelector('.view.active')||{}).id,
    open:getComputedStyle(document.getElementById('brSwOpen')).display,
    stats:[...document.querySelectorAll('#brSwStats .br-st')].map(e=>
      e.querySelector('.br-st-l').textContent+'='+e.querySelector('.br-st-n').textContent),
    sw:[...document.querySelectorAll('#brSwTurnouts .sw-card')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,22)),
    folders:[...document.querySelectorAll('#brSwFolders .folder-name')].map(e=>e.textContent.trim()),
    wrap:[...document.querySelectorAll('#brSwWrap .folder-name')].map(e=>e.textContent.trim())}});
ok('Сум цонх руу шилжинэ',t4.trPane==='none'&&t4.swPane!=='none',`${t4.trPane}/${t4.swPane}`);
ok('Сумын паспорт дарахад СШ-ийн нүүр рүү ҮСРЭХГҮЙ',t4.view==='brHomeView',t4.view);
ok('Сумын дүн гарна',t4.stats.length===6&&/СУМ=1/i.test(t4.stats[0])&&/НИЙТ ДҮНЗ=20/i.test(t4.stats[1]),
   JSON.stringify(t4.stats));
ok('Тэнцэхгүй дүнзний ТОО гарна',/^ТЭНЦЭХГҮЙ ДҮНЗ=\d+$/i.test(t4.stats[2]),t4.stats[2]);
ok('Сумууд жагсана',t4.sw.length===1&&/Сум 1/.test(t4.sw[0]),JSON.stringify(t4.sw));
ok('Дүнзний хавтас, агуулах байна',
   t4.folders.length===3&&t4.wrap.length===3&&/Орлого/.test(t4.wrap[0]),
   JSON.stringify(t4.folders)+' · '+JSON.stringify(t4.wrap));

const t5=await page.evaluate(async()=>{
  openBrSwRec('bw1');await new Promise(r=>setTimeout(r,380));
  const v1=(document.querySelector('.view.active')||{}).id;
  swBackFromRec();await new Promise(r=>setTimeout(r,380));
  return{v1,v2:(document.querySelector('.view.active')||{}).id,
    pane:getComputedStyle(document.getElementById('brSwPane')).display}});
ok('Сум дээр дарахад бүртгэл рүү орно',t5.v1==='swRecView',t5.v1);
ok('Буцахад САЛБАР руугаа, Сум цонхон дээрээ эргэнэ',
   t5.v2==='brHomeView'&&t5.pane!=='none',`${t5.v2} · ${t5.pane}`);


/* Зам, сум НЭМЭХ/УСТГАХ нь салбарын дэлгэцээ шинэчлэх ёстой —
   нуугдсан өртөө/СШ-ийн нүүрийг дүрслэх нь дэмий */
const t6=await page.evaluate(async()=>{
  brTab('tr');await new Promise(r=>setTimeout(r,300));
  const n0=document.querySelectorAll('#brTrGrid .track-card').length;
  // Зам нэмэх (салбарын нэрийн хүрдээр)
  openAddTrack();await new Promise(r=>setTimeout(r,300));
  _brPick=0;addTrack();await new Promise(r=>setTimeout(r,380));
  const n1=document.querySelectorAll('#brTrGrid .track-card').length;
  const st=[...document.querySelectorAll('#brTrStats .br-st')]
    .map(e=>e.querySelector('.br-st-l').textContent+'='+e.querySelector('.br-st-n').textContent);
  return{n0,n1,st:st[0],view:(document.querySelector('.view.active')||{}).id}});
ok('Зам нэмэхэд САЛБАРЫН жагсаалт шинэчлэгдэнэ',
   t6.n1===t6.n0+1&&t6.view==='brHomeView',`${t6.n0} → ${t6.n1} · ${t6.view}`);
ok('Дүн нь шууд дагаж шинэчлэгдэнэ',/Зам=3/.test(t6.st),t6.st);

const t7=await page.evaluate(async()=>{
  brTab('sw');await new Promise(r=>setTimeout(r,300));
  const n0=document.querySelectorAll('#brSwTurnouts .sw-card').length;
  openSwTurnout();await new Promise(r=>setTimeout(r,300));
  document.getElementById('swtNum').value='9';
  _swMak='Р-65';_swMark='1/9';addSwTurnout();await new Promise(r=>setTimeout(r,400));
  return{n0,n1:document.querySelectorAll('#brSwTurnouts .sw-card').length,
    view:(document.querySelector('.view.active')||{}).id}});
ok('Сум нэмэхэд САЛБАРЫН жагсаалт шинэчлэгдэнэ',
   t7.n1===t7.n0+1&&t7.view==='brHomeView',`${t7.n0} → ${t7.n1} · ${t7.view}`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
