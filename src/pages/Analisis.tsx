import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownUp, MessageCircle, Search, X } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, BarIndeks, CipStatus, Modal, WARNA_BIDANG, f1, f2, pautanWhatsApp } from '../components/ui'
import { boleh } from '../lib/kuasa'
import { STATUS_KUNCI } from '../lib/stor'
import { SejarahGuru, teksTugas } from '../components/SejarahGuru'
import { JENIS_LUAR } from './TugasLuar'
import { LABEL_STATUS, type StatusBeban } from '../lib/indeks'

type Isih = 'indeks' | 'nama' | 'skor' | 'masa'

export default function Analisis() {
  const { k } = useAplikasi()
  const [qs, setQs] = useSearchParams()
  const status = (qs.get('status') as StatusBeban | null) ?? null
  const [cari, setCari] = useState('')
  const [isih, setIsih] = useState<Isih>('indeks')
  const guruBuka = qs.get('guru')

  const baris = useMemo(() => {
    if (!k) return []
    const gred = new Map(k.data.gred.map((g) => [g.id, g.kod]))
    return k.data.guru
      .filter((g) => k.hasil.has(g.id))
      .map((g) => ({ g, h: k.hasil.get(g.id)!, bil: (k.lantikanGuru.get(g.id) ?? []).length, gred: g.gred_id ? gred.get(g.gred_id) : '' }))
      .filter((r) => !status || r.h.status === status)
      .filter((r) => !cari || r.g.nama.toLowerCase().includes(cari.toLowerCase()))
      .sort((a, b) =>
        isih === 'nama' ? a.g.nama.localeCompare(b.g.nama)
        : isih === 'skor' ? b.h.skor - a.h.skor
        : isih === 'masa' ? b.h.masaLaras - a.h.masaLaras
        : (a.h.status === 'dikecualikan' ? 1 : 0) - (b.h.status === 'dikecualikan' ? 1 : 0) || b.h.indeks - a.h.indeks)
  }, [k, status, cari, isih])

  if (!k) return null
  const t = k.data.tetapan
  const setStatus = (s: string | null) => { if (s) qs.set('status', s); else qs.delete('status'); setQs(qs) }

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Analisis Beban" sub={`Median masa mengajar ${k.ringkasan.medianMasa} · sasaran tugas purata ${f1(k.ringkasan.purataJangkaan)} mata · ${k.ringkasan.bilDikira} guru dikira`} />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {[null, 'terbeban', 'seimbang', 'kurang', 'tiada_tugas', 'dikecualikan'].map((s) => {
            const n = s ? [...k.hasil.values()].filter((h) => h.status === s).length : k.hasil.size
            return (
              <button key={s ?? 'semua'} onClick={() => setStatus(s)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>
                {s ? LABEL_STATUS[s as StatusBeban] : 'Semua'} <span className="opacity-60">{n}</span>
              </button>
            )
          })}
        </div>
        <div className="relative ml-auto w-full sm:w-60">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-9" placeholder="Cari guru…" value={cari} onChange={(e) => setCari(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-navy-500 mb-3">Indeks <b>1.00</b> = beban purata sekolah · melebihi <b>{t.ambang_tinggi}</b> = terbeban · bawah <b>{t.ambang_rendah}</b> = beban ringan. Klik nama untuk lihat jawatan guru.</p>

      <div className="kad overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50/70 text-[11px] uppercase tracking-wider text-navy-500">
              <tr>
                <th className="text-left px-4 py-3 w-10 hidden xl:table-cell">#</th>
                <Th label="Guru" k="nama" isih={isih} set={setIsih} kiri />
                <Th label="Indeks beban" k="indeks" isih={isih} set={setIsih} kiri />
                <Th label="Masa" k="masa" isih={isih} set={setIsih} />
                <Th label="Mata / sasaran" k="skor" isih={isih} set={setIsih} />
                <th className="px-3 py-3">Jawatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {baris.map((r, i) => (
                <tr key={r.g.id} onClick={() => { qs.set('guru', r.g.id); setQs(qs) }} className="hover:bg-brand-50/40 cursor-pointer">
                  <td className="px-4 py-2.5 text-navy-400 font-mono text-xs hidden xl:table-cell">{i + 1}</td>
                  <td className="px-3 py-2.5 min-w-[220px]">
                    <div className="flex items-center gap-2.5">
                      <Avatar nama={r.g.nama} kecil />
                      <div className="min-w-0">
                        <div className="font-semibold leading-snug">{r.g.nama}</div>
                        <div className="text-[11px] text-navy-400">{r.gred}{r.g.tag ? ` · ${r.g.tag}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 min-w-[170px]">
                    <div className="flex items-center gap-2"><div className="flex-1"><BarIndeks nilai={r.h.indeks} rendah={t.ambang_rendah} tinggi={t.ambang_tinggi} /></div><span className={`font-mono font-bold text-xs w-9 text-right ${r.h.status === 'terbeban' ? 'text-rose-600' : ''}`}>{f2(r.h.indeks)}</span></div>
                    <div className="mt-1"><CipStatus s={r.h.status} /></div>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    {r.h.masaAndaian
                      ? <span className="cip bg-amber-100 text-amber-800" title={`Belum diisi — indeks guna median ${k.ringkasan.medianMasa}`}>belum diisi</span>
                      : <span className="font-mono">{r.g.masa_seminggu}</span>}
                    {!r.h.masaAndaian && Math.abs(r.h.masaLaras - r.g.masa_seminggu) > 0.01 && (
                      <div className="text-[10px] text-navy-400" title="Masa dikira = masa × faktor kelas peperiksaan + relief">dikira {f1(r.h.masaLaras)}{r.g.kelas_peperiksaan ? ` (×${t.faktor_peperiksaan} pep.)` : ''}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono whitespace-nowrap"><b>{f1(r.h.skor)}</b><span className="text-navy-400"> / {f1(r.h.sasaran)}</span></td>
                  <td className="px-3 py-2.5 text-center">{r.bil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {guruBuka && <ProfilGuru guruId={guruBuka} tutup={() => { qs.delete('guru'); setQs(qs) }} />}
    </div>
  )
}

function Th({ label, k, isih, set, kiri }: { label: string; k: Isih; isih: Isih; set: (i: Isih) => void; kiri?: boolean }) {
  return (
    <th className={`px-3 py-3 ${kiri ? 'text-left' : ''}`}>
      <button onClick={() => set(k)} className={`inline-flex items-center gap-1 uppercase ${isih === k ? 'text-brand-700' : ''}`}>{label}<ArrowDownUp size={11} /></button>
    </th>
  )
}

export function ProfilGuru({ guruId, tutup }: { guruId: string; tutup: () => void }) {
  const { k, peranan, bidangSaya, ubah } = useAplikasi()
  if (!k) return null
  const d = k.data
  const g = d.guru.find((x) => x.id === guruId)
  const terkunci = STATUS_KUNCI.includes(d.kelulusan.status)
  const h = k.hasil.get(guruId)
  if (!g || !h) return null
  const t = d.tetapan
  const gred = d.gred.find((x) => x.id === g.gred_id)
  const tugas = (k.lantikanGuru.get(guruId) ?? []).map((sid) => {
    const s = d.slot.find((x) => x.id === sid)!
    const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    const b = d.bidang.find((x) => x.id === jk.bidang_id)
    return { s, jk, b, p: d.peranan.find((x) => x.id === s.peranan_id)!, skor: k.skorSlot.get(sid) ?? 0 }
  }).sort((a, b) => b.skor - a.skor)
  const w = t.w_mengajar

  return (
    <Modal buka tutup={tutup} lebar="max-w-2xl"
      tajuk={<span className="flex items-center gap-3"><Avatar nama={g.nama} />{g.nama}</span>}
      sub={<span className="flex items-center gap-2 mt-1">{gred?.kod}{g.tag && ` · ${g.tag}`} <CipStatus s={h.status} /></span>}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-navy-950 text-white p-4 sm:col-span-1">
          <div className="text-[11px] uppercase tracking-wider text-navy-300 font-bold">Indeks beban</div>
          <div className="font-display text-5xl font-black mt-1">{f2(h.indeks)}</div>
          <div className="text-xs text-navy-300 mt-1">1.00 = setara median sekolah</div>
        </div>
        <div className="sm:col-span-2 rounded-2xl border border-navy-100 p-4 font-mono text-[13px] space-y-1.5">
          <div className="flex justify-between"><span className="text-navy-500">Masa mengajar{g.kelas_peperiksaan ? ` (×${t.faktor_peperiksaan} peperiksaan)` : ''}{h.masaAndaian && <span className="text-amber-600 font-sans text-[11px]"> · belum diisi, andaian median</span>}</span><span>{f1(h.masaLaras)} ÷ {k.ringkasan.medianMasa} = <b>{f2(h.nisbahMasa)}</b></span></div>
          <div className="flex justify-between"><span className="text-navy-500">Mata tugas ÷ sasaran{t.guna_faktor_gred && gred ? ` (gred ×${gred.faktor})` : ''}</span><span>{f1(h.skor)} ÷ {f1(h.sasaran)} = <b>{f2(h.nisbahTugas)}</b></span></div>
          <div className="h-px bg-navy-100 my-2" />
          <div className="flex justify-between"><span className="text-navy-500">{w} × {f2(h.nisbahMasa)} + {f2(1 - w)} × {f2(h.nisbahTugas)}</span><b className="text-brand-700">{f2(h.indeks)}</b></div>
          <div className="pt-2 text-[12px] font-sans text-navy-600">Mata tugas = <b>{f1(h.nisbahTugas)}×</b> sasaran untuk gred ini{h.nisbahTugas > 1.5 ? ' — pertimbangkan untuk mengurangkan.' : h.nisbahTugas < 0.5 ? ' — boleh diberi tugas tambahan.' : '.'}</div>
        </div>
      </div>

      <h4 className="font-bold mt-6 mb-2">Senarai tugas ({tugas.length})</h4>
      {tugas.length === 0 ? <p className="text-sm text-navy-500">Belum ada sebarang jawatan.</p> : (
        <div className="space-y-1.5">
          {tugas.map(({ s, jk, b, p, skor }) => {
            const wb = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
            return (
              <div key={s.id} className="group flex items-center gap-3 rounded-xl border border-navy-100 px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${wb.titik}`} />
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{jk.nama}</div><div className="text-[11px] text-navy-500">{s.label || p.nama} · {b?.nama}</div></div>
                <div className="h-1.5 w-20 rounded-full bg-navy-100 overflow-hidden"><div className="h-full bg-emas-400" style={{ width: `${Math.min(100, (skor / 15) * 100)}%` }} /></div>
                <span className="font-mono text-sm font-bold w-10 text-right">{f1(skor)}</span>
                {!terkunci && boleh(peranan, 'lantik', b?.id, bidangSaya) && <button title="Gugurkan" onClick={() => ubah((st) => st.batal(s.id))} className="opacity-0 group-hover:opacity-100 p-1 text-navy-300 hover:text-rose-600"><X size={14} /></button>}
              </div>
            )
          })}
        </div>
      )}
      {(k.luarGuru.get(guruId)?.relief || k.luarGuru.get(guruId)?.mata) ? (
        <>
          <h4 className="font-bold mt-6 mb-2">Tugas luar & relief</h4>
          <div className="space-y-1.5">
            {d.tugasLuar.filter((x) => x.guru_id === guruId && x.tahun === d.sekolah.tahun_semasa).map((x) => (
              <div key={x.id} className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 text-sm">
                <span className="cip bg-violet-100 text-violet-700">{JENIS_LUAR[x.jenis].label}</span><span className="flex-1">{x.keterangan}</span>
                <span className="font-mono font-bold">{x.nilai} <span className="text-[10px] font-normal text-navy-400">{JENIS_LUAR[x.jenis].unit}</span></span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <h4 className="font-bold mt-6 mb-2">Sejarah 3 tahun</h4>
      <SejarahGuru guruId={guruId} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-navy-400 italic">Indeks Beban ialah alat bantu keputusan, bukan penilaian prestasi.</p>
        <a href={pautanWhatsApp(teksTugas(k, guruId), g.telefon)} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white hover:brightness-95 text-xs py-1.5"><MessageCircle size={14} /> Kongsi WhatsApp</a>
      </div>
    </Modal>
  )
}
