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
const B=require('./base');
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
const helpers=()=>page.evaluate(()=>{
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

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js|net::ERR/.test(e));
ok('Консолд алдаа алга',bad.length===0,
   J(bad.slice(0,3))+(failed.length?' · дахин ачаалахад тасарсан: '+J([...new Set(failed)].slice(0,4)):''));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
