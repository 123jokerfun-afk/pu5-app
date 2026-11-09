/* ══════════════════════════════════════════════════════════════
   УХАРЧ БҮРТГЭЖ БАЙХАД УТАС УНТРААД АСАХ

   Ухрах горимд нээлттэй үе нь ЯВАХ дарааллаар түр эргүүлэгдсэн
   байдаг (sec.rw). Утас унтрах / апп арын дэвсгэрт орох үед
   (visibilitychange → hidden, pagehide) үеийг жинхэнэ дараалалд нь
   буцааж хадгалдаг — апп арын дэвсгэрт алагдсан ч паспорт зөв
   үлдэнэ. Харин буцаж асахад бүртгэлийн дэлгэц нээлттэй хэвээр
   байхад ЯВАХ дарааллыг сэргээдэггүй байсан тул дараагийн дэр
   жинхэнэ дарааллын ТӨГСГӨЛД нэмэгдэж, дараалал холилддог байв:

     bad, normal, normal, (унтраад асах), tbd, normal
     хүлээгдэж буй: normal,tbd,normal,normal,bad
     гарч байсан:   normal,normal,bad,tbd,normal

   Талбар дээр галт тэрэг өнгөрөхөд утсаа унтраах нь түгээмэл. ПУ-5
   дэвтэрт тэнцэхгүй дэрийн байрлал, дараалсан цэг буруу гарна.

   Сонсогч window дээр тул үзэгдлийг bubbles:true-гээр илгээнэ.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),T=require('./touch');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const J=JSON.stringify;
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
// Дахин ачаалах үед тасарсан хүсэлтүүд (live.js-тэй адил) — аль хаягийнх
// болохыг тэмдэглэж, аппын бусад алдаанаас ялгана
const failed=[];
page.on('requestfailed',q=>failed.push(q.url().replace(/^https?:\/\/[^/]+/,'').slice(0,60)));

/* Туслах функцууд — дахин ачаалсны дараа ч дахин суулгана */
const helpers=(pg=page)=>pg.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const eb=document.getElementById('errBanner');if(eb)eb.remove();
  window.__w=ms=>new Promise(r=>setTimeout(r,ms));
  // Утас унтрах / асах. document.hidden-ийг солиод үзэгдэл илгээнэ.
  window.__vis=h=>{
    Object.defineProperty(document,'hidden',{value:h,configurable:true});
    Object.defineProperty(document,'visibilityState',{value:h?'hidden':'visible',configurable:true});
    document.dispatchEvent(new Event('visibilitychange',{bubbles:true}))};
  // bfcache: pagehide/pageshow нь window дээр шууд илгээгддэг
  window.__page=show=>{
    Object.defineProperty(document,'hidden',{value:!show,configurable:true});
    window.dispatchEvent(new PageTransitionEvent(show?'pageshow':'pagehide',{persisted:true}))};
  window.__pat=sec=>sec.sleepers.map(x=>x.type).join(',');
  window.__find=(tid,sid)=>{let s=null;
    (DB.folders||[]).forEach(f=>(f.tracks||[]).forEach(t=>{if(t.id===tid)
      (t.sections||[]).forEach(x=>{if(x.id===sid)s=x})}));
    (DB.main||[]).forEach(t=>{if(t.id===tid)(t.sections||[]).forEach(x=>{if(x.id===sid)s=x})});
    return s};
  // Утсанд (localStorage) яг юу хадгалагдсан бэ
  window.__ls=(tid,sid)=>{
    const d=_unpackDB(JSON.parse(localStorage.getItem(_lsKey())));let s=null;
    (d.folders||[]).forEach(f=>(f.tracks||[]).forEach(t=>{if(t.id===tid)
      (t.sections||[]).forEach(x=>{if(x.id===sid)s=x})}));
    return s?{pat:s.sleepers.map(x=>x.type).join(','),rw:!!s.rw}:null};
  window.__nums=()=>[...document.querySelectorAll('#rvLog .dr-rec .dr-num')].map(e=>e.textContent).join(' ');
  // Ухрах горимд 3 үетэй хоосон замын СҮҮЛИЙН үеийг (3-р үе) нээнэ
  window.__start=async(tid)=>{
    const ue=n=>({id:tid+'v'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',sleepers:[]});
    DB.folders=[{id:'fh',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:tid,num:5,kind:'station',note:'',sections:[ue(1),ue(2),ue(3)]}]}];
    DB.main=[{id:'km',num:681,kind:'main',mat:'tbd',sections:[
      {id:'kmv1',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',sleepers:[]}]}];
    activeFolderId='fh';DB.tracks=DB.folders[0].tracks;
    _revTrk={};_revAsked={};_revOpen=null;saveDB();
    goHome();await __w(150);
    openTrack(tid,1);await __w(220);
    pickWalk(true);await __w(220);
    openSection(walkSections(activeTrack())[0].id);await __w(300);
    return activeSec()};
  // Жинхэнэ цонхыг товшилтын хэсэгт сэргээнэ
  if(!window.__ac0)window.__ac0=window.appConfirm;
  window.appConfirm=()=>Promise.resolve(true);
});
await B.login(page,'ПД-6');
await helpers();

/* ── 1. Гол алдаа ─────────────────────────────────────────────── */
console.log('\nУнтраад асах — гол алдаа');
const a=await page.evaluate(async()=>{
  const sec=await __start('ta');
  const first=sec.label;
  for(const tp of ['bad','normal','normal'])await record(tp);
  await __w(150);
  const before=__pat(sec);
  document.getElementById('toast').textContent='';
  __vis(true);                               // утас унтарлаа
  const hid={pat:__pat(sec),rw:!!sec.rw,open:_revOpen,ls:__ls('ta','tav3')};
  await __w(120);
  __vis(false);                              // буцаж асав
  await __w(200);
  const back={pat:__pat(sec),rw:!!sec.rw,open:_revOpen===sec,nums:__nums(),
    toast:document.getElementById('toast').textContent};
  for(const tp of ['tbd','normal'])await record(tp);
  await __w(200);
  const walk=__pat(sec),nums=__nums();
  goTrack();await __w(320);
  const s=__find('ta','tav3');
  return{first,before,hid,back,walk,nums,final:__pat(s),rwEnd:!!s.rw,ls:__ls('ta','tav3')}});
ok('Ухрах горимд сүүлийн үеэс эхэлнэ',a.first==='3-р үе',a.first);
ok('Унтрахаас өмнө ЯВАХ дарааллаар',a.before==='bad,normal,normal',a.before);
ok('Унтрахад жинхэнэ дараалалд буцна (апп алагдсан ч паспорт зөв)',
   a.hid.pat==='normal,normal,bad'&&!a.hid.rw&&a.hid.open===null,J(a.hid));
ok('Унтрахад утсанд жинхэнэ дараалал хадгалагдана',
   a.hid.ls&&a.hid.ls.pat==='normal,normal,bad'&&!a.hid.ls.rw,J(a.hid.ls));
ok('Асахад ЯВАХ дараалал сэргэнэ (rw, _revOpen)',
   a.back.pat==='bad,normal,normal'&&a.back.rw&&a.back.open,J(a.back));
ok('Асахад дэлгэцийн дугаар хэвээр (#1 #2 #3)',a.back.nums==='#1 #2 #3',a.back.nums);
ok('Асахад "дугаар эргэлээ" гэсэн төөрөгдүүлэх мэдэгдэл гарахгүй',
   !/эргэлээ/.test(a.back.toast),a.back.toast||'(хоосон)');
ok('Үргэлжлүүлэхэд ЯВАХ дараалал зөв (#1…#5)',
   a.walk==='bad,normal,normal,tbd,normal'&&a.nums==='#1 #2 #3 #4 #5',a.walk+' · '+a.nums);
ok('Үеэс гарахад ЖИНХЭНЭ дараалал зөв: normal,tbd,normal,normal,bad',
   a.final==='normal,tbd,normal,normal,bad'&&!a.rwEnd,a.final);
ok('Утсанд ч мөн зөв дараалал',a.ls&&a.ls.pat==='normal,tbd,normal,normal,bad'&&!a.ls.rw,J(a.ls));

/* ── 2. Олон удаа унтраах ─────────────────────────────────────── */
console.log('\nОлон удаа унтраах');
const m=await page.evaluate(async()=>{
  const sec=await __start('tm');
  const seq=['bad','normal','tbd','normal','bad','bad','normal'];
  for(let i=0;i<seq.length;i++){
    await record(seq[i]);await __w(60);
    if(i%2===0){__vis(true);await __w(40);__vis(false);await __w(60)}
  }
  // Хоёр удаа дараалан "асах" ирсэн ч (зарим хөтөч) давхар эргэхгүй
  __vis(false);await __w(40);__vis(false);await __w(60);
  const walk=__pat(sec),rw=!!sec.rw,open=_revOpen===sec;
  goTrack();await __w(320);
  return{walk,rw,open,final:__pat(__find('tm','tmv3'))}});
ok('Бүртгэл бүрийн дараа унтраасан ч ЯВАХ дараалал хадгалагдана',
   m.walk==='bad,normal,tbd,normal,bad,bad,normal'&&m.rw&&m.open,m.walk+' · rw='+m.rw);
ok('Давхар "асах" үзэгдэлд ДАХИН эргэхгүй',m.walk.startsWith('bad,'),m.walk);
ok('Гарахад жинхэнэ дараалал бүтэн эсрэгээрээ',
   m.final==='normal,bad,bad,normal,tbd,normal,bad',m.final);

/* ── 3. pagehide / pageshow (bfcache) ─────────────────────────── */
console.log('\npagehide / pageshow');
const p=await page.evaluate(async()=>{
  const sec=await __start('tp');
  for(const tp of ['bad','normal','normal'])await record(tp);
  await __w(120);
  __page(false);
  const hid={pat:__pat(sec),rw:!!sec.rw};
  await __w(80);
  __page(true);
  await __w(150);
  const back={pat:__pat(sec),rw:!!sec.rw,open:_revOpen===sec};
  for(const tp of ['tbd','normal'])await record(tp);
  await __w(150);
  goTrack();await __w(320);
  return{hid,back,final:__pat(__find('tp','tpv3'))}});
ok('pagehide — жинхэнэ дараалалд буцна',p.hid.pat==='normal,normal,bad'&&!p.hid.rw,J(p.hid));
ok('pageshow — ЯВАХ дараалал сэргэнэ',p.back.pat==='bad,normal,normal'&&p.back.rw&&p.back.open,J(p.back));
ok('pageshow-ийн дараа үргэлжлүүлэхэд зөв',p.final==='normal,tbd,normal,normal,bad',p.final);

/* ── 3б. Нуугдаж байхад үүлнээс шинэчлэлт ирэв ────────────────
   Утас унтарсан үед өөр утасны бичилт ирвэл бүртгэлийн дэлгэц
   ЖИНХЭНЭ дарааллаар дахин зурагдана. Асахад өгөгдөл ч, дэлгэц ч
   ЯВАХ дараалалд буцах ёстой — эс тэгвэл ажилтан эсрэг дарааллыг
   харж, засах гэж буруу дэр дарна. */
console.log('\nНуугдаж байхад үүлний шинэчлэлт');
const u=await page.evaluate(async()=>{
  const ty=()=>[...document.querySelectorAll('#rvLog .dr-rec')].map(r=>
    ['normal','bad','tbd'].find(t=>r.classList.contains('dr-'+t))).join(',');
  await __start('tu');
  for(const tp of ['bad','normal','tbd'])await record(tp);
  await __w(120);
  __vis(true);
  _dirtyClear();
  _applyRemote(JSON.parse(JSON.stringify(_packDB(DB))),Date.now());
  await __w(120);
  const hid={pat:__pat(activeSec()),dom:ty()};
  __vis(false);await __w(200);
  const sec=activeSec();
  const back={pat:__pat(sec),dom:ty(),rw:!!sec.rw,open:_revOpen===sec};
  await record('normal');await __w(150);
  goTrack();await __w(320);
  return{hid,back,final:__pat(__find('tu','tuv3'))}});
ok('Нуугдаж байхад дэлгэц жинхэнэ дарааллаар зурагдсан (давтах нөхцөл)',
   u.hid.pat==='tbd,normal,bad'&&u.hid.dom==='tbd,normal,bad',J(u.hid));
ok('Асахад өгөгдөл ба дэлгэц ЯВАХ дараалалд буцна',
   u.back.pat==='bad,normal,tbd'&&u.back.dom==='bad,normal,tbd'&&u.back.rw&&u.back.open,J(u.back));
ok('Үргэлжлүүлж бүртгээд гарахад зөв',u.final==='normal,tbd,normal,bad',u.final);

/* ── 4. Хамаарахгүй тохиолдлууд ──────────────────────────────── */
console.log('\nХамаарахгүй тохиолдол');
const n=await page.evaluate(async()=>{
  const out={};
  // а) Замын жагсаалт дээр байхад унтраад асах — юу ч эргэхгүй
  await __start('tn');
  for(const tp of ['bad','normal','normal'])await record(tp);
  goTrack();await __w(300);
  __vis(true);await __w(40);__vis(false);await __w(120);
  const s=__find('tn','tnv3');
  out.track={pat:__pat(s),rw:!!s.rw,open:_revOpen,
    view:(document.querySelector('.view.active')||{}).id};
  // б) Эхнээс горимд — дараалал хэвээр
  pickWalk(false);await __w(200);
  openSection('tnv1');await __w(260);
  const f=activeSec();
  for(const tp of ['bad','normal'])await record(tp);
  __vis(true);await __w(40);__vis(false);await __w(120);
  await record('tbd');await __w(120);
  out.fwd={pat:__pat(f),rw:!!f.rw};
  goTrack();await __w(260);
  // в) Гол зам — ухрах горим байхгүй
  goHome();await __w(150);
  openTrack('km');await __w(250);
  openSection('kmv1');await __w(260);
  const k=activeSec();
  for(const tp of ['bad','normal'])await record(tp);
  __vis(true);await __w(40);__vis(false);await __w(120);
  await record('tbd');await __w(120);
  out.km={pat:__pat(k),rw:!!k.rw,rev:isRevTrack()};
  goHome();await __w(200);
  return out});
ok('Замын жагсаалт дээр асахад үе эргэхгүй',
   n.track.pat==='normal,normal,bad'&&!n.track.rw&&n.track.open===null&&n.track.view==='trackView',
   J(n.track));
ok('Эхнээс горимд унтраад асахад дараалал хэвээр',
   n.fwd.pat==='bad,normal,tbd'&&!n.fwd.rw,J(n.fwd));
ok('Гол замд унтраад асахад дараалал хэвээр',
   n.km.pat==='bad,normal,tbd'&&!n.km.rw&&!n.km.rev,J(n.km));

/* ── 5. Баталгаажуулах горим ────────────────────────────────────
   Шалгах горимд _verifCursor нь ЯВАХ дарааллын индекс. Унтраад
   асахад сэргээгүй бол дараагийн дэрийг БУРУУ дэртэй тулгаж "зөрж
   байна" гэсэн ХУДАЛ анхааруулга гарна. */
console.log('\nБаталгаажуулах горим');
const v=await page.evaluate(async()=>{
  const mk=(id,pat)=>({id,type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
    sleepers:pat.map(t=>({type:t,ts:0}))});
  DB.folders=[{id:'fv',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'tv',num:6,kind:'station',note:'',sections:[mk('vv1',['normal','normal','tbd','bad'])]}]}];
  activeFolderId='fv';DB.tracks=DB.folders[0].tracks;_revTrk={tv:1};_revOpen=null;saveDB();
  openTrack('tv',1);await __w(220);
  const asked=[];window.appConfirm=m=>{asked.push(m);return Promise.resolve(false)};
  openVerifModal('vv1');startVerification();await __w(300);
  await recordVerif('bad');await __w(380);              // явах #1 = жинхэнэ #4
  __vis(true);await __w(40);__vis(false);await __w(150);
  await recordVerif('tbd');await __w(380);              // явах #2 = жинхэнэ #3
  await recordVerif('normal');await __w(380);
  const log=_verifLog.map(x=>x.match);
  window.appConfirm=()=>Promise.resolve(true);
  endVerification();goTrack();await __w(300);
  return{log,asked:asked.length,final:__pat(__find('tv','vv1'))}});
