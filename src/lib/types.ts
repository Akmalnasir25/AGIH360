export type JenisSekolah = 'SK' | 'SMK'
export type Peranan = 'admin' | 'gb' | 'pk' | 'guru'
export type StatusGuru = 'aktif' | 'cuti' | 'bertukar'

export interface Sekolah {
  id: string
  kod: string
  nama: string
  jenis: JenisSekolah
  alamat: string | null
  daerah: string | null
  negeri: string | null
  logo_url: string | null
  nama_ketua: string | null
  jawatan_ketua: string | null
  tahun_semasa: number
}

export interface Tetapan {
  school_id: string
  w_mengajar: number
  ambang_tinggi: number
  ambang_rendah: number
  faktor_peperiksaan: number
  minit_semasa: number
  had_jawatan: number
  guna_faktor_gred: boolean
}

export interface Tahap { id: string; nama: string; faktor: number; susunan: number }
export interface PerananJK { id: string; nama: string; berat: number; susunan: number }
export interface Tempoh { id: string; nama: string; faktor: number; susunan: number }
export interface Gred { id: string; kod: string; peranan: string | null; faktor: number; susunan: number }
export interface Bidang { id: string; nama: string; warna: string; susunan: number }

export interface Guru {
  id: string
  nama: string
  emel: string | null
  telefon: string | null
  gred_id: string | null
  masa_seminggu: number
  kelas_peperiksaan: boolean
  status: StatusGuru
  dikecualikan: boolean
  tag: string | null
  kepakaran: string | null
}

export interface Jawatankuasa {
  id: string
  bidang_id: string
  nama: string
  tahap_id: string
  tempoh_id: string
  wajib: boolean
  catatan: string | null
  susunan: number
  bidang_tugas?: string | null
  /** Kod MySG (JR01…/JM01…) jika ada */
  kod?: string | null
}

export interface Slot {
  id: string
  jawatankuasa_id: string
  peranan_id: string
  label: string | null
  susunan: number
}

export interface Lantikan {
  id: string
  tahun: number
  slot_id: string
  guru_id: string
  /** Snapshot nama pada masa lantikan — untuk sejarah merentas tahun */
  jk_nama?: string | null
  peranan_nama?: string | null
  bidang_nama?: string | null
}

export type JenisTugasLuar = 'relief' | 'jurulatih' | 'pemeriksa' | 'luar' | 'lain'
export interface TugasLuar { id: string; guru_id: string; tahun: number; jenis: JenisTugasLuar; keterangan: string; nilai: number }

export type StatusAgihan = 'draf' | 'semakan' | 'lulus' | 'muktamad'
export interface Kelulusan { status: StatusAgihan; catatan: string | null; dikemaskini: string | null }

export interface LogAudit { id: string | number; masa: string; pengguna: string | null; tindakan: string; butiran: string | null }

export interface MaklumBalas { id: string; guru_id: string; tahun: number; mesej: string; status: 'baru' | 'selesai'; balasan: string | null; dicipta: string }

/** Semua data satu sekolah untuk satu tahun — dimuat sekali, dikira di pelayar. */
export interface DataSekolah {
  sekolah: Sekolah
  tetapan: Tetapan
  tahap: Tahap[]
  peranan: PerananJK[]
  tempoh: Tempoh[]
  gred: Gred[]
  bidang: Bidang[]
  guru: Guru[]
  jawatankuasa: Jawatankuasa[]
  slot: Slot[]
  /** Lantikan tahun semasa DAN beberapa tahun lepas (sejarah) — tapis ikut tahun! */
  lantikan: Lantikan[]
  tugasLuar: TugasLuar[]
  kelulusan: Kelulusan
  log: LogAudit[]
  maklumBalas: MaklumBalas[]
}
