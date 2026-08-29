// Realistic DB seeding via app APIs
module.exports.seed=async function(page,opt){
  opt=opt||{};
  await page.evaluate((o)=>{
    function mkSec(n,pattern){
      return {id:'s'+n+'-'+Math.random().toString(36).slice(2,7),type:'normal',
        label:n+'-р үе',note:'',date:'2026-08-01',
        sleepers:pattern.split('').map(ch=>({type:{n:'normal',b:'bad',t:'tbd',x:'bad_tbd'}[ch],ts:0}))}
    }
    const f={id:'f-test1',name:'Хавар 2026 паспорт',season:'хавар',year:'2026',date:'2026-04-10',sc:'ПЧ-1',
      tracks:[
        {id:'t1',num:3,kind:'station',note:'',sections:[
          mkSec(1,'nnnnnbbbnnnnnnnnnnnnnnnnn'),      // 3 дараалсан
          mkSec(2,'nnbnnnnnnbbbbnnnnnnnnnnnn'),      // 4 дараалсан
          mkSec(3,'ttttxxxtttttttttttttttttt')       // ТБД + 3 дараалсан
        ]},
        {id:'t2',num:4,kind:'station',note:'',sections:[
          mkSec(1,'nnnnnnnnnnbbnnnnnnnnnnnnn')
        ]}
      ]};
    const f2={id:'f-test2',name:'Намар 2026 паспорт',season:'намар',year:'2026',date:'2026-09-10',sc:'ПЧ-1',
      tracks:[{id:'t1b',num:3,kind:'station',note:'',sections:[
          mkSec(1,'nnnnnbbbnnnnnnnnnnnnnnnnn'),
          mkSec(2,'nnbnnnnnnbbbbnnnnnnnnnnnn'),
          mkSec(3,'ttttxxxtttttttttttttttttt')]}]};
    DB.folders=[f,f2];
    DB.main=[{id:'m1',num:12,kind:'main',note:'',sections:[
        mkSec(1,'nnnnnbbbnnnnnnnnnnnnnnnnn'),
        mkSec(2,'nnnnnnnnnnnnnnnnnnnnnnnnn')]}];
    _migrateDB();saveDB();
    activeFolderId=null;DB.tracks=[];renderHome();
  },opt);
  await page.waitForTimeout(300);
};
