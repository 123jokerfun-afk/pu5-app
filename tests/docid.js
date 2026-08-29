const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
/* Firestore-ын баримтын нэрийн дүрэм:
   · __...__ хэлбэр НӨӨЦЛӨГДСӨН
   · '.' болон '..' болохгүй
   · '/' агуулж болохгүй
   · 1500 байтаас урт байж болохгүй  */
const bad=id=>!id||id==='.'||id==='..'||/^__.*__$/.test(id)||id.includes('/')
  ||Buffer.byteLength(id,'utf8')>1500;
(async()=>{
const fs=require('fs');
const h=fs.readFileSync('/home/user/pu5-app/index.html','utf8');
// 1. Кодод шууд бичсэн бүх нэр
const lit=[...h.matchAll(/\.doc\('([^']*)'\)/g)].map(m=>m[1]);
ok('Кодод бичсэн нэрүүд хүчинтэй',lit.every(x=>!bad(x)),JSON.stringify(lit));

const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const mk=(id,n)=>{let it='';for(let i=0;i<84;i++)it+='n';
    return {id,num:n,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it,dRepl:{}}};
  DB.sw=[{id:'sf-'+Date.now()+'-ab12',name:'Зун',season:'зун',year:'2026',
    date:'2026-06-01',sc:'ПД-6',turnouts:[mk('sw-1',1)]}];
  DB.main=[{id:'km-12',num:12,kind:'main',sections:[]}];saveDB()});

// 2. Ажиллах үед үүсдэг бүх хэсгийн нэр
const ids=await page.evaluate(()=>Object.keys(_splitDB(_packDB(DB))));
ok('Үүсэх хэсгийн нэрүүд хүчинтэй',ids.every(x=>!bad(x)),JSON.stringify(ids));
ok('Хэсэг бүр нэртэй',ids.length>0,ids.length+' ширхэг');

// 3. Хачирхалтай id-тай паспорт ч аюулгүй нэр өгнө
const weird=await page.evaluate(()=>{
  const t=[['__x__','p___x__'],['a/b','p_ab'],['','p_'],['..','p_'],['-  -','p_--']];
  return t.map(([raw])=>_partId('p',raw))});
ok('Хачин id-г цэвэрлэнэ',weird.every(x=>!bad(x)),JSON.stringify(weird));

// 4. SW_SPECS_DOC зассан эсэх
ok('Сумын загварын нэр зассан',await page.evaluate(()=>SW_SPECS_DOC==='sw-specs'),
  await page.evaluate(()=>SW_SPECS_DOC));

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
