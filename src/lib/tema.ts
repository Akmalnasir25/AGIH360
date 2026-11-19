/** Reka bentuk Buku Pengurusan: palet warna + gaya kulit / pemisah bahagian / isi. Warna hex tanpa '#'. */
export interface Palet {
  id: string
  nama: string
  utama: string        // latar gelap (kulit, tajuk)
  aksen: string        // penonjol utama
  kedua: string        // penonjol sokongan
  lembut: string       // latar kotak/sel
  bahagian: string[]   // warna setiap bahagian (berulang jika bahagian lebih banyak)
}

export const PALET: Palet[] = [
  { id: 'gemilang', nama: 'Jalur Gemilang', utama: '16207A', aksen: 'D62828', kedua: 'F2B705', lembut: 'EEF1FB', bahagian: ['16207A', 'D62828', 'E0A100', '2D4FD6', '0F766E'] },
  { id: 'laut', nama: 'Biru Laut', utama: '0B2545', aksen: '13A89E', kedua: 'F2C14E', lembut: 'E8F4F3', bahagian: ['0B2545', '13A89E', '1F6FB2', 'E09F3E', '6D597A'] },
  { id: 'zamrud', nama: 'Hijau Zamrud', utama: '064E3B', aksen: '10B981', kedua: 'FBBF24', lembut: 'ECFDF5', bahagian: ['064E3B', '10B981', 'D97706', '0E7490', '65A30D'] },
  { id: 'ungu', nama: 'Ungu Moden', utama: '2E1065', aksen: '8B5CF6', kedua: '22D3EE', lembut: 'F3F0FF', bahagian: ['5B21B6', 'DB2777', '0891B2', '7C3AED', 'EA580C'] },
  { id: 'marun', nama: 'Merah Marun', utama: '5B1220', aksen: 'D9485F', kedua: 'F4B942', lembut: 'FDF2F4', bahagian: ['7F1D1D', 'C2410C', 'B45309', '9F1239', '57534E'] },
  { id: 'senja', nama: 'Jingga Senja', utama: '7C2D12', aksen: 'F97316', kedua: 'FACC15', lembut: 'FFF7ED', bahagian: ['C2410C', 'F59E0B', 'DC2626', '9A3412', 'CA8A04'] },
  { id: 'teal', nama: 'Teal Segar', utama: '134E4A', aksen: '14B8A6', kedua: 'A3E635', lembut: 'F0FDFA', bahagian: ['0F766E', '0EA5E9', '65A30D', '14B8A6', '0369A1'] },
  { id: 'bunga', nama: 'Merah Jambu Ceria', utama: '831843', aksen: 'EC4899', kedua: 'FB923C', lembut: 'FDF2F8', bahagian: ['BE185D', 'F472B6', 'F97316', 'A855F7', 'E11D48'] },
  { id: 'pastel', nama: 'Pastel Lembut', utama: '334155', aksen: '7DA2E8', kedua: 'F6C177', lembut: 'F5F7FB', bahagian: ['6F8FD8', 'E88A80', 'E6B25C', '6BB894', 'A58BD6'] },
  { id: 'grafit', nama: 'Grafit Korporat', utama: '111827', aksen: '0EA5E9', kedua: '9CA3AF', lembut: 'F3F4F6', bahagian: ['1F2937', '0EA5E9', '475569', '0F766E', '334155'] },
]

export type GayaKulit = 'jalur' | 'geometri' | 'minimal' | 'bingkai'
export type GayaPemisah = 'jalur' | 'geometri' | 'penuh' | 'minimal'
export type GayaIsi = 'kad' | 'jadual' | 'senarai'

export const GAYA_KULIT: { id: GayaKulit; nama: string; sub: string }[] = [
  { id: 'jalur', nama: 'Jalur Klasik', sub: 'Jalur pepenjuru, logo bulat besar' },
  { id: 'geometri', nama: 'Geometri Moden', sub: 'Latar gelap, bulatan berwarna' },
  { id: 'minimal', nama: 'Minimalis', sub: 'Latar putih, tipografi besar' },
  { id: 'bingkai', nama: 'Bingkai Rasmi', sub: 'Berbingkai, lambang di tengah' },
]
export const GAYA_PEMISAH: { id: GayaPemisah; nama: string; sub: string }[] = [
  { id: 'jalur', nama: 'Jalur Sisi', sub: 'Jalur warna kiri + senarai berkod' },
  { id: 'geometri', nama: 'Blok Geometri', sub: 'Blok warna atas + kad dua lajur' },
  { id: 'penuh', nama: 'Halaman Penuh', sub: 'Warna sehalaman, huruf gergasi' },
  { id: 'minimal', nama: 'Minimalis', sub: 'Putih, huruf garis luar' },
]
export const GAYA_ISI: { id: GayaIsi; nama: string; sub: string }[] = [
  { id: 'kad', nama: 'Kad Moden', sub: 'Setiap JK dalam kad berjalur' },
  { id: 'jadual', nama: 'Jadual Rasmi', sub: 'Jadual bersempadan, kepala berwarna' },
  { id: 'senarai', nama: 'Senarai Ringkas', sub: 'Padat, garis titik, jimat kertas' },
]

export interface RekaBuku { palet: string; kulit: GayaKulit; pemisah: GayaPemisah; isi: GayaIsi; moto?: string; slogan?: string }
export const REKA_LALAI: RekaBuku = { palet: 'gemilang', kulit: 'jalur', pemisah: 'jalur', isi: 'kad', moto: '', slogan: '' }

export function bacaReka(x: unknown): RekaBuku {
  const r = { ...REKA_LALAI, ...(x && typeof x === 'object' ? x as Partial<RekaBuku> : {}) }
  if (!PALET.some((p) => p.id === r.palet)) r.palet = REKA_LALAI.palet
  if (!GAYA_KULIT.some((g) => g.id === r.kulit)) r.kulit = REKA_LALAI.kulit
  if (!GAYA_PEMISAH.some((g) => g.id === r.pemisah)) r.pemisah = REKA_LALAI.pemisah
  if (!GAYA_ISI.some((g) => g.id === r.isi)) r.isi = REKA_LALAI.isi
  return r
}
export const paletIkut = (id?: string | null) => PALET.find((t) => t.id === id) ?? PALET[0]
export const warnaBahagian = (p: Palet, i: number) => p.bahagian[i % p.bahagian.length]
export const hex = (h: string) => `#${h}`
