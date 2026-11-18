import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight, Info, MessageSquareReply, Send } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, Kosong } from '../components/ui'
import { KATEGORI, kiraAmaran, type TahapAmaran } from '../lib/amaran'
import { boleh } from '../lib/kuasa'

const GAYA: Record<TahapAmaran, { kepala: string; ikon: typeof Info; label: string; warna: string }> = {
  tinggi: { kepala: 'bg-rose-50 text-rose-700', ikon: AlertOctagon, label: 'Kritikal', warna: 'text-rose-600' },
  sederhana: { kepala: 'bg-amber-50 text-amber-800', ikon: AlertTriangle, label: 'Perlu perhatian', warna: 'text-amber-600' },
  info: { kepala: 'bg-sky-50 text-sky-700', ikon: Info, label: 'Makluman', warna: 'text-sky-600' },
}
const SUSUN: TahapAmaran[] = ['tinggi', 'sederhana', 'info']
const HAD = 6

export default function Amaran() {
  const { k } = useAplikasi()
  const [tahap, setTahap] = useState<TahapAmaran | null>(null)
  const [buka, setBuka] = useState<Set<string>>(new Set())
  const semua = useMemo(() => (k ? kiraAmaran(k) : []), [k])
  if (!k) return null
  const bilTahap = (t: TahapAmaran) => semua.filter((a) => a.tahap === t).length
  // Kumpul ikut kategori, kritikal dahulu
  const kumpulan = Object.entries(KATEGORI)
    .map(([kod, v]) => ({ kod, ...v, item: semua.filter((a) => a.kod === kod) }))
    .filter((x) => x.item.length && (!tahap || x.tahap === tahap))
    .sort((a, b) => SUSUN.indexOf(a.tahap) - SUSUN.indexOf(b.tahap))

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Amaran" sub="Semakan automatik setiap kali agihan berubah. Klik baris untuk terus ke tempatnya." />
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setTahap(null)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${!tahap ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200'}`}>Semua <span className="opacity-60">{semua.length}</span></button>
        {SUSUN.map((t) => { const G = GAYA[t]; return (
          <button key={t} onClick={() => setTahap(t)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold flex items-center gap-1.5 ${tahap === t ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200'}`}>
            <G.ikon size={14} className={tahap === t ? '' : G.warna} />{G.label} <span className="opacity-60">{bilTahap(t)}</span>
          </button>) })}
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-3">
          {kumpulan.length === 0 && <div className="kad"><Kosong ikon={<CheckCircle2 />} tajuk="Tiada amaran" teks="Agihan nampak sihat." /></div>}
          {kumpulan.map((x) => {
            const G = GAYA[x.tahap]
            const semuaBuka = buka.has(x.kod)
            const item = semuaBuka ? x.item : x.item.slice(0, HAD)
            return (
              <div key={x.kod} className="kad overflow-hidden">
                <div className={`flex items-center gap-2 px-4 py-2.5 ${G.kepala}`}>
                  <G.ikon size={16} />
                  <span className="font-bold text-sm">{x.label}</span>
                  <span className="cip bg-white/70">{x.item.length}</span>
                  <span className="ml-auto text-[11px] font-semibold opacity-80">{G.label}</span>
                </div>
                <div className="divide-y divide-navy-50">
                  {item.map((a, i) => {
                    const ke = a.kod === 'A05' || a.kod === 'A04' ? `/app/jawatankuasa?jk=${a.jkId}` : a.guruId ? `/app/analisis?guru=${a.guruId}` : '/app/jawatankuasa'
                    return (
                      <Link to={ke} key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-navy-50/60 group">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm">{a.tajuk}</span>
                          <span className="text-sm text-navy-500"> — {a.butiran}</span>
                        </div>
                        <ChevronRight size={15} className="shrink-0 text-navy-300 group-hover:text-navy-600" />
                      </Link>
                    )
                  })}
                </div>
                {x.item.length > HAD && (
                  <button onClick={() => setBuka((s) => { const n = new Set(s); if (n.has(x.kod)) n.delete(x.kod); else n.add(x.kod); return n })}
                    className="w-full px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-navy-50 border-t border-navy-100">
                    {semuaBuka ? 'Tunjuk sedikit' : `Tunjuk semua ${x.item.length}`}
                  </button>
                )}
              </div>
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
