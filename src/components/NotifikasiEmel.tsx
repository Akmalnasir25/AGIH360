import { useEffect, useState } from 'react'
import { AlertTriangle, Mail, Send } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { supabase } from '../lib/supabase'
import { Modal } from './ui'

interface Hasil { akan_dihantar: number; tanpa_emel: string[]; brevo_sedia: boolean; dihantar?: number; gagal?: number }

/**
 * Notifikasi lantikan melalui e-mel (Edge Function "hantar-notifikasi" + Brevo).
 * Sentiasa cuba (dry-run) dahulu; penghantaran sebenar perlu taip "HANTAR".
 */
export function NotifikasiEmel({ tutup }: { tutup: () => void }) {
  const { k, stor } = useAplikasi()
  const [hasil, setHasil] = useState<Hasil | null>(null)
  const [ralat, setRalat] = useState<string | null>(null)
  const [sah, setSah] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const live = stor?.mod === 'live'

  const panggil = async (cuba: boolean) => {
    if (!supabase || !k) return
    setSibuk(true); setRalat(null)
    const { data, error } = await supabase.functions.invoke('hantar-notifikasi', { body: { school_id: k.data.sekolah.id, cuba } })
    setSibuk(false)
    if (error) setRalat('Fungsi e-mel belum dipasang pada pelayan. (Edge Function "hantar-notifikasi")')
    else setHasil(data as Hasil)
  }
  useEffect(() => { if (live) void panggil(true) }, [live]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!k) return null
  const ada = k.data.guru.filter((g) => (k.lantikanGuru.get(g.id) ?? []).length > 0)
  const tanpa = ada.filter((g) => !g.emel)

  return (
    <Modal buka tutup={tutup} tajuk={<span className="flex items-center gap-2"><Mail size={20} /> E-mel notifikasi lantikan</span>} lebar="max-w-lg"
      sub="Setiap guru menerima senarai tugasnya dan pautan untuk memuat turun surat di Tugas Saya.">
      {!live ? (
        <div className="space-y-3 text-sm">
          <p><b>{ada.length - tanpa.length}</b> guru akan menerima e-mel. {tanpa.length > 0 && <span className="text-amber-700">{tanpa.length} tiada e-mel: {tanpa.map((g) => g.nama).join(', ')}.</span>}</p>
          <div className="rounded-xl bg-emas-400/10 border border-emas-400/30 p-3 text-xs">Mod demo — tiada e-mel sebenar dihantar.</div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {sibuk && !hasil && <p>Menyemak…</p>}
          {ralat && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 flex gap-2"><AlertTriangle size={16} />{ralat}</div>}
          {hasil && (
            <>
              <p><b>{hasil.akan_dihantar}</b> guru akan menerima e-mel.{hasil.tanpa_emel.length > 0 && <span className="text-amber-700"> {hasil.tanpa_emel.length} tiada e-mel.</span>}</p>
              {hasil.dihantar !== undefined && <div className="rounded-xl bg-brand-50 border border-brand-200 p-3">Dihantar: <b>{hasil.dihantar}</b>{hasil.gagal ? ` · gagal ${hasil.gagal}` : ''}</div>}
              {!hasil.brevo_sedia ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">Penghantar e-mel (Brevo) belum dikonfigurasi pada pelayan. Hubungi pentadbir sistem.</div>
              ) : hasil.dihantar === undefined && (
                <div>
                  <label className="label">Taip HANTAR untuk mengesahkan</label>
                  <div className="flex gap-2"><input className="input" value={sah} onChange={(e) => setSah(e.target.value)} />
                    <button disabled={sah !== 'HANTAR' || sibuk} onClick={() => panggil(false)} className="btn-utama"><Send size={15} /> Hantar</button></div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <div className="flex justify-end mt-5"><button onClick={tutup} className="btn-hantu">Tutup</button></div>
    </Modal>
  )
}
