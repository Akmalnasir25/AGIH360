import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, MessageSquareReply, Send } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, Kosong } from '../components/ui'
import { KATEGORI, kiraAmaran, type TahapAmaran } from '../lib/amaran'
import { boleh } from '../lib/kuasa'

const GAYA: Record<TahapAmaran, { kad: string; ikon: typeof Info; label: string }> = {
  tinggi: { kad: 'border-rose-200 bg-rose-50/60', ikon: AlertOctagon, label: 'Kritikal' },
  sederhana: { kad: 'border-amber-200 bg-amber-50/60', ikon: AlertTriangle, label: 'Perlu perhatian' },
  info: { kad: 'border-sky-200 bg-sky-50/50', ikon: Info, label: 'Makluman' },
}

export default function Amaran() {
  const { k } = useAplikasi()
  const [kod, setKod] = useState<string | null>(null)
  const semua = useMemo(() => (k ? kiraAmaran(k) : []), [k])
  if (!k) return null
  const kiraan = new Map<string, number>()
  for (const a of semua) kiraan.set(a.kod, (kiraan.get(a.kod) ?? 0) + 1)
  const papar = semua.filter((a) => !kod || a.kod === kod)

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Amaran" sub="Semakan automatik setiap kali agihan berubah. Klik amaran untuk terus ke tempatnya." />
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setKod(null)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!kod ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200'}`}>Semua ({semua.length})</button>
        {Object.entries(KATEGORI).filter(([c]) => kiraan.get(c)).map(([c, v]) => (
          <button key={c} onClick={() => setKod(c)} className={`rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 ${kod === c ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200'}`}>
            <span className={`h-2 w-2 rounded-full ${v.tahap === 'tinggi' ? 'bg-rose-500' : v.tahap === 'sederhana' ? 'bg-amber-500' : 'bg-sky-500'}`} />{v.label} <span className="opacity-60">{kiraan.get(c)}</span>
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_380px] gap-5">
        <div className="space-y-2">
          {papar.length === 0 && <div className="kad"><Kosong ikon={<CheckCircle2 />} tajuk="Tiada amaran" teks="Agihan nampak sihat." /></div>}
          {papar.map((a, i) => {
            const g = GAYA[a.tahap]
            const ke = a.kod === 'A05' || a.kod === 'A04' ? `/app/jawatankuasa?jk=${a.jkId}` : a.guruId ? `/app/analisis?guru=${a.guruId}` : '/app/jawatankuasa'
            return (
              <Link to={ke} key={i} className={`flex items-start gap-3 rounded-2xl border p-3.5 hover:shadow-card transition ${g.kad}`}>
                <g.ikon size={18} className={a.tahap === 'tinggi' ? 'text-rose-600' : a.tahap === 'sederhana' ? 'text-amber-600' : 'text-sky-600'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-[10px] text-navy-400">{a.kod}</span><span className="text-[11px] font-bold uppercase tracking-wide text-navy-500">{KATEGORI[a.kod].label}</span></div>
                  <div className="font-semibold">{a.tajuk}</div>
                  <div className="text-sm text-navy-600">{a.butiran}</div>
                </div>
              </Link>
            )
          })}
        </div>
        <MaklumBalas />
      </div>
    </div>
  )
}

function MaklumBalas() {
  const { k, ubah, peranan } = useAplikasi()
  const [balas, setBalas] = useState<Record<string, string>>({})
  if (!k) return null
  const senarai = k.data.maklumBalas.filter((m) => m.tahun === k.data.sekolah.tahun_semasa)
  const bolehBalas = boleh(peranan, 'lihat_pengurusan')
  return (
    <div className="kad p-4 h-fit xl:sticky xl:top-6">
      <h3 className="font-bold flex items-center gap-2"><MessageSquareReply size={18} /> Maklum balas guru</h3>
      <p className="text-xs text-navy-500 mb-3">Dihantar dari halaman "Tugas Saya".</p>
      {senarai.length === 0 && <p className="text-sm text-navy-400">Tiada maklum balas.</p>}
      <div className="space-y-3">
        {senarai.map((m) => {
          const g = k.data.guru.find((x) => x.id === m.guru_id)
          return (
            <div key={m.id} className={`rounded-2xl border p-3 ${m.status === 'baru' ? 'border-amber-200 bg-amber-50/40' : 'border-navy-100'}`}>
              <div className="flex items-center gap-2"><Avatar nama={g?.nama ?? '?'} kecil /><div className="text-sm font-semibold flex-1">{g?.nama}</div><span className={`cip ${m.status === 'baru' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-700'}`}>{m.status === 'baru' ? 'Baru' : 'Selesai'}</span></div>
              <p className="text-sm mt-2">{m.mesej}</p>
              <div className="text-[10px] text-navy-400 mt-1">{new Date(m.dicipta).toLocaleString('ms-MY')}</div>
              {m.balasan && <div className="mt-2 rounded-xl bg-brand-50 text-sm p-2"><b className="text-brand-700 text-xs">Balasan:</b> {m.balasan}</div>}
              {m.status === 'baru' && bolehBalas && (
                <div className="mt-2 flex gap-1.5">
                  <input className="input py-1.5 text-xs" placeholder="Balasan ringkas…" value={balas[m.id] ?? ''} onChange={(e) => setBalas({ ...balas, [m.id]: e.target.value })} />
                  <button onClick={() => ubah((s) => s.simpan('maklum_balas', { id: m.id, guru_id: m.guru_id, tahun: m.tahun, mesej: m.mesej, status: 'selesai', balasan: balas[m.id]?.trim() || 'Diambil perhatian.' }))} className="btn-utama py-1.5 text-xs"><Send size={13} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
