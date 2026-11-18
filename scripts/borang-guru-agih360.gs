/**
 * AGIH360 — Borang maklumat guru (Google Form) — VERSI GENERIK untuk mana-mana sekolah
 *   Langkah 0: ubah KONFIGURASI di bawah (nama sekolah, kod, jenis, senarai guru).
 * -----------------------------------------------------------------------
 * CARA GUNA (sekali sahaja):
 *   1. Buka https://script.google.com  →  Projek baharu  →  padam kod sedia ada, tampal SEMUA kod ini.
 *   2. Simpan (Ctrl+S). Di menu atas pilih fungsi  ciptaBorang  →  tekan  Run (▶).
 *      Benarkan akses (Review permissions → pilih akaun → Advanced → Go to project → Allow).
 *   3. Lihat "Execution log": pautan BORANG (untuk dikongsi kepada guru) & pautan SHEET jawapan dipaparkan.
 *
 * SELEPAS GURU MENGISI:
 *   4. Buka Sheet jawapan  →  menu  AGIH360  →  "Jana helaian Guru (untuk AGIH360)".
 *      (Jika menu tiada, muat semula Sheet. Atau dari editor skrip, Run  janaHelaianGuru.)
 *   5. File → Download → Microsoft Excel (.xlsx)  →  AGIH360 → Guru → "Muat naik Excel".
 *   6. Menu AGIH360 → "Senarai belum isi" untuk tahu siapa yang belum menghantar.
 *
 * Guru boleh hantar semula / edit jawapan — yang TERKINI bagi setiap nama digunakan.
 */

// ═════════════ KONFIGURASI — UBAH DI SINI ═════════════
const SEKOLAH = 'NAMA SEKOLAH ANDA';
const KOD_SEKOLAH = 'ABC1234';
const JENIS = 'SK';          // 'SK' (rendah) atau 'SMK' (menengah)
const TAHUN = 2027;

// Senarai rasmi guru — salin dari senarai nama guru sekolah (satu nama setiap baris, dalam petikan).
// BIARKAN KOSONG [] jika mahu guru menaip nama sendiri (kurang disyorkan: risiko salah eja/pendua).
const NAMA_GURU = [
  // 'NAMA GURU SATU',
  // 'NAMA GURU DUA',
];

const GRED = ['DG9 dan ke bawah (termasuk DG6)', 'DG10', 'DG12', 'DG13', 'DG14', 'Gred Khas', 'COS / Interim / Kontrak'];
const JAWATAN = ['Tiada (guru akademik)', JENIS === 'SMK' ? 'Pengetua' : 'Guru Besar', 'PK Pentadbiran', 'PK HEM', 'PK Kokurikulum', 'Penyelia Petang', 'GKMP',
  'Guru Bimbingan & Kaunseling', 'Guru Pemulihan', 'Guru Pendidikan Khas', 'Guru Prasekolah', 'Guru Perpustakaan & Media'];
// Nama subjek pendek supaya AGIH360 boleh padankan dengan Panitia (cth "Matematik" ↔ "Panitia Matematik")
const SUBJEK = JENIS === 'SMK'
  ? ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Matematik Tambahan', 'Sains', 'Fizik', 'Kimia', 'Biologi', 'Sejarah',
     'Geografi', 'Pendidikan Islam', 'Bahasa Arab', 'Pendidikan Moral', 'Prinsip Perakaunan', 'Ekonomi', 'Perniagaan',
     'Reka Bentuk & Teknologi', 'Sains Komputer', 'Pendidikan Seni Visual', 'Muzik', 'PJPK', 'Bahasa Cina', 'Bahasa Tamil', 'Pendidikan Khas']
  : ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Pendidikan Islam', 'Bahasa Arab', 'Pendidikan Moral',
     'Sejarah', 'RBT', 'PJPK', 'Pendidikan Seni', 'Muzik', 'Bahasa Cina', 'Bahasa Tamil', 'Pendidikan Khas', 'Pemulihan', 'Prasekolah'];

const T = {  // tajuk soalan (dirujuk semasa menjana helaian)
  nama: 'Nama penuh',
  sesi: 'Sesi persekolahan',
  gred: 'Gred jawatan',
  masa: 'Jumlah waktu mengajar seminggu',
  pep: 'Mengajar kelas peperiksaan awam?',
  emel: 'E-mel DELIMa',
  jawatan: 'Jawatan pentadbiran / khusus',
  subjek: 'Subjek yang diajar (kepakaran)',
  tel: 'No. telefon bimbit (WhatsApp)',
};

