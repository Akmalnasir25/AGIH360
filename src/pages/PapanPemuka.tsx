import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertOctagon, ArrowRight, CheckCircle2, Feather, Inbox, Scale, UserX } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, BarIndeks, KadStat, TITIK_STATUS, WARNA_BIDANG, f2 } from '../components/ui'
import type { StatusBeban } from '../lib/indeks'

export default function PapanPemuka() {
  const { k } = useAplikasi()
  const nav = useNavigate()

  const s = useMemo(() => {
    if (!k) return null
    const d = k.data
    const guru = new Map(d.guru.map((g) => [g.id, g]))
    const hasil = [...k.hasil.values()]
    const kira = (st: StatusBeban) => hasil.filter((h) => h.status === st).length
    const dikira = hasil.filter((h) => h.status !== 'dikecualikan')
    const isi = d.slot.filter((sl) => k.pemegangSlot.has(sl.id)).length
    const kosongSlot = d.slot.length - isi
    const jkLengkap = d.jawatankuasa.filter((j) => d.slot.filter((sl) => sl.jawatankuasa_id === j.id).every((sl) => k.pemegangSlot.has(sl.id))).length
    const wajibKosong = d.jawatankuasa.filter((j) => j.wajib && d.slot.some((sl) => sl.jawatankuasa_id === j.id && !k.pemegangSlot.has(sl.id)))
    const berat = [...dikira].sort((a, b) => b.indeks - a.indeks).slice(0, 5)
    const ringan = [...dikira].filter((h) => h.status !== 'tiada_tugas').sort((a, b) => a.indeks - b.indeks).slice(0, 5)
    const belum = dikira.filter((h) => h.status === 'tiada_tugas')
    // histogram 0.0–2.0+ (selang 0.2)
    const tong = Array.from({ length: 11 }, (_, i) => ({ dari: i * 0.2, bil: 0 }))
    for (const h of dikira) tong[Math.min(10, Math.floor(h.indeks / 0.2))].bil++
    const maxTong = Math.max(1, ...tong.map((t) => t.bil))
    const perBidang = d.bidang.map((b) => {
      const sl = d.slot.filter((x) => d.jawatankuasa.find((j) => j.id === x.jawatankuasa_id)?.bidang_id === b.id)
      return { b, jumlah: sl.length, isi: sl.filter((x) => k.pemegangSlot.has(x.id)).length }
    })
    return { guru, kira, dikira, isi, kosongSlot, jkLengkap, wajibKosong, berat, ringan, belum, tong, maxTong, perBidang }
  }, [k])

  if (!k || !s) return null
  const t = k.data.tetapan
  const peratus = Math.round((s.isi / Math.max(1, k.data.slot.length)) * 100)
  const seimbangPc = Math.round((s.kira('seimbang') / Math.max(1, s.dikira.length)) * 100)
  const pergi = (st: string) => nav(`/app/analisis?status=${st}`)

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Dashboard" sub={`Gambaran beban tugas ${s.dikira.length} guru · sesi ${k.data.sekolah.tahun_semasa}`}
        tindakan={<Link to="/app/jawatankuasa" className="btn-utama">Agih tugas <ArrowRight size={16} /></Link>} />
      {k.ringkasan.bilTiadaMasa > 0 && (
        <Link to="/app/guru" className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100">
          <span className="text-lg leading-none">⚠️</span>
          <span><b>{k.ringkasan.bilTiadaMasa} guru belum diisi masa mengajar.</b> Buat masa ini mereka diandaikan setara median sekolah{k.ringkasan.bilTiadaMasa === k.ringkasan.bilDikira ? ' (indeks dikira daripada tugas sahaja)' : ''}. Lengkapkan di halaman Guru untuk indeks yang tepat →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KadStat warna="brand" ikon={<Scale size={16} />} label="Seimbang" nilai={s.kira('seimbang')} sub={`${seimbangPc}% daripada guru`} onClick={() => pergi('seimbang')} />
        <KadStat warna="rose" ikon={<AlertOctagon size={16} />} label="Terbeban" nilai={s.kira('terbeban')} sub={`Indeks > ${t.ambang_tinggi}`} onClick={() => pergi('terbeban')} />
        <KadStat warna="sky" ikon={<Feather size={16} />} label="Beban ringan" nilai={s.kira('kurang')} sub={`Indeks < ${t.ambang_rendah}`} onClick={() => pergi('kurang')} />
        <KadStat warna="amber" ikon={<UserX size={16} />} label="Belum ditugaskan" nilai={s.kira('tiada_tugas')} sub="Tiada sebarang jawatan" onClick={() => pergi('tiada_tugas')} />
        <KadStat warna="navy" ikon={<Inbox size={16} />} label="Jawatan kosong" nilai={s.kosongSlot} sub={`${s.wajibKosong.length} JK wajib belum lengkap`} onClick={() => nav('/app/jawatankuasa?kosong=1')} />
      </div>

      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        {/* Taburan */}
        <div className="kad p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Taburan Indeks Beban</h3>
              <p className="text-xs text-navy-500">Setiap bar = bilangan guru dalam julat indeks. Zon hijau = seimbang.</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-navy-400 font-semibold uppercase">Median masa</div>
              <div className="font-mono font-bold">{k.ringkasan.medianMasa} masa</div>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-1.5 h-44">
            {s.tong.map((tg) => {
              const zon = tg.dari + 0.1 > t.ambang_tinggi ? 'bg-rose-400' : tg.dari + 0.1 < t.ambang_rendah ? 'bg-sky-400' : 'bg-brand-500'
              return (
                <div key={tg.dari} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="text-[11px] font-bold text-navy-600 mb-1">{tg.bil || ''}</div>
                  <div className={`w-full rounded-t-lg ${zon} transition-all duration-700`} style={{ height: `${(tg.bil / s.maxTong) * 100}%`, minHeight: tg.bil ? 6 : 2, opacity: tg.bil ? 1 : 0.2 }} />
                </div>
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5 text-[10px] text-navy-400 font-mono">
            {s.tong.map((tg, i) => <div key={i} className="flex-1 text-center">{i === 10 ? '2.0+' : tg.dari.toFixed(1)}</div>)}
          </div>
        </div>

        {/* Kelengkapan */}
        <div className="kad p-5">
          <h3 className="font-bold">Kelengkapan Agihan</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#DCE4EE" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B483" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${peratus} 100`} className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display font-black text-xl">{peratus}%</div>
            </div>
            <div className="text-sm">
              <div><b>{s.isi}</b> / {k.data.slot.length} jawatan diisi</div>
              <div className="text-navy-500"><b className="text-navy-800">{s.jkLengkap}</b> / {k.data.jawatankuasa.length} JK lengkap</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {s.perBidang.map(({ b, jumlah, isi }) => {
              const w = WARNA_BIDANG[b.warna] ?? WARNA_BIDANG.slate
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs font-semibold"><span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${w.titik}`} />{b.nama}</span><span className="text-navy-500">{isi}/{jumlah}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-navy-100 overflow-hidden"><div className={`h-full ${w.titik} rounded-full`} style={{ width: `${(isi / Math.max(1, jumlah)) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <SenaraiRingkas tajuk="5 paling berat" sub="Pertimbangkan untuk dikurangkan" warna="rose" item={s.berat.map((h) => ({ h, g: s.guru.get(h.id)! }))} t={t} />
        <SenaraiRingkas tajuk="5 paling ringan" sub="Boleh diberi tugas tambahan" warna="sky" item={s.ringan.map((h) => ({ h, g: s.guru.get(h.id)! }))} t={t} />
        <div className="kad p-5">
          <h3 className="font-bold flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${TITIK_STATUS.tiada_tugas}`} /> Belum ditugaskan</h3>
          <p className="text-xs text-navy-500">Pastikan tiada guru tercicir</p>
          {s.belum.length === 0 ? (
            <div className="mt-6 text-center text-sm text-brand-700 font-semibold flex flex-col items-center gap-2"><CheckCircle2 /> Semua guru sudah ada tugas</div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {s.belum.map((h) => {
                const g = s.guru.get(h.id)!
                return <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 pl-1 pr-3 py-1 text-xs font-semibold"><Avatar nama={g.nama} kecil />{g.nama.replace(/ (bin|binti|a\/l|a\/p|anak) .*/i, '')}</span>
              })}
            </div>
          )}
          {s.wajibKosong.length > 0 && (
            <div className="mt-5 pt-4 border-t border-navy-100">
              <div className="text-xs font-bold text-navy-500 uppercase tracking-wide">JK wajib belum lengkap</div>
              <ul className="mt-2 space-y-1 text-sm">
                {s.wajibKosong.slice(0, 5).map((j) => <li key={j.id}><Link className="hover:text-brand-600" to={`/app/jawatankuasa?jk=${j.id}`}>• {j.nama}</Link></li>)}
                {s.wajibKosong.length > 5 && <li className="text-navy-400 text-xs">+{s.wajibKosong.length - 5} lagi</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SenaraiRingkas({ tajuk, sub, warna, item, t }: {
  tajuk: string; sub: string; warna: 'rose' | 'sky'
  item: { h: { id: string; indeks: number; skor: number }; g: { nama: string } }[]
  t: { ambang_rendah: number; ambang_tinggi: number }
}) {
  return (
    <div className="kad p-5">
      <h3 className="font-bold flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${warna === 'rose' ? 'bg-rose-500' : 'bg-sky-500'}`} />{tajuk}</h3>
      <p className="text-xs text-navy-500">{sub}</p>
      <div className="mt-3 space-y-3">
        {item.map(({ h, g }) => (
          <Link to={`/app/analisis?guru=${h.id}`} key={h.id} className="block group">
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="font-medium leading-snug group-hover:text-brand-600">{g.nama}</span>
              <span className="shrink-0 font-mono font-bold text-xs mt-0.5">{f2(h.indeks)}</span>
            </div>
            <div className="mt-1"><BarIndeks nilai={h.indeks} rendah={t.ambang_rendah} tinggi={t.ambang_tinggi} /></div>
          </Link>
        ))}
      </div>
    </div>
  )
}
