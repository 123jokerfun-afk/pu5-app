const {sweep}=require('./sweeplib');
const B=require('./base'),fs=require('fs');
sweep(B.DEVICES.slice(0,4),{})
  .then(r=>fs.writeFileSync(__dirname+'/sweep.json',JSON.stringify(r,null,1)))
  .catch(e=>{console.error('FATAL',e);process.exit(1)});
