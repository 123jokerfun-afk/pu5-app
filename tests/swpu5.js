/* ══════════════════════════════════════════════════════════════
   ДҮНЗНИЙ ПУ-5 МАЯГТ (exportSwPu5Book) — xls.js-тэй ижил зарчмаар
   гарсан Excel-г ExcelJS-ээр буцааж уншиж тоог шалгана. Дэрийн
   fillCell-д нэмсэн "?" (төлөвлөсөн) тэмдгийг мөн энд шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('exceljs')}catch(e){
  try{ExcelJS=require('./node_modules/exceljs')}catch(e2){}}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const V=r=>(r.values||[]).map(x=>x&&x.richText?x.richText.map(t=>t.text).join(''):x);
// richText-ийн эхний мөрийг (ДЭЭР — огноо эсвэл '?') тусад нь шалгах
const topOf=c=>{const v=c.value;if(v&&v.richText&&v.richText.length>1&&/\n$/.test(v.richText[0].text))
  return v.richText[0].text.replace('\n','');return ''};
const botOf=c=>{const v=c.value;if(v&&v.richText){const last=v.richText[v.richText.length-1];
  if(last.text.startsWith('\n'))return last.text.slice(1)}return ''};
// Дундах тэмдэг (—) — top/bot-той эсэхээс үл хамааран цорын ганц шинэ
// мөрийн шинжгүй richText хэсэг, эсвэл энгийн утга
const markOf=c=>{const v=c.value;
  if(v&&v.richText)return(v.richText.find(t=>!/\n/.test(t.text))||{}).text||'';
  return v};

if(!ExcelJS){console.log('  ⚠ exceljs алга — алгасав');console.log('SUMMARY 0/0');process.exit(0)}

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

await page.evaluate(()=>{
  window.appConfirm=()=>Promise.resolve(true);
  window.__b64=null;
  window.dlBlob=function(blob,name){
    return new Promise(r=>{const fr=new FileReader();
      fr.onload=()=>{window.__b64={name,d:String(fr.result).split(',')[1]};r()};
      fr.readAsDataURL(blob)})};
});

/* ── Мэдэгдэж буй өгөгдөл ──────────────────────────────────────
   Жижиг тусгай маяг (ТС/1): урт 3-аар 6 ширхэг, 3,25-аар 4 ширхэг.
   head=3 (дэр). Нийт it урт = 3+6+4=13.
   Эх төлөв (солихоос ӨМНӨХ, dRepl/slRepl.o-оор сэргээсэн):
     Дэр   (0,1,2):   b,n,n              → 1 тэнцэхгүй (0, СОЛИГДСОН)
     3 п/м (3..8):    b,b,b,n,b,n        → 4 тэнцэхгүй, 3 дараалсан(3,4,5)
     3,25  (9..12):   n,b,n,b            → 2 тэнцэхгүй, дараалалгүй
   idx0: солигдсон (26/6, ганц → У)
   idx3: дараалалд ороод СОЛИГДСОН (26/7 → С)
   idx4,5: дараалалд орсон ч СОЛИГДООГҮЙ (тэмдэггүй зураас)
   idx7: СОЛИГДООГҮЙ, ТӨЛӨВЛӨСӨН (? тэмдэг)
   idx10: ганцаараа СОЛИГДСОН (26/8 → У)
   idx12: СОЛИГДООГҮЙ, төлөвлөөгүй (тэмдэггүй зураас)
   ──────────────────────────────────────────────────────────── */
await page.evaluate(()=>{
  SW_CUSTOM.push({mak:'ТС',mark:'1',proj:[],sch:[[3,6],[3.25,4]]});
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'зун',year:'2026',date:'2026-06-01'};
  const it='nnn'+'nbbnbn'+'nnnb';                    // амьд төлөв (13 тэмдэгт)
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:7,station:'Шивээговь',mak:'ТС',mark:'1',proj:'x',head:3,it,
      slRepl:{0:{d:'2026-06-05',t:'n',m:'wood',o:1}},
      dRepl:{3:{d:'2026-07-10',L:3,o:1},10:{d:'2026-08-01',L:3.25,o:1}},
      dPlan:{7:3.25}}]}];
  swFolderId='sf';saveDB();
});

async function grab(call){
  await page.evaluate(async s=>{window.__b64=null;await new Function('return ('+s+')')()},call);
  await page.waitForFunction(()=>window.__b64,{timeout:40000});
  const r=await page.evaluate(()=>window.__b64);
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(r.d,'base64'));
  return {wb,name:r.name}
}

