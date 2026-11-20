/* ПУ-5 дэвтрийн дэлгэцийн шалгалтад зориулсан жишээ өгөгдөл:
   2 дэрийн паспорт (хавар/намар), 2 сумын паспорт. Намрын паспортод
   12 энгийн үе (10 үеийн 2 блок), дараалсан цэг, үе дамнасан цэг,
   ТБД/ТТБД, сольсон (сийрэгжилт ба бусад), төлөвлөсөн дэр, холбох хэсэг,
   мөн тооцоонд орох ёсгүй гол зам бий. */
module.exports.seedP5=async function(page){
  await page.evaluate(()=>{
    const T={n:'normal',b:'bad',t:'tbd',x:'bad_tbd'};
    const mk=(id,label,pat,extra)=>Object.assign({id,label,type:'normal',note:'',date:'2026-09-01',
      sleepers:pat.split('').map(c=>({type:T[c],ts:0}))},extra||{});
    const P20='nnnnnnnnnnnnnnnnnnnn';
    const secs=[];
    // 1-р үе: 5-7 дараалсан 3; 6-г сийрэгжүүлж сольсон (бүртгэлд хэвийн, repl-д тэнцэхгүй байсан)
    secs.push(mk('S1','1-р үе','nnnnnbnbnnnnnnnnnnnn',{repl:{6:{d:'2026-09-15',t:'normal',m:'wood',s:true,o:true}}}));
    // 2-р үе: ТБД, ТТБД, бусад шалтгаанаар сольсон ганц дэр (0), төлөвлөсөн (10)
    secs.push(mk('S2','2-р үе','ntxnnnnnnnbnnnnnnnnn',{repl:{0:{d:'2026-10-02',t:'normal',m:'wood',o:true}},plan:{10:{d:'2026-11-01'}}}));
    // 3-р үеийн сүүлийн 2 + 4-р үеийн эхний 1 = үе дамнасан дараалал
    secs.push(mk('S3','3-р үе','nnnnnnnnnnnnnnnnnnbb'));
    secs.push(mk('S4','4-р үе','bnnnnnnnnnnnnnnnnnnn'));
    for(let i=5;i<=12;i++)secs.push(mk('S'+i,i+'-р үе',i===9?'nnbbbbbnnnnnnnnnnnnn':P20.slice(0,i===12?18:20)));
    secs.push(mk('SC1','Холбох 1',"nnbnnnnnnn",{type:'connecting'}));
    DB.folders=[
      {id:'FOLD',name:'Хавар паспорт',season:'хавар',year:'2026',date:'2026-04-20',sc:'ПД-6',
       tracks:[{id:'TO1',num:2,kind:'station',note:'',sections:[mk('OS1','1-р үе','bbbbnnnnnnnnnnnnnnnn')]}]},
      {id:'FNEW',name:'Намар паспорт',season:'намар',year:'2026',date:'2026-09-20',sc:'ПД-6',
       tracks:[
         {id:'TN3',num:3,kind:'station',note:'',sections:[mk('N31','1-р үе','nnnnbnnnnnnnnnnnnnnn')]},
         {id:'TN2',num:2,kind:'station',note:'',sections:secs},
         {id:'TM',num:681,kind:'main',mat:'tbd',sections:[mk('M1','ГЗ','bbbbbbbbbb')]}
       ]}
    ];
    const itFor=(mak,mark,bad,head)=>{const sp=swSpec(mak,mark);
      const n=(head||0)+sp.sch.reduce((a,x)=>a+x[1],0);
      return Array.from({length:n},(_,i)=>bad.includes(i)?'b':'n').join('')};
    DB.sw=[
      {id:'SWOLD',name:'Хавар сум',season:'хавар',year:'2026',date:'2026-04-25',sc:'ПД-6',
       turnouts:[{id:'WO1',num:1,mak:'Р-65',mark:'1/11',head:0,it:itFor('Р-65','1/11',[0]),dRepl:{},slRepl:{}}]},
      {id:'SWNEW',name:'Намар сум',season:'намар',year:'2026',date:'2026-09-25',sc:'ПД-6',
       turnouts:[
         {id:'W1',num:8,mak:'Р-65',mark:'1/11',head:0,it:itFor('Р-65','1/11',[3,4,5,30,79]),dRepl:{4:{d:'2026-10-05',o:true}},slRepl:{},dPlan:{30:{d:'2026-11-01'}}},
         {id:'W2',num:9,mak:'Р-65',mark:'1/9',head:0,it:itFor('Р-65','1/9',[10]),dRepl:{},slRepl:{}}
       ]}
    ];
    // Сольсон дүнзийг амьд бүртгэлд хэвийн болгоно (эх төлөвт тэнцэхгүй хэвээр)
    const w=DB.sw[1].turnouts[0];w.it=w.it.slice(0,4)+'n'+w.it.slice(5);
    _migrateDB();saveDB();activeFolderId=null;DB.tracks=[];renderHome();
  });
  await page.waitForTimeout(300);
};
