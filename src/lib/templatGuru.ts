import type { Gred, Sekolah } from './types'

/** Susunan lajur — SAMA dengan "Tampal dari Excel" supaya kedua-dua cara guna pemetaan yang sama. */
export const LAJUR_GURU = [
  { tajuk: 'Nama Penuh', lebar: 40, nota: 'Wajib. Cth: Pn. Siti Aminah binti Hassan' },
  { tajuk: 'Gred', lebar: 18, nota: 'Pilih dari senarai (DG9–DG14 / Gred Khas). Gred lama (DG41/44/48/52/54) juga diterima.' },
  { tajuk: 'Masa Mengajar Seminggu', lebar: 14, nota: 'Bilangan waktu/masa PdP seminggu (nombor).' },
  { tajuk: 'Kelas Peperiksaan', lebar: 14, nota: 'Ya / Tidak — mengajar kelas peperiksaan awam.' },
  { tajuk: 'E-mel DELIMa', lebar: 34, nota: 'Untuk log masuk "Tugas Saya". Cth: nama@moe-dl.edu.my' },
  { tajuk: 'Jawatan / Tag', lebar: 20, nota: 'Pilihan. Cth: Guru Besar, PK HEM, GKMP (pentadbir dikecualikan daripada median).' },
  { tajuk: 'Kepakaran / Subjek', lebar: 26, nota: 'Pilihan. Cth: Matematik, Sains' },
  { tajuk: 'No. Telefon', lebar: 16, nota: 'Pilihan. Untuk kongsi tugas melalui WhatsApp.' },
]

const CONTOH = [
  ['CONTOH — Pn. Siti Aminah binti Hassan', 'DG10', 26, 'Tidak', 'siti.aminah@moe-dl.edu.my', '', 'Bahasa Melayu', '0123456789'],
  ['CONTOH — En. Mohd Faizal bin Rahman', 'DG12', 24, 'Ya', 'mohd.faizal@moe-dl.edu.my', 'GKMP', 'Matematik, Sains', ''],
]

/** Jana templat Excel untuk diisi sekolah (dengan senarai juntai & arahan). */
export async function janaTemplatGuru(s: Sekolah, gred: Gred[]) {
  const E = (await import('exceljs')).default
  const wb = new E.Workbook()
  wb.creator = 'AGIH360'
  const NAVY = 'FF0B1F3A', HIJAU = 'FF10B483'

  // Helaian senarai (tersembunyi) untuk juntai Gred
  const senarai = wb.addWorksheet('Senarai', { state: 'veryHidden' })
  gred.forEach((g, i) => (senarai.getCell(`A${i + 1}`).value = g.kod))
  senarai.getCell('B1').value = 'Ya'; senarai.getCell('B2').value = 'Tidak'

  const ws = wb.addWorksheet('Guru', { views: [{ state: 'frozen', ySplit: 3 }] })
  ws.columns = LAJUR_GURU.map((l) => ({ width: l.lebar }))
  ws.mergeCells(1, 1, 1, LAJUR_GURU.length)
  const t = ws.getCell('A1')
  t.value = `SENARAI GURU — ${s.nama.toUpperCase()} (${s.kod}) · AGIH360`
  t.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  ws.getRow(1).height = 24
  ws.mergeCells(2, 1, 2, LAJUR_GURU.length)
  ws.getCell('A2').value = 'Isi mulai baris 6. Baris CONTOH akan diabaikan semasa muat naik — boleh dipadam. Jangan ubah susunan lajur.'
  ws.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF5B7499' } }

  const kepala = ws.getRow(3)
  kepala.values = LAJUR_GURU.map((l) => l.tajuk)
  kepala.height = 30
  kepala.eachCell((c, i) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i <= 2 ? HIJAU : NAVY } }
    c.alignment = { vertical: 'middle', wrapText: true }
    c.note = LAJUR_GURU[i - 1].nota
  })
  CONTOH.forEach((r, i) => {
    const row = ws.getRow(4 + i)
    row.values = r
    row.eachCell((c) => (c.font = { italic: true, color: { argb: 'FF8A9FBD' } }))
  })

  // Pengesahan data untuk 300 baris
  const AKHIR = 305
  for (let r = 4; r <= AKHIR; r++) {
    ws.getCell(`B${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`Senarai!$A$1:$A$${gred.length}`], showErrorMessage: false }
    ws.getCell(`C${r}`).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [0, 60], showErrorMessage: true, errorTitle: 'Masa mengajar', error: 'Masukkan nombor 0–60.' }
    ws.getCell(`D${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['Senarai!$B$1:$B$2'] }
  }

  const ar = wb.addWorksheet('Arahan')
  ar.columns = [{ width: 26 }, { width: 90 }]
  ar.addRow(['ARAHAN PENGISIAN']).font = { bold: true, size: 13 }
  ar.addRow([])
  LAJUR_GURU.forEach((l) => { const r = ar.addRow([l.tajuk, l.nota]); r.getCell(1).font = { bold: true } })
  ar.addRow([])
  ar.addRow(['Selepas siap', 'Simpan fail ini, kemudian di AGIH360 → Guru → "Muat naik Excel". Semak pratonton, tekan Import.'])
  ar.addRow(['Guru sedia ada', 'Nama yang sudah wujud dalam sistem akan diabaikan (tiada pendua).'])
  wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 1, visibility: 'visible' }]

  const buf = await wb.xlsx.writeBuffer()
  const { saveAs } = await import('file-saver')
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${s.kod}-Templat-Guru-AGIH360.xlsx`)
}

const teksSel = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'object') {
    const o = v as { text?: unknown; result?: unknown; richText?: { text: string }[]; hyperlink?: string }
    if (o.richText) return o.richText.map((x) => x.text).join('')
    if (o.text != null) return teksSel(o.text)
    if (o.result != null) return String(o.result)
    if (o.hyperlink) return o.hyperlink.replace(/^mailto:/, '')
  }
  return String(v)
}

/** Baca fail Excel yang diisi → baris mentah (susunan LAJUR_GURU). Abaikan tajuk, kepala & baris CONTOH. */
export async function bacaExcelGuru(fail: File): Promise<string[][]> {
  const E = (await import('exceljs')).default
  const wb = new E.Workbook()
  await wb.xlsx.load(await fail.arrayBuffer())
  const ws = wb.getWorksheet('Guru') ?? wb.worksheets.find((w) => w.state === 'visible')
  if (!ws) throw new Error('Helaian "Guru" tidak ditemui dalam fail.')
  const out: string[][] = []
  ws.eachRow((row) => {
    const sel = Array.from({ length: LAJUR_GURU.length }, (_, i) => teksSel(row.getCell(i + 1).value).trim())
    const nama = sel[0]
    if (!nama) return
    if (/^contoh\b/i.test(nama) || /^nama( penuh)?$/i.test(nama) || /^senarai guru/i.test(nama) || /^isi mulai/i.test(nama)) return
    out.push(sel)
  })
  return out
}
