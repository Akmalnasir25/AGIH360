import type { Sekolah } from './types'

const NEGERI: Record<string, string> = {
  perak: 'Perak Darul Ridzuan', selangor: 'Selangor Darul Ehsan', johor: 'Johor Darul Ta\'zim', kedah: 'Kedah Darul Aman',
  kelantan: 'Kelantan Darul Naim', terengganu: 'Terengganu Darul Iman', pahang: 'Pahang Darul Makmur',
  'negeri sembilan': 'Negeri Sembilan Darul Khusus', perlis: 'Perlis Indera Kayangan', melaka: 'Melaka', 'pulau pinang': 'Pulau Pinang',
  sabah: 'Sabah', sarawak: 'Sarawak',
}
const JENIS: [RegExp, string][] = [
  [/^SMKA\b/i, 'Sekolah Menengah Kebangsaan Agama'], [/^SMK\b/i, 'Sekolah Menengah Kebangsaan'], [/^SMJK\b/i, 'Sekolah Menengah Jenis Kebangsaan'],
  [/^SJKC\b/i, 'Sekolah Jenis Kebangsaan (Cina)'], [/^SJKT\b/i, 'Sekolah Jenis Kebangsaan (Tamil)'], [/^SK\b/i, 'Sekolah Kebangsaan'],
]
const KECIL = new Set(['bin', 'binti', 'dan', 'di', 'ke'])
const hurufAwal = (t: string) => t.toLowerCase().replace(/[\p{L}\d']+/gu, (w, i) => (i > 0 && KECIL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
const besarSemua = (t: string) => t === t.toUpperCase()

/** "SK PENGKALAN PEGOH" → "Sekolah Kebangsaan Pengkalan Pegoh" */
export function namaPenuhSekolah(nama: string) {
  let n = nama.trim()
  for (const [re, ganti] of JENIS) if (re.test(n)) { n = n.replace(re, ganti); break }
  return besarSemua(nama) ? hurufAwal(n).replace(/\((cina|tamil)\)/i, (_, x: string) => `(${x[0].toUpperCase()}${x.slice(1)})`) : n
}
export const negeriPenuh = (n: string | null | undefined) => (n ? NEGERI[n.trim().toLowerCase()] ?? n.trim() : '')
/** Baris alamat: ikut baris baharu; jika satu baris, pecah ikut koma. */
export const barisAlamat = (a: string | null | undefined) => {
  const t = (a ?? '').trim()
  if (!t) return []
  return (t.includes('\n') ? t.split('\n') : t.split(',')).map((x) => x.trim()).filter(Boolean)
}
export const kodPapar = (kod: string) => kod.replace(/^([A-Za-z]+)\s*(\d+)$/, (_, a: string, b: string) => `${a.toUpperCase()} ${b}`)
export const emelRasmi = (s: Sekolah) => s.emel?.trim() || `${s.kod.replace(/\s/g, '')}@moe.edu.my`

/** Isi kepala surat format KPM: lajur kiri (teks) & maklumat hubungan kanan (sebaris dengan 3 baris terakhir). */
export function isiKepala(s: Sekolah) {
  const kiri = [
    namaPenuhSekolah(s.nama),
    ...barisAlamat(s.alamat),
    ...(s.negeri && !barisAlamat(s.alamat).some((b) => b.toLowerCase().includes(s.negeri!.trim().toLowerCase())) ? [negeriPenuh(s.negeri)] : []),
    `Kod Sekolah : ${kodPapar(s.kod)}`,
  ]
  const kanan: [string, string][] = [
    ...(s.telefon ? [['Telefon', s.telefon] as [string, string]] : []),
    ...(s.faks ? [['Faks', s.faks] as [string, string]] : []),
    ['Email', emelRasmi(s)],
  ]
  return { kiri, kanan }
}
