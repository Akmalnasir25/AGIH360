import type { DataSekolah, Slot, Tetapan } from './types'

/**
 * Enjin Indeks Beban NeracaTugas
 *
 *   Skor tugas  = Σ (faktor tahap JK × berat peranan × faktor tempoh)
 *   Masa        = masa mengajar seminggu × (faktor peperiksaan jika kelas peperiksaan)
 *   Indeks      = w × (Masa ÷ median masa) + (1 − w) × (Skor ÷ sasaran tugas)
 *
 * Sasaran tugas = purata jangkaan (jumlah skor SEMUA slot, termasuk kosong, tolak skor
 * yang dipegang guru dikecualikan, ÷ bilangan guru dikira) × (faktor gred ÷ purata faktor gred).
 * Purata jangkaan dipilih berbanding median skor supaya indeks stabil walaupun di awal tahun
 * (ketika hampir semua guru belum ada tugas, median = 0), dan supaya pratonton "jika dilantik" tepat.
 */

export type StatusBeban = 'terbeban' | 'seimbang' | 'kurang' | 'tiada_tugas' | 'dikecualikan'

export interface BarisIndeks {
  id: string
  masa: number              // masa seminggu (mentah)
  relief?: number           // purata masa relief seminggu (ditambah ke masa, tanpa faktor peperiksaan)
  kelas_peperiksaan: boolean
  dikira: boolean           // aktif & tidak dikecualikan
  faktor_gred: number
  skor: number
}

export interface HasilIndeks {
  id: string
  masaLaras: number
  skor: number
  sasaran: number
  nisbahMasa: number
  nisbahTugas: number
  indeks: number
  status: StatusBeban
  /** Beban tugas jawatankuasa dinyatakan sebagai "setara N masa mengajar seminggu" */
  setaraMasa: number
}

export interface Ringkasan {
  medianMasa: number
  purataJangkaan: number
  purataFaktorGred: number
  bilDikira: number
}

export function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function ringkas(baris: BarisIndeks[], t: Tetapan, jumlahSkorSlot: number): Ringkasan {
  const dikira = baris.filter((b) => b.dikira)
  const masa = dikira.map((b) => masaLaras(b, t))
  let medianMasa = median(masa)
  if (medianMasa <= 0) medianMasa = masa.length ? masa.reduce((a, b) => a + b, 0) / masa.length : 0
  if (medianMasa <= 0) medianMasa = 1

  const skorTakDikira = baris.filter((b) => !b.dikira).reduce((a, b) => a + b.skor, 0)
  const bil = Math.max(dikira.length, 1)
  let purataJangkaan = (jumlahSkorSlot - skorTakDikira) / bil
  if (!(purataJangkaan > 0)) purataJangkaan = 1

  const fg = dikira.map((b) => b.faktor_gred || 1)
  const purataFaktorGred = fg.length ? fg.reduce((a, b) => a + b, 0) / fg.length : 1

  return { medianMasa, purataJangkaan, purataFaktorGred, bilDikira: dikira.length }
}

export function masaLaras(b: BarisIndeks, t: Tetapan) {
  return b.masa * (b.kelas_peperiksaan ? t.faktor_peperiksaan : 1) + (b.relief ?? 0)
}

export function kiraSatu(b: BarisIndeks, t: Tetapan, r: Ringkasan): HasilIndeks {
  const w = t.w_mengajar
  const ml = masaLaras(b, t)
  const gredRatio = t.guna_faktor_gred ? (b.faktor_gred || 1) / (r.purataFaktorGred || 1) : 1
  const sasaran = r.purataJangkaan * gredRatio
  const nisbahMasa = ml / r.medianMasa
  const nisbahTugas = sasaran > 0 ? b.skor / sasaran : 0
  const indeks = w * nisbahMasa + (1 - w) * nisbahTugas
  let status: StatusBeban
  if (!b.dikira) status = 'dikecualikan'
  else if (b.skor === 0) status = 'tiada_tugas'
  else if (indeks > t.ambang_tinggi) status = 'terbeban'
  else if (indeks < t.ambang_rendah) status = 'kurang'
  else status = 'seimbang'
  const setaraMasa = w > 0 ? ((1 - w) / w) * nisbahTugas * r.medianMasa : 0
  return { id: b.id, masaLaras: ml, skor: b.skor, sasaran, nisbahMasa, nisbahTugas, indeks, status, setaraMasa }
}

// ───────────────── Pembantu atas DataSekolah ─────────────────

