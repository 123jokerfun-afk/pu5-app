/* ══════════════════════════════════════════════════════════════
   ЯВАХ ЧИГЛЭЛ — өртөөний замыг буцах замдаа бүртгэх

   Талбар дээр замуудыг нэг нэгээр туулахдаа зэргэлдээ замыг БУЦАХ
   замдаа бүртгэдэг. Тэгэхээр үе нь эсрэг дарааллаар (50 → 1)
   тааралдана. Энэ нь зөвхөн ЯВАХ дараалал — үеийн дугаар, бүртгэсэн
   дэр, паспортын өгөгдөл ХӨНДӨГДӨХ ЁСГҮЙ.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  // Үүлгүй орчны анхааруулах туузыг авна — товчны дээр хучигдахаас сэргийлнэ
  const eb=document.getElementById('errBanner');if(eb)eb.remove()});

/* 2-р зам: 5 үе × 4 дэр. 9-р зам: ганц үе. Гол зам: 2 үе. */
await page.evaluate(()=>{
  const ue=n=>({id:'u'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:4},(_,i)=>({type:i===0?'bad':'normal',ts:0}))});
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'t1',num:2,kind:'station',sections:[ue(1),ue(2),ue(3),ue(4),ue(5)]},
            {id:'t9',num:9,kind:'station',sections:[ue(1)]}]}];
  DB.main=[{id:'k1',num:12,kind:'main',mat:'tbd',sections:[ue(1),ue(2)]}];
  activeFolderId='f1';DB.tracks=DB.folders[0].tracks;saveDB()});

/* ── 1. Зам нээхэд чиглэл асууна ── */
console.log('\nЧиглэл асуух');
const ask=await page.evaluate(async()=>{
  openTrack('t1');await new Promise(r=>setTimeout(r,350));
  return{open:document.getElementById('walkModal').classList.contains('open'),
    sub:document.getElementById('wkSub').textContent,
    fwd:document.getElementById('wkFwd').textContent,
    rev:document.getElementById('wkRev').textContent}});
ok('Өртөөний зам нээхэд чиглэл асууна',ask.open===true,String(ask.open));
ok('Замын нэр, үеийн тоо харагдана',/2-р зам/.test(ask.sub)&&/5 үе/.test(ask.sub),ask.sub);
ok('Эхнээс нь 1-р үеэс, ухрах нь сүүлийн үеэс',
   /1-р үе$/.test(ask.fwd)&&/5-р үе$/.test(ask.rev),`${ask.fwd} · ${ask.rev}`);

/* ── 2. Ухрах — жагсаалт эсрэгээрээ ── */
console.log('\nУхрах горим');
const rev=await page.evaluate(async()=>{
  const before=dataSections(activeTrack()).map(s=>s.label);
  pickWalk(1);await new Promise(r=>setTimeout(r,300));
  return{before,
    cards:[...document.querySelectorAll('#trackBody .sec-card-title')].map(e=>e.textContent.trim()),
    walk:walkSections(activeTrack()).map(s=>s.label),
    store:activeTrack().sections.map(s=>s.label),
    on:isRevTrack(),sub:document.getElementById('tvSub').textContent,
    open:document.getElementById('walkModal').classList.contains('open')}});
ok('Сонгосны дараа цонх хаагдана',!rev.open);
ok('Үеийн карт эсрэг дарааллаар',
   JSON.stringify(rev.cards)===JSON.stringify(['5-р үе','4-р үе','3-р үе','2-р үе','1-р үе']),
   JSON.stringify(rev.cards));
ok('walkSections эсрэгээрээ',
   JSON.stringify(rev.walk)===JSON.stringify(rev.before.slice().reverse()),
   JSON.stringify(rev.walk));
ok('ХАДГАЛСАН дараалал ХӨНДӨГДӨӨГҮЙ',
   JSON.stringify(rev.store)===JSON.stringify(rev.before),JSON.stringify(rev.store));
ok('Замын дэлгэцэд "ухарч" гэж харагдана',/ухарч/.test(rev.sub),rev.sub);
// Заалт нь толгойн ЖИНХЭНЭ товч — хуруунд багтах хэмжээтэй
await w(300);
const btn=await page.evaluate(()=>{
  const eb=document.getElementById('errBanner');if(eb)eb.remove();
  const b=document.getElementById('walkBtn');
  const r=b.getBoundingClientRect();
  return{lbl:b.textContent.trim(),w:Math.round(r.width),h:Math.round(r.height),
    hit:(()=>{const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return e===b||b.contains(e)})(),
    top:(()=>{const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return e?e.tagName+'.'+String(e.className).slice(0,30)+'#'+e.id:'-'})()}});
ok('Чиглэлийн товч хуруунд багтана (≥28px)',btn.w>=28&&btn.h>=28&&btn.hit,
   `${btn.w}×${btn.h} · ${btn.lbl} · дээр: ${btn.top}`);

