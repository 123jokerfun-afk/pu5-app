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

console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
