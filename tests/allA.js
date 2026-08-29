const {execFileSync}=require('child_process');
const fs=require('fs');
let tot=0,bad=0;
for(const f of ['boot','zero','theme','flow1','flow2','flow4','flow5','flow6','flow7']){
  let out='';
  try{out=execFileSync('node',[f+'.js'],{encoding:'utf8',timeout:180000,stdio:['ignore','pipe','pipe']})}
  catch(e){out=(e.stdout||'')+'\nFATAL '+(e.message||'').split('\n')[0]}
  const fails=out.split('\n').filter(l=>l.includes('✗'));
  const sum=(out.match(/SUMMARY.*/)||[''])[0];
  console.log(f.padEnd(7),sum||'(no summary)');
  fails.forEach(l=>{console.log('     '+l.trim());bad++});
  if(/FATAL/.test(out))console.log('     '+(out.match(/FATAL.*/)||[''])[0].slice(0,140)),bad++;
  tot++;
}
console.log('\nfiles:'+tot+'  failing checks:'+bad);
