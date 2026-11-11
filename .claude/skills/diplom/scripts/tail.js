// Ашигласан материалын жагсаалт — бүх хэсгийн дараа ачаална (иш татаагүй бол гаргахгүй)
const {refList} = require('./refs');
const L = refList();
module.exports = L.length ? [{t: 'h1', text: 'АШИГЛАСАН МАТЕРИАЛ'}, {t: 'refs', items: L}] : [];
