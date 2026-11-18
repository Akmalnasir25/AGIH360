import { describe, expect, it, vi } from 'vitest'
import ExcelJS from 'exceljs'

const ditangkap: { blob: Blob; nama: string }[] = []
vi.mock('file-saver', () => ({ saveAs: (blob: Blob, nama: string) => ditangkap.push({ blob, nama }) }))

import { binaDemo } from './demo'
import { bacaExcelGuru, janaTemplatGuru, LAJUR_GURU } from './templatGuru'

describe('templat Excel guru', () => {
  it('jana → isi → muat naik: baris CONTOH diabaikan, data dibaca betul', async () => {
    const d = binaDemo('SK')
    await janaTemplatGuru(d.sekolah, d.gred)
    expect(ditangkap[0].nama).toMatch(/Templat-Guru-AGIH360\.xlsx$/)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await ditangkap[0].blob.arrayBuffer())
    const ws = wb.getWorksheet('Guru')!
    expect(ws.getRow(3).values).toEqual([undefined, ...LAJUR_GURU.map((l) => l.tajuk)])
    // pengesahan data juntai gred wujud
    expect(ws.getCell('B6').dataValidation?.type).toBe('list')

    // Cikgu isi dua guru (satu dengan gred lama & e-mel berpautan)
    ws.getRow(6).values = ['Pn. Rosnah binti Daud', 'DG44', 27, 'Ya', 'rosnah@moe-dl.edu.my', 'PK HEM', 'Sejarah', '0191234567']
    ws.getRow(7).values = ['En. Lee Wei Jie', 'DG12', 25, 'Tidak', { text: 'lee@moe-dl.edu.my', hyperlink: 'mailto:lee@moe-dl.edu.my' }, '', '', '']
    const buf = await wb.xlsx.writeBuffer()
    const fail = new File([buf], 'diisi.xlsx')

    const baris = await bacaExcelGuru(fail)
    expect(baris.length).toBe(2)
    expect(baris[0]).toEqual(['Pn. Rosnah binti Daud', 'DG44', '27', 'Ya', 'rosnah@moe-dl.edu.my', 'PK HEM', 'Sejarah', '0191234567'])
    expect(baris[1][4]).toBe('lee@moe-dl.edu.my')
  })
})
