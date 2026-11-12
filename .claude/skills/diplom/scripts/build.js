// Дипломын төслийн бичвэрийг Word (docx) болгоно.
// Хэрэглээ: node build.js <out.docx> <content1.js> [content2.js ...]
// Хэлбэр нь тэнхимийн «Хавсралт А» загварт нийцнэ: бүлэг бүр шинэ хуудаснаас, толгойд
// бүлгийн нэр ба доогуур зураас, хөлд зураас ба хуудасны дугаар; хүснэгт, зургийн
// гарчиг 11pt налуу; зураг, хүснэгтийн жагсаалтыг Word өөрөө бөглөнө.
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType,
  HeadingLevel, WidthType, ShadingType, BorderStyle, Header, Footer, PageNumber, LevelFormat, TabStopType,
  PageBreak, VerticalAlign, SectionType, StyleLevel} = D;

const OUT = process.argv[2];
const blocks = [].concat(...process.argv.slice(3).map(f => require(path.resolve(f))));

const FONT = 'Times New Roman';
const SZ = 24;              // 12pt
const CAP = 22;             // 11pt — хүснэгт, зургийн гарчиг, эх сурвалж
const LINE = 360;           // 1.5 мөр
const IND = 709;            // 1.25 см
const TEXT_W = 11906 - 1701 - 851;   // A4, зүүн 3 см, баруун 1.5 см
const ACCENT = '4472C4';    // толгойн бичиг, зураасны өнгө (жишээ дипломынхтой ижил)
const AUTHOR = process.env.DIPLOM_AUTHOR || '';  // хөлд бичигдэх нэр, жишээ нь «П-4 Н.Нэр»

// **тод**, *налуу*, [[шар тэмдэглэгээ — нөхөх зүйл]], ^{дээд}, _{доод}
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\]|\^\{[^}]+\}|_\{[^}]+\})/g;
  let last = 0, m;
  const push = (t, o) => { if (t) out.push(new TextRun(Object.assign({text: t, font: FONT, size: base.size || SZ}, base, o))); };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index), {});
    const s = m[0];
    if (s.startsWith('**')) push(s.slice(2, -2), {bold: true});
    else if (s.startsWith('[[')) push('[' + s.slice(2, -2) + ']', {shading: {type: ShadingType.CLEAR, fill: 'FFF200', color: 'auto'}});
    else if (s.startsWith('^{')) push(s.slice(2, -1), {superScript: true});
    else if (s.startsWith('_{')) push(s.slice(2, -1), {subScript: true});
    else push(s.slice(1, -1), {italics: true});
    last = m.index + s.length;
  }
  push(text.slice(last), {});
  return out;
}
const plain = t => String(t).replace(/\*\*|\*|\[\[|\]\]/g, '');

const body = (text, o = {}) => new Paragraph(Object.assign({
  children: runs(text), alignment: AlignmentType.JUSTIFIED,
  indent: {firstLine: IND}, spacing: {line: LINE, after: 0}}, o));

const border = {style: BorderStyle.SINGLE, size: 4, color: '000000'};
const borders = {top: border, bottom: border, left: border, right: border};
const NONE = {style: BorderStyle.NONE, size: 0, color: 'FFFFFF'};
const noBorders = {top: NONE, bottom: NONE, left: NONE, right: NONE};

