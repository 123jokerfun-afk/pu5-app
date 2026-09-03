/**
 * ПУ-5 — Google Sheets хүлээн авагч
 *
 * Энэ скрипт ЮУ Ч БОДДОГГҮЙ. Аппаас ирсэн мөрүүдийг хэсгийн нэртэй
 * шийтэд хуулж тавьдаг, тэгээд л болоо. Тооцоо (тэнцэхгүй хувь,
 * дараалсан цэг, солигдсон дүнзний пог/м) бүгд аппад хийгддэг —
 * ПУ-5 бол хуулийн бичиг баримт тул тоо хоёр газраас гарч болохгүй.
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
    if (body.schema !== 1)
      return _json({ ok: false, error: 'schema ' + body.schema + ' — скриптээ шинэчилнэ үү' });

    var name = String(body.tab || '').trim();
    if (!name) return _json({ ok: false, error: 'tab хоосон' });

    var rows = body.rows || [];
    if (!rows.length) return _json({ ok: false, error: 'мөр ирсэнгүй' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clear();

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

    // Ганц утгатай мөр = маягтын гарчиг. Бүдүүнээр ялгана — энэ нь
    // харагдац төдий, тоонд огт хамаагүй.
    for (var k = 0; k < grid.length; k++) {
      var only = String(grid[k][0]).length > 0;
      for (var c = 1; c < w && only; c++) if (String(grid[k][c]).length) only = false;
      if (only)
        sh.getRange(k + 1, 1, 1, w).setFontWeight('bold');
    }
    sh.setFrozenRows(2);

    return _json({ ok: true, tab: name, rows: grid.length, cols: w });
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) });
  }
}

function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
