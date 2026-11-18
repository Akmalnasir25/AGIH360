import type { Konteks } from './indeks'
import type { Sekolah } from './types'

/** Struktur senarai jawatankuasa sedia untuk dieksport */
export interface BarisAhli { jawatan: string; nama: string[] }  // nama[] > 1 bila peranan sama digabung (cth AJK)
export interface JKEksport { no: string; kod: string | null; nama: string; tahap: string; tempoh: string; ahli: BarisAhli[]; kosong: number; bidangTugas: string[] }
export interface BidangEksport { huruf: string; nama: string; jk: JKEksport[] }
export interface Skop { bidang?: string[]; jk?: string[] }
export interface Pilihan { tunjukKosong: boolean; gabungPeranan: boolean }

const HURUF = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const KOSONG = '(belum diisi)'

export function kumpul(k: Konteks, skop: Skop, p: Pilihan): BidangEksport[] {
  const d = k.data
  const guru = new Map(d.guru.map((g) => [g.id, g.nama]))
  const peranan = new Map(d.peranan.map((x) => [x.id, x]))
  const bidang = [...d.bidang].sort((a, b) => a.susunan - b.susunan)
  const hasil: BidangEksport[] = []
  bidang.forEach((b, bi) => {
    if (skop.bidang?.length && !skop.bidang.includes(b.id)) return
    const jks = d.jawatankuasa
      .filter((j) => j.bidang_id === b.id && (!skop.jk?.length || skop.jk.includes(j.id)))
      .sort((a, c) => a.susunan - c.susunan)
    if (!jks.length) return
    hasil.push({
      huruf: HURUF[bi] ?? String(bi + 1),
      nama: b.nama,
      jk: jks.map((j, ji) => {
        const slot = d.slot.filter((s) => s.jawatankuasa_id === j.id).sort((a, c) => a.susunan - c.susunan)
        const ahli: BarisAhli[] = []
        let kosong = 0
        for (const s of slot) {
          const gid = k.pemegangSlot.get(s.id)
          const nama = gid ? guru.get(gid) ?? '' : null
          if (!nama) { kosong++; if (!p.tunjukKosong) continue }
          const jawatan = s.label || peranan.get(s.peranan_id)?.nama || ''
          const akhir = ahli[ahli.length - 1]
          if (p.gabungPeranan && akhir && akhir.jawatan === jawatan) akhir.nama.push(nama ?? KOSONG)
          else ahli.push({ jawatan, nama: [nama ?? KOSONG] })
        }
        return {
          no: `${bi + 1}.${ji + 1}`, kod: j.kod ?? null, nama: j.nama, ahli, kosong,
          bidangTugas: (j.bidang_tugas ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
          tahap: d.tahap.find((t) => t.id === j.tahap_id)?.nama ?? '',
          tempoh: d.tempoh.find((t) => t.id === j.tempoh_id)?.nama ?? '',
        }
      }),
    })
  })
  return hasil
}

export function tajukDokumen(_s: Sekolah, data: BidangEksport[]) {
  return data.length === 1 && data[0].jk.length === 1
    ? data[0].jk[0].nama.toUpperCase()
    : data.length === 1 ? `JAWATANKUASA ${data[0].nama.toUpperCase()}` : 'SENARAI JAWATANKUASA SEKOLAH'
}

function namaFail(s: Sekolah, data: BidangEksport[], ext: string) {
  const t = tajukDokumen(s, data).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${s.kod}-${t}-${s.tahun_semasa}.${ext}`
}

async function simpan(blob: Blob, nama: string) {
  const { saveAs } = await import('file-saver')
  saveAs(blob, nama)
}

// ───────────────────────── Kepala surat (Word) ─────────────────────────
export type ModKepalaDok = 'kosong' | 'logo' | 'imej'

function dataUrlKeBait(url: string): { bait: Uint8Array; jenis: 'png' | 'jpg' } {
  const [kepala, b64] = url.split(',')
  const bin = atob(b64)
  const bait = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bait[i] = bin.charCodeAt(i)
  return { bait, jenis: /png/i.test(kepala) ? 'png' : 'jpg' }
}
async function saizImej(url: string): Promise<{ w: number; h: number }> {
  const img = new Image()
  await new Promise<void>((ok, gagal) => { img.onload = () => ok(); img.onerror = () => gagal(new Error('Imej tidak sah')); img.src = url })
  return { w: img.naturalWidth || 1, h: img.naturalHeight || 1 }
}

/** Perenggan kepala dokumen Word mengikut mod. lebarPx = lebar ruang taip halaman (96 dpi). */
async function kepalaWord(s: Sekolah, mod: ModKepalaDok, lebarPx: number) {
  const { Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } = await import('docx')
  if (mod === 'kosong') return [new Paragraph({ spacing: { before: 1700 }, children: [] })]
  if (mod === 'imej' && s.kepala_surat) {
    const { bait, jenis } = dataUrlKeBait(s.kepala_surat)
    const { w, h } = await saizImej(s.kepala_surat)
    return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new ImageRun({ type: jenis, data: bait, transformation: { width: lebarPx, height: Math.round((h / w) * lebarPx) } })] })]
  }
  const alamat = [s.alamat, s.daerah, s.negeri].filter(Boolean).join(', ')
  const out = []
  if (s.logo_url) {
    const { bait, jenis } = dataUrlKeBait(s.logo_url)
    const { w, h } = await saizImej(s.logo_url)
    const t = 80
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new ImageRun({ type: jenis, data: bait, transformation: { width: Math.round((w / h) * t), height: t } })] }))
  }
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.nama.toUpperCase(), bold: true, size: 28 })] }))
  if (alamat || s.telefon) out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000', space: 4 } },
    children: [new TextRun({ text: [alamat, s.telefon ? `Tel: ${s.telefon}` : ''].filter(Boolean).join('  ·  '), size: 18 })],
  }))
  return out
}

// ───────────────────────── WORD (.docx) ─────────────────────────
export async function keWord(s: Sekolah, data: BidangEksport[], mod: ModKepalaDok = 'logo') {
  const D = await import('docx')
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, HeadingLevel, PageBreak } = D
  const garis = { style: BorderStyle.SINGLE, size: 4, color: '7A8BA6' }
  const sempadan = { top: garis, bottom: garis, left: garis, right: garis }
  const anak: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = []

  // Lebar ruang taip A4: 11906 − 2×1100 twip ≈ 647 px
  anak.push(...(await kepalaWord(s, mod, 647)))
  anak.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: tajukDokumen(s, data), bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 }, children: [new TextRun({ text: `SESI ${s.tahun_semasa}`, size: 22, color: '3A557D' })] }),
  )

  data.forEach((b, bi) => {
    if (bi > 0) anak.push(new Paragraph({ children: [new PageBreak()] }))
    anak.push(new Paragraph({
      heading: HeadingLevel.HEADING_1, spacing: { before: 120, after: 200 },
      shading: { type: ShadingType.CLEAR, fill: '0B1F3A', color: 'auto' },
      children: [new TextRun({ text: `  BAHAGIAN ${b.huruf}: ${b.nama.toUpperCase()}`, bold: true, color: 'FFFFFF', size: 24 })],
    }))
    for (const j of b.jk) {
      anak.push(new Paragraph({
        keepNext: true, keepLines: true, spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: `${j.no}  ${j.nama}${j.kod ? `  (${j.kod})` : ''}`, bold: true, size: 22 })],
      }))
      anak.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2800, 6200],
        rows: j.ahli.map((a, ri) => new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: sempadan, width: { size: 31, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'EEF2F7', color: 'auto' },
              children: [new Paragraph({ keepNext: ri < j.ahli.length - 1, children: [new TextRun({ text: a.jawatan, bold: true, size: 20 })] })],
            }),
            new TableCell({
              borders: sempadan, width: { size: 69, type: WidthType.PERCENTAGE },
              children: a.nama.map((n, ni) => new Paragraph({
                keepNext: ri < j.ahli.length - 1 || ni < a.nama.length - 1,
                children: [new TextRun({ text: a.nama.length > 1 ? `${ni + 1}. ${n}` : n, size: 20, italics: n === KOSONG, color: n === KOSONG ? '8A9FBD' : undefined })],
              })),
            }),
          ],
        })),
      }))
    }
  })

  const doc = new Document({
    creator: 'AGIH360', title: tajukDokumen(s, data),
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children: anak,
    }],
  })
  await simpan(await Packer.toBlob(doc), namaFail(s, data, 'docx'))
}

// ───────────────────────── EXCEL (.xlsx) ─────────────────────────
export async function keExcel(s: Sekolah, data: BidangEksport[], k: Konteks) {
  const E = (await import('exceljs')).default
  const wb = new E.Workbook()
  wb.creator = 'AGIH360'
  const NAVY = 'FF0B1F3A', KELABU = 'FFEEF2F7'
  const sempadan = { style: 'thin' as const, color: { argb: 'FFB9C7DB' } }
  const kotak = { top: sempadan, bottom: sempadan, left: sempadan, right: sempadan }

  // Helaian 1: senarai rata (mudah ditapis / pivot)
  const rata = wb.addWorksheet('Semua Jawatankuasa', { views: [{ state: 'frozen', ySplit: 3 }] })
  rata.columns = [{ width: 6 }, { width: 18 }, { width: 44 }, { width: 20 }, { width: 42 }]
  rata.mergeCells('A1:E1')
  rata.getCell('A1').value = `${s.nama.toUpperCase()} · ${tajukDokumen(s, data)} · SESI ${s.tahun_semasa}`
  rata.getCell('A1').font = { bold: true, size: 13 }
  const kepala = rata.getRow(3)
  kepala.values = ['Bil', 'Bidang', 'Jawatankuasa', 'Jawatan', 'Nama Guru']
  kepala.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.border = kotak })
  let n = 0
  for (const b of data) for (const j of b.jk) for (const a of j.ahli) for (const nm of a.nama) {
    const r = rata.addRow([++n, b.nama, `${j.no} ${j.nama}`, a.jawatan, nm])
    r.eachCell((c) => (c.border = kotak))
  }
  rata.autoFilter = { from: 'A3', to: `E${3 + n}` }

  // Helaian per bidang: gaya buku pengurusan
  for (const b of data) {
    const ws = wb.addWorksheet(b.nama.slice(0, 31))
    ws.columns = [{ width: 24 }, { width: 50 }]
    ws.mergeCells('A1:B1')
    ws.getCell('A1').value = `BAHAGIAN ${b.huruf}: ${b.nama.toUpperCase()}`
    ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    for (const j of b.jk) {
      ws.addRow([])
      const t = ws.addRow([`${j.no}  ${j.nama}`])
      ws.mergeCells(`A${t.number}:B${t.number}`)
      t.getCell(1).font = { bold: true, size: 11 }
      for (const a of j.ahli) {
        const r = ws.addRow([a.jawatan, a.nama.map((nm, i) => (a.nama.length > 1 ? `${i + 1}. ${nm}` : nm)).join('\n')])
        r.getCell(1).font = { bold: true }
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: KELABU } }
        r.getCell(2).alignment = { wrapText: true, vertical: 'top' }
        r.getCell(1).alignment = { vertical: 'top' }
        r.eachCell((c) => (c.border = kotak))
        if (a.nama.length > 1) r.height = 15 * a.nama.length
      }
    }
  }

  // Helaian: tugas ikut guru (untuk semakan pentadbir)
  const tg = wb.addWorksheet('Tugas Ikut Guru', { views: [{ state: 'frozen', ySplit: 1 }] })
  tg.columns = [{ width: 6 }, { width: 40 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 80 }]
  const kg = tg.getRow(1)
  kg.values = ['Bil', 'Nama Guru', 'Gred', 'Masa', 'Mata', 'Indeks', 'Status', 'Senarai Jawatan']
  kg.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } } })
  const d = k.data
  const label: Record<string, string> = { terbeban: 'Terbeban', seimbang: 'Seimbang', kurang: 'Ada ruang', tiada_tugas: 'Belum ditugaskan', dikecualikan: 'Dikecualikan' }
  ;[...d.guru].filter((g) => k.hasil.has(g.id)).sort((a, b) => a.nama.localeCompare(b.nama)).forEach((g, i) => {
    const h = k.hasil.get(g.id)!
    const senarai = (k.lantikanGuru.get(g.id) ?? []).map((sid) => {
      const sl = d.slot.find((x) => x.id === sid)!
      const jk = d.jawatankuasa.find((x) => x.id === sl.jawatankuasa_id)!
      return `${sl.label || d.peranan.find((p) => p.id === sl.peranan_id)?.nama} (${jk.nama})`
    }).join('; ')
    const r = tg.addRow([i + 1, g.nama, d.gred.find((x) => x.id === g.gred_id)?.kod ?? '', h.masaLaras, Math.round(h.skor * 10) / 10, Math.round(h.indeks * 100) / 100, label[h.status], senarai])
    r.getCell(8).alignment = { wrapText: true }
    if (h.status === 'terbeban') r.getCell(7).font = { color: { argb: 'FFE11D48' }, bold: true }
  })

  const buf = await wb.xlsx.writeBuffer()
  await simpan(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), namaFail(s, data, 'xlsx'))
}


// ───────────────────────── Carta organisasi ─────────────────────────
export interface Carta { ketua: { jawatan: string; nama: string }; cabang: { bidang: string; pk: string | null; jk: string[] }[] }

const KATA_BIDANG: [RegExp, RegExp][] = [
  [/pentadbiran|pengurusan/i, /pentadbiran|pengurusan/i],
  [/^kurikulum/i, /\bkurikulum\b|pentadbiran/i],  // \b: elak padan "Kokurikulum"
  [/hal ehwal|hem/i, /hem|hal ehwal/i],
  [/kokurikulum|koku/i, /koku/i],
]

export function binaCarta(k: Konteks, data: BidangEksport[]): Carta {
  const d = k.data
  const s = d.sekolah
  const pk = d.guru.filter((g) => /^pk|penolong kanan/i.test(g.tag ?? ''))
  return {
    ketua: { jawatan: s.jawatan_ketua ?? (s.jenis === 'SK' ? 'Guru Besar' : 'Pengetua'), nama: s.nama_ketua ?? '—' },
    cabang: data.map((b) => {
      const pasangan = KATA_BIDANG.find(([rb]) => rb.test(b.nama))
      const calon = pasangan ? pk.filter((g) => pasangan[1].test(g.tag ?? '')) : []
      const kata = b.nama.split(' ')[0].toLowerCase()
      const pilih = calon.find((g) => (g.tag ?? '').toLowerCase().split(/[^a-z]+/).includes(kata)) ?? calon[0]
      return { bidang: b.nama, pk: pilih ? `${pilih.nama} (${pilih.tag})` : null, jk: b.jk.map((j) => j.nama) }
    }),
  }
}

// ───────────────────────── BUKU PENGURUSAN (Word) ─────────────────────────
export async function keWordBuku(s: Sekolah, data: BidangEksport[], carta: Carta) {
  const D = await import('docx')
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, HeadingLevel, PageBreak, TableOfContents, VerticalAlign } = D
  const garis = { style: BorderStyle.SINGLE, size: 4, color: '7A8BA6' }
  const sempadan = { top: garis, bottom: garis, left: garis, right: garis }
  const tiada = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const tiadaSempadan = { top: tiada, bottom: tiada, left: tiada, right: tiada }
  type Anak = InstanceType<typeof Paragraph> | InstanceType<typeof Table> | InstanceType<typeof TableOfContents>
  const anak: Anak[] = []
  const P = (text: string, o: { bold?: boolean; size?: number; color?: string; tengah?: boolean; before?: number; after?: number } = {}) =>
    new Paragraph({ alignment: o.tengah ? AlignmentType.CENTER : undefined, spacing: { before: o.before ?? 0, after: o.after ?? 80 }, children: [new TextRun({ text, bold: o.bold, size: o.size, color: o.color })] })

  // Kulit
  anak.push(
    P('', { before: 2400 }),
    P(s.nama.toUpperCase(), { bold: true, size: 36, color: '0B1F3A', tengah: true }),
    P([s.alamat, s.daerah, s.negeri].filter(Boolean).join(', '), { size: 20, color: '3A557D', tengah: true, after: 1200 }),
    P('BUKU PENGURUSAN', { bold: true, size: 64, color: '06926B', tengah: true }),
    P('SEKOLAH', { bold: true, size: 64, color: '06926B', tengah: true, after: 400 }),
    P(`SESI ${s.tahun_semasa}`, { bold: true, size: 40, color: 'CF8A0F', tengah: true }),
    new Paragraph({ children: [new PageBreak()] }),
  )
  // Isi kandungan — medan Word, dikemas kini automatik ketika fail dibuka
  anak.push(P('ISI KANDUNGAN', { bold: true, size: 28, tengah: true, after: 240 }))
  anak.push(new TableOfContents('Isi Kandungan', { hyperlink: true, headingStyleRange: '1-2' }))
  anak.push(new Paragraph({ children: [new PageBreak()] }))

  // Carta organisasi
  anak.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'CARTA ORGANISASI' })] }))
  const kotak = (teks: string[], fill: string) => new TableCell({
    borders: tiadaSempadan, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: teks.map((t, i) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: i === 0, size: i === 0 ? 20 : 16, color: 'FFFFFF' })] })),
  })
  const n = Math.max(1, carta.cabang.length)
  anak.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [new TableCell({ borders: tiadaSempadan, columnSpan: n, children: [
        new Table({ alignment: AlignmentType.CENTER, width: { size: 50, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [kotak([carta.ketua.jawatan.toUpperCase(), carta.ketua.nama], '0B1F3A')] })] }),
        new Paragraph({ text: '' }),
      ] })] }),
      new TableRow({ children: carta.cabang.map((c) => new TableCell({ borders: tiadaSempadan, margins: { left: 60, right: 60 }, children: [
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [kotak([c.bidang.toUpperCase(), c.pk ?? ''], '06926B')] })] }),
      ] })) }),
      new TableRow({ children: carta.cabang.map((c) => new TableCell({ borders: tiadaSempadan, margins: { left: 60, right: 60, top: 80 },
        children: c.jk.map((j) => new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `• ${j}`, size: 15 })] })) })) }),
    ],
  }))

  // Bahagian
  data.forEach((b) => {
    anak.push(new Paragraph({ children: [new PageBreak()] }))
    anak.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `BAHAGIAN ${b.huruf}: ${b.nama.toUpperCase()}` })] }))
    for (const j of b.jk) {
      anak.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, keepLines: true, spacing: { before: 240, after: 80 }, children: [new TextRun({ text: `${j.no}  ${j.nama}${j.kod ? `  (${j.kod})` : ''}` })] }))
      anak.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: j.ahli.map((a, ri) => new TableRow({
          cantSplit: true,
          children: [
            new TableCell({ borders: sempadan, width: { size: 31, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: 'EEF2F7', color: 'auto' },
              children: [new Paragraph({ keepNext: ri < j.ahli.length - 1, children: [new TextRun({ text: a.jawatan, bold: true, size: 20 })] })] }),
            new TableCell({ borders: sempadan, width: { size: 69, type: WidthType.PERCENTAGE },
              children: a.nama.map((nm, ni) => new Paragraph({ keepNext: ri < j.ahli.length - 1 || ni < a.nama.length - 1, children: [new TextRun({ text: a.nama.length > 1 ? `${ni + 1}. ${nm}` : nm, size: 20 })] })) }),
          ],
        })),
      }))
      if (j.bidangTugas.length) {
        anak.push(P('Bidang tugas:', { bold: true, size: 19, before: 120, after: 40 }))
        j.bidangTugas.forEach((t, i) => anak.push(new Paragraph({ indent: { left: 360, hanging: 260 }, spacing: { after: 30 }, children: [new TextRun({ text: `${i + 1}.  ${t}`, size: 19 })] })))
      }
    }
  })

  const doc = new Document({
    creator: 'AGIH360', title: `Buku Pengurusan ${s.nama} ${s.tahun_semasa}`,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { size: 26, bold: true, color: 'FFFFFF' }, paragraph: { shading: { type: ShadingType.CLEAR, fill: '0B1F3A', color: 'auto' }, spacing: { before: 120, after: 200 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { size: 22, bold: true, color: '0B1F3A' } },
      ],
    },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: anak }],
  })
  await simpan(await Packer.toBlob(doc), `${s.kod}-Buku-Pengurusan-${s.tahun_semasa}.docx`)
}
