// Дипломын төслийн бичвэрийг Word (docx) болгоно.
// Хэрэглээ: node build.js <out.docx> <content1.js> [content2.js ...]
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType,
  HeadingLevel, WidthType, ShadingType, BorderStyle, Footer, PageNumber, LevelFormat, TabStopType,
  PageBreak, VerticalAlign} = D;

const OUT = process.argv[2];
const blocks = [].concat(...process.argv.slice(3).map(f => require(path.resolve(f))));

const FONT = 'Times New Roman';
const SZ = 24;              // 12pt
const LINE = 360;           // 1.5 мөр
const IND = 709;            // 1.25 см
const TEXT_W = 11906 - 1701 - 851;   // A4, зүүн 3 см, баруун 1.5 см

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

const body = (text, o = {}) => new Paragraph(Object.assign({
  children: runs(text), alignment: AlignmentType.JUSTIFIED,
  indent: {firstLine: IND}, spacing: {line: LINE, after: 0}}, o));

const border = {style: BorderStyle.SINGLE, size: 4, color: '000000'};
const borders = {top: border, bottom: border, left: border, right: border};

function table(b) {
  const W = b.widths.reduce((a, x) => a + x, 0);
  const scale = TEXT_W / W;
  const widths = b.widths.map(w => Math.floor(w * scale));
  widths[widths.length - 1] += TEXT_W - widths.reduce((a, x) => a + x, 0);
  const cell = (txt, w, head, opt = {}) => new TableCell({
    borders, width: {size: w, type: WidthType.DXA}, columnSpan: opt.span,
    verticalAlign: VerticalAlign.CENTER,
    shading: head ? {fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto'} : undefined,
    margins: {top: 40, bottom: 40, left: 90, right: 90},
    children: String(txt).split('\n').map(line => new Paragraph({
      alignment: opt.left ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: {line: 240, after: 0},
      children: runs(line, {size: 22, bold: head || opt.bold || undefined})}))});
  const rows = [new TableRow({tableHeader: true, cantSplit: true,
    children: b.header.map((h, i) => cell(h, widths[i], true))})];
  b.rows.forEach(r => {
    if (r.group) {
      rows.push(new TableRow({cantSplit: true, children: [cell('*' + r.group + '*', TEXT_W, false, {span: widths.length, left: true})]}));
      return;
    }
    rows.push(new TableRow({cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false,
      {left: b.leftCols && b.leftCols.includes(i), bold: b.boldLast && r === b.rows[b.rows.length - 1]}))}));
  });
  const out = [
    new Paragraph({alignment: AlignmentType.RIGHT, spacing: {before: 120, after: 0, line: 240}, keepNext: true,
      children: runs('*Хүснэгт ' + b.num + '*')}),
    new Paragraph({alignment: AlignmentType.CENTER, spacing: {after: 80, line: 240}, keepNext: true,
      children: runs(b.title, {bold: true})}),
    new Table({width: {size: TEXT_W, type: WidthType.DXA}, columnWidths: widths, rows}),
  ];
  if (b.note) out.push(new Paragraph({spacing: {before: 40, after: 0, line: 240}, children: runs(b.note, {size: 20, italics: true})}));
  out.push(new Paragraph({spacing: {after: 120, line: 240}, children: []}));
  return out;
}

function figure(b) {
  const buf = fs.readFileSync(b.img);
  const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20);
  const wPx = Math.round(b.cm / 2.54 * 96);
  const hPx = Math.round(wPx * H / W);
  return [
    new Paragraph({alignment: AlignmentType.CENTER, spacing: {before: 120, after: 60}, keepNext: true,
      children: [new ImageRun({type: 'png', data: buf, transformation: {width: wPx, height: hPx},
        altText: {title: b.caption, description: b.caption, name: path.basename(b.img)}})]}),
    new Paragraph({alignment: AlignmentType.CENTER, spacing: {after: 160, line: 240},
      children: runs('**Зураг ' + b.num + '.** ' + b.caption)}),
  ];
}

const children = [];
blocks.forEach(b => {
  switch (b.t) {
    case 'h1':
      children.push(new Paragraph({heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
        alignment: AlignmentType.CENTER, spacing: {before: 0, after: 240, line: LINE},
        children: runs(b.text)}));
      break;
    case 'h2':
      children.push(new Paragraph({heading: HeadingLevel.HEADING_2, keepNext: true,
        spacing: {before: 240, after: 120, line: LINE}, indent: {firstLine: IND}, children: runs(b.text)}));
      break;
    case 'h3':
      children.push(new Paragraph({heading: HeadingLevel.HEADING_3, keepNext: true,
        spacing: {before: 160, after: 80, line: LINE}, indent: {firstLine: IND}, children: runs(b.text)}));
      break;
    case 'p': children.push(body(b.text)); break;
    case 'ul': case 'ol':
      b.items.forEach(it => children.push(new Paragraph({
        numbering: {reference: b.t === 'ul' ? 'bul' : 'num' + (b.id || ''), level: 0},
        alignment: AlignmentType.JUSTIFIED, spacing: {line: LINE, after: 0}, children: runs(it)})));
      break;
    case 'eq':
      children.push(new Paragraph({alignment: AlignmentType.LEFT, spacing: {before: 120, after: 120, line: LINE},
        tabStops: [{type: TabStopType.CENTER, position: Math.round(TEXT_W / 2)}, {type: TabStopType.RIGHT, position: TEXT_W}],
        children: [new TextRun({text: '\t', font: FONT, size: SZ}), ...runs(b.text), new TextRun({text: '\t(' + b.num + ')', font: FONT, size: SZ})]}));
      break;
    case 'table': children.push(...table(b)); break;
    case 'fig': children.push(...figure(b)); break;
    case 'refs':
      b.items.forEach((it, i) => children.push(new Paragraph({alignment: AlignmentType.JUSTIFIED,
        spacing: {line: LINE, after: 60}, indent: {left: 567, hanging: 567},
        children: runs('[' + (i + 1) + ']\t' + it)})));
      break;
    case 'pb': children.push(new Paragraph({children: [new PageBreak()]})); break;
    default: throw new Error('unknown block ' + b.t);
  }
});

// Жагсаалт бүр 1-ээс эхлэх тул дугаартай жагсаалтын лавлагааг тус бүрд нь үүсгэнэ
const numIds = [...new Set(blocks.filter(b => b.t === 'ol').map(b => 'num' + (b.id || '')))];
const doc = new Document({
  creator: process.env.DIPLOM_AUTHOR || 'Зохиогч',
  title: 'ПУ-5 PWA систем төсөл — дипломын төсөл',
  styles: {
    default: {document: {run: {font: FONT, size: SZ}}},
    paragraphStyles: [
      {id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: 28, bold: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 0}},
      {id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: SZ, bold: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 1}},
      {id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: {size: SZ, bold: true, italics: true, font: FONT, color: '000000'}, paragraph: {outlineLevel: 2}},
    ]},
  numbering: {config: [
    {reference: 'bul', levels: [{level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
      style: {paragraph: {indent: {left: IND + 360, hanging: 360}}}}]},
    ...numIds.map(id => ({reference: id, levels: [{level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: {paragraph: {indent: {left: IND + 360, hanging: 360}}}}]})),
  ]},
  sections: [{
    properties: {page: {size: {width: 11906, height: 16838},
      margin: {top: 1134, bottom: 1134, left: 1701, right: 851}}},
    footers: {default: new Footer({children: [new Paragraph({alignment: AlignmentType.CENTER,
      children: [new TextRun({children: [PageNumber.CURRENT], font: FONT, size: 22})]})]})},
    children,
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', OUT, children.length); });
