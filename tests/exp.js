// Excel / CSV экспорт — аппын ГОЛ бүтээгдэхүүн (ПУ-5 дэвтэр нь хуулийн
// бичиг баримт). Энэ хүртэл огт шалгагдаагүй байв.
//
// Экспортын зарим нь `await appConfirm(...)` дуудна. Тестэд хэн ч
// дардаггүй тул шууд дуудвал МӨНХ хүлээнэ — эхлээд жинхэнэ товчийг
// дарж, дараа нь appConfirm-ыг орлуулж бусдыг нь шалгана.
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// Татагдсан файлыг барьж авна (жинхэнэ татахгүй). Эхний 2 байтыг
// хадгална — xlsx бол zip, 'PK' байх ёстой.
await page.evaluate(()=>{
  window.__dl=[];
  window.dlBlob=function(blob,name){
    const rec={name,size:blob&&blob.size||0,type:blob&&blob.type||'',magic:''};
    window.__dl.push(rec);
    return blob.slice(0,2).text().then(t=>{rec.magic=t}).catch(()=>{})
  };
});

// Баялаг өгөгдөл бэлдэнэ
await page.evaluate(()=>{
  const mkSec=(id,n,bad,repl)=>{
    const s={id,type:'normal',label:id+' үе',note:'',date:'2026-05-01',
      sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))};
    // s:1 = СИЙРЭГЖИЛТЭЭР солигдсон. Сийрэгжилтийн маягт зөвхөн үүнийг
    // тоолдог тул үүнгүйгээр маягт хоосон гарна.
    if(repl){s.repl={};repl.forEach(i=>{s.repl[i]={d:'2026-05-12',t:'normal',m:'wood',o:1,s:1}})}
    return s};
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'fx',name:'Хавар 2026 паспорт',season:'хавар',year:'2026',
    date:'2026-04-01',sc:'ПД-6',tracks:[
      {id:'t1',num:1,kind:'station',sections:[mkSec('s1',46,[3,4,5,20],[3,4]),mkSec('s2',46,[10,11,12])]},
      {id:'t2',num:2,kind:'station',sections:[mkSec('s3',46,[1,2,3,4,5])]}]}];
  activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
  DB.main=[{id:'km12',num:12,kind:'main',mat:'tbd',fast:'CZ',
    sections:[mkSec('m1',46,[7,8,9],[7])]}];
  let it='';for(let i=0;i<84;i++)it+=[5,6,7,20,21].includes(i)?'b':'n';
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',
      head:4,it,dRepl:{5:{d:'2026-05-12',L:2.7,o:1}}}]}];
  swFolderId='sf';
  saveDB();
});

/* ── 1. Жинхэнэ баталгаажуулах цонхны зам ─────────────────────
   Модалыг гараар дарж, экспорт үнэхээр цааш явахыг батална. */
await page.evaluate(()=>{window.__dl=[];window.__p=exportPu5Book('folder')});
let modalUp=false;
try{await page.waitForFunction(()=>{const m=document.getElementById('appConfirmModal');
  return m&&m.classList.contains('open')},{timeout:5000});modalUp=true}catch(e){}
ok('ПУ-5 дэвтэр — баталгаажуулах цонх гарна',modalUp);
if(modalUp){
  await page.click('#appConfirmOkBtn');
  let got=false;
  try{await page.waitForFunction(()=>window.__dl.length>0,{timeout:30000});got=true}catch(e){}
  const d=await page.evaluate(()=>window.__dl[0]||null);
  ok('ПУ-5 дэвтэр — цонхыг зөвшөөрөхөд татагдана',got&&!!d&&d.size>0,d?d.name+' · '+d.size+' Б':'файл гарсангүй');
}

/* ── 2. Болих товч дарвал ФАЙЛ ГАРАХГҮЙ ───────────────────── */
await page.evaluate(()=>{window.__dl=[];window.__p=exportSwForms()});
let m2=false;
try{await page.waitForFunction(()=>{const m=document.getElementById('appConfirmModal');
  return m&&m.classList.contains('open')},{timeout:5000});m2=true}catch(e){}
if(m2){
  await page.click('#appConfirmCancelBtn');
  await page.waitForTimeout(800);
  const n=await page.evaluate(()=>window.__dl.length);
  ok('Болих дарвал файл татагдахгүй',n===0,n+' файл');
}else ok('Сумын маягт — баталгаажуулах цонх гарна',false);

/* ── 3. Бусад экспорт — цонхыг автоматаар зөвшөөрнө ────────── */
await page.evaluate(()=>{window.appConfirm=()=>Promise.resolve(true)});

async function run(label,call,expectName){
  const r=await page.evaluate(async(src)=>{
    window.__dl=[];
    const fn=new Function('return ('+src+')');
    try{
      await Promise.race([fn(),
        new Promise((_,rj)=>setTimeout(()=>rj(new Error('ГАЦСАН (20с)')),20000))]);
    }catch(e){return {err:e&&e.message||String(e)}}
    await new Promise(r=>setTimeout(r,400));
    return {dl:window.__dl}
  },call);
  if(r.err){ok(label,false,'АЛДАА: '+r.err);return}
  const d=(r.dl||[])[0];
  ok(label,!!d&&d.size>0,d?(d.name+' · '+d.size+' Б'):'файл гарсангүй');
  if(!d)return;
  if(expectName)ok(label+' — нэр зөв',expectName.test(d.name),d.name);
  if(/\.xlsx$/.test(d.name))ok(label+' — бодит xlsx (zip)',d.magic==='PK',d.magic||'(хоосон)');
}

await run('ПУ-5 дэвтэр — гол зам',"exportPu5Book('main')",/\.xlsx$/);
await run('Өнгөт Excel',"exportColoredExcel()",/\.xlsx$/);
await run('Сийрэгжилтийн маягт',"exportCarveForm()",/\.xlsx$/);
await run('Сумын дүнзний маягт',"exportSwForms()",/\.xlsx$/);
await run('Бүх зам CSV',"exportAllCSV()",/\.csv$/);
await run('Нэг замын CSV',"exportTrackCSV('t1')",/\.csv$/);

/* ── 4. Хоосон паспортод гацахгүй, унахгүй ────────────────── */
const empty=await page.evaluate(async()=>{
  DB.folders=[{id:'fe',name:'Хоосон',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',tracks:[]}];
  activeFolderId='fe';DB.tracks=[];DB.main=[];
  window.__dl=[];
  const errs=[];
  for(const src of ['exportPu5Book("folder")','exportPu5Book("main")','exportAllCSV()','exportCarveForm()']){
    try{
      await Promise.race([new Function('return ('+src+')')(),
        new Promise((_,rj)=>setTimeout(()=>rj(new Error('ГАЦСАН')),15000))]);
    }catch(e){errs.push(src+': '+(e.message||e))}
  }
  await new Promise(r=>setTimeout(r,400));
  return errs});
ok('Хоосон паспортод экспорт гацахгүй, унахгүй',empty.length===0,JSON.stringify(empty));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
