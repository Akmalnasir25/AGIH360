import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, FileText, LayoutTemplate, Loader2, Palette, Printer, Save, ScrollText } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { BukuPratonton, Kulit, Pemisah, binaBahagian } from '../components/BukuPratonton'
import { KandunganPengenalan } from './Pengenalan'
import { senaraiGuruBuku } from '../lib/buku'
import { binaCarta, keWordBuku, kumpul } from '../lib/eksport'
import { GAYA_ISI, GAYA_KULIT, GAYA_PEMISAH, PALET, bacaReka, hex, paletIkut, type RekaBuku } from '../lib/tema'

type Tab = 'kandungan' | 'reka' | 'pratonton'

export default function BukuPengurusan() {
  const { k, ubah } = useAplikasi()
  const [qs, setQs] = useSearchParams()
  const tab = (qs.get('tab') as Tab) || 'kandungan'
  const setTab = (t: Tab) => { qs.set('tab', t); setQs(qs, { replace: true }) }
  const tersimpan = useMemo(() => bacaReka(k?.data.sekolah.reka_buku), [k])
  const [reka, setReka] = useState<RekaBuku | null>(null)
  const r = reka ?? tersimpan
  const berubah = reka !== null && JSON.stringify(reka) !== JSON.stringify(tersimpan)
  const [sibuk, setSibuk] = useState<string | null>(null)
  const data = useMemo(() => (k ? kumpul(k, {}, { tunjukKosong: false, gabungPeranan: true }) : []), [k])
  if (!k) return null
  const d = k.data
  const seksyen = [...d.buku].sort((a, b) => a.susunan - b.susunan)

  const simpanReka = async () => {
    setSibuk('simpan')
    try { await ubah((s) => s.simpanRekaBuku(r)); setReka(null) } finally { setSibuk(null) }
  }
  const word = async () => {
    setSibuk('word')
    try { await keWordBuku(d.sekolah, data, binaCarta(k, data), seksyen, r, r.senaraiGuru !== false ? senaraiGuruBuku(d) : []) } finally { setSibuk(null) }
  }

  const TABS: [Tab, string, typeof Palette][] = [['kandungan', 'Kandungan', ScrollText], ['reka', 'Reka Bentuk', Palette], ['pratonton', 'Pratonton & Muat Turun', Printer]]
  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Buku Pengurusan" sub="Isi Bab Pengenalan, pilih reka bentuk, kemudian cetak atau muat turun. Senarai JK diambil terus daripada agihan semasa."
        tindakan={tab === 'pratonton' ? <>
          <button onClick={word} disabled={!!sibuk} className="btn-garis">{sibuk === 'word' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Word (.docx)</button>
          <button onClick={() => window.print()} className="btn-utama"><Printer size={16} /> Cetak / PDF</button>
        </> : undefined} />

      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-navy-50 p-1 text-sm font-semibold">
          {TABS.map(([v, l, I]) => <button key={v} onClick={() => setTab(v)} className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${tab === v ? 'bg-white shadow-card text-navy-900' : 'text-navy-500'}`}><I size={15} />{l}</button>)}
        </div>
        {berubah && <div className="ml-auto flex items-center gap-2 text-sm"><span className="text-amber-700 font-semibold">Reka bentuk belum disimpan</span>
          <button onClick={() => setReka(null)} className="btn-hantu py-1.5">Batal</button>
          <button onClick={simpanReka} disabled={!!sibuk} className="btn-utama py-1.5"><Save size={15} /> Simpan reka bentuk</button></div>}
      </div>

      {tab === 'kandungan' && <KandunganPengenalan />}
      {tab === 'reka' && <PilihReka r={r} set={setReka} />}
      {tab === 'pratonton' && (
        <div className="mx-auto max-w-[820px] print:max-w-none">
          <p className="no-print text-xs text-navy-500 mb-3">PDF: tekan <b>Cetak / PDF</b> → pilih "Save as PDF", saiz A4, aktifkan "Background graphics".</p>
          <BukuPratonton k={k} data={data} reka={r} />
        </div>
      )}
    </div>
  )
}

/** Panel pilihan reka bentuk dengan lakaran mini sebenar. */
function PilihReka({ r, set }: { r: RekaBuku; set: (r: RekaBuku) => void }) {
  const { k } = useAplikasi()
  if (!k) return null
  const s = k.data.sekolah
  const p = paletIkut(r.palet)
  const seksyen = [...k.data.buku].sort((a, b) => a.susunan - b.susunan)
  const bhg = binaBahagian(seksyen, kumpul(k, {}, { tunjukKosong: false, gabungPeranan: true }), p, r.senaraiGuru !== false)
  const contohBhg = bhg[1] ?? bhg[0]
  return (
    <div className="space-y-6">
      <Kumpulan tajuk="Palet warna" ikon={<Palette size={16} />} sub="Setiap bahagian mendapat warna tersendiri daripada palet.">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {PALET.map((x) => (
            <button key={x.id} onClick={() => set({ ...r, palet: x.id })} className={`rounded-2xl border-2 p-3 text-left transition ${r.palet === x.id ? 'border-brand-500 bg-brand-50' : 'border-navy-100 hover:border-navy-300'}`}>
              <div className="flex h-10 rounded-lg overflow-hidden"><div className="w-1/3" style={{ background: hex(x.utama) }} />{x.bahagian.slice(0, 4).map((c) => <div key={c} className="flex-1" style={{ background: hex(c) }} />)}</div>
              <div className="mt-2 text-sm font-bold flex items-center gap-1.5">{r.palet === x.id && <Check size={14} className="text-brand-600" />}{x.nama}</div>
            </button>
          ))}
        </div>
      </Kumpulan>

      <Kumpulan tajuk="Gaya kulit depan" ikon={<LayoutTemplate size={16} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GAYA_KULIT.map((g) => (
            <Pilihan key={g.id} on={r.kulit === g.id} nama={g.nama} sub={g.sub} onClick={() => set({ ...r, kulit: g.id })}>
              <Mini><Kulit s={s} p={p} reka={{ ...r, kulit: g.id }} bhg={bhg} /></Mini>
            </Pilihan>
          ))}
        </div>
      </Kumpulan>

      <Kumpulan tajuk="Gaya halaman pemisah bahagian" ikon={<LayoutTemplate size={16} />}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GAYA_PEMISAH.map((g) => (
            <Pilihan key={g.id} on={r.pemisah === g.id} nama={g.nama} sub={g.sub} onClick={() => set({ ...r, pemisah: g.id })}>
              {contohBhg && <Mini><Pemisah s={s} p={p} gaya={g.id} b={contohBhg} no={2} /></Mini>}
            </Pilihan>
          ))}
        </div>
      </Kumpulan>

      <Kumpulan tajuk="Susun atur senarai jawatankuasa" ikon={<LayoutTemplate size={16} />}>
        <div className="grid sm:grid-cols-3 gap-4">
          {GAYA_ISI.map((g) => (
            <Pilihan key={g.id} on={r.isi === g.id} nama={g.nama} sub={g.sub} onClick={() => set({ ...r, isi: g.id })}>
              <ContohIsi gaya={g.id} w={hex(p.bahagian[1] ?? p.aksen)} utama={hex(p.utama)} lembut={hex(p.lembut)} />
            </Pilihan>
          ))}
        </div>
      </Kumpulan>

      <Kumpulan tajuk="Senarai guru & staf" ikon={<ScrollText size={16} />} sub="Dijana terus daripada halaman Guru: nama, gred, jawatan, opsyen/subjek dan no. telefon — diasing ikut sesi & staf sokongan.">
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={r.senaraiGuru !== false} onChange={(e) => set({ ...r, senaraiGuru: e.target.checked })} /> Sertakan dalam Bahagian A</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand-500 h-4 w-4" disabled={r.senaraiGuru === false} checked={r.telefon !== false} onChange={(e) => set({ ...r, telefon: e.target.checked })} /> Papar no. telefon</label>
        </div>
      </Kumpulan>

      <Kumpulan tajuk="Teks kulit" ikon={<ScrollText size={16} />}>
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
          <div><label className="label">Moto sekolah</label><input className="input" value={r.moto ?? ''} onChange={(e) => set({ ...r, moto: e.target.value })} placeholder="cth. Usaha Kunci Kejayaan" /></div>
          <div><label className="label">Slogan (kulit belakang)</label><input className="input" value={r.slogan ?? ''} onChange={(e) => set({ ...r, slogan: e.target.value })} placeholder="cth. Bergerak Seiring Mampu Bersaing" /></div>
        </div>
      </Kumpulan>
    </div>
  )
}

function Kumpulan({ tajuk, sub, ikon, children }: { tajuk: string; sub?: string; ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="kad p-5">
      <div className="font-bold flex items-center gap-2">{ikon}{tajuk}</div>
      {sub && <div className="text-xs text-navy-500 mt-0.5">{sub}</div>}
      <div className="mt-4">{children}</div>
    </div>
  )
}
function Pilihan({ on, nama, sub, onClick, children }: { on: boolean; nama: string; sub: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border-2 p-2.5 text-left transition ${on ? 'border-brand-500 bg-brand-50 shadow-card' : 'border-navy-100 hover:border-navy-300'}`}>
      {children}
      <div className="mt-2 px-1 text-sm font-bold flex items-center gap-1.5">{on && <Check size={14} className="text-brand-600" />}{nama}</div>
      <div className="px-1 text-[11px] text-navy-500">{sub}</div>
    </button>
  )
}
/** Lakaran mini: komponen A4 sebenar (lebar 794px) dikecilkan. */
function Mini({ children }: { children: React.ReactNode }) {
  const luar = useRef<HTMLDivElement>(null)
  const [skala, setSkala] = useState(0.25)
  useEffect(() => {
    const el = luar.current
    if (!el) return
    const kemas = () => setSkala(el.clientWidth / 794)
    kemas()
    const ro = new ResizeObserver(kemas); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={luar} className="relative w-full aspect-[210/297] overflow-hidden rounded-lg border border-navy-100 bg-white pointer-events-none">
      <div className="absolute left-0 top-0 origin-top-left w-[794px] font-[Arial,sans-serif]" style={{ transform: `scale(${skala})` }}>{children}</div>
    </div>
  )
}
function ContohIsi({ gaya, w, utama, lembut }: { gaya: RekaBuku['isi']; w: string; utama: string; lembut: string }) {
  const baris = [['Pengerusi', 'Guru Besar'], ['Setiausaha', 'Pn. Aminah'], ['AJK', '1. En. Ali  2. Pn. Siti']]
  if (gaya === 'jadual') return (
    <div className="rounded-lg border border-navy-100 bg-white p-3 h-36 text-[9px]">
      <div className="font-bold mb-1" style={{ color: w }}>B1 PANITIA SAINS</div>
      <table className="w-full border-collapse"><thead><tr style={{ background: w }}><th className="border text-white px-1 text-left">Jawatan</th><th className="border text-white px-1 text-left">Nama</th></tr></thead>
        <tbody>{baris.map(([a, b]) => <tr key={a}><td className="border px-1 font-semibold">{a}</td><td className="border px-1">{b}</td></tr>)}</tbody></table>
    </div>
  )
  if (gaya === 'senarai') return (
    <div className="rounded-lg border border-navy-100 bg-white p-3 h-36 text-[9px]">
      {['B1 PANITIA SAINS', 'B2 PANITIA MATEMATIK'].map((t) => <div key={t} className="mb-2"><div className="font-bold border-b-2 mb-0.5" style={{ borderColor: w, color: utama }}>{t}</div>
        {baris.map(([a, b]) => <div key={a} className="flex gap-2"><span className="w-1/3 text-slate-500 font-semibold">{a}</span><span>{b}</span></div>)}</div>)}
    </div>
  )
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3 h-36 text-[9px]">
      <div className="rounded-md overflow-hidden border border-slate-200">
        <div className="px-2 py-1 font-bold" style={{ background: lembut, borderLeft: `4px solid ${w}`, color: utama }}>B1 Panitia Sains</div>
        {baris.map(([a, b]) => <div key={a} className="flex gap-2 px-2 py-0.5 border-t border-slate-100"><span className="w-1/3 font-semibold" style={{ color: utama }}>{a}</span><span>{b}</span></div>)}
      </div>
    </div>
  )
}
