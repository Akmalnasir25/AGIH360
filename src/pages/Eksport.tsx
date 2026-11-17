import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, FileSpreadsheet, FileText, List, Loader2, Printer, Search } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { WARNA_BIDANG } from '../components/ui'
import { binaCarta, keExcel, keWord, keWordBuku, kumpul, tajukDokumen, type Pilihan } from '../lib/eksport'

type Mod = 'semua' | 'bidang' | 'jk'

export default function Eksport() {
  const { k, peranan, bidangSaya } = useAplikasi()
  const [qs] = useSearchParams()
  const awalJK = qs.get('jk')
  const [mod, setMod] = useState<Mod>(awalJK ? 'jk' : peranan === 'pk' && bidangSaya ? 'bidang' : 'semua')
  const [bidang, setBidang] = useState<string[]>(bidangSaya ? [bidangSaya] : [])
  const [jk, setJk] = useState<string[]>(awalJK ? [awalJK] : [])
  const [cariJK, setCariJK] = useState('')
  const [p, setP] = useState<Pilihan>({ tunjukKosong: false, gabungPeranan: true })
  const [sibuk, setSibuk] = useState<string | null>(null)
  const [buku, setBuku] = useState(false)

  const data = useMemo(() => {
    if (!k) return []
    const skop = mod === 'bidang' ? { bidang } : mod === 'jk' ? { jk } : {}
    if ((mod === 'bidang' && !bidang.length) || (mod === 'jk' && !jk.length)) return []
    return kumpul(k, skop, p)
  }, [k, mod, bidang, jk, p])

  if (!k) return null
  const d = k.data
  const bilJK = data.reduce((a, b) => a + b.jk.length, 0)
  const bilKosong = data.reduce((a, b) => a + b.jk.reduce((x, j) => x + j.kosong, 0), 0)
  const tog = (arr: string[], set: (a: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  const jana = async (jenis: 'word' | 'excel') => {
    setSibuk(jenis)
    try {
      if (jenis === 'word') await (buku ? keWordBuku(d.sekolah, data, binaCarta(k, data)) : keWord(d.sekolah, data))
      else await keExcel(d.sekolah, data, k)
    } finally { setSibuk(null) }
  }

  return (
    <div>
      <TajukHalaman tajuk="Jana Dokumen" sub="Senarai AJK terus daripada agihan semasa. Ubah lantikan, jana semula — format sentiasa seragam." />
      <div className="grid xl:grid-cols-[360px_1fr] gap-5">
        {/* Panel pilihan */}
        <div className="space-y-4 no-print xl:sticky xl:top-6 h-fit">
          <div className="kad p-4">
            <div className="label">Jenis dokumen</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setBuku(false)} className={`rounded-2xl border-2 p-3 text-left ${!buku ? 'border-brand-500 bg-brand-50' : 'border-navy-100'}`}><List size={18} className="text-brand-600" /><div className="font-bold text-sm mt-1">Senarai AJK</div><div className="text-[11px] text-navy-500">Jadual ahli setiap JK</div></button>
              <button onClick={() => setBuku(true)} className={`rounded-2xl border-2 p-3 text-left ${buku ? 'border-brand-500 bg-brand-50' : 'border-navy-100'}`}><BookOpen size={18} className="text-brand-600" /><div className="font-bold text-sm mt-1">Buku Pengurusan</div><div className="text-[11px] text-navy-500">Kulit, isi kandungan, carta, bidang tugas</div></button>
            </div>
          </div>
          <div className="kad p-4">
            <div className="label">1. Skop</div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-navy-50 p-1 text-sm font-semibold">
              {([['semua', 'Sekolah'], ['bidang', 'Unit'], ['jk', 'JK']] as [Mod, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setMod(v)} className={`rounded-lg py-1.5 ${mod === v ? 'bg-white shadow-card' : 'text-navy-500'}`}>{l}</button>
              ))}
            </div>
            {mod === 'bidang' && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.bidang.map((b) => {
                  const w = WARNA_BIDANG[b.warna] ?? WARNA_BIDANG.slate
                  const on = bidang.includes(b.id)
                  return <button key={b.id} onClick={() => tog(bidang, setBidang, b.id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 border ${on ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-navy-200'}`}><span className={`h-2 w-2 rounded-full ${w.titik}`} />{b.nama}</button>
                })}
              </div>
            )}
            {mod === 'jk' && (
              <div className="mt-3">
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-8 py-1.5" placeholder="Cari JK…" value={cariJK} onChange={(e) => setCariJK(e.target.value)} /></div>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-0.5">
                  {d.jawatankuasa.filter((j) => !cariJK || j.nama.toLowerCase().includes(cariJK.toLowerCase())).map((j) => (
                    <label key={j.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-navy-50 cursor-pointer">
                      <input type="checkbox" className="accent-brand-500" checked={jk.includes(j.id)} onChange={() => tog(jk, setJk, j.id)} /><span className="truncate">{j.nama}</span>
                    </label>
                  ))}
                </div>
                {jk.length > 0 && <button onClick={() => setJk([])} className="text-xs text-brand-600 font-semibold mt-1">Kosongkan pilihan ({jk.length})</button>}
              </div>
            )}
          </div>

          <div className="kad p-4 space-y-2">
            <div className="label">2. Pilihan</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={p.gabungPeranan} onChange={(e) => setP({ ...p, gabungPeranan: e.target.checked })} /> Gabung AJK dalam satu baris bernombor</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={p.tunjukKosong} onChange={(e) => setP({ ...p, tunjukKosong: e.target.checked })} /> Tunjuk jawatan belum diisi</label>
          </div>

          <div className="kad p-4">
            <div className="label">3. Muat turun</div>
            <div className="text-xs text-navy-500 mb-3">{data.length} unit · {bilJK} jawatankuasa{bilKosong > 0 && <span className="text-amber-700 font-semibold"> · {bilKosong} jawatan belum diisi</span>}</div>
            <div className="grid grid-cols-3 gap-2">
              <BtnFormat ikon={<FileText />} label="Word" sub=".docx" warna="bg-[#2B579A]" sibuk={sibuk === 'word'} mati={!data.length} onClick={() => jana('word')} />
              <BtnFormat ikon={<FileSpreadsheet />} label="Excel" sub=".xlsx" warna="bg-[#217346]" sibuk={sibuk === 'excel'} mati={!data.length} onClick={() => jana('excel')} />
              <BtnFormat ikon={<Printer />} label="PDF" sub="cetak" warna="bg-[#C4302B]" mati={!data.length} onClick={() => window.print()} />
            </div>
            <p className="text-[11px] text-navy-400 mt-3">PDF: pilih "Save as PDF" dalam tetingkap cetak. Excel turut mengandungi helaian <b>Tugas Ikut Guru</b>.</p>
          </div>
        </div>

        {/* Pratonton (juga susun atur PDF) */}
        <div className="bg-white shadow-card print:shadow-none rounded-2xl print:rounded-none p-8 sm:p-12 text-black text-[12.5px] font-sans min-h-[60vh]">
          {data.length === 0 ? <div className="text-center text-navy-400 py-20 no-print">Pilih unit atau jawatankuasa untuk dipratonton.</div> : <>
            {buku && <PraBuku k={k} data={data} />}
            {!buku && <div className="text-center mb-8">
              <div className="font-bold text-base">{d.sekolah.nama.toUpperCase()}</div>
              <div className="font-bold">{tajukDokumen(d.sekolah, data)}</div>
              <div className="text-gray-600">SESI {d.sekolah.tahun_semasa}</div>
            </div>}
            {data.map((b, bi) => (
              <section key={b.huruf} id={`bhg-${b.huruf}`} className={bi > 0 || buku ? 'mt-10 print:mt-0 print:break-before-page' : ''}>
                <div className="bg-[#0B1F3A] text-white font-bold px-3 py-1.5 [print-color-adjust:exact]">BAHAGIAN {b.huruf}: {b.nama.toUpperCase()}</div>
                {b.jk.map((j) => (
                  <div key={j.no} className="mt-5 break-inside-avoid">
                    <div className="font-bold mb-1.5">{j.no}&nbsp;&nbsp;{j.nama}</div>
                    <table className="w-full border-collapse">
                      <tbody>
                        {j.ahli.map((a, i) => (
                          <tr key={i}>
                            <td className="border border-gray-400 bg-[#EEF2F7] [print-color-adjust:exact] font-semibold px-2 py-1 w-[31%] align-top">{a.jawatan}</td>
                            <td className="border border-gray-400 px-2 py-1">
                              {a.nama.map((n, ni) => <div key={ni} className={n === '(belum diisi)' ? 'italic text-gray-400' : ''}>{a.nama.length > 1 ? `${ni + 1}. ` : ''}{n}</div>)}
                            </td>
                          </tr>
                        ))}
                        {j.ahli.length === 0 && <tr><td colSpan={2} className="border border-gray-400 px-2 py-1 italic text-gray-400">Belum ada ahli dilantik</td></tr>}
                      </tbody>
                    </table>
                    {buku && j.bidangTugas.length > 0 && (
                      <div className="mt-2"><div className="font-semibold">Bidang tugas:</div>
                        <ol className="list-decimal ml-6">{j.bidangTugas.map((t, i) => <li key={i}>{t}</li>)}</ol></div>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </>}
        </div>
      </div>
    </div>
  )
}

function BtnFormat({ ikon, label, sub, warna, onClick, sibuk, mati }: { ikon: React.ReactNode; label: string; sub: string; warna: string; onClick: () => void; sibuk?: boolean; mati?: boolean }) {
  return (
    <button disabled={mati || sibuk} onClick={onClick} className={`${warna} text-white rounded-2xl py-3 flex flex-col items-center gap-1 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-pop disabled:opacity-40 disabled:translate-y-0`}>
      {sibuk ? <Loader2 className="animate-spin" /> : ikon}{label}<span className="text-[10px] font-medium opacity-80">{sub}</span>
    </button>
  )
}

function PraBuku({ k, data }: { k: NonNullable<ReturnType<typeof useAplikasi>['k']>; data: ReturnType<typeof kumpul> }) {
  const s = k.data.sekolah
  const carta = binaCarta(k, data)
  return (
    <>
      {/* Kulit */}
      <div className="relative overflow-hidden rounded-xl print:rounded-none bg-[#0B1F3A] text-white [print-color-adjust:exact] h-[640px] print:h-[95vh] flex flex-col justify-between p-10 print:break-after-page">
        <div className="absolute -right-24 top-24 h-[420px] w-[420px] rotate-12 bg-[#10B483]" />
        <div className="absolute -right-24 top-[300px] h-24 w-[520px] -rotate-[24deg] bg-[#F9C846]" />
        <div className="relative">
          <div className="text-sm font-bold tracking-widest opacity-80">{s.kod}</div>
          <div className="text-lg font-bold mt-1">{s.nama.toUpperCase()}</div>
        </div>
        <div className="relative">
          <div className="text-7xl font-black text-[#F9C846] opacity-90">{s.tahun_semasa}</div>
          <div className="text-5xl font-black leading-tight mt-2">BUKU<br />PENGURUSAN<br />SEKOLAH</div>
        </div>
        <div className="relative text-sm opacity-80">{[s.alamat, s.daerah, s.negeri].filter(Boolean).join(', ')}</div>
      </div>
      {/* Isi kandungan */}
      <div className="mt-10 print:mt-0 print:break-after-page">
        <div className="text-center font-bold text-base mb-4">ISI KANDUNGAN</div>
        <div className="flex justify-between border-b border-dotted border-gray-400 py-1"><span>Carta Organisasi</span></div>
        {data.map((b) => (
          <div key={b.huruf} className="mt-2">
            <div className="font-bold border-b border-dotted border-gray-400 py-1">BAHAGIAN {b.huruf}: {b.nama.toUpperCase()}</div>
            {b.jk.map((j) => <div key={j.no} className="pl-5 border-b border-dotted border-gray-300 py-0.5">{j.no}&nbsp;&nbsp;{j.nama}</div>)}
          </div>
        ))}
      </div>
      {/* Carta organisasi */}
      <div className="mt-10 print:mt-0 print:break-after-page">
        <div className="bg-[#0B1F3A] text-white font-bold px-3 py-1.5 [print-color-adjust:exact]">CARTA ORGANISASI</div>
        <div className="flex justify-center mt-6"><div className="rounded-lg bg-[#0B1F3A] text-white text-center px-6 py-3 [print-color-adjust:exact]"><div className="font-bold">{carta.ketua.jawatan.toUpperCase()}</div><div className="text-[11px]">{carta.ketua.nama}</div></div></div>
        <div className="mx-auto h-5 w-px bg-gray-400" />
        <div className="grid gap-2 border-t border-gray-400 pt-5" style={{ gridTemplateColumns: `repeat(${carta.cabang.length}, minmax(0,1fr))` }}>
          {carta.cabang.map((c) => (
            <div key={c.bidang}>
              <div className="rounded-lg bg-[#06926B] text-white text-center px-2 py-2 [print-color-adjust:exact]"><div className="font-bold text-[11px]">{c.bidang.toUpperCase()}</div>{c.pk && <div className="text-[10px] mt-0.5">{c.pk}</div>}</div>
              <ul className="mt-2 text-[10.5px] space-y-0.5">{c.jk.map((j) => <li key={j}>• {j}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
