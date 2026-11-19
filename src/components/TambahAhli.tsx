import { useMemo, useState } from 'react'
import { ArrowRight, Check, Search, Sparkles, Users } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { kiraSatu } from '../lib/indeks'
import { kepakaranSepadan } from '../lib/sejarah'
import { Avatar, CipStatus, Modal, f2 } from './ui'

/**
 * Tambah beberapa ahli sekaligus ke JK — slot baharu dicipta untuk setiap guru dipilih.
 * Indeks "selepas" dikira untuk SEMUA yang ditanda (kumulatif bagi setiap guru).
 */
export function TambahAhli({ jkId, tutup }: { jkId: string; tutup: () => void }) {
  const { k, ubah } = useAplikasi()
  const [cari, setCari] = useState('')
  const [pilih, setPilih] = useState<string[]>([])
  const [perananId, setPerananId] = useState<string>(() => k?.data.peranan.find((p) => p.nama === 'AJK')?.id ?? k?.data.peranan[0]?.id ?? '')
  const [sibuk, setSibuk] = useState(false)
  const [label, setLabel] = useState('')

  const jk = k?.data.jawatankuasa.find((j) => j.id === jkId)
  const skorSatu = useMemo(() => {
    if (!k || !jk) return 0
    const t = k.data.tahap.find((x) => x.id === jk.tahap_id)?.faktor ?? 0
    const tp = k.data.tempoh.find((x) => x.id === jk.tempoh_id)?.faktor ?? 0
    const b = k.data.peranan.find((x) => x.id === perananId)?.berat ?? 0
    return t * b * tp
  }, [k, jk, perananId])

  const calon = useMemo(() => {
    if (!k || !jk) return []
    const ahli = new Set(k.data.slot.filter((s) => s.jawatankuasa_id === jkId).map((s) => k.pemegangSlot.get(s.id)).filter(Boolean))
    const baris = new Map(k.baris.map((b) => [b.id, b]))
    return k.data.guru
      .filter((g) => g.status === 'aktif' && baris.has(g.id) && !ahli.has(g.id))
      .map((g) => {
        const b = baris.get(g.id)!
        const kini = k.hasil.get(g.id)!
        const lepas = kiraSatu({ ...b, skor: b.skor + skorSatu }, k.data.tetapan, k.ringkasan)
        return { g, kini, lepas, pakar: kepakaranSepadan(g.kepakaran, jk.nama) }
      })
      .sort((a, b) => (a.g.dikecualikan ? 1 : 0) - (b.g.dikecualikan ? 1 : 0) || (a.pakar ? -0.25 : 0) + a.lepas.indeks - ((b.pakar ? -0.25 : 0) + b.lepas.indeks))
  }, [k, jk, jkId, skorSatu])

  if (!k || !jk) return null
  const t = k.data.tetapan
  const tog = (id: string) => setPilih((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const simpan = async () => {
    setSibuk(true)
    try { await ubah((s) => s.tambahAhli(jkId, perananId, pilih, label.trim() || null)); tutup() } finally { setSibuk(false) }
  }
  const tersaring = calon.filter((c) => !cari || c.g.nama.toLowerCase().includes(cari.toLowerCase()))

  return (
    <Modal buka tutup={tutup} lebar="max-w-3xl" tajuk={<span className="flex items-center gap-2"><Users size={20} className="text-brand-600" />Tambah ahli · <span className="text-brand-600">{jk.nama}</span></span>}
      sub="Tanda seberapa ramai guru. Jawatan baharu dicipta automatik untuk setiap seorang.">
      <div className="grid sm:grid-cols-2 gap-3 mb-3 rounded-2xl bg-navy-50/70 p-3">
        <div>
          <label className="label">1. Lantik sebagai</label>
          <select className="input" value={perananId} onChange={(e) => setPerananId(e.target.value)}>
            {k.data.peranan.map((p) => <option key={p.id} value={p.id}>{p.nama} (×{p.berat})</option>)}
          </select>
        </div>
        <div>
          <label className="label">2. Keterangan / acara (pilihan)</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="cth. Pidato BM (Ketua), Rumah Biru" />
        </div>
      </div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input autoFocus className="input pl-9" placeholder="3. Cari & tanda guru…" value={cari} onChange={(e) => setCari(e.target.value)} />
      </div>
      <p className="text-xs text-navy-500 mb-3 flex items-center gap-1.5"><Sparkles size={13} className="text-emas-500" /> Paling ringan di atas · kepakaran sepadan diutamakan · setiap jawatan = {skorSatu.toFixed(1)} mata</p>
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {tersaring.map((c) => {
          const on = pilih.includes(c.g.id)
          return (
            <button key={c.g.id} onClick={() => tog(c.g.id)} className={`w-full text-left flex items-center gap-3 rounded-2xl border p-2.5 transition ${on ? 'border-brand-400 bg-brand-50' : 'border-navy-100 hover:bg-navy-50/50'}`}>
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${on ? 'bg-brand-500 border-brand-500 text-white' : 'border-navy-300'}`}>{on && <Check size={13} strokeWidth={3} />}</div>
              <Avatar nama={c.g.nama} kecil />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm truncate">{c.g.nama}</span>
                  <CipStatus s={c.kini.status} />
                  {c.pakar && <span className="cip bg-violet-100 text-violet-700">Kepakaran: {c.pakar}</span>}
                </div>
              </div>
              <span className="text-xs font-mono font-semibold whitespace-nowrap flex items-center gap-1">{f2(c.kini.indeks)} <ArrowRight size={12} className="text-navy-400" />
                <span className={c.lepas.indeks > t.ambang_tinggi ? 'text-rose-600' : 'text-brand-700'}>{f2(c.lepas.indeks)}</span></span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy-100">
        <span className="text-sm text-navy-500">{pilih.length} guru dipilih</span>
        <div className="flex gap-2"><button onClick={tutup} className="btn-hantu">Batal</button>
          <button disabled={!pilih.length || sibuk} onClick={simpan} className="btn-utama"><Users size={16} /> Lantik {pilih.length} guru</button></div>
      </div>
    </Modal>
  )
}