console.log('\nДүнзний ПУ-5 маягт (exportSwPu5Book)');
{
  const {wb,name}=await grab('exportSwPu5Book()');
  ok('Файлын нэр огноотой',/^Дүнз_ПУ-5_\d{4}-\d{2}-\d{2}\.xlsx$/.test(name),name);
  const names=wb.worksheets.map(w=>w.name);
  ok('Хуудсууд: Нийт дүн + 7-р сум',names[0]==='Нийт дүн'&&names.includes('7-р сум'),names.join(' | '));

  // ── Нийт дүн (АМЬД swTally-гаар — солигдсон дүнз тэнцсэнд тооцогдоно,
  // дэрийн ПУ-5 маягтаас ЗОРИУДААР ялгаатай, хэрэглэгчийн шийдвэрээр) ──
  // idx0(дэр),3,10 солигдсон → live bad: дэр 0, 3п/м(4,5,7)=3, 3,25(12)=1
  const ov=wb.getWorksheet('Нийт дүн');
  const orow=V(ov.getRow(3)).slice(1);
  ok('Нийт дүн: сум7, дэр 3/0 (амьд), дүнз 10/31, тэнцэхгүй 4/12,25',
     orow[0]===7&&orow[2]===3&&orow[3]===0&&orow[4]===10&&orow[5]==='31'
     &&orow[6]===4&&orow[7]==='12,25',JSON.stringify(orow));
  ok('Хувь ойролцоогоор 39,5%',Math.abs(orow[8]-12.25/31)<1e-9,String(orow[8]));

  // ── Сумын матриц хуудас ──
  const ws=wb.getWorksheet('7-р сум');
  const hdr=V(ws.getRow(3)).slice(1);
  ok('Толгой: № + Дэр/3/3,25/НИЙТ',
     hdr[0]==='№'&&hdr[1]==='Дэр 2,75 м'&&hdr[2]==='3 пог/м'&&hdr[3]==='3,25 пог/м'&&hdr[4]==='НИЙТ',
     JSON.stringify(hdr));

  // Дэр багана (col B = 2): мөр4=idx0(26/6,У), мөр5,6 хоосон
  ok('Дэр#1 (idx0): 26/6 дээр, — төв, У доор',
     topOf(ws.getCell(4,2))==='26/6'&&markOf(ws.getCell(4,2))==='—'&&botOf(ws.getCell(4,2))==='У',
     JSON.stringify([topOf(ws.getCell(4,2)),markOf(ws.getCell(4,2)),botOf(ws.getCell(4,2))]));
  ok('Дэр#2,#3 хэвийн (хоосон)',
     ws.getCell(5,2).value===null&&ws.getCell(6,2).value===null,
     JSON.stringify([ws.getCell(5,2).value,ws.getCell(6,2).value]));

  // 3 пог/м багана (col C = 3): idx3..8 → мөр4..9
  ok('3п/м #1 (idx3, дараалалд орсон, СОЛИГДСОН): 26/7, —, С',
     topOf(ws.getCell(4,3))==='26/7'&&botOf(ws.getCell(4,3))==='С',
     JSON.stringify([topOf(ws.getCell(4,3)),botOf(ws.getCell(4,3))]));
  ok('3п/м #2,#3 (idx4,5, дараалалд орсон ч СОЛИГДООГҮЙ): тэмдэггүй зураас',
     V(ws.getRow(5))[3]==='—'&&botOf(ws.getCell(5,3))===''&&
     V(ws.getRow(6))[3]==='—'&&botOf(ws.getCell(6,3))==='',
     JSON.stringify([V(ws.getRow(5))[3],V(ws.getRow(6))[3]]));
  ok('3п/м #4 (idx6) хэвийн',ws.getCell(7,3).value===null,String(ws.getCell(7,3).value));
  ok('3п/м #5 (idx7, ТӨЛӨВЛӨСӨН): ? дээр, — төв, доор тэмдэггүй',
     topOf(ws.getCell(8,3))==='?'&&markOf(ws.getCell(8,3))==='—'&&botOf(ws.getCell(8,3))==='',
     JSON.stringify([topOf(ws.getCell(8,3)),markOf(ws.getCell(8,3))]));
  ok('3п/м #6 (idx8) хэвийн',ws.getCell(9,3).value===null,String(ws.getCell(9,3).value));

  // 3,25 багана (col D = 4): idx9..12 → мөр4..7
  ok('3,25 #1 (idx9) хэвийн',ws.getCell(4,4).value===null,String(ws.getCell(4,4).value));
  ok('3,25 #2 (idx10, ганц СОЛИГДСОН): 26/8, —, У',
     topOf(ws.getCell(5,4))==='26/8'&&botOf(ws.getCell(5,4))==='У',
     JSON.stringify([topOf(ws.getCell(5,4)),botOf(ws.getCell(5,4))]));
  ok('3,25 #3 (idx11) хэвийн',ws.getCell(6,4).value===null,String(ws.getCell(6,4).value));
  ok('3,25 #4 (idx12, СОЛИГДООГҮЙ, төлөвлөөгүй): тэмдэггүй зураас',
     V(ws.getRow(7))[4]==='—'&&topOf(ws.getCell(7,4))===''&&botOf(ws.getCell(7,4))==='',
     JSON.stringify([V(ws.getRow(7))[4],topOf(ws.getCell(7,4))]));

  // ── 4 мөртэй Дүн блок (maxRows=6 → эхэлнэ мөр 10-аас) ──
  // slice(1)-ийн дараа: [0]=мөрийн шошго, [1]=Дэр, [2]=3п/м, [3]=3,25, [4]=НИЙТ
  const dd=V(ws.getRow(10)).slice(1),pm=V(ws.getRow(11)).slice(1),
        bs=V(ws.getRow(12)).slice(1),bm=V(ws.getRow(13)).slice(1);
  // Дэр өөрийн дугаарлалттай (1-3); дүнз бүх ангиллаараа ЗАЛГАА
  // дугаарлана: 3п/м(6ш)=1-6, 3,25(4ш)=7-10 (голоос үргэлжилнэ),
  // НИЙТ мөрөнд бүх дүнзний хамрах хүрээ 1-10
  ok('Д/Д: Дэр 1-3, 3п/м 1-6, 3,25 (залгаа) 7-10, НИЙТ 1-10',
     dd[0]==='Д/Д'&&dd[1]==='1-3'&&dd[2]==='1-6'&&dd[3]==='7-10'&&dd[4]==='1-10',JSON.stringify(dd));
  ok('Пог/м: Дэр хоосон, 3п/м 18, 3,25 13, НИЙТ 31',
     pm[1]===''&&pm[2]==='18'&&pm[3]==='13'&&pm[4]==='31',JSON.stringify(pm));
  // Тоолол АМЬД (to.it) төлөвөөр: idx0,3,10 солигдсон тул тэнцсэнд
  // тооцогдоно — Дэр 0(байсан 1), 3п/м 3(байсан 4, idx3 хасагдав),
  // 3,25 1(байсан 2, idx10 хасагдав), НИЙТ 4(байсан 6)
  // pg.bad||'' хэлбэрээр бичигддэг тул 0 нь хоосон мөр болж харагдана
  ok('Тэнцэхгүй /ш (амьд): Дэр хоосон(0), 3п/м 3, 3,25 1, НИЙТ 4',
     bs[1]===''&&bs[2]===3&&bs[3]===1&&bs[4]===4,JSON.stringify(bs));
  ok('Тэнцэхгүй пог/м (амьд): Дэр хоосон, 3п/м 9, 3,25 3,25, НИЙТ 12,25',
     bm[1]===''&&bm[2]==='9'&&bm[3]==='3,25'&&bm[4]==='12,25',JSON.stringify(bm));
}