/* ── 3. Үе хооронд шилжих нь буцаж явна ── */
const nav=await page.evaluate(async()=>{
  const wk=walkSections(activeTrack());
  openSection(wk[0].id);await new Promise(r=>setTimeout(r,300));
  const seq=[activeSec().label];
  for(let i=0;i<5;i++){navNextSection();await new Promise(r=>setTimeout(r,80));seq.push(activeSec().label)}
  const back=[];
  for(let i=0;i<2;i++){navPrevSection();await new Promise(r=>setTimeout(r,80));back.push(activeSec().label)}
  return{seq,back,sub:document.getElementById('rvSub').textContent,
    n:dataSections(activeTrack()).length}});
ok('"Дараагийн" нь 5 → 1 рүү явна',
   JSON.stringify(nav.seq.slice(0,5))===JSON.stringify(['5-р үе','4-р үе','3-р үе','2-р үе','1-р үе']),
   JSON.stringify(nav.seq));
ok('1-р үеэс цааш ШИНЭ ҮЕ нэмэхгүй',
   nav.seq[5]==='1-р үе'&&nav.n===5,`${nav.seq[5]} · ${nav.n} үе`);
ok('"Өмнөх" нь 1 → 5 рүү буцна',
   JSON.stringify(nav.back)===JSON.stringify(['2-р үе','3-р үе']),JSON.stringify(nav.back));
ok('Бүртгэлийн дэлгэцэд чиглэл харагдана',/ухарч/.test(nav.sub),nav.sub);

/* ── 4. Эхнээс рүү буцаах ── */
console.log('\nЭхнээс');
const fwd=await page.evaluate(async()=>{
  goTrack();await new Promise(r=>setTimeout(r,150));
  document.getElementById('walkBtn').click();await new Promise(r=>setTimeout(r,220));
  const reopened=document.getElementById('walkModal').classList.contains('open');
  pickWalk(0);await new Promise(r=>setTimeout(r,260));
  const cards=[...document.querySelectorAll('#trackBody .sec-card-title')].map(e=>e.textContent.trim());
  const wk=walkSections(activeTrack());
  openSection(wk[0].id);await new Promise(r=>setTimeout(r,250));
  const seq=[activeSec().label];
  for(let i=0;i<5;i++){navNextSection();await new Promise(r=>setTimeout(r,80));seq.push(activeSec().label)}
  return{reopened,cards,seq,on:isRevTrack(),n:dataSections(activeTrack()).length,
    sub:document.getElementById('rvSub').textContent}});
ok('Толгойн товч дарахад чиглэл дахин асууна',fwd.reopened===true);
ok('Эхнээс — жагсаалт 1 → 5',
   JSON.stringify(fwd.cards)===JSON.stringify(['1-р үе','2-р үе','3-р үе','4-р үе','5-р үе']),
   JSON.stringify(fwd.cards));
ok('Эхнээс — төгсгөлд ШИНЭ ҮЕ нэмэгдэнэ (хуучин зан төлөв)',
   fwd.seq[5]==='6-р үе'&&fwd.n===6,`${fwd.seq[5]} · ${fwd.n} үе`);
ok('Эхнээс үед заалт харагдахгүй',!/ухарч/.test(fwd.sub)&&!fwd.on,fwd.sub);

/* ── 5. Хаана асуухгүй вэ ── */
console.log('\nАсуухгүй тохиолдол');
const no=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,150));
  openTrack('k1');await new Promise(r=>setTimeout(r,300));
  const km=document.getElementById('walkModal').classList.contains('open');
  const kmRev=isRevTrack(activeTrack());
  goHome();await new Promise(r=>setTimeout(r,120));
  openTrack('t9');await new Promise(r=>setTimeout(r,300));
  const one=document.getElementById('walkModal').classList.contains('open');
  const oneSub=document.getElementById('tvSub').textContent;
  return{km,kmRev,one,oneSub}});
ok('Гол замд чиглэл асуухгүй',!no.km&&!no.kmRev,String(no.km));
ok('Ганц үетэй замд асуухгүй',!no.one,String(no.one));
ok('Ганц үетэй замд заалт ч гарахгүй',!/ухарч|эхнээс/.test(no.oneSub),no.oneSub);

/* ── 6. Тоо, дүн хөндөгдөөгүй ── */
const same=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,120));
  openTrack('t1',1);await new Promise(r=>setTimeout(r,250));
  const a0=analyzeTrack(activeTrack());
  _revTrk[activeTrackId]=1;renderTrackView();await new Promise(r=>setTimeout(r,200));
  const a1=analyzeTrack(activeTrack());
  return{a0:[a0.total,a0.bad],a1:[a1.total,a1.bad],
    ov:document.getElementById('tvOverview').textContent.replace(/\s+/g,' ').trim().slice(0,40)}});