function table(b) {
  const W = b.widths.reduce((a, x) => a + x, 0);
  const scale = TEXT_W / W;
  const widths = b.widths.map(w => Math.floor(w * scale));
  widths[widths.length - 1] += TEXT_W - widths.reduce((a, x) => a + x, 0);
  const cell = (txt, w, head, opt = {}) => new TableCell({
    borders, width: {size: w, type: WidthType.DXA}, columnSpan: opt.span,
    verticalAlign: VerticalAlign.CENTER,
    shading: head ? {fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto'}
      : opt.fill ? {fill: opt.fill, type: ShadingType.CLEAR, color: 'auto'} : undefined,
    margins: {top: 40, bottom: 40, left: 90, right: 90},
    children: String(txt).split('\n').map(line => new Paragraph({
      alignment: opt.left ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: {line: 240, after: 0}, keepNext: opt.keep || undefined,
      children: runs(line, {size: b.size || 22, bold: head || opt.bold || undefined})}))});
  // Хавсралт А: хүснэгтийг хоёр хуудсанд хуваахгүй. Мөр бүрийн догол мөрөнд «дараагийнхтай хамт»
  // тавьснаар Word, LibreOffice хоёулаа хүснэгтийг бүхэлд нь дараагийн хуудас руу шилжүүлнэ.
  // Сүүлийн мөр тайлбартай бол тайлбартайгаа хамт үлдэнэ. Графикийн том хүснэгтэд (raw) хамаарахгүй.
  const keep = !b.raw, last = b.rows.length - 1;
  const rows = [new TableRow({tableHeader: true, cantSplit: true,
    children: b.header.map((h, i) => cell(h, widths[i], true, {span: b.headerSpan && b.headerSpan[i], keep}))
      .filter((c, i) => !(b.headerSkip && b.headerSkip.includes(i)))})];
  b.rows.forEach((r, k) => {
    const kp = keep && (k < last || !!b.note);
    if (r.group) {
      rows.push(new TableRow({cantSplit: true, children: [cell('**' + r.group + '**', TEXT_W, false, {span: widths.length, keep: kp})]}));
      return;
    }
    rows.push(new TableRow({cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false,
      {left: b.leftCols && b.leftCols.includes(i), bold: b.boldLast && r === b.rows[b.rows.length - 1],
       fill: b.markFill && i >= 2 && c ? b.markFill : undefined, keep: kp}))}));
  });
  const t = new Table({width: {size: TEXT_W, type: WidthType.DXA}, columnWidths: widths, rows});
  if (b.raw) return [t, new Paragraph({spacing: {after: 120, line: 240}, children: []})];
  // «Хүснэгт 1.1. Нэр» нэг мөрөнд, 11pt налуу, баруун тийш (Хавсралт А)
  const out = [
    new Paragraph({style: 'TblCap', keepNext: true, children: runs('Хүснэгт ' + b.num + '. ' + b.title, {size: CAP, italics: true})}),
    t,
  ];
  if (b.note) out.push(new Paragraph({spacing: {before: 40, after: 0, line: 240}, children: runs(b.note, {size: CAP, italics: true})}));
  out.push(new Paragraph({spacing: {after: 120, line: 240}, children: []}));
  return out;
}

function imgSize(buf, cm) {
  const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20);
  const wPx = Math.round(cm / 2.54 * 96);
  return {width: wPx, height: Math.round(wPx * H / W)};
}

function figure(b) {
  const buf = fs.readFileSync(b.img);
  return [
    new Paragraph({alignment: AlignmentType.CENTER, spacing: {before: 120, after: 60}, keepNext: true,
      children: [new ImageRun({type: 'png', data: buf, transformation: imgSize(buf, b.cm),
        altText: {title: plain(b.caption), description: plain(b.caption), name: path.basename(b.img)}})]}),
    // Эх сурвалжийн мөр зургийн дор, гарчгийн өмнө (Хавсралт А)
    new Paragraph({spacing: {after: 0, line: 240}, keepNext: true,
      children: runs('Эх сурвалж: ' + (b.src || 'Судлаачийн боловсруулснаар'), {size: CAP, italics: true})}),
    new Paragraph({style: 'FigCap', children: runs('Зураг ' + b.num + '. ' + b.caption, {size: CAP, italics: true})}),
  ];
}