/* ══ Регресс: дэрийн ПУ-5-д нэмсэн "?" (төлөвлөсөн) ═══════════ */
console.log('\nДэрийн ПУ-5 — "?" төлөвлөсөн тэмдэг (регресс)');
{
  await page.evaluate(()=>{
    const mkSec=(id,n,bad)=>({id,type:'normal',label:id+' үе',note:'',date:'2026-05-01',
      sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
    DB.folders=[{id:'fx',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'t1',num:1,kind:'station',sections:[mkSec('s1',10,[2,5])]}]}];
    activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
    DB.main=[];DB.sw=[];
    DB.folders[0].tracks[0].sections[0].plan={5:'wood'};   // idx5 (солигдоогүй) төлөвлөсөн
    saveDB();
  });
  const {wb}=await grab("exportPu5Book('folder')");
  const g=wb.worksheets.find(w=>/^1з/.test(w.name));
  ok('1-р замын торон хуудас байна',!!g,g&&g.name);
  if(g){
    // Дата мөрүүд 4-ээс эхэлнэ, #6 (idx5) нь мөр 9, багана 2
    const cell=g.getCell(9,2);
    const v=cell.value;
    const top=(v&&v.richText&&v.richText[0])?v.richText[0].text.replace('\n',''):'';
    ok('Төлөвлөсөн (idx5) дээр "?" харагдана',top==='?',JSON.stringify(v));
    const cell3=g.getCell(6,2);   // idx2, солигдоогүй, төлөвлөөгүй — энгийн зураас
    const v3=cell3.value;
    ok('Энгийн тэнцэхгүй (idx2) дээр "?" ГАРАХГҮЙ',v3==='—',JSON.stringify(v3));
  }
}

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
