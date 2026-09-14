// ГҮНЗГИЙ ШАЛГАЛТ — санамсаргүй үйлдэл, бодит товшилт, амьдралын мөчлөг.
// Хамгийн удаан тул тусдаа гүйгч. fuzz нь үр бүрээр өөр зам туулна.
const {execFileSync}=require('child_process');
let tot=0,bad=0;
const RUNS=[
  ['deep',[]],
  ['live',[]],
  ['fuzz',['1','150']],
  ['fuzz',['2','150']],
  ['fuzz',['3','150']],
  ['fuzz',['4','150']],
  ['fuzz',['5','150']],
];
for(const [f,args] of RUNS){
  let out='';
  try{out=execFileSync('node',[f+'.js'].concat(args),
    {encoding:'utf8',timeout:1800000,stdio:['ignore','pipe','pipe']})}
  catch(e){out=(e.stdout||'')+'\nFATAL '+(e.message||'').split('\n')[0]}
  const fails=out.split('\n').filter(l=>l.includes('✗'));
  const sum=(out.match(/SUMMARY.*/)||[''])[0];
  console.log((f+(args.length?' '+args.join(' '):'')).padEnd(12),sum||'(no summary)');
  fails.forEach(l=>{console.log('     '+l.trim());bad++});
  if(/FATAL/.test(out))console.log('     '+(out.match(/FATAL.*/)||[''])[0].slice(0,140)),bad++;
  tot++;
}
console.log('\nfiles:'+tot+'  failing checks:'+bad);