// Нүүрний толгой: зүүн, баруун талд лого, дунд нь байгууллагын нэр
function logoHead(b) {
  const side = 1700, mid = TEXT_W - 2 * side;
  const img = f => { const buf = fs.readFileSync(f); return new Paragraph({alignment: AlignmentType.CENTER,
    children: [new ImageRun({type: 'png', data: buf, transformation: imgSize(buf, b.cm || 2.6)})]}); };
  const c = (children, w) => new TableCell({borders: noBorders, width: {size: w, type: WidthType.DXA},
    verticalAlign: VerticalAlign.CENTER, children});
  return [new Table({width: {size: TEXT_W, type: WidthType.DXA}, columnWidths: [side, mid, side],
    borders: {top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE},
    rows: [new TableRow({children: [c([img(b.left)], side),
      c(b.lines.map(t => new Paragraph({alignment: AlignmentType.CENTER, spacing: {line: 276, after: 0},
        children: runs(t, {bold: true, size: SZ})})), mid),
      c([img(b.right)], side)]})]})];
}

// ── Хэсгүүдэд хуваах: h1, агуулга, жагсаалт бүр шинэ хэсэг (шинэ хуудас, өөрийн толгой) ──
const sections = [{header: null, children: []}];
const cur = () => sections[sections.length - 1];
const newSection = header => sections.push({header, children: []});
const listTitle = t => new Paragraph({heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
  spacing: {after: 240, line: LINE}, children: runs(t)});

blocks.forEach(b => {
  const ch = cur().children;
  switch (b.t) {
    case 'h1':
      newSection(plain(b.text));
      cur().children.push(new Paragraph({heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER, spacing: {before: 0, after: 240, line: LINE},
        children: runs(b.text)}));
      break;
    case 'h2':
      ch.push(new Paragraph({heading: HeadingLevel.HEADING_2, keepNext: true,
        spacing: {before: 240, after: 120, line: LINE}, indent: {firstLine: IND}, children: runs(b.text)}));
      break;
    case 'h3':
      ch.push(new Paragraph({heading: HeadingLevel.HEADING_3, keepNext: true,
        spacing: {before: 160, after: 80, line: LINE}, indent: {firstLine: IND}, children: runs(b.text)}));
      break;
    case 'p': ch.push(body(b.text)); break;
    case 'ul': case 'ol':
      b.items.forEach(it => ch.push(new Paragraph({
        numbering: {reference: b.t === 'ul' ? 'bul' : 'num' + (b.id || ''), level: 0},
        alignment: AlignmentType.JUSTIFIED, spacing: {line: LINE, after: 0}, children: runs(it)})));
      break;
    case 'eq':
      ch.push(new Paragraph({alignment: AlignmentType.LEFT, spacing: {before: 120, after: 120, line: LINE},
        tabStops: [{type: TabStopType.CENTER, position: Math.round(TEXT_W / 2)}, {type: TabStopType.RIGHT, position: TEXT_W}],
        children: [new TextRun({text: '\t', font: FONT, size: SZ}), ...runs(b.text), new TextRun({text: '\t(' + b.num + ')', font: FONT, size: SZ})]}));
      break;
    case 'table': ch.push(...table(b)); break;
    case 'fig': ch.push(...figure(b)); break;
    case 'logohead': ch.push(...logoHead(b)); break;
    case 'refs':
      b.items.forEach((it, i) => ch.push(new Paragraph({alignment: AlignmentType.LEFT,
        spacing: {line: LINE, after: 60}, indent: {left: 567, hanging: 567},
        children: runs('[' + (i + 1) + ']\t' + it)})));
      break;
    case 'pb': ch.push(new Paragraph({children: [new PageBreak()]})); break;
    // Нүүр, батламж, даалгаврын мөр: {text, size, bold, italic, before, align, indent, right}
    case 'title':
      b.lines.forEach(l => ch.push(new Paragraph({
        alignment: l.align === 'left' ? AlignmentType.LEFT : l.align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER,
        indent: l.indent ? {left: l.indent} : undefined,
        tabStops: l.right ? [{type: TabStopType.RIGHT, position: TEXT_W}] : undefined,
        spacing: {before: l.before || 0, after: 0, line: l.line || LINE},
        children: [...runs(l.text, {size: l.size || SZ, bold: l.bold || undefined, italics: l.italic || undefined}),
          ...(l.right ? [new TextRun({text: '\t', font: FONT, size: l.size || SZ}), ...runs(l.right, {size: l.size || SZ})] : [])]})));
      break;
    // Агуулга ба жагсаалтууд: Word нээхэд талбарыг шинэчилж хуудасны дугаар бөглөгдөнө
    case 'toc':
      newSection(b.text || 'Агуулга');
      cur().children.push(listTitle(b.text || 'Агуулга'),
        new D.TableOfContents('Агуулга', {hyperlink: true, headingStyleRange: '1-3'}));
      break;
    case 'figlist': case 'tablist': {
      const t = b.t === 'figlist' ? 'Зургийн жагсаалт' : 'Хүснэгтийн жагсаалт';
      newSection(t);
      cur().children.push(listTitle(t), new D.TableOfContents(t, {hyperlink: true,
        stylesWithLevels: [new StyleLevel(b.t === 'figlist' ? 'FigCap' : 'TblCap', 1)]}));
      break;
    }
    default: throw new Error('unknown block ' + b.t);
  }
});

