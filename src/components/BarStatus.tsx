import { useState } from 'react'
import { CheckCircle2, FileEdit, Lock, Send, ShieldCheck, Unlock } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { boleh } from '../lib/kuasa'
import type { StatusAgihan } from '../lib/types'
import { Modal } from './ui'

const LANGKAH: { s: StatusAgihan; label: string; ikon: typeof Send }[] = [
  { s: 'draf', label: 'Draf', ikon: FileEdit },
  { s: 'semakan', label: 'Semakan', ikon: Send },
  { s: 'lulus', label: 'Lulus', ikon: ShieldCheck },
  { s: 'muktamad', label: 'Muktamad', ikon: CheckCircle2 },
]

/** Aliran kelulusan agihan: Draf → Semakan (PK hantar) → Lulus (GB) → Muktamad (GB). Lulus/Muktamad mengunci lantikan. */
export function BarStatus() {
  const { k, peranan, ubah, simulasi } = useAplikasi()
  const [tindakan, setTindakan] = useState<{ ke: StatusAgihan; tajuk: string } | null>(null)
  const [catatan, setCatatan] = useState('')
  if (!k) return null
  const st = k.data.kelulusan.status
  const i = LANGKAH.findIndex((l) => l.s === st)
  const lulus = boleh(peranan, 'lulus')
  const pilihan: { ke: StatusAgihan; tajuk: string; kelas: string; ikon: typeof Send }[] = []
  if (st === 'draf' && boleh(peranan, 'hantar_semakan')) pilihan.push({ ke: 'semakan', tajuk: 'Hantar untuk semakan', kelas: 'btn-gelap', ikon: Send })
  if (st === 'semakan' && lulus) pilihan.push({ ke: 'lulus', tajuk: 'Luluskan', kelas: 'btn-utama', ikon: ShieldCheck }, { ke: 'draf', tajuk: 'Kembalikan ke draf', kelas: 'btn-garis', ikon: FileEdit })
  if (st === 'lulus' && lulus) pilihan.push({ ke: 'muktamad', tajuk: 'Muktamadkan', kelas: 'btn-utama', ikon: CheckCircle2 }, { ke: 'draf', tajuk: 'Buka semula', kelas: 'btn-garis', ikon: Unlock })
  if (st === 'muktamad' && lulus) pilihan.push({ ke: 'draf', tajuk: 'Buka semula (pindaan)', kelas: 'btn-garis', ikon: Unlock })

  return (
    <div className="kad p-3 mb-4 flex flex-col md:flex-row md:items-center gap-3 no-print">
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {LANGKAH.map((l, n) => (
          <div key={l.s} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${n < i ? 'bg-brand-100 text-brand-700' : n === i ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-400'}`}>
              <l.ikon size={13} />{l.label}
            </div>
            {n < LANGKAH.length - 1 && <div className={`h-0.5 w-5 ${n < i ? 'bg-brand-400' : 'bg-navy-100'}`} />}
          </div>
        ))}
        {(st === 'lulus' || st === 'muktamad') && <span className="ml-2 text-xs text-navy-500 flex items-center gap-1 whitespace-nowrap"><Lock size={12} /> Lantikan dikunci</span>}
        {k.data.kelulusan.catatan && <span className="ml-2 text-xs text-navy-500 italic truncate">“{k.data.kelulusan.catatan}”</span>}
      </div>
      {!simulasi && <div className="flex gap-2">{pilihan.map((p) => <button key={p.ke + p.tajuk} onClick={() => { setCatatan(''); setTindakan(p) }} className={`${p.kelas} py-1.5 text-xs`}><p.ikon size={14} />{p.tajuk}</button>)}</div>}
      {tindakan && (
        <Modal buka tutup={() => setTindakan(null)} tajuk={tindakan.tajuk} lebar="max-w-md"
          sub={tindakan.ke === 'lulus' || tindakan.ke === 'muktamad' ? 'Selepas ini lantikan dikunci sehingga dibuka semula.' : undefined}>
          <label className="label">Catatan (pilihan)</label>
          <textarea className="input" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="cth. Diluluskan dalam mesyuarat 12 Jan" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setTindakan(null)} className="btn-hantu">Batal</button>
            <button onClick={async () => { await ubah((s) => s.tukarStatus(tindakan.ke, catatan || undefined)); setTindakan(null) }} className="btn-utama">Sahkan</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
