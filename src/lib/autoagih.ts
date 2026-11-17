import { kiraSatu, type Konteks } from './indeks'
import { kepakaranSepadan, tahunBerturut } from './sejarah'

export interface Cadangan {
  slotId: string
  guruId: string | null           // null = tiada calon sesuai
  indeksSebelum: number
  indeksSelepas: number
  sebab: string[]
}

export interface PilihanAuto {
  bidang?: string[]
  jk?: string[]
  hormatHad: boolean            // patuhi had jawatan seorang guru
  elakTerbeban: boolean         // jangan lantik jika indeks selepas > ambang tinggi
  utamakanKepakaran: boolean
  elakGiliran: boolean          // elak guru yang sudah 3 tahun berturut pegang jawatan sama
  termasukPengerusi?: boolean   // lalai: Pengerusi dibiarkan (lazimnya GB/PK, dilantik manual)
}

/**
 * Auto-agih heuristik (deterministik): isi slot kosong, jawatan paling berat dahulu.
 * Setiap slot → calon layak dengan indeks SELEPAS paling rendah (bonus kepakaran sepadan).
 * Penyebut indeks tetap (purata jangkaan semua slot), jadi kiraan berjujukan adalah tepat.
 */
export function autoAgih(k: Konteks, p: PilihanAuto): Cadangan[] {
  const d = k.data
  const t = d.tetapan
  const skorKini = new Map(k.baris.map((b) => [b.id, b.skor]))
  const bilKini = new Map(d.guru.map((g) => [g.id, (k.lantikanGuru.get(g.id) ?? []).length]))
  const ahliJK = new Map<string, Set<string>>()
  for (const s of d.slot) {
    const g = k.pemegangSlot.get(s.id)
    if (!g) continue
    const set = ahliJK.get(s.jawatankuasa_id) ?? new Set()
    set.add(g)
    ahliJK.set(s.jawatankuasa_id, set)
  }
  const baris = new Map(k.baris.map((b) => [b.id, b]))
  const guru = new Map(d.guru.map((g) => [g.id, g]))
  const layak = d.guru.filter((g) => g.status === 'aktif' && !g.dikecualikan && baris.has(g.id))

  const slotKosong = d.slot
    .filter((s) => !k.pemegangSlot.has(s.id))
    .filter((s) => {
      const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)
      if (!jk) return false
      if (p.jk?.length) return p.jk.includes(jk.id)
      if (p.bidang?.length) return p.bidang.includes(jk.bidang_id)
      return true
    })
    .sort((a, b) => (k.skorSlot.get(b.id) ?? 0) - (k.skorSlot.get(a.id) ?? 0))

  const hasil: Cadangan[] = []
  for (const s of slotKosong) {
    const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    const pnm = d.peranan.find((x) => x.id === s.peranan_id)?.nama ?? ''
    const skorSlot = k.skorSlot.get(s.id) ?? 0
    if (!p.termasukPengerusi && /pengerusi/i.test(pnm)) {
      hasil.push({ slotId: s.id, guruId: null, indeksSebelum: 0, indeksSelepas: 0, sebab: ['Pengerusi lazimnya GB/PK — lantik secara manual'] })
      continue
    }
    let terbaik: { gid: string; nilai: number; sebelum: number; selepas: number; sebab: string[] } | null = null
    let ditolak = { had: 0, terbeban: 0, sudahAhli: 0, giliran: 0 }

    for (const g of layak) {
      if (ahliJK.get(jk.id)?.has(g.id)) { ditolak.sudahAhli++; continue }
      if (p.hormatHad && (bilKini.get(g.id) ?? 0) + 1 > t.had_jawatan) { ditolak.had++; continue }
      if (p.elakGiliran && tahunBerturut(d, g.id, pnm, jk.nama, false) >= 3) { ditolak.giliran++; continue }
      const b = baris.get(g.id)!
      const sebelum = kiraSatu({ ...b, skor: skorKini.get(g.id)! }, t, k.ringkasan).indeks
      const selepas = kiraSatu({ ...b, skor: skorKini.get(g.id)! + skorSlot }, t, k.ringkasan).indeks
      if (p.elakTerbeban && selepas > t.ambang_tinggi) { ditolak.terbeban++; continue }
      const pakar = p.utamakanKepakaran ? kepakaranSepadan(g.kepakaran, jk.nama) : null
      const nilai = selepas - (pakar ? 0.25 : 0)
      if (!terbaik || nilai < terbaik.nilai || (nilai === terbaik.nilai && g.nama < guru.get(terbaik.gid)!.nama)) {
        const sebab = [`Indeks paling rendah selepas lantikan (${sebelum.toFixed(2)} → ${selepas.toFixed(2)})`]
        if (pakar) sebab.unshift(`Kepakaran sepadan: ${pakar}`)
        if ((skorKini.get(g.id) ?? 0) === 0) sebab.push('Belum ada sebarang tugas')
        terbaik = { gid: g.id, nilai, sebelum, selepas, sebab }
      }
    }

    if (terbaik) {
      skorKini.set(terbaik.gid, (skorKini.get(terbaik.gid) ?? 0) + skorSlot)
      bilKini.set(terbaik.gid, (bilKini.get(terbaik.gid) ?? 0) + 1)
      const set = ahliJK.get(jk.id) ?? new Set()
      set.add(terbaik.gid)
      ahliJK.set(jk.id, set)
      hasil.push({ slotId: s.id, guruId: terbaik.gid, indeksSebelum: terbaik.sebelum, indeksSelepas: terbaik.selepas, sebab: terbaik.sebab })
    } else {
      const sebab = ['Tiada calon sesuai']
      if (ditolak.terbeban) sebab.push(`${ditolak.terbeban} guru akan jadi terbeban`)
      if (ditolak.had) sebab.push(`${ditolak.had} guru mencapai had jawatan`)
      if (ditolak.giliran) sebab.push(`${ditolak.giliran} guru sudah 3 tahun memegangnya`)
      hasil.push({ slotId: s.id, guruId: null, indeksSebelum: 0, indeksSelepas: 0, sebab })
    }
    ditolak = { had: 0, terbeban: 0, sudahAhli: 0, giliran: 0 }
  }
  return hasil
}
