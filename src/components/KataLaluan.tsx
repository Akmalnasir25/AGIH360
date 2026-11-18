import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { supabase } from '../lib/supabase'
import { Modal } from './ui'

const PERISTIWA = 'agih360:kata-laluan'
const KUNCI_LANGKAU = 'agih360.langkau-kata-laluan'

/** Buka tetingkap tukar kata laluan dari mana-mana komponen. */
export const bukaKataLaluan = () => window.dispatchEvent(new Event(PERISTIWA))

/**
 * Pengguna log masuk dengan kod e-mel (bukan DELIMa) yang belum ada kata laluan
 * diminta mencipta kata laluan sekali, supaya log masuk seterusnya guna e-mel + kata laluan.
 */
export function KataLaluanGlobal() {
  const { sesi } = useAplikasi()
  const [buka, setBuka] = useState(false)
  const [paksa, setPaksa] = useState(false)  // dibuka oleh pengguna (tukar), bukan gesaan pertama
  const [tukar, setTukar] = useState(false)  // tajuk ditetapkan semasa dibuka (tidak berubah selepas simpan)
  const [k1, setK1] = useState('')
  const [k2, setK2] = useState('')
  const [ralat, setRalat] = useState<string | null>(null)
  const [siap, setSiap] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  const pengguna = sesi?.user
  const emelSahaja = pengguna && (pengguna.app_metadata?.provider ?? 'email') === 'email'
  const adaKata = Boolean(pengguna?.user_metadata?.kata_laluan)

  useEffect(() => {
    if (!pengguna || !emelSahaja || adaKata) return
    let langkau = false
    try { langkau = sessionStorage.getItem(KUNCI_LANGKAU) === pengguna.id } catch { /* abaikan */ }
    if (!langkau) { setPaksa(false); setTukar(false); setBuka(true) }
  }, [pengguna, emelSahaja, adaKata])

  useEffect(() => {
    const f = () => { setPaksa(true); setSiap(false); setTukar(true); setBuka(true) }
    window.addEventListener(PERISTIWA, f)
    return () => window.removeEventListener(PERISTIWA, f)
  }, [])

  if (!buka || !pengguna || !supabase) return null

  const tutup = () => {
    if (!paksa && !siap) { try { sessionStorage.setItem(KUNCI_LANGKAU, pengguna.id) } catch { /* abaikan */ } }
    setBuka(false); setK1(''); setK2(''); setRalat(null)
  }
  const simpan = async () => {
    setRalat(null)
    if (k1.length < 8) return setRalat('Sekurang-kurangnya 8 aksara.')
    if (!/[A-Za-z]/.test(k1) || !/\d/.test(k1)) return setRalat('Gabungkan huruf dan nombor.')
    if (k1 !== k2) return setRalat('Kata laluan tidak sepadan.')
    setSibuk(true)
    const { error } = await supabase!.auth.updateUser({ password: k1, data: { kata_laluan: true } })
    setSibuk(false)
    if (error) return setRalat(/same|different/i.test(error.message) ? 'Kata laluan baharu mesti berbeza daripada yang lama.' : error.message)
    setSiap(true)
  }

  return (
    <Modal buka tutup={tutup} lebar="max-w-md"
      tajuk={<span className="flex items-center gap-2"><KeyRound size={20} className="text-brand-600" />{tukar ? 'Tukar kata laluan' : 'Cipta kata laluan'}</span>}
      sub={tukar ? undefined : 'Supaya log masuk seterusnya cukup dengan e-mel dan kata laluan — tanpa menunggu kod.'}>
      {siap ? (
        <div className="text-center py-4">
          <ShieldCheck className="mx-auto text-brand-600" size={40} />
          <p className="mt-3 font-semibold">Kata laluan disimpan.</p>
          <p className="text-sm text-navy-500 mt-1">Log masuk seterusnya: <b>{pengguna.email}</b> + kata laluan ini.</p>
          <button onClick={tutup} className="btn-utama mt-5">Teruskan</button>
        </div>
      ) : (
        <div className="space-y-3">
          <input type="email" autoComplete="username" value={pengguna.email ?? ''} readOnly className="hidden" />
          <div><label className="label">Kata laluan baharu</label><input autoFocus type="password" autoComplete="new-password" className="input" value={k1} onChange={(e) => setK1(e.target.value)} /></div>
          <div><label className="label">Ulang kata laluan</label><input type="password" autoComplete="new-password" className="input" value={k2} onChange={(e) => setK2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && simpan()} /></div>
          <p className="text-[11px] text-navy-500">Minimum 8 aksara, gabungan huruf dan nombor. Lupa nanti? Log masuk semula dengan kod e-mel.</p>
          {ralat && <div className="text-sm text-rose-600">{ralat}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={tutup} className="btn-hantu">{tukar ? 'Batal' : 'Nanti'}</button>
            <button disabled={sibuk || !k1 || !k2} onClick={simpan} className="btn-utama">Simpan</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
