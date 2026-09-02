/* Хэвтээ байрлал ба гэрэлтэй загвар — утас эргүүлэх, өдрийн гэрэлд
   ажиллах хоёр нөхцөл өмнө нь огт шалгагдаагүй байв. */
const {sweep}=require('./sweeplib');
const B=require('./base'),fs=require('fs');
(async()=>{
  const a=await sweep(B.DEVICES,{landscape:true,tag:'ХЭВТЭЭ'});
  const b=await sweep([B.DEVICES[0],B.DEVICES[4],B.DEVICES[6]],{light:true,tag:'ГЭРЭЛТЭЙ'});
  fs.writeFileSync(__dirname+'/sweepC.json',JSON.stringify(a.concat(b),null,1));
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
