/* ══════════════════════════════════════════════════════════════
   САЛААЛСАН ГОЛ ЗАМ — ПД-11, ПД-12

   Эдгээр хэсгийн "гол зам" нь өөр тийш салсан мухар зам. Дэр нь
   ӨРТӨӨНИЙ замынхтай адил бүртгэгдэнэ: материал нь дэрийн төрлөөс
   (ТБД / тэнцэхгүй ТБД) тодорхойлогдоно, замын `mat` талбараас биш.
   Тоо буруу бодогдвол ПУ-5 дээр шууд буруу гарна.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();

/* ── Энгийн хэсэг (ПД-6): гол зам хэвээр ── */
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-6');
  const r=await page.evaluate(()=>({
    branch:isBranchSection(),lbl:mainLabel(),
    lbl6:mainLabel('ПД-6'),lbl11:mainLabel('ПД-11'),lbl12:mainLabel('ПД-12')}));
  ok('ПД-6 — салаалсан биш',!r.branch,String(r.branch));
  ok('ПД-6 — "Гол зам" гэж нэрлэнэ',r.lbl==='Гол зам',r.lbl);
  ok('ПД-11, ПД-12 л салаалсан',
     r.lbl6==='Гол зам'&&r.lbl11==='Салаалсан гол зам'&&r.lbl12==='Салаалсан гол зам',
     JSON.stringify([r.lbl6,r.lbl11,r.lbl12]));
  await page.close();
}

/* ── Салаалсан хэсэг (ПД-11) ── */
{
  const {page,errs}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-11');
  await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

  // ТБД замд модон дэр тэмдэглэвэл: гол замд материал нь замынх (бүгд ТБД),
  // салаалсан замд дэрийн төрлийнх (2 модон + 2 ТБД)
  const t=await page.evaluate(()=>{
    DB.location='Бор-өндөр';
    DB.main=[{id:'k1',num:1,kind:'main',mat:'tbd',fast:'CZ',sections:[
      {id:'m1',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
       sleepers:[{type:'normal',ts:0},{type:'bad',ts:0},
                 {type:'tbd',ts:0},{type:'bad_tbd',ts:0}]}]}];
    activeFolderId=null;DB.tracks=[];saveDB();
    const sec=DB.main[0].sections[0];
    const a=analyzeMainSection(sec,DB.main[0]);
    const tl=_secTally(sec,DB.main[0]);
    return{a:{total:a.total,wood:a.wood,tbd:a.tbd,bad:a.bad,bWood:a.bWood,bTbd:a.bTbd},
      t:tl,branch:isBranchSection(),lbl:mainLabel()}});
  ok('ПД-11 — салаалсан гэж танигдана',t.branch,String(t.branch));
  ok('ПД-11 — "Салаалсан гол зам" гэж нэрлэнэ',t.lbl==='Салаалсан гол зам',t.lbl);
  ok('Материал дэрийн төрлөөс: 2 модон, 2 ТБД',
     t.a.wood===2&&t.a.tbd===2,`модон ${t.a.wood} · ТБД ${t.a.tbd}`);
  ok('Тэнцэхгүй 2 (нэг модон, нэг ТБД)',
     t.a.bad===2&&t.a.bWood===1&&t.a.bTbd===1,
     `нийт ${t.a.bad} · модон ${t.a.bWood} · ТБД ${t.a.bTbd}`);
  ok('Маягтын тооцоо өртөөнийхтэй ижил замаар',
     t.t.total===4&&t.t.wood===2&&t.t.conc===2&&t.t.bad===2
     &&t.t.badWood===1&&t.t.badConc===1,JSON.stringify(t.t));

  // "Нийт дэр оруулах" товч харагдахгүй
  const ui=await page.evaluate(async()=>{
    openMainKmList();
    await new Promise(r=>setTimeout(r,450));
    const b=document.getElementById('kmBulkBtn');
    return{bulk:b?getComputedStyle(b).display:'?',
      title:(document.getElementById('mkTitle')||{}).textContent||'',
      view:(document.querySelector('.view.active')||{}).id}});
  ok('"Нийт дэр оруулах" товч нуугдана',ui.bulk==='none',ui.bulk);
  ok('Км жагсаалтын гарчиг солигдов',ui.title==='Салаалсан гол зам',ui.title);

  const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
  ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,2)));
  await page.close();
}

/* ── Энгийн хэсэгт хуучин зан төлөв хэвээр ── */
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-6');
  const t=await page.evaluate(async()=>{
    DB.main=[{id:'k1',num:1,kind:'main',mat:'tbd',fast:'CZ',sections:[
      {id:'m1',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
       sleepers:[{type:'normal',ts:0},{type:'bad',ts:0},
                 {type:'tbd',ts:0},{type:'bad_tbd',ts:0}]}]}];
    activeFolderId=null;DB.tracks=[];saveDB();
    const a=analyzeMainSection(DB.main[0].sections[0],DB.main[0]);
    openMainKmList();
    await new Promise(r=>setTimeout(r,450));
    const b=document.getElementById('kmBulkBtn');
    return{wood:a.wood,tbd:a.tbd,bulk:b?getComputedStyle(b).display:'?',
      title:(document.getElementById('mkTitle')||{}).textContent||''}});
  ok('ПД-6 — материал замынхаар (бүгд ТБД)',t.wood===0&&t.tbd===4,
     `модон ${t.wood} · ТБД ${t.tbd}`);
  ok('ПД-6 — "Нийт дэр оруулах" хэвээр харагдана',t.bulk!=='none',t.bulk);
  ok('ПД-6 — гарчиг "Гол зам" хэвээр',t.title==='Гол зам',t.title);
  await page.close();
}

