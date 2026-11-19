import type { DataSekolah, StatusAgihan } from './types'
import type { RekaBuku } from './tema'

export type Baris = { id?: string; [k: string]: unknown }
export type NamaJadual = 'guru' | 'jawatankuasa' | 'slot' | 'tahap' | 'peranan_jk' | 'tempoh' | 'gred' | 'bidang' | 'tugas_luar' | 'maklum_balas' | 'buku_seksyen'

/** Antara muka data — dilaksanakan oleh StorDemo (dalam memori / simulasi) dan StorSupabase. */
export interface Stor {
  mod: 'demo' | 'live' | 'simulasi'
  muat(): Promise<DataSekolah>
  /** Lantik guru ke slot (gantikan pemegang sedia ada). */
  lantik(slotId: string, guruId: string): Promise<void>
  lantikBanyak(pasangan: { slotId: string; guruId: string }[]): Promise<void>
  batal(slotId: string): Promise<void>
  batalBanyak(slotIds: string[]): Promise<void>
  /** Cipta slot baharu (peranan sama) untuk setiap guru dan lantik terus. */
  tambahAhli(jkId: string, perananId: string, guruIds: string[]): Promise<void>
  simpan(jadual: NamaJadual, baris: Baris): Promise<string>
  simpanBanyak(jadual: NamaJadual, baris: Baris[]): Promise<void>
  buang(jadual: NamaJadual, id: string): Promise<void>
  /** Arkib JK/slot: sejarah tahun lepas kekal, lantikan tahun semasa digugurkan. */
  arkib(jadual: 'jawatankuasa' | 'slot', id: string): Promise<void>
  simpanTetapan(t: Partial<DataSekolah['tetapan']>): Promise<void>
  simpanSekolah(s: Partial<DataSekolah['sekolah']>): Promise<void>
  /** Reka bentuk Buku Pengurusan (admin/GB/PK/Setiausaha) */
  simpanRekaBuku(r: RekaBuku): Promise<void>
  salinTahunLepas(): Promise<number>
  tukarStatus(status: StatusAgihan, catatan?: string): Promise<void>
}

export const STATUS_KUNCI: StatusAgihan[] = ['lulus', 'muktamad']