const hdr = text => new Header({children: [new Paragraph({alignment: AlignmentType.CENTER,
  border: {bottom: {style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1}},
  children: [new TextRun({text, font: FONT, size: CAP, color: ACCENT})]})]});
const ftr = () => new Footer({children: [new Paragraph({
  border: {top: {style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1}},
  tabStops: [{type: TabStopType.RIGHT, position: TEXT_W}],
  children: [new TextRun({text: AUTHOR, font: FONT, size: CAP}), new TextRun({text: '\t', font: FONT, size: CAP}),
    new TextRun({children: [PageNumber.CURRENT], font: FONT, size: CAP})]})]});
const empty = () => ({default: new Header({children: [new Paragraph({children: []})]})});
const emptyF = () => ({default: new Footer({children: [new Paragraph({children: []})]})});

// Жагсаалт бүр 1-ээс эхлэх тул дугаартай жагсаалтын лавлагааг тус бүрд нь үүсгэнэ
const numIds = [...new Set(blocks.filter(b => b.t === 'ol').map(b => 'num' + (b.id || '')))];
const page = {size: {width: 11906, height: 16838}, margin: {top: 1134, bottom: 1134, left: 1701, right: 851}};
const doc = new Document({
  features: {updateFields: blocks.some(b => ['toc', 'figlist', 'tablist'].includes(b.t))},
  creator: AUTHOR,
  title: 'ТӨМӨР ЗАМЫН ДЭР БҮРТГЭХ PWA СИСТЕМ — дипломын төсөл',
  styles: {
    default: {document: {run: {font: FONT, size: SZ}}},
    paragraphStyles: [
      {id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: 28, bold: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 0}},
      {id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: SZ, bold: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 1}},
      {id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: SZ, bold: true, italics: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 2}},
      {id: 'FigCap', name: 'Зургийн гарчиг', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: CAP, italics: true, font: FONT}, paragraph: {alignment: AlignmentType.CENTER, spacing: {after: 200, line: 240}}},
      {id: 'TblCap', name: 'Хүснэгтийн гарчиг', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: CAP, italics: true, font: FONT}, paragraph: {alignment: AlignmentType.RIGHT, spacing: {before: 120, after: 60, line: 240}}},
    ]},
  numbering: {config: [
    {reference: 'bul', levels: [{level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
      style: {paragraph: {indent: {left: IND + 360, hanging: 360}}}}]},
    ...numIds.map(id => ({reference: id, levels: [{level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: {paragraph: {indent: {left: IND + 360, hanging: 360}}}}]})),
  ]},
  // Эхний хэсэг (нүүр, батламж, даалгавар) толгой, хөлгүй; бусад нь бүлгийн нэртэй толгой, дугаартай хөлтэй.
  // Нүүр хуудсыг хамааруулан дугаар тасралтгүй үргэлжилнэ.
  sections: sections.filter(s => s.children.length).map((s, i) => ({
    properties: {page, type: i ? SectionType.NEXT_PAGE : undefined},
    headers: s.header ? {default: hdr(s.header)} : empty(),
    footers: s.header ? {default: ftr()} : emptyF(),
    children: s.children,
  })),
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', OUT, sections.length); });
