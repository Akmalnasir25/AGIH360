import type { Stor } from './stor'
import type { DataSekolah } from './types'

/** [peranan, label, bilangan] */
type Slot = [string, string | null, number?]
interface JKTemplat { nama: string; tahap: 'Utama' | 'Sokongan' | 'Sampingan'; tempoh: 'Sepanjang tahun' | 'Bermusim' | 'Program'; slot: Slot[]; bidang_tugas?: string }

/** Bidang Pendidikan Khas (PPKI) — pilihan, hanya untuk sekolah yang ada Program Pendidikan Khas Integrasi. */
export const NAMA_BIDANG_PPKI = 'Pendidikan Khas'
export const adaPPKI = (d: Pick<DataSekolah, 'bidang'>) => d.bidang.some((b) => /pendidikan khas|ppki/i.test(b.nama))

const PN: Slot = ['Penasihat', 'Guru Besar'], PG: Slot = ['Pengerusi', 'PK Pendidikan Khas']
export const TEMPLAT_PPKI: JKTemplat[] = [
  { nama: 'PPKI – Pengurusan dan Pentadbiran', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [PG, ['Setiausaha', 'S/U PPKI / Takwim'], ['Bendahari', null],
    ['Setiausaha', 'S/U Kurikulum'], ['Setiausaha', 'S/U HEM'], ['Setiausaha', 'S/U Kokurikulum'], ['Setiausaha', 'S/U Peperiksaan'],
    ['Penyelaras', 'Data / SMM / SSDM / Inklusif'], ['Penyelaras', 'Stok / Inventori / Perabot'], ['Penyelaras', 'Elaun Murid Khas (EMK)'],
    ['Penyelaras', 'Disiplin / Kaunseling / Pengawas'], ['Penyelaras', 'Kebersihan, Keceriaan']],
    bidang_tugas: 'Merancang dan menyelaras pengurusan Program Pendidikan Khas Integrasi.\nMenyediakan takwim, data murid dan laporan PPKI.\nMemantau pelaksanaan kurikulum, HEM dan kokurikulum murid berkeperluan khas.' },
  { nama: 'PPKI – JK Perancangan Tahunan', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [PN, PG, ['Setiausaha', null], ['Bendahari', null], ['AJK', null, 4]] },
  { nama: 'PPKI – JK Kewangan', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [PN, PG, ['Setiausaha', null], ['Penolong Setiausaha', null], ['AJK', null, 3]] },
  { nama: 'PPKI – Guru Beredar & Pembantu Pengurusan Murid', tahap: 'Sokongan', tempoh: 'Sepanjang tahun', slot: [PG, ['Setiausaha', null], ['AJK', 'Guru Beredar', 2], ['AJK', 'PPM', 4]] },
  { nama: 'PPKI – Jadual Guru Bertugas Mingguan', tahap: 'Sokongan', tempoh: 'Sepanjang tahun', slot: [['AJK', 'Kumpulan 1', 2], ['AJK', 'Kumpulan 2', 2], ['AJK', 'Kumpulan 3', 2], ['AJK', 'Kumpulan 4', 2]] },
  { nama: 'PPKI – JK Induk Kurikulum', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [PN, PG, ['Setiausaha', null], ['Penolong Setiausaha', null],
    ['Ketua Panitia', 'Bahasa Melayu'], ['Ketua Panitia', 'Bahasa Inggeris'], ['Ketua Panitia', 'Matematik'], ['Ketua Panitia', 'Sains, Sosial dan Alam Sekitar'],
    ['Ketua Panitia', 'Pendidikan Islam'], ['Ketua Panitia', 'Pengurusan Diri'], ['Ketua Panitia', 'Kemahiran Hidup'], ['Ketua Panitia', 'Pendidikan Seni / Jasmani / Muzik']] },
  { nama: 'PPKI – JK Pentaksiran Alternatif Pendidikan Rendah (PAPR)', tahap: 'Sokongan', tempoh: 'Bermusim', slot: [PN, PG, ['Setiausaha', 'S/U PAPR'], ['AJK', null, 2]] },
  { nama: 'PPKI – JK Rancangan Pendidikan Individu (RPI)', tahap: 'Sokongan', tempoh: 'Sepanjang tahun', slot: [PN, PG, ['Setiausaha', 'S/U RPI'], ['AJK', null, 2]] },
  { nama: 'PPKI – JK Psikometrik', tahap: 'Sampingan', tempoh: 'Bermusim', slot: [PN, PG, ['AJK', 'IMKPK'], ['AJK', 'IKPPK'], ['AJK', 'IKEPK']] },
  { nama: 'PPKI – JK Induk HEM', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [PN, PG, ['Naib Pengerusi', 'PK HEM'], ['Setiausaha', null], ['Penolong Setiausaha', null],
    ['AJK', 'SPBT'], ['AJK', 'RMT / Susu'], ['AJK', 'Elaun Murid Khas'], ['AJK', 'Disiplin / Kaunseling / Pengawas'], ['AJK', 'Pertukaran Murid ke Sek. Menengah'], ['AJK', 'Imunisasi / Pergigian']] },
  { nama: 'PPKI – JK Induk Kokurikulum', tahap: 'Utama', tempoh: 'Sepanjang tahun', slot: [['Pengerusi', 'Guru Besar'], ['Naib Pengerusi', 'PK Pendidikan Khas'], ['Setiausaha', 'S/U Kokurikulum'],
    ['Penyelaras', 'Sukan dan Permainan'], ['Penyelaras', 'Kelab dan Persatuan'], ['Penyelaras', 'Unit Beruniform']] },
  { nama: 'PPKI – Unit Sukan', tahap: 'Sokongan', tempoh: 'Sepanjang tahun', slot: [['Pengerusi', 'Guru Besar'], ['Naib Pengerusi', 'PK Pendidikan Khas'], ['Setiausaha', 'S/U Sukan']] },
]

/** Cipta bidang Pendidikan Khas + JK standard PPKI (slot kosong). Pulangkan bilangan JK. */
export async function aktifkanPPKI(s: Stor, d: DataSekolah): Promise<number> {
  if (adaPPKI(d)) throw new Error('Bidang Pendidikan Khas sudah wujud.')
  const cari = <T extends { nama: string; id: string }>(xs: T[], n: string) => xs.find((x) => x.nama.toLowerCase() === n.toLowerCase())
  const ajk = cari(d.peranan, 'AJK') ?? d.peranan.at(-1)
  if (!ajk) throw new Error('Tiada peranan JK dalam tetapan.')
  const susunan = Math.max(0, ...d.bidang.map((b) => b.susunan)) + 1
  const bidangId = await s.simpan('bidang', { nama: NAMA_BIDANG_PPKI, warna: 'violet', susunan })
  for (const [i, j] of TEMPLAT_PPKI.entries()) {
    const jkId = await s.simpan('jawatankuasa', {
      bidang_id: bidangId, nama: j.nama, wajib: false, susunan: i + 1, bidang_tugas: j.bidang_tugas ?? null,
      tahap_id: (cari(d.tahap, j.tahap) ?? d.tahap[0])?.id, tempoh_id: (cari(d.tempoh, j.tempoh) ?? d.tempoh[0])?.id,
    })
    let n = 0
    const slot = j.slot.flatMap(([p, label, bil = 1]) => Array.from({ length: bil }, () => ({
      jawatankuasa_id: jkId, peranan_id: (cari(d.peranan, p) ?? ajk).id, label, susunan: ++n,
    })))
    await s.simpanBanyak('slot', slot)
  }
  return TEMPLAT_PPKI.length
}
