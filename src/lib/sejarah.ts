import type { DataSekolah, Lantikan } from './types'

/** Peranan "utama" (bukan AJK biasa) — untuk giliran & pembangunan guru */
export const PERANAN_UTAMA = /pengerusi|setiausaha|penyelaras|ketua|bendahari|guru kelas|warden/i

const kunciJawatan = (l: Pick<Lantikan, 'jk_nama' | 'peranan_nama'>) => `${l.peranan_nama ?? ''}|${l.jk_nama ?? ''}`

/** Senarai jawatan seorang guru mengikut tahun (terbaru dahulu), daripada snapshot nama. */
export function sejarahGuru(d: DataSekolah, guruId: string) {
  const ikutTahun = new Map<number, Lantikan[]>()
  for (const l of d.lantikan) {
    if (l.guru_id !== guruId) continue
    const arr = ikutTahun.get(l.tahun) ?? []
    arr.push(l)
    ikutTahun.set(l.tahun, arr)
  }
  return [...ikutTahun.entries()].sort((a, b) => b[0] - a[0]).map(([tahun, l]) => ({
    tahun,
    jawatan: l.map((x) => ({ jk: x.jk_nama ?? '—', peranan: x.peranan_nama ?? '—', bidang: x.bidang_nama ?? '' })),
    luar: d.tugasLuar.filter((t) => t.guru_id === guruId && t.tahun === tahun),
  }))
}

/**
 * Berapa tahun berturut-turut (termasuk tahun semasa jika dilantik) guru memegang jawatan yang sama
 * (padanan nama peranan + nama JK, tahan terhadap JK yang dinamakan semula selagi snapshot sama).
 */
export function tahunBerturut(d: DataSekolah, guruId: string, peranan: string, jkNama: string, termasukSemasa = true): number {
  const tahun = d.sekolah.tahun_semasa
  const k = `${peranan}|${jkNama}`
  const set = new Set(d.lantikan.filter((l) => l.guru_id === guruId && kunciJawatan(l) === k).map((l) => l.tahun))
  let n = 0
  for (let t = termasukSemasa ? tahun : tahun - 1; set.has(t); t--) n++
  return n
}

/** Adakah guru pernah memegang peranan utama dalam N tahun terakhir (termasuk semasa)? */
export function pernahPerananUtama(d: DataSekolah, guruId: string, nTahun = 3): boolean {
  const min = d.sekolah.tahun_semasa - nTahun + 1
  return d.lantikan.some((l) => l.guru_id === guruId && l.tahun >= min && PERANAN_UTAMA.test(l.peranan_nama ?? ''))
}

/** Kepakaran guru sepadan dengan nama JK? (cth kepakaran "Matematik" ↔ "Panitia Matematik") */
export function kepakaranSepadan(kepakaran: string | null | undefined, namaJK: string): string | null {
  if (!kepakaran) return null
  const jk = namaJK.toLowerCase()
  for (const k of kepakaran.split(/[,;/]+/).map((x) => x.trim()).filter((x) => x.length >= 3)) {
    if (jk.includes(k.toLowerCase())) return k
  }
  return null
}

/** Adakah JK ini berkaitan mata pelajaran (panitia) — supaya kepakaran tidak sepadan dianggap amaran */
export const JK_SUBJEK = /panitia|bidang .*pelajaran/i
