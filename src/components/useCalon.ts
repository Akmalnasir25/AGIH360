import { useMemo } from 'react'
import { useAplikasi } from '../context/Aplikasi'
import { pratonton } from '../lib/indeks'
import { kepakaranSepadan, tahunBerturut, PERANAN_UTAMA } from '../lib/sejarah'

/**
 * Maklumat slot + senarai calon guru (disusun ikut indeks SELEPAS dilantik, kepakaran diutamakan,
 * cuti/dikecualikan di bawah) beserta amaran. Dikongsi oleh modal PilihGuru & panel guru Agih Tugas.
 */
export function useCalon(slotId: string | null) {
  const { k } = useAplikasi()

  const info = useMemo(() => {
    if (!k || !slotId) return null
    const d = k.data
    const slot = d.slot.find((s) => s.id === slotId)
    if (!slot) return null
    const jk = d.jawatankuasa.find((j) => j.id === slot.jawatankuasa_id)
    if (!jk) return null
    const peranan = d.peranan.find((p) => p.id === slot.peranan_id)!
    const tahap = d.tahap.find((t) => t.id === jk.tahap_id)!
    const tempoh = d.tempoh.find((t) => t.id === jk.tempoh_id)!
    const pemegang = k.pemegangSlot.get(slotId) ?? null
    const ahliJK = new Set(d.slot.filter((s) => s.jawatankuasa_id === jk.id).map((s) => k.pemegangSlot.get(s.id)).filter(Boolean))
    return { slot, jk, peranan, tahap, tempoh, pemegang, skor: k.skorSlot.get(slotId) ?? 0, ahliJK }
  }, [k, slotId])

  const calon = useMemo(() => {
    if (!k || !info) return []
    const t = k.data.tetapan
    const gred = new Map(k.data.gred.map((g) => [g.id, g.kod]))
    return k.data.guru
      .filter((g) => g.status !== 'bertukar' && k.hasil.has(g.id))
      .map((g) => {
        const kini = k.hasil.get(g.id)!
        const lepas = pratonton(k, g.id, info.slot.id)!
        const bil = (k.lantikanGuru.get(g.id) ?? []).length
        const amaran: string[] = []
        if (g.status === 'cuti') amaran.push('Sedang cuti')
        if (g.dikecualikan) amaran.push(g.tag ?? 'Dikecualikan')
        if (bil + 1 > t.had_jawatan && info.pemegang !== g.id) amaran.push(`Melebihi had ${t.had_jawatan} jawatan`)
        if (info.ahliJK.has(g.id) && info.pemegang !== g.id) amaran.push('Sudah dalam JK ini')
        if (kini.status !== 'terbeban' && lepas.indeks > t.ambang_tinggi) amaran.push('Akan jadi terbeban')
        if (PERANAN_UTAMA.test(info.peranan.nama)) {
          const n = tahunBerturut(k.data, g.id, info.peranan.nama, info.jk.nama, false)
          if (n >= 2) amaran.push(`Sudah ${n} tahun berturut pegang jawatan ini`)
        }
        const pakar = kepakaranSepadan(g.kepakaran, info.jk.nama)
        return { g, kini, lepas, bil, amaran, pakar, gred: g.gred_id ? gred.get(g.gred_id) : null }
      })
      .sort((a, b) => {
        const pa = a.g.status !== 'aktif' || a.g.dikecualikan ? 1 : 0
        const pb = b.g.status !== 'aktif' || b.g.dikecualikan ? 1 : 0
        return pa - pb || (a.lepas.indeks - (a.pakar ? 0.25 : 0)) - (b.lepas.indeks - (b.pakar ? 0.25 : 0))
      })
  }, [k, info])

  return { info, calon }
}

export type Calon = ReturnType<typeof useCalon>['calon'][number]