ok('Унтраад асасны дараа ч шалгалт зөв дэртэй тулгана (худал зөрүүгүй)',
   J(v.log)==='[true,true,true]'&&v.asked===0,J(v.log)+' · асуусан '+v.asked);
ok('Шалгалтын дараа жинхэнэ дараалал хөндөгдөөгүй',v.final==='normal,normal,tbd,bad',v.final);

/* ── 6. Апп ГЭНЭТ хаагдсан бол — дутуу үе ───────────────────────
   _revLeave болон _migrateDB хоёулаа дутуу бүртгэсэн үеийг "бүрэн"
   гэж үзэж эргүүлдэг. Дахин нээгээд ухрах горимд орвол _revEnter нь
   ЯВАХ дарааллыг яг сэргээх тул бүртгэл зөв үргэлжилнэ. */
console.log('\nАпп гэнэт хаагдсан');
// а) Унтраасан хойно OS аппыг алав (hidden → дахин ачаалалт)
await page.evaluate(async()=>{
  await __start('tk');
  for(const tp of ['bad','normal','normal'])await record(tp);
  await __w(120);__vis(true)});
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
await B.login(page,'ПД-6');
await helpers();
const k1=await page.evaluate(async()=>{
  const f=DB.folders.find(x=>x.id==='fh');activeFolderId=f.id;DB.tracks=f.tracks;
  const s0=__find('tk','tkv3');const loaded={pat:__pat(s0),rw:!!s0.rw};
  openTrack('tk',1);await __w(220);pickWalk(true);await __w(220);
  openSection('tkv3');await __w(300);
  const sec=activeSec(),walk=__pat(sec);
  for(const tp of ['tbd','normal'])await record(tp);
  await __w(150);goTrack();await __w(320);
  return{loaded,walk,final:__pat(__find('tk','tkv3'))}});
