const B=require('./base');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[3]); // Android small
await B.login(page,'ПЧ-1');

// ── pack/unpack бүрэн эсэх ──
const rt=await page.evaluate(()=>{
  const mk=(n,p)=>({id:'s'+n,type:'normal',label:n+'-р үе',note:'тайлбар',date:'2026-04-01',
    sleepers:p.split('').map(c=>({type:{n:'normal',b:'bad',t:'tbd',x:'bad_tbd'}[c],ts:0}))});
  const s=mk(1,'nbtxnbtx');
  s.repl={1:{d:'2026-05-01',t:'normal',m:'wood',o:1,s:1},3:{d:'2026-06-02',t:'tbd',m:'tbd',o:0}};
  s.fmap={0:'CZ',2:'APC'};
  s.manual={woodTotal:8,bad:2,tbd:2,bad_tbd:2};
  DB.folders=[{id:'f1',name:'П',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',
    tracks:[{id:'t1',num:3,kind:'station',note:'нот',sections:[s,
      {id:'sT',type:'turnout',label:'5-р сум',num:5,btw:{a:1,b:2},note:'',sleepers:[],date:'x'}]}]}];
  DB.main=[{id:'m1',num:12,kind:'main',note:'',sections:[mk(9,'ttttbb')]}];
  DB.sw=[{id:'sf1',name:'С',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',
    turnouts:[{id:'sw1',num:1,station:'Ө',mak:'Р-65',mark:'1/11',proj:'2764',head:4,
      it:'nnnnbbbnn',dRepl:{5:{d:'2026-05-05',L:3.25,o:1}},slRepl:{1:{d:'2026-05-06',t:'normal'}}}]}];
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  const before=JSON.parse(JSON.stringify(DB));
  const after=_unpackDB(JSON.parse(JSON.stringify(_packDB(DB))));
  const norm=o=>{const c=JSON.parse(JSON.stringify(o));delete c._sc;delete c.tracks;
    // sleepers дотор ts заримдаа алдагдана — төрлийг л харьцуулна
    const walk=x=>{if(Array.isArray(x))x.forEach(walk);
      else if(x&&typeof x==='object'){if(Array.isArray(x.sleepers))x.sleepers=x.sleepers.map(s=>s.type);
        Object.values(x).forEach(walk)}};
    walk(c);return c};
  const a=JSON.stringify(norm(before)),b=JSON.stringify(norm(after));
  return {eq:a===b,a:a.length,b:b.length,
    diff:a===b?'':(()=>{for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i])
      return 'pos'+i+'\nA:'+a.slice(Math.max(0,i-90),i+90)+'\nB:'+b.slice(Math.max(0,i-90),i+90);return''})()}
});
ok('Pack/unpack бүрэн хадгална',rt.eq,rt.eq?(rt.a+'B'):rt.diff);

// ── Гүйцэтгэл: том паспорт ──
const perf=await page.evaluate(()=>{
  const mk=(n)=>{const p=[];for(let i=0;i<46;i++)p.push({type:i%9===0?'bad':i%5===0?'tbd':'normal',ts:0});
    return{id:'s'+n+'-'+Math.random().toString(36).slice(2,6),type:'normal',label:n+'-р үе',note:'',date:'2026-04-01',sleepers:p}};
  const tracks=[];for(let k=1;k<=8;k++){const secs=[];for(let j=1;j<=25;j++)secs.push(mk(j));
    tracks.push({id:'tt'+k,num:k,kind:'station',note:'',sections:secs})}
  DB.folders=[{id:'big',name:'Том паспорт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',tracks}];
  DB.main=[];DB.sw=[];_migrateDB();
  const n=tracks.length*25*46;
  let t0=performance.now();openFolder('big');const tHome=performance.now()-t0;
  t0=performance.now();openTrack('tt1');const tTrack=performance.now()-t0;
  t0=performance.now();openSection(DB.tracks[0].sections[0].id);const tRec=performance.now()-t0;
  t0=performance.now();showSummaryAll();const tSum=performance.now()-t0;
  t0=performance.now();const pk=_packDB(DB);const tPack=performance.now()-t0;
  t0=performance.now();openConsecReport();const tCon=performance.now()-t0;
  return {n,tHome:+tHome.toFixed(0),tTrack:+tTrack.toFixed(0),tRec:+tRec.toFixed(0),
          tSum:+tSum.toFixed(0),tPack:+tPack.toFixed(0),tCon:+tCon.toFixed(0),
          size:JSON.stringify(pk).length}
});
console.log('  ⏱ ',JSON.stringify(perf));
ok('Нүүр 1с дотор',perf.tHome<1000,perf.tHome+'ms');
ok('Замын дэлгэц 1с дотор',perf.tTrack<1000,perf.tTrack+'ms');
ok('Бүртгэлийн дэлгэц 1с дотор',perf.tRec<1000,perf.tRec+'ms');
ok('Хураангуй 2с дотор',perf.tSum<2000,perf.tSum+'ms');
ok('Дараалсан тайлан 2с дотор',perf.tCon<2000,perf.tCon+'ms');
ok('Багцлалт 1с дотор',perf.tPack<1000,perf.tPack+'ms');
ok('Firestore 1MB хязгаарт багтана',perf.size<900000,Math.round(perf.size/1024)+'KB / 9200 дэр');

console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
