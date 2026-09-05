/**
 * ПУ-5 — Google Sheets хүлээн авагч
 *
 * Энэ скрипт ЮУ Ч БОДДОГГҮЙ. Аппаас ирсэн мөрүүдийг хэсгийн нэртэй
 * шийтэд хуулж тавьдаг, тэгээд л болоо. Тооцоо (тэнцэхгүй хувь,
 * дараалсан цэг, солигдсон дүнзний пог/м) бүгд аппад хийгддэг —
 * ПУ-5 бол хуулийн бичиг баримт тул тоо хоёр газраас гарч болохгүй.
 *
 * Хэлбэрийг ч (толгойн нэгтгэл, хүрээ, багана өргөн) апп зааж өгнө —
 * `fmt` талбараар. Скрипт зөвхөн зурна.
 *
 * СУУЛГАХ:
 *   1. Хүснэгтээ нээгээд Extensions → Apps Script
 *   2. Энэ файлын агуулгыг Code.gs дотор буулгана
 *   3. TOKEN-г өөрийн нууц үгээр солино (хоосон бол шалгахгүй)
 *   4. Deploy → New deployment → Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Гарсан .../exec холбоосыг аппын Админ → Sheets цонхонд буулгана
 *      (TOKEN тавьсан бол ард нь ?t=НУУЦҮГ гэж залгана)
 *
 *   Кодыг ДАРАА нь өөрчилвөл Deploy → Manage deployments → ✏ →
 *   Version: New version → Deploy хийхгүй бол хуучин код ажилласаар байна.
 */

var TOKEN = '';                 // хоосон = шалгахгүй
var MAX_COLS = 40;              // маягтын хамгийн өргөн нь 19 багана

function doGet(e) {
  return _json({ ok: true, msg: 'ПУ-5 хүлээн авагч ажиллаж байна' });
}

function doPost(e) {
  try {
    if (TOKEN && (!e || !e.parameter || e.parameter.t !== TOKEN))
      return _json({ ok: false, error: 'Нууц үг таарахгүй' });

    var body = JSON.parse(e.postData.contents);
    if (body.schema !== 1 && body.schema !== 2)
      return _json({ ok: false, error: 'schema ' + body.schema + ' — скриптээ шинэчилнэ үү' });

    var name = String(body.tab || '').trim();
    if (!name) return _json({ ok: false, error: 'tab хоосон' });

    var rows = body.rows || [];
    if (!rows.length) return _json({ ok: false, error: 'мөр ирсэнгүй' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    // Нэгтгэсэн нүд үлдвэл дараагийн бичилт мөр хазайлгадаг тул эхлээд салгана
    sh.clear();
    try { sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart(); } catch (err) {}

    // setValues нь тэгш өнцөгт матриц шаарддаг — богино мөрийг гүйцээнэ
    var w = 1;
    for (var i = 0; i < rows.length; i++) w = Math.max(w, rows[i].length);
    w = Math.min(w, MAX_COLS);
    var grid = [];
    for (var j = 0; j < rows.length; j++) {
      var r = (rows[j] || []).slice(0, w);
      while (r.length < w) r.push('');
      grid.push(r);
    }
    if (sh.getMaxColumns() < w) sh.insertColumnsAfter(sh.getMaxColumns(), w - sh.getMaxColumns());
    if (sh.getMaxRows() < grid.length) sh.insertRowsAfter(sh.getMaxRows(), grid.length - sh.getMaxRows());
    sh.getRange(1, 1, grid.length, w).setValues(grid);

    _shape(sh, grid, w, body);

    // Бичсэн шийт рүү ШУУД ороход хэрэгтэй холбоос. Үүнгүй бол апп
    // хүснэгтийг нээхдээ хамгийн сүүлд идэвхтэй байсан таб дээр буудаг.
    var url = ss.getUrl().replace(/[?#].*$/, '').replace(/\/edit$/, '')
            + '/edit#gid=' + sh.getSheetId();
    return _json({ ok: true, tab: name, rows: grid.length, cols: w, url: url });
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) });
  }
}

/**
 * Хэлбэр — бүгд аппын зааврын дагуу. Энд ямар ч шийдвэр гаргахгүй.
 * fmt[i] = {title, row, head, n, cols, merges:[[r,c,rs,cs]], bold:[мөр]}
 */
function _shape(sh, grid, w, body) {
  var fmt = body.fmt || [];

  sh.getRange(1, 1, grid.length, w)
    .setFontFamily('Arial').setFontSize(10)
    .setVerticalAlignment('middle').setHorizontalAlignment('center');
  // Эхний хоёр багана бичвэр — голлуулбал уншихад төвөгтэй
  sh.getRange(1, 1, grid.length, 1).setHorizontalAlignment('left');

  // Хуудасны толгой (хэсэг, он/улирал, огноо)
  sh.getRange(1, 1, 2, w).setHorizontalAlignment('left');
  sh.getRange(1, 1).setFontSize(12).setFontWeight('bold');

  var widths = body.widths || [];
  for (var c = 0; c < w; c++) {
    var px = widths[c] || 62;
    try { sh.setColumnWidth(c + 1, px); } catch (e) {}
  }

  if (!fmt.length) {           // schema 1 — хуучин апп. Хамгийн бага хэлбэр.
    sh.setFrozenRows(2);
    return;
  }

  for (var b = 0; b < fmt.length; b++) {
    var f = fmt[b];
    var cols = Math.min(f.cols || w, w);

    // Маягтын гарчиг — хүснэгтээс тусад нь, зүүн тийш, бүдүүн
    if (f.title >= 1) {
      sh.getRange(f.title, 1, 1, cols).merge()
        .setHorizontalAlignment('left').setFontWeight('bold').setFontSize(11);
    }

    // Бүх хүснэгтэд хүрээ — гадна ба дотор
    sh.getRange(f.row, 1, f.n, cols)
      .setBorder(true, true, true, true, true, true);

    // Толгой — бүдүүн, мөр таслаж багтаана
    var hr = sh.getRange(f.row, 1, f.head || 2, cols);
    hr.setFontWeight('bold').setWrap(true).setHorizontalAlignment('center');
    for (var k = 0; k < (f.head || 2); k++) sh.setRowHeight(f.row + k, 42);

    // Нэгтгэлүүд — эх маягтын толгойн бүтэц
    var mg = f.merges || [];
    for (var m = 0; m < mg.length; m++) {
      var q = mg[m];
      if (q[1] + q[3] - 1 > cols) continue;
      try { sh.getRange(q[0], q[1], q[2], q[3]).merge(); } catch (e) {}
    }

    // Дүнгийн мөрүүд
    var bd = f.bold || [];
    for (var y = 0; y < bd.length; y++) {
      try { sh.getRange(bd[y], 1, 1, cols).setFontWeight('bold'); } catch (e) {}
    }
  }
  sh.setFrozenRows(2);
}

function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
