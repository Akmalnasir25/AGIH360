import type { Peranan } from './types'

/**
 * Semua semakan kebenaran UI melalui fungsi ini (RLS di pelayan tetap penentu sebenar).
 *  admin  — setiausaha sistem: semua
 *  gb     — Guru Besar / Pengetua: semua + lulus/muktamad
 *  pk     — Penolong Kanan: urus JK & lantik dalam bidangnya (atau semua jika tiada bidang ditetapkan)
 *  guru   — Tugas Saya sahaja
 */
export type Tindakan =
  | 'lihat_pengurusan' | 'urus_guru' | 'urus_tetapan' | 'surat' | 'eksport'
  | 'urus_jk' | 'lantik' | 'hantar_semakan' | 'lulus' | 'tugas_luar' | 'log'

export function boleh(p: Peranan, t: Tindakan, bidangId?: string | null, bidangSaya?: string | null): boolean {
  if (p === 'admin' || p === 'gb') return true
  if (p === 'pk') {
    if (t === 'urus_jk' || t === 'lantik') return !bidangSaya || !bidangId || bidangSaya === bidangId
    return ['lihat_pengurusan', 'eksport', 'hantar_semakan', 'log'].includes(t)
  }
  return false
}

export const LABEL_PERANAN: Record<Peranan, string> = { admin: 'Admin', gb: 'GB / Pengetua', pk: 'PK', guru: 'Guru' }