export interface Konteks {
  data: DataSekolah
  skorSlot: Map<string, number>
  jumlahSkorSlot: number
  baris: BarisIndeks[]
  ringkasan: Ringkasan
  hasil: Map<string, HasilIndeks>
  lantikanGuru: Map<string, string[]>   // guru_id → slot_id[] (tahun semasa)
  pemegangSlot: Map<string, string>     // slot_id → guru_id (tahun semasa)
  /** Tugas luar tahun semasa: relief (masa seminggu) & mata lain, ikut guru */
  luarGuru: Map<string, { relief: number; mata: number }>
}

export function skorUntukSlot(d: DataSekolah, s: Slot): number {
  const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)
  if (!jk) return 0
  const tahap = d.tahap.find((x) => x.id === jk.tahap_id)?.faktor ?? 0
  const tempoh = d.tempoh.find((x) => x.id === jk.tempoh_id)?.faktor ?? 0
  const berat = d.peranan.find((x) => x.id === s.peranan_id)?.berat ?? 0
  return round(tahap * berat * tempoh, 2)
}

export function binaKonteks(d: DataSekolah): Konteks {
  const skorSlot = new Map(d.slot.map((s) => [s.id, skorUntukSlot(d, s)]))
  const tahun = d.sekolah.tahun_semasa
  const luarGuru = new Map<string, { relief: number; mata: number }>()
  for (const t of d.tugasLuar ?? []) {
    if (t.tahun !== tahun) continue
    const x = luarGuru.get(t.guru_id) ?? { relief: 0, mata: 0 }
    if (t.jenis === 'relief') x.relief += t.nilai; else x.mata += t.nilai
    luarGuru.set(t.guru_id, x)
  }
  const jumlahLuar = [...luarGuru.entries()]
    .filter(([gid]) => d.guru.find((g) => g.id === gid)?.status !== 'bertukar')
    .reduce((a, [, x]) => a + x.mata, 0)
  // Sasaran purata mengambil kira semua slot + semua mata tugas luar
  const jumlahSkorSlot = [...skorSlot.values()].reduce((a, b) => a + b, 0) + jumlahLuar
  const lantikanGuru = new Map<string, string[]>()
  const pemegangSlot = new Map<string, string>()
  for (const l of d.lantikan) {
    if (l.tahun !== tahun) continue
    pemegangSlot.set(l.slot_id, l.guru_id)
    const arr = lantikanGuru.get(l.guru_id) ?? []
    arr.push(l.slot_id)
    lantikanGuru.set(l.guru_id, arr)
  }
  const gredF = new Map(d.gred.map((g) => [g.id, g.faktor]))
  const baris: BarisIndeks[] = d.guru
    .filter((g) => g.status !== 'bertukar')
    .map((g) => ({
      id: g.id,
      masa: g.masa_seminggu,
      relief: luarGuru.get(g.id)?.relief ?? 0,
      kelas_peperiksaan: g.kelas_peperiksaan,
      dikira: g.status === 'aktif' && !g.dikecualikan,
      faktor_gred: (g.gred_id && gredF.get(g.gred_id)) || 1,
      skor: round((lantikanGuru.get(g.id) ?? []).reduce((a, sid) => a + (skorSlot.get(sid) ?? 0), 0) + (luarGuru.get(g.id)?.mata ?? 0), 2),
    }))
  const ringkasan = ringkas(baris, d.tetapan, jumlahSkorSlot)
  const hasil = new Map(baris.map((b) => [b.id, kiraSatu(b, d.tetapan, ringkasan)]))
  return { data: d, skorSlot, jumlahSkorSlot, baris, ringkasan, hasil, lantikanGuru, pemegangSlot, luarGuru }
}

/** Indeks guru jika dilantik ke slot tambahan (penyebut kekal — pratonton tepat). */
export function pratonton(k: Konteks, guruId: string, slotId: string): HasilIndeks | null {
  const b = k.baris.find((x) => x.id === guruId)
  if (!b) return null
  const tambah = k.pemegangSlot.get(slotId) === guruId ? 0 : (k.skorSlot.get(slotId) ?? 0)
  return kiraSatu({ ...b, skor: b.skor + tambah }, k.data.tetapan, k.ringkasan)
}

export function round(n: number, dp = 2) {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

export const LABEL_STATUS: Record<StatusBeban, string> = {
  terbeban: 'Terbeban',
  seimbang: 'Seimbang',
  kurang: 'Ada ruang',
  tiada_tugas: 'Belum ditugaskan',
  dikecualikan: 'Dikecualikan',
}
