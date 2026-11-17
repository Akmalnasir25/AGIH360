import { describe, expect, it, vi } from 'vitest'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

const ditangkap: { blob: Blob; nama: string }[] = []
vi.mock('file-saver', () => ({ saveAs: (blob: Blob, nama: string) => ditangkap.push({ blob, nama }) }))

import { binaDemo } from './demo'
import { binaKonteks } from './indeks'
import { keExcel, keWord, kumpul } from './eksport'

describe('eksport', () => {
  const k = binaKonteks(binaDemo('SK'))
  const p = { tunjukKosong: true, gabungPeranan: true }

  it('kumpul: gabung AJK & skop bidang', () => {
    const semua = kumpul(k, {}, p)
    expect(semua.length).toBe(4)
    const satu = kumpul(k, { bidang: [k.data.bidang[1].id] }, p)
    expect(satu.length).toBe(1)
    expect(satu[0].nama).toBe('Kurikulum')
    const jkPengurusan = semua[0].jk[0]
    const ajk = jkPengurusan.ahli.find((a) => a.jawatan === 'AJK')!
    expect(ajk.nama.length).toBe(4)
  })

  it('Word .docx sah & mengandungi nama guru', async () => {
    ditangkap.length = 0
    const data = kumpul(k, {}, p)
    await keWord(k.data.sekolah, data)
    const { blob, nama } = ditangkap[0]
    expect(nama).toMatch(/\.docx$/)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('BAHAGIAN A: PENTADBIRAN')
    expect(xml).toContain('JK Pengurusan Sekolah')
    const contohGuru = k.data.guru.find((g) => k.lantikanGuru.has(g.id))!.nama
    expect(xml).toContain(contohGuru.replace(/&/g, '&amp;'))
  })

  it('Excel .xlsx sah dengan helaian per bidang & tugas ikut guru', async () => {
    ditangkap.length = 0
    const data = kumpul(k, {}, p)
    await keExcel(k.data.sekolah, data, k)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await ditangkap[0].blob.arrayBuffer())
    const nama = wb.worksheets.map((w) => w.name)
    expect(nama).toEqual(['Semua Jawatankuasa', 'Pentadbiran', 'Kurikulum', 'Hal Ehwal Murid', 'Kokurikulum', 'Tugas Ikut Guru'])
    expect(wb.getWorksheet('Tugas Ikut Guru')!.rowCount).toBeGreaterThan(30)
  })
})