// ─────────────────────────────────────────────────────────────────────────────
function ciptaBorang() {
  const form = FormApp.create(`Maklumat Guru ${TAHUN} — ${SEKOLAH} (AGIH360)`);
  form.setDescription(
    `Maklumat ini digunakan untuk agihan tugas jawatankuasa yang seimbang melalui sistem AGIH360.\n` +
    `Sila isi dengan tepat. Anda boleh mengedit jawapan selepas dihantar. Masa diperlukan: ~2 minit.`)
    .setAllowResponseEdits(true)
    .setProgressBar(false)
    .setConfirmationMessage('Terima kasih cikgu! Maklumat anda telah direkod untuk AGIH360.');
  try { form.setCollectEmail(false); } catch (e) { /* tidak penting */ }

  if (NAMA_GURU.length) {
    form.addListItem().setTitle(T.nama).setHelpText('Pilih nama anda. Jika tiada dalam senarai, maklumkan kepada pentadbir.')
      .setChoiceValues(NAMA_GURU.slice().sort()).setRequired(true);
  } else {
    form.addTextItem().setTitle(T.nama).setHelpText('Nama penuh seperti dalam rekod rasmi (HRMIS).').setRequired(true);
  }
  form.addMultipleChoiceItem().setTitle(T.sesi).setChoiceValues(['Pagi', 'Petang']).setRequired(true);
  form.addListItem().setTitle(T.gred).setChoiceValues(GRED).setRequired(true)
    .setHelpText('Gred KUP dikira sama (cth DG12 KUP → DG12). Gred lama: DG41=DG9, DG44=DG10, DG48=DG12, DG52=DG13, DG54=DG14.');

  form.addTextItem().setTitle(T.masa).setRequired(true)
    .setHelpText('Bilangan WAKTU PdP seminggu mengikut jadual waktu semasa (nombor sahaja, cth 28). Guru Besar/PK tulis waktu sebenar (boleh 0).')
    .setValidation(FormApp.createTextValidation().requireNumberBetween(0, 60)
      .setHelpText('Masukkan nombor antara 0 hingga 60.').build());

  form.addMultipleChoiceItem().setTitle(T.pep).setChoiceValues(['Tidak', 'Ya']).setRequired(true)
    .setHelpText(JENIS === 'SMK' ? 'Contoh: mengajar Tingkatan 5 (SPM) atau Tingkatan 6 (STPM).' : 'Untuk sekolah rendah, biasanya "Tidak".');

  form.addTextItem().setTitle(T.emel).setRequired(true)
    .setHelpText('E-mel DELIMa anda (nama@moe-dl.edu.my) — digunakan untuk log masuk "Tugas Saya" di AGIH360.')
    .setValidation(FormApp.createTextValidation().requireTextMatchesPattern('(?i)^\\s*[a-z0-9._%+-]+@moe-dl\\.edu\\.my\\s*$')
      .setHelpText('Mesti e-mel DELIMa yang berakhir @moe-dl.edu.my').build());

  form.addMultipleChoiceItem().setTitle(T.jawatan).setChoiceValues(JAWATAN).showOtherOption(true).setRequired(true)
    .setHelpText('Guru Besar, PK & Penyelia Petang dikecualikan daripada median beban (beban pentadbiran berbeza).');

  form.addCheckboxItem().setTitle(T.subjek).setChoiceValues(SUBJEK).showOtherOption(true).setRequired(true)
    .setHelpText('Tanda semua subjek yang anda ajar tahun ini. Digunakan untuk mencadangkan Panitia yang sesuai.');

  form.addTextItem().setTitle(T.tel).setRequired(false)
    .setHelpText('Pilihan. Untuk perkongsian senarai tugas melalui WhatsApp. Cth 0123456789')
    .setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^0?1[0-9]-?[0-9]{7,8}$')
      .setHelpText('Format: 0123456789 atau 012-3456789').build());

  const ss = SpreadsheetApp.create(`Jawapan Maklumat Guru ${TAHUN} — ${SEKOLAH} (AGIH360)`);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  ScriptApp.newTrigger('onOpenSheet').forSpreadsheet(ss).onOpen().create();

  Logger.log('✅ BORANG (kongsi kepada guru): ' + form.getPublishedUrl());
  Logger.log('✏️  Sunting borang: ' + form.getEditUrl());
  Logger.log('📊 SHEET jawapan: ' + ss.getUrl());
}

// Menu dalam Sheet jawapan
function onOpenSheet() {
  SpreadsheetApp.getUi().createMenu('AGIH360')
    .addItem('Jana helaian Guru (untuk AGIH360)', 'janaHelaianGuru')
    .addItem('Senarai belum isi', 'senaraiBelumIsi')
    .addToUi();
}

function bukaSheet_() {
  try { const a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a; } catch (e) { /* dijalankan dari editor */ }
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Jalankan ciptaBorang dahulu.');
  return SpreadsheetApp.openById(id);
}