ok('Ачаалахад жинхэнэ дараалал (дутуу үе)',k1.loaded.pat==='normal,normal,bad'&&!k1.loaded.rw,J(k1.loaded));
ok('Дахин ухарч нээхэд ЯВАХ дараалал сэргэнэ',k1.walk==='bad,normal,normal',k1.walk);
ok('Үргэлжлүүлж бүртгээд гарахад зөв',k1.final==='normal,tbd,normal,normal,bad',k1.final);

// б) Ямар ч үзэгдэлгүй унасан (rw тэмдэгтэй хэвээр хадгалагдсан)
await page.evaluate(async()=>{
  await __start('tc');
  for(const tp of ['bad','normal','normal'])await record(tp);
  await __w(120);
  // Унасан мэт: гарах үзэгдлүүд ажиллахгүй
  window._revLeave=function(){};window.flushSave=function(){return false}});
const c0=await page.evaluate(()=>__ls('tc','tcv3'));
await page.reload({waitUntil:'load'});
await page.waitForTimeout(900);
await B.login(page,'ПД-6');
await helpers();
const k2=await page.evaluate(async()=>{
  const f=DB.folders.find(x=>x.id==='fh');activeFolderId=f.id;DB.tracks=f.tracks;
  const s0=__find('tc','tcv3');const loaded={pat:__pat(s0),rw:!!s0.rw};
  openTrack('tc',1);await __w(220);pickWalk(true);await __w(220);
  openSection('tcv3');await __w(300);
  const sec=activeSec(),walk=__pat(sec);
  for(const tp of ['tbd','normal'])await record(tp);
  await __w(150);goTrack();await __w(320);
  return{loaded,walk,final:__pat(__find('tc','tcv3'))}});