/* ── Бүртгэлийн дэлгэц: салаалсан нь ӨРТӨӨНИЙ замтай адил ──────────
   ТБД нь бүгд CZ маягийнх тул бэхэлгээ сонгох, доош шудран APC
   бүртгэх, "нийт дэр оруулах" бөөнөөр бүртгэх нь энд утгагүй. */
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-11');
  const rec=await page.evaluate(async()=>{
    const ue=n=>({id:'u'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',sleepers:[]});
    DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',
      sc:'ПД-11',tracks:[{id:'t1',num:1,kind:'station',sections:[ue(9)]}]}];
    // Хуучин паспортад APC бичигдсэн байсан ч CZ гэж уншигдах ёстой
    DB.main=[{id:'k1',num:1,kind:'main',mat:'tbd',fast:'APC',sections:[ue(1)]}];
    activeFolderId='f1';DB.tracks=DB.folders[0].tracks;saveDB();
    openTrack('k1');openSection('u1');
    await new Promise(r=>setTimeout(r,420));
    record('tbd');record('bad_tbd');record('normal');
    await new Promise(r=>setTimeout(r,260));
    const d=x=>{const e=document.getElementById(x);return e?getComputedStyle(e).display:'?'};
    const t=activeTrack(),sec=activeSec();
    return{bulk:d('recBulkBtn'),row:d('recTypeRow'),type:d('secTypeBtn'),hint:d('joyHintBot'),
      down:getJoyType(0,40),right:getJoyType(40,0),up:getJoyType(0,-40),
      fast:fastOf(sec,0,t),
      l0:sleeperLabel(sec,0,t),l1:sleeperLabel(sec,1,t),l2:sleeperLabel(sec,2,t)}});
  ok('ПД-11 — "Нийт дэр оруулах" үед харагдахгүй',rec.bulk==='none',rec.bulk);
  ok('ПД-11 — "Төрөл" (бэхэлгээ) товч харагдахгүй',
     rec.type==='none'&&rec.row==='none',`төрөл ${rec.type} · мөр ${rec.row}`);
  ok('ПД-11 — доош шудрахад юу ч бүртгэгдэхгүй',rec.down==='',JSON.stringify(rec.down));
  ok('ПД-11 — доод заалт (↓ ТБД APC) алга',rec.hint==='none',rec.hint);
  ok('ПД-11 — бусад чиглэл хэвээр',rec.right==='tbd'&&rec.up==='bad',
     `${rec.right} · ${rec.up}`);
  ok('ПД-11 — паспортад APC байсан ч CZ гэж уншина',rec.fast==='CZ',rec.fast);
  ok('ПД-11 — ТБД ба тэнцэхгүй ТБД хоёулаа CZ',
     rec.l0==='ТБД (CZ)'&&rec.l1==='Тэнцэхгүй ТБД (CZ)',`${rec.l0} · ${rec.l1}`);
  ok('ПД-11 — модон дэр дээр бэхэлгээ бичигдэхгүй',rec.l2==='Хэвийн',rec.l2);

  // Тухайн хэсгийн ӨРТӨӨНИЙ зам нь хэвийн хэвээр
  const st=await page.evaluate(async()=>{
    openTrack('t1');openSection('u9');
    await new Promise(r=>setTimeout(r,380));
    const d=x=>{const e=document.getElementById(x);return e?getComputedStyle(e).display:'?'};
    return{bulk:d('recBulkBtn'),hint:d('joyHintBot'),down:getJoyType(0,40)}});
  ok('ПД-11 — ӨРТӨӨНИЙ замд бөөнөөр оруулах хэвээр',
     st.bulk!=='none'&&st.hint!=='none'&&st.down==='tbd_apc',JSON.stringify(st));
  await page.close();
}
/* ПД-6-д юу ч өөрчлөгдөөгүй байх ёстой */
{
  const {page}=await B.newPage(br,B.DEVICES[1]);
  await B.login(page,'ПД-6');
  const r6=await page.evaluate(async()=>{
    const ue=n=>({id:'u'+n,type:'normal',label:n+'-р үе',note:'',date:'2026-05-01',sleepers:[]});
    DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',
      sc:'ПД-6',tracks:[]}];
    DB.main=[{id:'k1',num:1,kind:'main',mat:'tbd',fast:'APC',sections:[ue(1)]}];
    activeFolderId='f1';DB.tracks=[];saveDB();
    openTrack('k1');openSection('u1');
    await new Promise(r=>setTimeout(r,420));
    record('normal');
    await new Promise(r=>setTimeout(r,220));
    const d=x=>{const e=document.getElementById(x);return e?getComputedStyle(e).display:'?'};
    const t=activeTrack(),sec=activeSec();
    return{bulk:d('recBulkBtn'),type:d('secTypeBtn'),hint:d('joyHintBot'),
      down:getJoyType(0,40),fast:fastOf(sec,0,t),lbl:sleeperLabel(sec,0,t)}});
  ok('ПД-6 — бүртгэлийн дэлгэц хуучнаараа',
     r6.bulk!=='none'&&r6.type!=='none'&&r6.hint!=='none'&&r6.down==='tbd_apc',
     JSON.stringify(r6));
  ok('ПД-6 — замын бэхэлгээ (APC) хэвээр уншигдана',
     r6.fast==='APC'&&r6.lbl==='Хэвийн APC',`${r6.fast} · ${r6.lbl}`);
  await page.close();
}

console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
