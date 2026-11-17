import { describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'

const ditangkap: { blob: Blob; nama: string }[] = []
vi.mock('file-saver', () => ({ saveAs: (blob: Blob, nama: string) => ditangkap.push({ blob, nama }) }))

import { binaDemo, StorDemo } from './demo'
import { binaKonteks, kiraSatu, ringkas, type BarisIndeks } from './indeks'
import { autoAgih } from './autoagih'
import { kiraAmaran } from './amaran'
import { tahunBerturut, kepakaranSepadan } from './sejarah'
import { boleh } from './kuasa'
import { binaCarta, keWordBuku, kumpul } from './eksport'

describe('tugas luar & relief', () => {
  it('relief menambah masa, tugas luar menambah skor', () => {
    const d = binaDemo('SK')
    const k = binaKonteks(d)
    const relief = d.tugasLuar.find((t) => t.jenis === 'relief')!
    const g = d.guru.find((x) => x.id === relief.guru_id)!
    expect(k.hasil.get(g.id)!.masaLaras).toBe(g.masa_seminggu + relief.nilai)
    const luar = d.tugasLuar.find((t) => t.jenis === 'jurulatih')!
    const tanpa = binaKonteks({ ...d, tugasLuar: [] })
    expect(k.hasil.get(luar.guru_id)!.skor - tanpa.hasil.get(luar.guru_id)!.skor).toBeCloseTo(luar.nilai, 5)
  })

  it('laluan guru (RPC tanpa nama) = laluan admin (binaKonteks)', () => {
    const d = binaDemo('SK')
    const k = binaKonteks(d)
    // Tiru output data_indeks + jumlah_skor_slot seperti di pelayan
    const tahun = d.sekolah.tahun_semasa
    const slotSkor = [...k.skorSlot.values()].reduce((a, b) => a + b, 0)
    const rows = d.guru.filter((g) => g.status !== 'bertukar').map((g) => {
      const skorJK = (k.lantikanGuru.get(g.id) ?? []).reduce((a, sid) => a + (k.skorSlot.get(sid) ?? 0), 0)
      const tl = d.tugasLuar.filter((t) => t.guru_id === g.id && t.tahun === tahun)
      return {
        id: g.id, masa: g.masa_seminggu, kelas_peperiksaan: g.kelas_peperiksaan, dikira: g.status === 'aktif' && !g.dikecualikan,
        faktor_gred: d.gred.find((x) => x.id === g.gred_id)?.faktor ?? 1, skor: skorJK,
        relief: tl.filter((t) => t.jenis === 'relief').reduce((a, t) => a + t.nilai, 0),
        luar: tl.filter((t) => t.jenis !== 'relief').reduce((a, t) => a + t.nilai, 0),
      }
    })
    const baris: BarisIndeks[] = rows.map((r) => ({ id: r.id, masa: r.masa, relief: r.relief, kelas_peperiksaan: r.kelas_peperiksaan, dikira: r.dikira, faktor_gred: r.faktor_gred, skor: r.skor + r.luar }))
    const rk = ringkas(baris, d.tetapan, slotSkor + rows.reduce((a, r) => a + r.luar, 0))
    for (const b of baris) expect(kiraSatu(b, d.tetapan, rk).indeks).toBeCloseTo(k.hasil.get(b.id)!.indeks, 9)
  })
})

describe('auto-agih', () => {
  const d = binaDemo('SK')
  const k = binaKonteks(d)
  const c = autoAgih(k, { hormatHad: true, elakTerbeban: true, utamakanKepakaran: true, elakGiliran: true })

  it('mencadangkan untuk setiap slot kosong, berat dahulu', () => {
    const kosong = d.slot.filter((s) => !k.pemegangSlot.has(s.id))
    expect(c.length).toBe(kosong.length)
    const skor = c.map((x) => k.skorSlot.get(x.slotId)!)
    expect([...skor].sort((a, b) => b - a)).toEqual(skor)
  })

  it('tiada guru dikecualikan/tidak aktif, tiada pendua dalam JK sama, tiada jadi terbeban', () => {
    const ahli = new Map<string, Set<string>>()
    for (const s of d.slot) { const g = k.pemegangSlot.get(s.id); if (g) { const x = ahli.get(s.jawatankuasa_id) ?? new Set(); x.add(g); ahli.set(s.jawatankuasa_id, x) } }
    for (const x of c.filter((y) => y.guruId)) {
      const g = d.guru.find((y) => y.id === x.guruId)!
      expect(g.status).toBe('aktif')
      expect(g.dikecualikan).toBe(false)
      expect(x.indeksSelepas).toBeLessThanOrEqual(d.tetapan.ambang_tinggi)
      const jk = d.slot.find((s) => s.id === x.slotId)!.jawatankuasa_id
      expect(ahli.get(jk)?.has(x.guruId!) ?? false).toBe(false)
      const set = ahli.get(jk) ?? new Set(); set.add(x.guruId!); ahli.set(jk, set)
      expect(x.sebab.length).toBeGreaterThan(0)
    }
  })

  it('selepas terap, pratonton indeks = indeks sebenar', async () => {
    const st = new StorDemo(d)
    await st.lantikBanyak(c.filter((x) => x.guruId).map((x) => ({ slotId: x.slotId, guruId: x.guruId! })))
    const k2 = binaKonteks(await st.muat())
    const akhir = new Map<string, number>()
    for (const x of c) if (x.guruId) akhir.set(x.guruId, x.indeksSelepas)
    for (const [gid, ind] of akhir) expect(k2.hasil.get(gid)!.indeks).toBeCloseTo(ind, 6)
  })
})

describe('amaran & sejarah', () => {
  const d = binaDemo('SK')
  const k = binaKonteks(d)
  const a = kiraAmaran(k)
  it('mengesan giliran 3 tahun, maklum balas, terbeban, belum ditugaskan, tiada e-mel', () => {
    const kod = new Set(a.map((x) => x.kod))
    for (const c of ['A01', 'A02', 'A05', 'A08', 'A10', 'A12']) expect(kod.has(c)).toBe(true)
  })
  it('tahunBerturut mengira dari snapshot', () => {
    const x = a.find((y) => y.kod === 'A08')!
    const s = d.slot.find((y) => y.id === x.slotId)!
    const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    const p = d.peranan.find((y) => y.id === s.peranan_id)!.nama
    expect(tahunBerturut(d, x.guruId!, p, jk.nama)).toBeGreaterThanOrEqual(3)
  })
  it('kepakaran sepadan', () => {
    expect(kepakaranSepadan('Matematik, Sains', 'Panitia Matematik')).toBe('Matematik')
    expect(kepakaranSepadan('Sejarah', 'Panitia Matematik')).toBeNull()
  })
})

describe('kuasa', () => {
  it('PK terhad kepada bidangnya', () => {
    expect(boleh('pk', 'urus_jk', 'B1', 'B1')).toBe(true)
    expect(boleh('pk', 'urus_jk', 'B2', 'B1')).toBe(false)
    expect(boleh('pk', 'urus_guru')).toBe(false)
    expect(boleh('pk', 'lulus')).toBe(false)
    expect(boleh('gb', 'lulus')).toBe(true)
    expect(boleh('guru', 'lihat_pengurusan')).toBe(false)
  })
})

describe('StorDemo: tambah ahli, arkib, kunci, simulasi', () => {
  it('tambahAhli mencipta slot & melantik semua', async () => {
    const st = new StorDemo('SK')
    const d0 = await st.muat()
    const jk = d0.jawatankuasa[0]
    const ajk = d0.peranan.find((p) => p.nama === 'AJK')!.id
    const pilih = d0.guru.slice(30, 33).map((g) => g.id)
    const sebelum = d0.slot.filter((s) => s.jawatankuasa_id === jk.id).length
    await st.tambahAhli(jk.id, ajk, pilih)
    const d1 = await st.muat()
    expect(d1.slot.filter((s) => s.jawatankuasa_id === jk.id).length).toBe(sebelum + 3)
    const k = binaKonteks(d1)
    for (const g of pilih) expect((k.lantikanGuru.get(g) ?? []).some((sid) => d1.slot.find((s) => s.id === sid)!.jawatankuasa_id === jk.id)).toBe(true)
  })
  it('arkib JK: lantikan semasa hilang, sejarah tahun lepas kekal', async () => {
    const st = new StorDemo('SK')
    const d0 = await st.muat()
    const jk = d0.jawatankuasa[0]
    const slotIds = new Set(d0.slot.filter((s) => s.jawatankuasa_id === jk.id).map((s) => s.id))
    const lepas = d0.lantikan.filter((l) => slotIds.has(l.slot_id) && l.tahun < d0.sekolah.tahun_semasa).length
    expect(lepas).toBeGreaterThan(0)
    await st.arkib('jawatankuasa', jk.id)
    const d1 = await st.muat()
    expect(d1.jawatankuasa.find((j) => j.id === jk.id)).toBeUndefined()
    expect(d1.lantikan.filter((l) => slotIds.has(l.slot_id) && l.tahun === d1.sekolah.tahun_semasa).length).toBe(0)
    expect(d1.lantikan.filter((l) => l.jk_nama === jk.nama && l.tahun < d1.sekolah.tahun_semasa).length).toBe(lepas)
  })
  it('lulus mengunci lantikan', async () => {
    const st = new StorDemo('SK')
    const d = await st.muat()
    await st.tukarStatus('lulus')
    await expect(st.lantik(d.slot[0].id, d.guru[10].id)).rejects.toThrow(/lulus/)
    await st.tukarStatus('draf')
    await expect(st.lantik(d.slot[0].id, d.guru[10].id)).resolves.toBeUndefined()
  })
  it('simulasi menyekat perubahan struktur', async () => {
    const sim = new StorDemo(binaDemo('SK'))
    expect(sim.mod).toBe('simulasi')
    await expect(sim.arkib('slot', 'x')).rejects.toThrow(/simulasi/)
  })
})

describe('Buku Pengurusan', () => {
  it('Word sah: kulit, isi kandungan, carta, bidang tugas', async () => {
    ditangkap.length = 0
    const k = binaKonteks(binaDemo('SK'))
    const data = kumpul(k, {}, { tunjukKosong: false, gabungPeranan: true })
    const carta = binaCarta(k, data)
    expect(carta.cabang.length).toBe(4)
    expect(carta.cabang.find((c) => c.bidang === 'Hal Ehwal Murid')!.pk).toMatch(/PK HEM/)
    expect(carta.cabang.find((c) => c.bidang === 'Kurikulum')!.pk).toMatch(/PK Pentadbiran/)
    expect(carta.cabang.find((c) => c.bidang === 'Kokurikulum')!.pk).toMatch(/PK Kokurikulum/)
    await keWordBuku(k.data.sekolah, data, carta)
    const zip = await JSZip.loadAsync(await ditangkap[0].blob.arrayBuffer())
    const xml = await zip.file('word/document.xml')!.async('string')
    for (const t of ['BUKU PENGURUSAN', 'ISI KANDUNGAN', 'CARTA ORGANISASI', 'Bidang tugas:', 'BAHAGIAN A: PENTADBIRAN']) expect(xml).toContain(t)
  })
})
