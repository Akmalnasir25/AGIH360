import { describe, expect, it } from 'vitest'
import { binaKonteks, kiraSatu, median, pratonton, ringkas, type BarisIndeks } from './indeks'
import { binaDemo } from './demo'
import type { Tetapan } from './types'

const T: Tetapan = { school_id: 'x', w_mengajar: 0.6, ambang_tinggi: 1.3, ambang_rendah: 0.7, faktor_peperiksaan: 1.2, minit_semasa: 30, had_jawatan: 8, guna_faktor_gred: false }
const b = (id: string, masa: number, skor: number, o: Partial<BarisIndeks> = {}): BarisIndeks => ({ id, masa, skor, kelas_peperiksaan: false, dikira: true, faktor_gred: 1, ...o })

describe('median', () => {
  it('ganjil & genap', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBe(0)
  })
})

describe('indeks', () => {
  it('guru setara median & purata = 1.00', () => {
    const rows = [b('a', 30, 10), b('b', 30, 10), b('c', 30, 10)]
    const r = ringkas(rows, T, 30)
    const h = kiraSatu(rows[0], T, r)
    expect(h.indeks).toBeCloseTo(1, 5)
    expect(h.status).toBe('seimbang')
  })

  it('awal tahun: semua skor 0 tidak bahagi dengan sifar', () => {
    const rows = [b('a', 30, 0), b('b', 28, 0)]
    const r = ringkas(rows, T, 60) // ada slot, belum diisi
    const h = kiraSatu(rows[0], T, r)
    expect(Number.isFinite(h.indeks)).toBe(true)
    expect(h.status).toBe('tiada_tugas')
    expect(r.purataJangkaan).toBe(30)
  })

  it('tiada slot & tiada masa tetap terhingga', () => {
    const rows = [b('a', 0, 0)]
    const r = ringkas(rows, T, 0)
    expect(Number.isFinite(kiraSatu(rows[0], T, r).indeks)).toBe(true)
  })

  it('guru dikecualikan tidak masuk median & skornya ditolak dari sasaran', () => {
    const rows = [b('gb', 4, 20, { dikira: false }), b('a', 30, 10), b('b', 30, 10)]
    const r = ringkas(rows, T, 40)
    expect(r.medianMasa).toBe(30)
    expect(r.purataJangkaan).toBe(10) // (40 - 20) / 2
    expect(kiraSatu(rows[0], T, r).status).toBe('dikecualikan')
  })

  it('kelas peperiksaan didarab faktor', () => {
    const rows = [b('a', 25, 10, { kelas_peperiksaan: true }), b('b', 30, 10)]
    const r = ringkas(rows, T, 20)
    expect(kiraSatu(rows[0], T, r).masaLaras).toBe(30)
  })

  it('gred tinggi mendapat sasaran lebih besar', () => {
    const tg = { ...T, guna_faktor_gred: true }
    const rows = [b('dg9', 30, 10, { faktor_gred: 1 }), b('dg13', 30, 10, { faktor_gred: 1.3 })]
    const r = ringkas(rows, tg, 20)
    expect(kiraSatu(rows[1], tg, r).indeks).toBeLessThan(kiraSatu(rows[0], tg, r).indeks)
  })

  it('terbeban melepasi ambang', () => {
    const rows = [b('a', 30, 40), b('b', 20, 5), b('c', 30, 5)]
    const r = ringkas(rows, T, 50)
    expect(kiraSatu(rows[0], T, r).status).toBe('terbeban')
    expect(kiraSatu(rows[1], T, r).status).toBe('kurang')
  })
})

describe('masa mengajar belum diisi', () => {
  it('masa 0 diandaikan median: guru tugas sama → indeks sama', () => {
    const rows = [b('a', 30, 10), b('b', 0, 10), b('c', 30, 10)]
    const r = ringkas(rows, T, 30)
    expect(r.medianMasa).toBe(30)
    expect(r.bilTiadaMasa).toBe(1)
    const hb = kiraSatu(rows[1], T, r)
    expect(hb.masaAndaian).toBe(true)
    expect(hb.indeks).toBeCloseTo(kiraSatu(rows[0], T, r).indeks, 9)
  })
  it('semua masa kosong: label masih bermakna (terbeban dikesan ikut tugas)', () => {
    const rows = [b('a', 0, 40), b('b', 0, 5), b('c', 0, 5)]
    const r = ringkas(rows, T, 50)
    expect(r.bilTiadaMasa).toBe(3)
    expect(kiraSatu(rows[0], T, r).status).toBe('terbeban')
    expect(kiraSatu(rows[1], T, r).status).not.toBe('terbeban')
  })
})

describe('konteks demo', () => {
  it('pratonton = indeks selepas lantikan sebenar', () => {
    const d = binaDemo('SK')
    const k = binaKonteks(d)
    const kosong = d.slot.find((s) => !k.pemegangSlot.has(s.id))!
    const guru = d.guru[10]
    const p = pratonton(k, guru.id, kosong.id)!
    d.lantikan.push({ id: 'z', tahun: d.sekolah.tahun_semasa, slot_id: kosong.id, guru_id: guru.id })
    const k2 = binaKonteks(d)
    expect(k2.hasil.get(guru.id)!.indeks).toBeCloseTo(p.indeks, 6)
  })

  it('demo SMK juga terbina', () => {
    const k = binaKonteks(binaDemo('SMK'))
    expect(k.data.jawatankuasa.length).toBeGreaterThan(30)
    expect([...k.hasil.values()].some((h) => h.status === 'terbeban')).toBe(true)
  })
})
