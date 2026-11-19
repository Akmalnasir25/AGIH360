import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, UserPlus, X } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { BarStatus } from '../components/BarStatus'
import { PilihGuru } from '../components/PilihGuru'
import { TambahAhli } from '../components/TambahAhli'
import { TITIK_STATUS, WARNA_BIDANG } from '../components/ui'
import { boleh } from '../lib/kuasa'
import { STATUS_KUNCI } from '../lib/stor'
import type { Jawatankuasa as JK } from '../lib/types'
import { BtnBidang, SuntingJK, SuntingSlot } from './Jawatankuasa'

/** Paparan menyeluruh: semua JK & AJK ikut bahagian — klik untuk ubah terus. */
export default function PaparanJK() {
  const { k, peranan, bidangSaya } = useAplikasi()
  const [bidang, setBidang] = useState('semua')
  const [cari, setCari] = useState('')
  const [kosong, setKosong] = useState(false)
  const [slotPilih, setSlotPilih] = useState<string | null>(null)
  const [slotSunting, setSlotSunting] = useState<string | null>(null)
  const [tambahJK, setTambahJK] = useState<string | null>(null)
  const [suntingJK, setSuntingJK] = useState<Partial<JK> | null>(null)

  const kumpulan = useMemo(() => {
    if (!k) return []
    const d = k.data
    const guru = new Map(d.guru.map((g) => [g.id, g]))
    const peranan = new Map(d.peranan.map((p) => [p.id, p.nama]))
    const q = cari.trim().toLowerCase()
    return [...d.bidang].sort((a, b) => a.susunan - b.susunan)
      .filter((b) => bidang === 'semua' || b.id === bidang)
      .map((b) => ({
        b,
        jk: d.jawatankuasa.filter((j) => j.bidang_id === b.id).sort((x, y) => x.susunan - y.susunan).map((j) => {
          const baris = d.slot.filter((s) => s.jawatankuasa_id === j.id).sort((x, y) => x.susunan - y.susunan).map((s) => {
            const g = guru.get(k.pemegangSlot.get(s.id) ?? '')
            return { s, label: s.label || peranan.get(s.peranan_id) || '', g, h: g ? k.hasil.get(g.id) : undefined }
          })
          return { j, baris, isi: baris.filter((x) => x.g).length }
        }).filter((x) => !kosong || x.isi < x.baris.length)
          .filter((x) => !q || x.j.nama.toLowerCase().includes(q) || x.baris.some((r) => r.g?.nama.toLowerCase().includes(q))),
      })).filter((x) => x.jk.length)
  }, [k, bidang, cari, kosong])

  if (!k) return null
  const d = k.data
  const terkunci = STATUS_KUNCI.includes(d.kelulusan.status)
  const bolehLantik = (bid: string) => !terkunci && boleh(peranan, 'lantik', bid, bidangSaya)
  const bolehUrus = (bid: string) => !terkunci && boleh(peranan, 'urus_jk', bid, bidangSaya)
  const q = cari.trim().toLowerCase()
  const jumlahJK = kumpulan.reduce((a, x) => a + x.jk.length, 0)

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Paparan JK" sub="Semua jawatankuasa & AJK dalam satu paparan. Klik nama untuk tukar guru, klik ruang kosong untuk mengisi." />
      <BarStatus />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <BtnBidang aktif={bidang === 'semua'} onClick={() => setBidang('semua')} label="Semua" />
          {[...d.bidang].sort((a, b) => a.susunan - b.susunan).map((b) => <BtnBidang key={b.id} aktif={bidang === b.id} onClick={() => setBidang(b.id)} label={b.nama} warna={b.warna} />)}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Cari JK atau nama guru…" value={cari} onChange={(e) => setCari(e.target.value)} />
            {cari && <button onClick={() => setCari('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400"><X size={14} /></button>}
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-navy-600 cursor-pointer"><input type="checkbox" className="accent-brand-500" checked={kosong} onChange={(e) => setKosong(e.target.checked)} /> Ada kosong sahaja</label>
          <span className="text-xs text-navy-400">{jumlahJK} JK</span>
        </div>
      </div>

      {kumpulan.length === 0 && <div className="kad p-10 text-center text-navy-400 text-sm">Tiada jawatankuasa sepadan.</div>}
      {kumpulan.map(({ b, jk }) => {
        const w = WARNA_BIDANG[b.warna] ?? WARNA_BIDANG.slate
        const lantik = bolehLantik(b.id), urus = bolehUrus(b.id)
        return (
          <section key={b.id} className="mb-8">
            <div className={`sticky top-0 z-10 -mx-1 px-1 py-2 mb-3 bg-slate-50/95 backdrop-blur flex items-center gap-2`}>
              <span className={`h-2.5 w-2.5 rounded-full ${w.titik}`} />
              <h2 className={`text-sm font-black uppercase tracking-wider ${w.teks}`}>{b.nama}</h2>
              <span className="text-xs text-navy-400">{jk.length} JK · {jk.reduce((a, x) => a + x.isi, 0)}/{jk.reduce((a, x) => a + x.baris.length, 0)} diisi</span>
            </div>
            <div className="columns-1 md:columns-2 2xl:columns-3 gap-4">
              {jk.map(({ j, baris, isi }) => (
                <div key={j.id} className="kad mb-4 break-inside-avoid overflow-hidden">
                  <div className={`flex items-start gap-2 px-3 py-2 border-b border-navy-100 ${w.bg}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] leading-snug">{j.nama}</div>
                      <div className="text-[10px] text-navy-500">{j.kod ? `${j.kod} · ` : ''}{isi}/{baris.length} diisi</div>
                    </div>
                    {lantik && <button title="Tambah ahli" onClick={() => setTambahJK(j.id)} className="p-1 rounded-md text-navy-400 hover:bg-white hover:text-navy-700"><Plus size={14} /></button>}
                    {urus && <button title="Sunting JK" onClick={() => setSuntingJK(j)} className="p-1 rounded-md text-navy-400 hover:bg-white hover:text-navy-700"><Pencil size={13} /></button>}
                  </div>
                  <div className="px-3 py-1.5">
                    {baris.map(({ s, label, g, h }) => {
                      const padan = q && g?.nama.toLowerCase().includes(q)
                      return (
                        <div key={s.id} className={`group flex items-start gap-2 py-[3px] text-[12px] ${padan ? 'bg-amber-100 -mx-1.5 px-1.5 rounded' : ''}`}>
                          <span className="w-[38%] shrink-0 text-[11px] text-navy-500 leading-snug pt-px">{label}</span>
                          {g ? (
                            <button disabled={!lantik} onClick={() => setSlotPilih(s.id)} title={lantik ? 'Klik untuk tukar guru' : g.nama}
                              className="flex-1 min-w-0 text-left leading-snug flex items-start gap-1.5 enabled:hover:text-brand-700">
                              {h && <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${TITIK_STATUS[h.status]}`} />}
                              <span className="font-medium">{g.nama}</span>
                            </button>
                          ) : (
                            <button disabled={!lantik} onClick={() => setSlotPilih(s.id)} className="flex-1 text-left text-[11px] font-semibold text-amber-600 enabled:hover:text-brand-700 flex items-center gap-1">
                              <UserPlus size={12} /> kosong — klik untuk isi
                            </button>
                          )}
                          {urus && <button title="Sunting jawatan" onClick={() => setSlotSunting(s.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-navy-300 hover:text-navy-700"><Pencil size={11} /></button>}
                        </div>
                      )
                    })}
                    {baris.length === 0 && <div className="py-2 text-[11px] text-navy-400 italic">Belum ada jawatan</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <PilihGuru slotId={slotPilih} tutup={() => setSlotPilih(null)} />
      {slotSunting && <SuntingSlot slotId={slotSunting} tutup={() => setSlotSunting(null)} />}
      {tambahJK && <TambahAhli jkId={tambahJK} tutup={() => setTambahJK(null)} />}
      {suntingJK && <SuntingJK jk={suntingJK} tutup={() => setSuntingJK(null)} />}
    </div>
  )
}
