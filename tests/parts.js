const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const mk=(id,num)=>{let it='';for(let i=0;i<84;i++)it+=i%7===0?'b':'n';
    return {id,num,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it,dRepl:{6:{d:'2026-05-12',L:2.7,o:1}}}};
  DB.sw=[{id:'sf-1',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[mk('sw-1',1),mk('sw-8',8)]}];
  // гол зам + солилтын бүртгэл
  DB.main=[{id:'km-12',num:12,kind:'main',mat:'tbd',fast:'CZ',sections:[
    {id:'u1',type:'normal',label:'1-р үе',note:'тэмдэглэл',date:'2026-05-01',
     sleepers:Array.from({length:30},(_,i)=>({type:i%5?'normal':'bad',ts:0})),
     repl:{3:{d:'2026-05-12',t:'normal',m:'wood',o:1},7:{d:'2026-05-13',t:'tbd',m:'tbd',s:1,o:1}}}]}];
  saveDB()});

// ── 1. Хуваах → нийлүүлэх нь өгөгдлийг бүрэн хадгалж байна уу ──
const rt=await page.evaluate(()=>{
  const packed=_packDB(DB);
  const parts=_splitDB(packed);
  const back=_joinParts(parts);
  return {same:_cmpKey(packed)===_cmpKey(back),
    ids:Object.keys(parts).sort(),
    nFold:(back.folders||[]).length, nSw:(back.sw||[]).length,
    nMain:(back.main||[]).length,
    replKept:JSON.stringify((((back.main||[])[0]||{}).sections||[{}])[0].repl||{}),
    dReplKept:JSON.stringify((((back.sw||[])[0]||{}).turnouts||[{}])[0].dRepl||{}),
    loc:back.location, rpt:JSON.stringify(back.rpt)}});
ok('Хуваагаад нийлүүлэхэд ЯГ адилхан',rt.same);
ok('Хэсгүүд зөв нэрлэгдэв',rt.ids.includes('meta')&&rt.ids.includes('main')
  &&rt.ids.some(i=>i.startsWith('p_'))&&rt.ids.some(i=>i.startsWith('s_')),JSON.stringify(rt.ids));
ok('Паспортууд бүрэн',rt.nFold>0,'дэр='+rt.nFold+' сум='+rt.nSw+' км='+rt.nMain);
ok('Солилтын бүртгэл хэвээр',/2026-05-12/.test(rt.replKept)&&/"s":1/.test(rt.replKept),rt.replKept);
ok('Сумын солилт хэвээр',/2026-05-12/.test(rt.dReplKept),rt.dReplKept);
ok('Нэр ба тохиргоо хэвээр',!!rt.loc&&rt.rpt.length>2,rt.loc);

// ── 2. Өөрчлөгдсөн хэсгийг л таньж байна уу ──
const ch=await page.evaluate(()=>{
  const h=o=>{const p={};const s=_splitDB(o);
    Object.keys(s).forEach(k=>p[k]=_hash(JSON.stringify(s[k])));return p};
  const a=h(_packDB(DB));
  // ЗӨВХӨН нэг дэрийн паспортыг өөрчилнө
  DB.folders[0].tracks[0].sections[0].note='өөрчлөв';
  const b=h(_packDB(DB));
  const diff=Object.keys(b).filter(k=>a[k]!==b[k]);
  return {diff,total:Object.keys(b).length}});
ok('Ганц хэсэг л өөрчлөгдсөн гэж таниулав',ch.diff.length===1&&ch.diff[0].startsWith('p_'),
  JSON.stringify(ch.diff)+' / нийт '+ch.total);

// ── 3. Хэсэг бүр 1 МиБ-д багтаж байна уу ──
const sz=await page.evaluate(()=>{
  const p=_splitDB(_packDB(DB));
  const m={};Object.keys(p).forEach(k=>m[k]=_fsSize(p[k]));
  return {max:Math.max(...Object.values(m)),lim:DOC_LIMIT,n:Object.keys(m).length}});
ok('Хэсэг бүр хязгаарт багтав',sz.max<sz.lim,fmtSize=sz.max+' Б / '+sz.n+' хэсэг');

// ── 4. Апп хэвийн ажиллаж байна уу (хос бичилт эвдээгүй) ──
const app=await page.evaluate(()=>{
  goHome();const a=document.getElementById('hsTotal').textContent;
  goSwHome();const b=document.getElementById('swHsD').textContent;
  goHome();
  return {a,b,views:document.querySelectorAll('.view.active').length}});
ok('Нүүр дэлгэц ажиллав',app.views===1,'дэр='+app.a+' дүнз='+app.b);
ok('Хадгалалт алдаагүй',await page.evaluate(()=>{try{saveDB();return true}catch(e){return false}}));

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
