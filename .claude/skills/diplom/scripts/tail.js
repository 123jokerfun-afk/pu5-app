// Ашигласан материалын жагсаалт — бүх хэсгийн дараа ачаална (иш татаагүй бол гаргахгүй)
const {refList} = require('./refs');
const L = refList();
module.exports = L.length ? [{t: 'h1', text: 'Ашигласан материалын жагсаалт'}, {t: 'refs', items: L}] : [];
