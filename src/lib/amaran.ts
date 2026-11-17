import type { Konteks } from './indeks'
import { JK_SUBJEK, PERANAN_UTAMA, kepakaranSepadan, pernahPerananUtama, tahunBerturut } from './sejarah'

export type TahapAmaran = 'tinggi' | 'sederhana' | 'info'
export interface Amaran {
  kod: string
  tahap: TahapAmaran
  tajuk: string
  butiran: string
  guruId?: string
  jkId?: string
  slotId?: string
}

export const KATEGORI: Record<string, { label: string; tahap: TahapAmaran }> = {
  A01: { label: 'Terbeban', tahap: 'tinggi' },
  A02: { label: 'Belum ditugaskan', tahap: 'sederhana' },
  A03: { label: 'Melebihi had jawatan', tahap: 'tinggi' },
  A04: { label: 'Dua jawatan dalam JK sama', tahap: 'sederhana' },
  A05: { label: 'JK wajib belum lengkap', tahap: 'tinggi' },
  A06: { label: 'Guru tidak aktif masih dilantik', tahap: 'tinggi' },
  A07: { label: 'Guru kanan hanya AJK', tahap: 'info' },
  A08: { label: 'Giliran: 3 tahun berturut', tahap: 'sederhana' },
  A09: { label: 'Belum pernah pegang jawatan utama', tahap: 'info' },
  A10: { label: 'Tiada e-mel DELIMa', tahap: 'info' },
  A11: { label: 'Kepakaran tidak sepadan', tahap: 'info' },
  A12: { label: 'Maklum balas guru belum dijawab', tahap: 'sederhana' },
}

export function kiraAmaran(k: Konteks): Amaran[] {
  const d = k.data
  const t = d.tetapan
  const out: Amaran[] = []
  const tambah = (kod: string, tajuk: string, butiran: string, x: Partial<Amaran> = {}) =>
    out.push({ kod, tahap: KATEGORI[kod].tahap, tajuk, butiran, ...x })
  const jkMap = new Map(d.jawatankuasa.map((j) => [j.id, j]))
  const perananMap = new Map(d.peranan.map((p) => [p.id, p]))
  const gredMap = new Map(d.gred.map((g) => [g.id, g]))

  for (const g of d.guru) {
    const h = k.hasil.get(g.id)
    const slots = k.lantikanGuru.get(g.id) ?? []
    if (g.status !== 'aktif' && slots.length)
      tambah('A06', g.nama, `Status "${g.status}" tetapi masih memegang ${slots.length} jawatan.`, { guruId: g.id })
    if (!h || h.status === 'dikecualikan' || g.status !== 'aktif') continue
    if (h.status === 'terbeban') tambah('A01', g.nama, `Indeks ${h.indeks.toFixed(2)} melebihi ${t.ambang_tinggi} (${slots.length} jawatan, ${h.skor.toFixed(1)} mata).`, { guruId: g.id })
    if (h.status === 'tiada_tugas') tambah('A02', g.nama, 'Tiada sebarang jawatan pada sesi ini.', { guruId: g.id })
    if (slots.length > t.had_jawatan) tambah('A03', g.nama, `${slots.length} jawatan, had sekolah ${t.had_jawatan}.`, { guruId: g.id })

    // A04: dua slot dalam JK sama
    const perJK = new Map<string, number>()
    for (const sid of slots) { const jid = d.slot.find((s) => s.id === sid)?.jawatankuasa_id; if (jid) perJK.set(jid, (perJK.get(jid) ?? 0) + 1) }
    for (const [jid, n] of perJK) if (n > 1) tambah('A04', g.nama, `${n} jawatan dalam ${jkMap.get(jid)?.nama}.`, { guruId: g.id, jkId: jid })

    // A07: gred tinggi (faktor ≥ 1.3) tetapi semua jawatan AJK
    const gf = g.gred_id ? gredMap.get(g.gred_id) : null
    if (gf && gf.faktor >= 1.3 && slots.length && slots.every((sid) => !PERANAN_UTAMA.test(perananMap.get(d.slot.find((s) => s.id === sid)!.peranan_id)?.nama ?? '')))
      tambah('A07', g.nama, `${gf.kod} (${gf.peranan}) tetapi hanya memegang jawatan AJK.`, { guruId: g.id })

    // A09: tiada peranan utama dalam 3 tahun
    if (slots.length && !pernahPerananUtama(d, g.id, 3))
      tambah('A09', g.nama, 'Tiada jawatan Pengerusi/Setiausaha/Penyelaras/Ketua dalam 3 tahun — peluang pembangunan.', { guruId: g.id })

    if (!g.emel) tambah('A10', g.nama, 'Tidak boleh log masuk "Tugas Saya" atau menerima e-mel lantikan.', { guruId: g.id })
  }

  for (const s of d.slot) {
    const gid = k.pemegangSlot.get(s.id)
    if (!gid) continue
    const jk = jkMap.get(s.jawatankuasa_id)
    const pnm = perananMap.get(s.peranan_id)?.nama ?? ''
    const g = d.guru.find((x) => x.id === gid)
    if (!jk || !g) continue
    // A08: giliran — peranan utama sama 3 tahun berturut
    if (PERANAN_UTAMA.test(pnm)) {
      const n = tahunBerturut(d, gid, pnm, jk.nama)
      if (n >= 3) tambah('A08', g.nama, `${pnm}, ${jk.nama} — ${n} tahun berturut-turut. Pertimbang giliran.`, { guruId: gid, jkId: jk.id, slotId: s.id })
    }
    // A11: Ketua panitia / jawatan panitia dengan kepakaran ditetapkan tetapi tidak sepadan
    if (JK_SUBJEK.test(jk.nama) && /ketua/i.test(pnm) && g.kepakaran && !kepakaranSepadan(g.kepakaran, jk.nama))
      tambah('A11', g.nama, `${pnm}, ${jk.nama} — kepakaran: ${g.kepakaran}.`, { guruId: gid, jkId: jk.id, slotId: s.id })
  }

  for (const jk of d.jawatankuasa) {
    if (!jk.wajib) continue
    const sl = d.slot.filter((s) => s.jawatankuasa_id === jk.id)
    const kosong = sl.filter((s) => !k.pemegangSlot.has(s.id)).length
    if (kosong) tambah('A05', jk.nama, `${kosong} daripada ${sl.length} jawatan belum diisi.`, { jkId: jk.id })
  }

  for (const m of d.maklumBalas)
    if (m.status === 'baru' && m.tahun === d.sekolah.tahun_semasa)
      tambah('A12', d.guru.find((g) => g.id === m.guru_id)?.nama ?? 'Guru', m.mesej.slice(0, 120), { guruId: m.guru_id })

  const susun: Record<TahapAmaran, number> = { tinggi: 0, sederhana: 1, info: 2 }
  return out.sort((a, b) => susun[a.tahap] - susun[b.tahap] || a.kod.localeCompare(b.kod))
}