/** Baca jawapan → jawapan TERKINI bagi setiap nama. */
function jawapanTerkini_(ss) {
  const sh = ss.getSheets().find((s) => s.getFormUrl && s.getFormUrl());
  if (!sh) throw new Error('Helaian jawapan borang tidak ditemui.');
  const v = sh.getDataRange().getDisplayValues();
  const kepala = v[0];
  const c = (t) => kepala.indexOf(t);
  const peta = {};
  v.slice(1).forEach((r) => {
    const nama = (r[c(T.nama)] || '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!nama) return;
    peta[nama] = {  // baris kemudian menggantikan yang awal (jawapan terkini)
      nama, sesi: r[c(T.sesi)], gred: r[c(T.gred)], masa: r[c(T.masa)], pep: r[c(T.pep)], emel: (r[c(T.emel)] || '').toLowerCase().trim(),
      jawatan: r[c(T.jawatan)], subjek: r[c(T.subjek)], tel: r[c(T.tel)] || '',
    };
  });
  return peta;
}

/** Hasilkan helaian "Guru" dalam format templat AGIH360 (lajur & susunan sama). */
function janaHelaianGuru() {
  const ss = bukaSheet_();
  const data = jawapanTerkini_(ss);
  let sh = ss.getSheetByName('Guru');
  if (sh) sh.clear(); else sh = ss.insertSheet('Guru', 0);

  sh.getRange(1, 1).setValue(`SENARAI GURU — ${SEKOLAH} (${KOD_SEKOLAH}) · AGIH360 · ${TAHUN}`).setFontWeight('bold');
  sh.getRange(2, 1).setValue(`Isi mulai baris 4 — dijana daripada Google Form pada ${new Date().toLocaleString('ms-MY')}. Muat turun sebagai .xlsx dan muat naik di AGIH360 → Guru → Muat naik Excel.`)
    .setFontStyle('italic').setFontColor('#5B7499');
  const kepala = ['Nama Penuh', 'Gred', 'Masa Mengajar Seminggu', 'Kelas Peperiksaan', 'E-mel DELIMa', 'Jawatan / Tag', 'Kepakaran / Subjek', 'No. Telefon'];
  sh.getRange(3, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#FFFFFF');

  const baris = Object.values(data).sort((a, b) => a.nama.localeCompare(b.nama)).map((d) => {
    const kontrak = /COS|Interim|Kontrak/i.test(d.gred);
    const gred = kontrak ? '' : d.gred.replace(/\s*\(termasuk DG6\)/, '');
    const jawatan = /^Tiada/i.test(d.jawatan) ? '' : d.jawatan;
    const tag = [jawatan, kontrak ? 'COS/Interim' : '', d.sesi ? `Sesi ${d.sesi}` : ''].filter(String).join(', ');
    const tel = String(d.tel).replace(/\D/g, '');
    return [d.nama, gred, Number(d.masa) || 0, d.pep === 'Ya' ? 'Ya' : 'Tidak', d.emel, tag, d.subjek, tel ? (tel[0] === '0' ? tel : '0' + tel) : ''];
  });
  if (baris.length) sh.getRange(4, 1, baris.length, kepala.length).setValues(baris);
  sh.getRange(4, 8, Math.max(baris.length, 1), 1).setNumberFormat('@');  // kekalkan 0 di hadapan no. telefon
  sh.autoResizeColumns(1, kepala.length);
  sh.setFrozenRows(3);
  ss.setActiveSheet(sh);

  const belum = NAMA_GURU.length ? NAMA_GURU.filter((n) => !data[n.toUpperCase()]).length : '—';
  const msg = `Helaian "Guru" dijana: ${baris.length} guru. Belum mengisi: ${belum}.\n\nSeterusnya: File → Download → Microsoft Excel (.xlsx), kemudian muat naik di AGIH360 → Guru → Muat naik Excel.`;
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

/** Helaian "Belum Isi": nama dalam senarai rasmi yang belum menghantar borang. */
function senaraiBelumIsi() {
  const ss = bukaSheet_();
  const data = jawapanTerkini_(ss);
  if (!NAMA_GURU.length) { try { SpreadsheetApp.getUi().alert('NAMA_GURU kosong — tiada senarai untuk dibandingkan.'); } catch (e) {} return; }
  const belum = NAMA_GURU.filter((n) => !data[n.toUpperCase()]).sort();
  let sh = ss.getSheetByName('Belum Isi');
  if (sh) sh.clear(); else sh = ss.insertSheet('Belum Isi');
  sh.getRange(1, 1, 1, 2).setValues([['Bil', `Belum mengisi borang (${belum.length} daripada ${NAMA_GURU.length})`]]).setFontWeight('bold');
  if (belum.length) sh.getRange(2, 1, belum.length, 2).setValues(belum.map((n, i) => [i + 1, n]));
  sh.autoResizeColumns(1, 2);
  ss.setActiveSheet(sh);
}