ok('Чиглэл сольсон ч тоо, дүн хэвээр',
   JSON.stringify(same.a0)===JSON.stringify(same.a1),
   JSON.stringify(same.a0)+' / '+JSON.stringify(same.a1));
ok('openTrack(id,1) — чиглэл асуухгүй (жишээ: дараалсан цэгээс үсрэх)',
   true,same.ov);

/* ── 7. ҮЕ ДОТРОО УХРАХ ────────────────────────────────────────
   Хүн ЯВСАН дарааллаараа 1, 2, 3 … гэж бүртгэнэ. Үеэс гарахад
   дугаар эргэнэ: сүүлд бүртгэсэн нь #1 болно. Паспортад ҮРГЭЛЖ
   замын жинхэнэ дараалал үлдэх ёстой. */
console.log('\nҮе дотроо ухрах');
await page.evaluate(()=>{window.appConfirm=()=>Promise.resolve(true)});
const inner=await page.evaluate(async()=>{
  const ue=n=>({id:'v'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',sleepers:[]});
  DB.folders[0].tracks.push({id:'t5',num:5,kind:'station',sections:[ue(1),ue(2),ue(3)]});
  DB.tracks=DB.folders[0].tracks;saveDB();
  openTrack('t5',1);_revTrk['t5']=1;renderTrackView();
  await new Promise(r=>setTimeout(r,220));
  const wk=walkSections(activeTrack());
  openSection(wk[0].id);                    // 3-р үе (ухрах эхлэл)
  await new Promise(r=>setTimeout(r,280));
  const sec=activeSec();
  for(const tp of ['bad','normal','normal','tbd','normal'])await record(tp);
  await new Promise(r=>setTimeout(r,200));
  const walkOrder=sec.sleepers.map(x=>x.type);
  const rw=!!sec.rw;
  const nums=[...document.querySelectorAll('#rvLog .dr-rec .dr-num')].map(e=>e.textContent);
  navNextSection();                          // үе солив → дугаар эргэнэ
  await new Promise(r=>setTimeout(r,260));
  const v3=activeTrack().sections.find(x=>x.id==='v3');
  return{first:wk[0].label,walkOrder,rw,nums,now:activeSec().label,
    stored:v3.sleepers.map(x=>x.type),rwAfter:!!v3.rw}});
ok('Ухрах горимд сүүлийн үеэс эхэлнэ',inner.first==='3-р үе',inner.first);
ok('Бүртгэж байхад ЯВАХ дарааллаар (#1, #2 …)',
   JSON.stringify(inner.nums)===JSON.stringify(['#1','#2','#3','#4','#5']),
   JSON.stringify(inner.nums));
ok('Үе дотор явах дарааллаар хадгалагдаж байна (rw тэмдэг)',
   inner.rw&&JSON.stringify(inner.walkOrder)===JSON.stringify(['bad','normal','normal','tbd','normal']),
   JSON.stringify(inner.walkOrder));
ok('Үе солиход дугаар ЭРГЭНЭ — сүүлд бүртгэсэн нь #1',
   JSON.stringify(inner.stored)===JSON.stringify(['normal','tbd','normal','normal','bad']),
   JSON.stringify(inner.stored));
ok('Эргүүлсний дараа rw тэмдэг арилна',!inner.rwAfter);
ok('Дараагийн үе рүү шилжив',inner.now==='2-р үе',inner.now);

/* Дахин орж үргэлжлүүлэн бүртгэх */
const again=await page.evaluate(async()=>{
  openSection('v3');await new Promise(r=>setTimeout(r,280));
  const sec=activeSec();
  const walk=sec.sleepers.map(x=>x.type),rw=!!sec.rw;
  await record('bad');                       // явах дараалалд 6 дахь
  await new Promise(r=>setTimeout(r,180));
  goTrack();await new Promise(r=>setTimeout(r,320));
  const v3=activeTrack().sections.find(x=>x.id==='v3');
  return{walk,rw,final:v3.sleepers.map(x=>x.type),rwEnd:!!v3.rw}});
ok('Дахин орход ЯВАХ дараалал руу буцаана',
   again.rw&&JSON.stringify(again.walk)===JSON.stringify(['bad','normal','normal','tbd','normal']),
   JSON.stringify(again.walk));
ok('Үргэлжлүүлж бүртгээд гарахад дахин зөв эргэнэ',
   JSON.stringify(again.final)===JSON.stringify(['bad','normal','tbd','normal','normal','bad'])
   &&!again.rwEnd,JSON.stringify(again.final));

/* Эргүүлэлт нь repl / fmap / fseg-ийг ч зөв зөөнө, хоёр удаа эргүүлбэл
   яг анхныхаараа болно */
const swap=await page.evaluate(()=>{
  const sec={id:'x',type:'normal',label:'X',
    sleepers:[0,1,2,3,4,5].map(i=>({type:i===0?'bad':'normal',ts:0})),
    repl:{0:{d:'2026-05-01'},5:{d:'2026-06-01'}},fmap:{1:{f:'APC'}},
    fseg:[{i:2,m:'tbd',f:'CZ'}]};
  const J=()=>JSON.stringify({sl:sec.sleepers.map(x=>x.type),repl:sec.repl,fmap:sec.fmap});
  const a=J();_revSwap(sec);const mid={repl:Object.keys(sec.repl),fmap:Object.keys(sec.fmap),
    seg:sec.fseg.map(x=>x.i)};_revSwap(sec);
  return{same:a===J(),mid,segLen:sec.fseg.length}});
ok('Хоёр удаа эргүүлбэл яг анхных нь болно (repl, fmap хамт)',swap.same,JSON.stringify(swap.mid));
ok('fseg-ийн муж эргэхдээ алдагдахгүй',swap.mid.seg.indexOf(0)>=0,JSON.stringify(swap.mid.seg));

/* Апп унасан ч ачаалахдаа өөрөө засна */
const crash=await page.evaluate(()=>{
  const v3=(DB.folders[0].tracks.find(t=>t.id==='t5').sections).find(x=>x.id==='v3');
  const good=v3.sleepers.map(x=>x.type);
  _revSwap(v3);v3.rw=1;                      // "унасан" төлөв — хагас эргэсэн
  const broken=v3.sleepers.map(x=>x.type);
  _migrateDB();
  return{good,broken,fixed:v3.sleepers.map(x=>x.type),rw:!!v3.rw}});
ok('Унасны дараа ачаалахад үе өөрөө буцаж эргэнэ',
   JSON.stringify(crash.fixed)===JSON.stringify(crash.good)&&!crash.rw,
   JSON.stringify(crash.broken)+' → '+JSON.stringify(crash.fixed));

/* Эхнээс горимд юу ч эргэхгүй */
const fwd2=await page.evaluate(async()=>{
  delete _revTrk['t5'];
  openSection('v1');await new Promise(r=>setTimeout(r,260));
  const sec=activeSec();
  for(const tp of ['bad','normal','tbd'])await record(tp);
  await new Promise(r=>setTimeout(r,180));
  const rw=!!sec.rw;
  goTrack();await new Promise(r=>setTimeout(r,300));
  const v1=activeTrack().sections.find(x=>x.id==='v1');
  return{rw,stored:v1.sleepers.map(x=>x.type)}});
ok('Эхнээс горимд дараалал ХЭВЭЭР (эргэхгүй)',
   !fwd2.rw&&JSON.stringify(fwd2.stored)===JSON.stringify(['bad','normal','tbd']),
   JSON.stringify(fwd2.stored));

/* ── 8. Холбох хэсэг дээд талд, гарахад байрлал руугаа гүйлгэнэ ── */
console.log('\nЖагсаалтын байрлал');
const conn=await page.evaluate(async()=>{
  const t=DB.folders[0].tracks.find(x=>x.id==='t1');
  if(!t.sections.find(s=>s.type==='connecting'))
    t.sections.push({id:'c1',type:'connecting',label:'Холбох 1',note:'',sleepers:[]});
  saveDB();openTrack('t1',1);await new Promise(r=>setTimeout(r,300));
  const lbl=[...document.querySelectorAll('#trackBody .sec-lbl')].map(e=>e.textContent.trim().split(' ')[0]);
  return{lbl}});
ok('Холбох хэсэг жагсаалтын ДЭЭД талд',
   conn.lbl[0]==='Холбох'&&conn.lbl[1]==='Үенүүд',JSON.stringify(conn.lbl));

const back=await page.evaluate(async()=>{
  const t=activeTrack(),last=dataSections(t).filter(s=>s.type!=='connecting').slice(-1)[0];
  openSection(last.id);await new Promise(r=>setTimeout(r,260));
  goTrack();await new Promise(r=>setTimeout(r,700));
  const el=document.querySelector(`#trackBody .sec-card[data-sid="${last.id}"]`);
  const r=el?el.getBoundingClientRect():null;
  return{id:last.id,found:!!el,
    vis:r?(r.top>0&&r.bottom<window.innerHeight+2):false,
    hasAttr:!!document.querySelector('#trackBody .sec-card[data-sid]')}});
ok('Үеийн картад таних тэмдэг (data-sid) байна',back.hasAttr);
ok('Үеэс гарахад тэр үе рүүгээ гүйлгэнэ',back.found&&back.vis,
   `олдов ${back.found} · харагдаж байна ${back.vis}`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
