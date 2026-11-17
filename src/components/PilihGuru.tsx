import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Search, Sparkles, UserMinus } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { pratonton } from '../lib/indeks'
import { kepakaranSepadan, tahunBerturut, PERANAN_UTAMA } from '../lib/sejarah'
import { Avatar, BarIndeks, CipStatus, Modal, f1, f2 } from './ui'

type Tapis = 'semua' | 'ruang' | 'seimbang' | 'terbeban'

export function PilihGuru({ slotId, tutup }: { slotId: string | null; tutup: () => void }) {
  const { k, ubah } = useAplikasi()
  const [cari, setCari] = useState('')
  const [tapis, setTapis] = useState<Tapis>('semua')
  const [sibuk, setSibuk] = useState<string | null>(null)

  const info = useMemo(() => {
    if (!k || !slotId) return null
    const d = k.data
    const slot = d.slot.find((s) => s.id === slotId)
    if (!slot) return null
    const jk = d.jawatankuasa.find((j) => j.id === slot.jawatankuasa_id)!
    const peranan = d.peranan.find((p) => p.id === slot.peranan_id)!
    const tahap = d.tahap.find((t) => t.id === jk.tahap_id)!
    const tempoh = d.tempoh.find((t) => t.id === jk.tempoh_id)!
    const pemegang = k.pemegangSlot.get(slotId) ?? null
    const ahliJK = new Set(d.slot.filter((s) => s.jawatankuasa_id === jk.id).map((s) => k.pemegangSlot.get(s.id)).filter(Boolean))
    return { slot, jk, peranan, tahap, tempoh, pemegang, skor: k.skorSlot.get(slotId) ?? 0, ahliJK }
  }, [k, slotId])

  const calon = useMemo(() => {
    if (!k || !info) return []
    const t = k.data.tetapan
    const gred = new Map(k.data.gred.map((g) => [g.id, g.kod]))
    return k.data.guru
      .filter((g) => g.status !== 'bertukar')
      .map((g) => {
        const kini = k.hasil.get(g.id)!
        const lepas = pratonton(k, g.id, info.slot.id)!
        const bil = (k.lantikanGuru.get(g.id) ?? []).length
        const amaran: string[] = []
        if (g.status === 'cuti') amaran.push('Sedang cuti')
        if (g.dikecualikan) amaran.push(g.tag ?? 'Dikecualikan')
        if (bil + 1 > t.had_jawatan && info.pemegang !== g.id) amaran.push(`Melebihi had ${t.had_jawatan} jawatan`)
        if (info.ahliJK.has(g.id) && info.pemegang !== g.id) amaran.push('Sudah dalam JK ini')
        if (kini.status !== 'terbeban' && lepas.indeks > t.ambang_tinggi) amaran.push('Akan jadi terbeban')
        if (PERANAN_UTAMA.test(info.peranan.nama)) {
          const n = tahunBerturut(k.data, g.id, info.peranan.nama, info.jk.nama, false)
          if (n >= 2) amaran.push(`Sudah ${n} tahun berturut pegang jawatan ini`)
        }
        const pakar = kepakaranSepadan(g.kepakaran, info.jk.nama)
        return { g, kini, lepas, bil, amaran, pakar, gred: g.gred_id ? gred.get(g.gred_id) : null }
      })
      .sort((a, b) => {
        const pa = a.g.status !== 'aktif' || a.g.dikecualikan ? 1 : 0
        const pb = b.g.status !== 'aktif' || b.g.dikecualikan ? 1 : 0
        return pa - pb || (a.lepas.indeks - (a.pakar ? 0.25 : 0)) - (b.lepas.indeks - (b.pakar ? 0.25 : 0))
      })
  }, [k, info])

  if (!k || !info) return null
  const t = k.data.tetapan
  const tersaring = calon.filter((c) => {
    if (cari && !c.g.nama.toLowerCase().includes(cari.toLowerCase())) return false
    if (tapis === 'ruang') return c.kini.status === 'kurang' || c.kini.status === 'tiada_tugas'
    if (tapis === 'seimbang') return c.kini.status === 'seimbang'
    if (tapis === 'terbeban') return c.kini.status === 'terbeban'
    return true
  })
  const pemegang = info.pemegang ? k.data.guru.find((g) => g.id === info.pemegang) : null

  const lantik = async (guruId: string) => {
    setSibuk(guruId)
    try { await ubah((s) => s.lantik(info.slot.id, guruId)); tutup() } finally { setSibuk(null) }
  }
  const kosongkan = async () => {
    setSibuk('x')
    try { await ubah((s) => s.batal(info.slot.id)); tutup() } finally { setSibuk(null) }
  }

  return (
    <Modal buka={!!slotId} tutup={tutup} lebar="max-w-3xl"
      tajuk={<span>{info.slot.label || info.peranan.nama} <span className="text-navy-400 font-medium">·</span> <span className="text-brand-600">{info.jk.nama}</span></span>}
      sub={
        <span className="inline-flex flex-wrap gap-1.5 mt-1">
          <span className="cip bg-navy-100 text-navy-700">{info.tahap.nama} ×{info.tahap.faktor}</span>
          <span className="cip bg-navy-100 text-navy-700">{info.peranan.nama} ×{info.peranan.berat}</span>
          <span className="cip bg-navy-100 text-navy-700">{info.tempoh.nama} ×{info.tempoh.faktor}</span>
          <span className="cip bg-emas-400/20 text-emas-600">= {f1(info.skor)} mata</span>
        </span>
      }>
      {pemegang && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-brand-50 border border-brand-200 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar nama={pemegang.nama} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Penyandang semasa</div>
              <div className="font-semibold truncate">{pemegang.nama}</div>
            </div>
          </div>
          <button disabled={!!sibuk} onClick={kosongkan} className="btn-garis text-rose-600"><UserMinus size={15} /> Kosongkan</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input autoFocus className="input pl-9" placeholder="Cari nama guru…" value={cari} onChange={(e) => setCari(e.target.value)} />
        </div>
        <div className="flex rounded-xl bg-navy-50 p-1 text-xs font-semibold">
          {([['semua', 'Semua'], ['ruang', 'Ada ruang'], ['seimbang', 'Seimbang'], ['terbeban', 'Terbeban']] as [Tapis, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setTapis(v)} className={`px-3 py-1.5 rounded-lg ${tapis === v ? 'bg-white shadow-card text-navy-900' : 'text-navy-500'}`}>{l}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-navy-500 mb-3 flex items-center gap-1.5">
        <Sparkles size={13} className="text-emas-500" /> Disusun ikut indeks <b>selepas dilantik</b>, paling ringan di atas; kepakaran sepadan diutamakan. Garis tegak = 1.00.
      </p>

      <div className="space-y-2">
        {tersaring.map((c, i) => {
          const disyor = i < 3 && !cari && tapis === 'semua' && c.amaran.length === 0
          const semasa = info.pemegang === c.g.id
          return (
            <div key={c.g.id} className={`group rounded-2xl border p-3 transition ${disyor ? 'border-brand-300 bg-brand-50/40' : 'border-navy-100 hover:border-navy-200 hover:bg-navy-50/40'}`}>
              <div className="flex items-center gap-3">
                <Avatar nama={c.g.nama} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{c.g.nama}</span>
                    {disyor && <span className="cip bg-brand-500 text-white"><Sparkles size={10} /> Disyorkan</span>}
                    {c.gred && <span className="cip bg-navy-100 text-navy-600">{c.gred}</span>}
                    {c.pakar && <span className="cip bg-violet-100 text-violet-700">Kepakaran: {c.pakar}</span>}
                    <CipStatus s={c.kini.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1"><BarIndeks nilai={c.kini.indeks} pratonton={c.lepas.indeks} rendah={t.ambang_rendah} tinggi={t.ambang_tinggi} /></div>
                    <div className="text-xs font-mono font-semibold whitespace-nowrap flex items-center gap-1">
                      {f2(c.kini.indeks)} <ArrowRight size={12} className="text-navy-400" />
                      <span className={c.lepas.indeks > t.ambang_tinggi ? 'text-rose-600' : 'text-brand-700'}>{f2(c.lepas.indeks)}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-navy-500">
                    <span>{c.g.masa_seminggu} masa/minggu{c.g.kelas_peperiksaan && ' · kelas peperiksaan'}</span>
                    <span>{c.bil} jawatan · {f1(c.kini.skor)} mata</span>
                    {c.amaran.map((a) => <span key={a} className="text-amber-700 font-semibold inline-flex items-center gap-1"><AlertTriangle size={11} />{a}</span>)}
                  </div>
                </div>
                <button disabled={!!sibuk || semasa} onClick={() => lantik(c.g.id)}
                  className={semasa ? 'btn bg-brand-100 text-brand-700' : disyor ? 'btn-utama' : 'btn-garis'}>
                  {semasa ? <><Check size={15} /> Dilantik</> : sibuk === c.g.id ? '…' : 'Lantik'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