ok('Унахаас өмнө утсанд ЯВАХ дараалал + rw тэмдэг үлдсэн',
   c0&&c0.pat==='bad,normal,normal'&&c0.rw,J(c0));
ok('_migrateDB дутуу үеийг жинхэнэ дараалалд оруулна',
   k2.loaded.pat==='normal,normal,bad'&&!k2.loaded.rw,J(k2.loaded));
ok('Дахин ухарч нээхэд ЯВАХ дараалал сэргэнэ',k2.walk==='bad,normal,normal',k2.walk);
ok('Үргэлжлүүлж бүртгээд гарахад зөв',k2.final==='normal,tbd,normal,normal,bad',k2.final);

/* ── 7. ЖИНХЭНЭ ТОВЧООР — талбар дээрх бүтэн ажил ───────────────
   Дээрх шалгалтууд функцийг шууд дууддаг. Энд ажилтны гараар хийдэг
   бүх үйлдлийг (CDP touch) хийж, хооронд нь утсаа унтрааж асаана:
   жойстикийн 5 чиглэл, гарын товч, буцаах, засах цонх НЭЭЛТТЭЙ үед
   унтраах, байгаа дэрийг дарж бичих баталгаажуулах цонх НЭЭЛТТЭЙ үед
   унтраах, "Дараагийн →", "Буцах", Android-ын буцах товч. Утасны
   хэмжээ бүрт давтана — товч байрлал нь хэмжээнээс хамаардаг. */
