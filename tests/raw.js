/* ══════════════════════════════════════════════════════════════
   ТҮҮХИЙ КОД ДЭЛГЭЦЭНД ГАРАХ

   v103-т `${ic("clipboard",34)}` гэсэн бичиглэл хоосон замын
   дэлгэц дээр ТҮҮХИЙ КОДООРОО хэвлэгдэж байв — backtick биш
   энгийн хашилт хэрэглэсэн тул template literal ажиллаагүй.

   Хоёр талаас шалгана:
   1) ЭХ КОД дээр — бүх салаа замыг хамарна, дэлгэц нээх шаардлагагүй
   2) ДЭЛГЭЦ дээр — хоосон төлөв бүрийг жинхэнээр нь нээж харна
   ══════════════════════════════════════════════════════════════ */
const fs=require('fs'),path=require('path');
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

/* ── 1. Эх кодын шалгалт ─────────────────────────────────────
   Inline script бүрийг тэмдэгт бүрээр уншиж, мөрийн төрлийг
   зөв ялгана (тайлбар, escape, үүрлэсэн ${} багтана). */
function scanSource(){
  const h=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const bad=[];let m;
  while((m=re.exec(h))){
    const off=m.index+m[0].indexOf(m[1]),s=m[1];
    const lineAt=p=>h.slice(0,off+p).split('\n').length;
    let i=0;
    while(i<s.length){
      const c=s[i];
      if(c==='/'&&s[i+1]==='/'){while(i<s.length&&s[i]!=='\n')i++;continue}
      if(c==='/'&&s[i+1]==='*'){i=s.indexOf('*/',i+2);if(i<0)break;i+=2;continue}
      if(c==='"'||c==="'"){
        const q=c,st=i;i++;let body='';
        while(i<s.length){
          if(s[i]==='\\'){body+=s[i]+s[i+1];i+=2;continue}
          if(s[i]===q||s[i]==='\n')break;
          body+=s[i];i++
        }
        i++;
        if(/\$\{/.test(body))bad.push({line:lineAt(st),txt:body.slice(0,100)});
        continue
      }
      if(c==='`'){                     // template literal — зөв хэлбэр
        i++;let d=0;
        while(i<s.length){
          if(s[i]==='\\'){i+=2;continue}
          if(s[i]==='$'&&s[i+1]==='{'){d++;i+=2;continue}
          if(d>0&&s[i]==='}'){d--;i++;continue}
          if(d===0&&s[i]==='`')break;
          i++
        }
        i++;continue
      }
      i++
    }
  }
  return bad
}
const src=scanSource();
ok('Эх код: энгийн хашилтад ${} алга',src.length===0,
   src.map(b=>'мөр '+b.line+': '+b.txt).join(' | '));

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// Харагдах бичвэрт түүхий кодын ул мөр байгаа эсэх
async function leak(label,setup){
  const r=await page.evaluate(async(fn)=>{
    await new Function('return (async()=>{'+fn+'})()')();
    await new Promise(r=>setTimeout(r,350));
    const t=document.body.innerText||'';
    const hits=[];
    (t.match(/\$\{[^}]{0,60}\}?/g)||[]).forEach(x=>hits.push(x));
    // ic(...) нь SVG буцаадаг — текстээр харагдвал бас алдаа
    (t.match(/\bic\(["'][^)]{0,40}\)/g)||[]).forEach(x=>hits.push(x));
    return hits.slice(0,4)
  },setup);
  ok(label,r.length===0,r.join(' | '));
}

// Хоосон зам — v103-ын алдаа яг энд байсан
await leak('Хоосон зам (үегүй)',`
  DB.folders=[{id:'fz',name:'Шалгалт',season:'хавар',year:'2026',
    date:'2026-04-01',sc:'ПД-6',tracks:[{id:'tz',num:5,kind:'station',
    note:'Шивээговь зөрлөг',sections:[]}]}];
  activeFolderId='fz';DB.tracks=DB.folders[0].tracks;saveDB();
  openFolder('fz');openTrack('tz');`);

await leak('Хоосон гол замын км',`
  DB.main=[{id:'mz',num:12,kind:'main',mat:'tbd',fast:'CZ',sections:[]}];
  saveDB();openTrack('mz');`);

await leak('Хоосон паспорт (замгүй)',`
  DB.folders.push({id:'fe',name:'Хоосон',season:'намар',year:'2026',
    date:'2026-09-01',sc:'ПД-6',tracks:[]});saveDB();openFolder('fe');`);

await leak('Хоосон сумын паспорт',`
  DB.sw=[{id:'sz',name:'Зун 2026',season:'зун',year:'2026',
    date:'2026-06-01',sc:'ПД-6',turnouts:[]}];
  swFolderId='sz';saveDB();goTab('sw');`);

await leak('Нүүр',`goHome();`);
await leak('Паспортын жагсаалт',`goTab('folders');`);
await leak('Мэдэгдэл',`goTab('sync');`);
await leak('Профайл',`closeModal('syncSheet');goTab('prof');`);
await leak('Замын дүн',`
  closeModal('profSheet');goHome();
  openFolder('f-test1');openTrack('t1');showTrackSummary();`);
await leak('Бүх дүн',`showSummaryAll();`);
// Дээрх шалгалтууд DB.folders-ыг сольсон тул үетэй замыг шинээр бэлдэнэ
await leak('Бүртгэлийн дэлгэц (дэртэй)',`
  goHome();
  const _sl=Array.from({length:46},(_,i)=>({type:i%7===0?'bad':'normal',ts:0}));
  DB.folders.push({id:'fr',name:'Бүртгэл',season:'хавар',year:'2026',
    date:'2026-04-01',sc:'ПД-6',tracks:[{id:'tr',num:9,kind:'station',note:'',
    sections:[{id:'sr',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
      sleepers:_sl}]}]});
  saveDB();openFolder('fr');openTrack('tr');openSection('sr');`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
