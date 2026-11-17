import { useState } from 'react'
import { ArrowLeftRight, Archive, History, ShieldCheck, UserMinus, UserPlus, UserCog } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { BarStatus } from '../components/BarStatus'

const IKON: Record<string, typeof History> = { lantik: UserPlus, gugur: UserMinus, tukar: ArrowLeftRight, status: ShieldCheck, arkib: Archive, peranan: UserCog }
const WARNA: Record<string, string> = { lantik: 'bg-brand-100 text-brand-700', gugur: 'bg-rose-100 text-rose-700', tukar: 'bg-amber-100 text-amber-700', status: 'bg-navy-900 text-white', arkib: 'bg-navy-100 text-navy-600', peranan: 'bg-violet-100 text-violet-700' }

export default function Kelulusan() {
  const { k } = useAplikasi()
  const [tapis, setTapis] = useState<string | null>(null)
  if (!k) return null
  const log = k.data.log.filter((l) => !tapis || l.tindakan === tapis)
  return (
    <div className="animate-naik max-w-4xl">
      <TajukHalaman tajuk="Kelulusan & Log Aktiviti" sub="Draf → Semakan PK → Lulus GB/Pengetua → Muktamad. Setiap lantikan direkod: siapa, bila, apa." />
      <BarStatus />
      <div className="kad p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2"><History size={18} /> Log aktiviti</h3>
          <div className="flex gap-1 text-xs">
            {[null, 'lantik', 'gugur', 'tukar', 'status', 'arkib'].map((t) => (
              <button key={t ?? 'semua'} onClick={() => setTapis(t)} className={`rounded-full px-2.5 py-1 font-semibold capitalize ${tapis === t ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-600'}`}>{t ?? 'semua'}</button>
            ))}
          </div>
        </div>
        <ol className="relative border-l-2 border-navy-100 ml-3 space-y-4">
          {log.map((l) => {
            const I = IKON[l.tindakan] ?? History
            return (
              <li key={l.id} className="ml-5">
                <span className={`absolute -left-[13px] h-6 w-6 rounded-full flex items-center justify-center ${WARNA[l.tindakan] ?? 'bg-navy-100'}`}><I size={12} /></span>
                <div className="text-sm"><span className="font-semibold capitalize">{l.tindakan}</span> · {l.butiran}</div>
                <div className="text-[11px] text-navy-400">{new Date(l.masa).toLocaleString('ms-MY')} · {l.pengguna}</div>
              </li>
            )
          })}
          {log.length === 0 && <li className="ml-5 text-sm text-navy-400">Tiada rekod.</li>}
        </ol>
      </div>
    </div>
  )
}