async function uiFlow(pg){
  const st=()=>pg.evaluate(()=>{const s=activeSec();
    return{lbl:s?s.label:'-',pat:s?__pat(s):'-',rw:!!(s&&s.rw),
      view:(document.querySelector('.view.active')||{}).id,
      dom:[...document.querySelectorAll('#rvLog .dr-rec')].map(r=>
        ['normal','bad','tbd','bad-tbd'].find(t=>r.classList.contains('dr-'+t))).join(','),
      modal:[...document.querySelectorAll('.overlay.open')].map(o=>o.id).join(',')}});
  // Элементийг харагдах хэсэгт гүйлгэж, төвд нь хуруугаар дарна
  // Бөмбөрөгийн мөр transform-оор байрладаг тул түүнийг гүйлгэхгүй (noScroll)
  // Дэлгэц шилжих хөдөлгөөний дунд дарвал өөр товч дарагдана — байрлал
  // 2 удаа хэмжихэд хөдлөөгүй үед л дарна
  const tapAt=async(js,wait,noScroll)=>{
    const c=await pg.evaluate(async([js,ns])=>{const e=(0,eval)(js);if(!e)return null;
      if(!ns)e.scrollIntoView({block:'center'});
      let r=e.getBoundingClientRect(),p=null;
      for(let k=0;k<20&&(!p||Math.abs(p.left-r.left)+Math.abs(p.top-r.top)>0.5);k++){
        p=r;await new Promise(f=>setTimeout(f,90));r=e.getBoundingClientRect()}
      const x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);
      return{x,y,hit:!!h&&(h===e||e.contains(h)),top:h?h.tagName+'#'+h.id+'.'+String(h.className).slice(0,24):'-'}},[js,!!noScroll]);
    if(!c)throw new Error('олдсонгүй: '+js);
    if(!c.hit){
      // Цонх гулсаж гарч байгаа бол хөдөлгөөн дуусахыг хүлээнэ
      if((tapAt.n=(tapAt.n||0)+1)<8){await pg.waitForTimeout(200);return tapAt(js,wait,noScroll)}
      tapAt.n=0;throw new Error('халхлагдсан: '+js.slice(0,60)+' ← '+c.top)}
    tapAt.n=0;
    await T.tap(pg,c.x,c.y);await pg.waitForTimeout(wait||300)};
  const tap=(sel,wait,ns)=>tapAt(`document.querySelector(${J(sel)})`,wait,ns);
  /* Бөмбөрөгийг хуруугаар яг i-р мөр хүртэл чирж зогсооно (сүүлд нь
     хуруугаа зогсоож хурдыг 0 болгоно — эс тэгвэл инерцээр цааш гүйнэ),
     дараа нь тэр мөрийг дарж засах цонх нээнэ. Жижиг дэлгэцэд хол
     мөр толгойн доор нуугддаг тул ажилтан ч ингэж хийдэг. */
  const drumGo=async i=>{
    const cdp=await T.cdp(pg);
    for(let a=0;a<5;a++){
      // Хуруу зөвхөн бөмбөрөгийн ХАРАГДАХ хэсэгт (толгойн доор, доод
      // удирдлагын дээр) хөдөлнө — жижиг утсанд энэ зай богино
      const g=await pg.evaluate(i=>{const r=DRM.vp.getBoundingClientRect();
        return{x:r.left+r.width/2,top:r.top+70,bot:Math.min(r.bottom,innerHeight-DR_BOTTOM)-20,
          dy:(DRM.pos-i)*DR_H,cur:drumCursor()}},i);
      if(g.cur===i&&a)return;
      const span=g.bot-g.top,dy=Math.max(-span,Math.min(span,g.dy)),N=14;
      const y0=dy<0?g.bot:g.top;
      const tp=(type,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:y===null?[]:[{x:g.x,y,id:1}]});
      await tp('touchStart',y0);
      for(let k=1;k<=N;k++){await tp('touchMove',y0+dy*k/N);await pg.waitForTimeout(16)}
      await pg.waitForTimeout(160);await tp('touchMove',y0+dy+0.5);await pg.waitForTimeout(30);
      await tp('touchEnd',null);await pg.waitForTimeout(700);
    }
    const cur=await pg.evaluate(()=>drumCursor());
    if(cur!==i)throw new Error('бөмбөрөг '+i+' биш '+cur+' дээр зогсов')};
  const row=async(i,wait)=>{await drumGo(i);await tap(`#rvLog .drow[data-i="${i}"]`,wait,true)};

  const joy=async(dx,dy)=>{const c=await T.center(pg,'#joyBtn');
    if(!c)throw new Error('жойстик харагдахгүй: '+J(await st()));
    if(!dx&&!dy)await T.tap(pg,c.x,c.y);else await T.swipe(pg,c.x,c.y,dx,dy);
    await pg.waitForTimeout(140)};
  const sleep=async()=>{await pg.evaluate(()=>__vis(true));await pg.waitForTimeout(150);
    await pg.evaluate(()=>__vis(false));await pg.waitForTimeout(250)};
  const out={};
  await pg.evaluate(()=>{
    window.appConfirm=window.__ac0;                    // жинхэнэ цонх
    const ue=n=>({id:'uv'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',sleepers:[]});
    DB.folders=[{id:'fu',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'tu',num:4,kind:'station',note:'',sections:[ue(1),ue(2),ue(3)]}]}];
    DB.main=[];activeFolderId='fu';DB.tracks=DB.folders[0].tracks;
    _revTrk={};_revAsked={};_revOpen=null;saveDB();goHome()});
  await pg.waitForTimeout(400);
  await B.gotoPass(pg);
  await pg.evaluate(()=>{const e=document.getElementById('errBanner');if(e)e.remove()});
  await tap('.track-card[data-tid="tu"]',450);
  await tap('#walkBtn',350);
  await tapAt(`[...document.querySelectorAll('#walkModal button')].find(b=>/Ухарч/.test(b.textContent))`,400);
  out.trk=await pg.evaluate(()=>({view:(document.querySelector('.view.active')||{}).id,rev:isRevTrack(),
    first:(document.querySelector('#trackBody .sec-card[data-sid]')||{}).dataset.sid}));
  await tap('#trackBody .sec-card[data-sid="uv3"] .sec-card-title',450);
  out.open=await st();
  // 3-р үе: дээш (тэнцэхгүй), товшилт ×2 → унтраах → гарын "3" (ТБД), товшилт
  await joy(0,-45);await joy();await joy();
  await sleep();
  await pg.keyboard.press('3');await pg.waitForTimeout(150);await joy();
  out.s1=await st();
  await sleep();
  await tap('#recordView .round-btn[title="Буцаах"]',300);  // буцаах
  out.undo=await st();
  await sleep();
  // #1-ийг засах: бөмбөрөгийг тэр дэр хүртэл чирээд дарна
  await row(0,400);
  out.edOpen=(await st()).modal;
  await sleep();                                          // засах цонх нээлттэй үед унтраах
  await tap('#typeBtn',350);await tap('#tmB_bad_tbd',400);
  out.edit=await st();
  // #2 дээр очоод ТБД гэж дарж бичнэ → баталгаажуулах цонх
  await drumGo(1);
  await joy(45,0);await pg.waitForTimeout(250);
  out.cfOpen=(await st()).modal;
  await sleep();                                          // асуулт нээлттэй үед унтраах
  await tap('#appConfirmOkBtn',400);
  out.over=await st();
  await drumGo(await pg.evaluate(()=>activeSec().sleepers.length));  // бүртгэх хайрцаг руу чирнэ
  out.slot=await pg.evaluate(()=>drumCursor()+'/'+activeSec().sleepers.length);
  await joy();
  out.s1b=await st();
  await sleep();
  await tap('#navNextBtn',450);                           // "Дараагийн →"
  out.next=await st();
  out.u3=await pg.evaluate(()=>{const s=__find('tu','uv3');return __pat(s)+(s.rw?'[rw]':'')});
  // 2-р үе: товшилт, баруун (ТБД) → pagehide/pageshow → зүүн (Тэнц. ТБД) → "Буцах"
  await joy();await joy(45,0);
  await pg.evaluate(()=>__page(false));await pg.waitForTimeout(120);
  await pg.evaluate(()=>__page(true));await pg.waitForTimeout(250);
  await joy(-45,0);
  out.s2=await st();
  await pg.evaluate(()=>{document.getElementById('toast').textContent=''});
  await tap('#recordView .back-btn',450);
  out.backToast=await pg.evaluate(()=>document.getElementById('toast').textContent);
  out.u2=await pg.evaluate(()=>{const s=__find('tu','uv2');
    return{pat:__pat(s)+(s.rw?'[rw]':''),view:(document.querySelector('.view.active')||{}).id}});
  // 2-р үеийг дахин нээгээд үргэлжлүүлнэ → унтраах → доош (ТБД APC) → Android-ын буцах
  await tap('#trackBody .sec-card[data-sid="uv2"] .sec-card-title',450);
  out.re=await st();
  out.reSub=await pg.evaluate(()=>document.getElementById('rvSub').textContent);
  await sleep();
  await joy(0,45);
  out.s2b=await st();
  await pg.goBack();await pg.waitForTimeout(500);
  out.end=await pg.evaluate(()=>{
    const t=getTrack('tu'),rwAny=t.sections.some(s=>s.rw);
    const ls=__ls('tu','uv2'),ls3=__ls('tu','uv3');
    return{view:(document.querySelector('.view.active')||{}).id,rwAny,
      u2:__pat(__find('tu','uv2')),u3:__pat(__find('tu','uv3')),ls,ls3,
      total:analyzeTrack(t).total}});
  return out
}
const uiCheck=(nm,u)=>{
  ok(nm+' · товчоор ← Ухарч сонгоход сүүлийн үе дээд талд',
     u.trk.view==='trackView'&&u.trk.rev&&u.trk.first==='uv3',J(u.trk));
  ok(nm+' · үеийн карт дарахад бүртгэлийн дэлгэц',u.open.view==='recordView'&&u.open.lbl==='3-р үе',J(u.open));
  ok(nm+' · жойстик + гар, хооронд нь унтраасан',
     u.s1.pat==='bad,normal,normal,tbd,normal'&&u.s1.rw&&u.s1.dom===u.s1.pat,J(u.s1));
  ok(nm+' · унтраагаад "Буцаах" — СҮҮЛД бүртгэснийг авна',
     u.undo.pat==='bad,normal,normal,tbd'&&u.undo.rw,u.undo.pat);
  ok(nm+' · засах цонх нээлттэй үед унтраасан ч #1-ийг зөв засна',
     /editSleeperModal/.test(u.edOpen)&&u.edit.pat==='bad_tbd,normal,normal,tbd'&&!u.edit.modal,
     u.edOpen+' → '+u.edit.pat);
  ok(nm+' · дарж бичих асуулт нээлттэй үед унтраасан ч #2-ыг зөв солино',
     /appConfirmModal/.test(u.cfOpen)&&u.over.pat==='bad_tbd,tbd,normal,tbd',u.cfOpen+' → '+u.over.pat);
  ok(nm+' · бөмбөрөгийг чирж бүртгэх хайрцаг руу буцаад үргэлжлүүлнэ',
     u.slot==='4/4'&&u.s1b.pat==='bad_tbd,tbd,normal,tbd,normal',u.slot+' · '+u.s1b.pat);
  ok(nm+' · "Дараагийн →" — 3-р үе жинхэнэ дараалалд, дараагийнх нь 2-р үе',
     u.u3==='normal,tbd,normal,tbd,bad_tbd'&&u.next.lbl==='2-р үе',u.u3+' · '+u.next.lbl);
  ok(nm+' · pagehide/pageshow-ийн дараа ч зөв (2-р үе)',u.s2.pat==='normal,tbd,bad_tbd'&&u.s2.rw,u.s2.pat);
  ok(nm+' · "Буцах" товч — 2-р үе жинхэнэ дараалалд',
     u.u2.pat==='bad_tbd,tbd,normal'&&u.u2.view==='trackView',J(u.u2));
  ok(nm+' · жинхэнэ гарахад "дугаар эргэлээ" мэдэгдэл хэвээр гарна',/эргэлээ/.test(u.backToast),u.backToast);
  ok(nm+' · дахин нээхэд ЯВАХ дараалал, "ухарч" харагдана',
     u.re.pat==='normal,tbd,bad_tbd'&&u.re.rw&&u.re.dom==='normal,tbd,bad-tbd'&&/ухарч/.test(u.reSub),
     u.re.pat+' · '+u.reSub);
  ok(nm+' · унтраагаад доош (ТБД APC)',u.s2b.pat==='normal,tbd,bad_tbd,tbd',u.s2b.pat);
  ok(nm+' · Android-ын буцах — паспорт, утас хоёулаа зөв',
     u.end.view==='trackView'&&!u.end.rwAny&&u.end.u2==='tbd,bad_tbd,tbd,normal'
     &&u.end.ls&&u.end.ls.pat===u.end.u2&&!u.end.ls.rw&&u.end.ls3&&u.end.ls3.pat===u.end.u3&&u.end.total===9,
     J(u.end));
};
console.log('\nЖинхэнэ товчоор');
try{uiCheck(B.DEVICES[1].name.split(' (')[0],await uiFlow(page))}
catch(e){ok(B.DEVICES[1].name+' · товчоор',false,String(e.message).slice(0,120))}
for(const di of [0,3,4,6]){
  const dv=B.DEVICES[di];
  const np=await B.newPage(br,dv);
  await B.login(np.page,'ПД-6');await helpers(np.page);
  try{uiCheck(dv.name.split(' (')[0],await uiFlow(np.page))}
  catch(e){ok(dv.name+' · товчоор',false,String(e.message).slice(0,120))}
  np.errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js|net::ERR/.test(e)).forEach(e=>errs.push(dv.name+': '+e));
  await np.ctx.close();
}

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js|net::ERR/.test(e));
ok('Консолд алдаа алга',bad.length===0,
   J(bad.slice(0,3))+(failed.length?' · дахин ачаалахад тасарсан: '+J([...new Set(failed)].slice(0,4)):''));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
