// Экспорт ба интерфэйс — ПУ-5 дэвтэр, маягтууд, дэлгэцийн зан төлөв.
// Excel нь удаан тул тусдаа гүйгч (allA/allB/allC-ээс салгав).
const {execFileSync}=require('child_process');
let tot=0,bad=0;
for(const f of ['ui2','raw','tap','swipe','perf','pack','swrec','edge','exp','xls']){
  let out='';
  try{out=execFileSync('node',[f+'.js'],{encoding:'utf8',timeout:600000,stdio:['ignore','pipe','pipe']})}
  catch(e){out=(e.stdout||'')+'\nFATAL '+(e.message||'').split('\n')[0]}
  const fails=out.split('\n').filter(l=>l.includes('✗'));
  const sum=(out.match(/SUMMARY.*/)||[''])[0];
  console.log(f.padEnd(6),sum||'(no summary)');
  fails.forEach(l=>{console.log('     '+l.trim());bad++});
  if(/FATAL/.test(out))console.log('     '+(out.match(/FATAL.*/)||[''])[0].slice(0,140)),bad++;
  tot++;
}
console.log('\nfiles:'+tot+'  failing checks:'+bad);
