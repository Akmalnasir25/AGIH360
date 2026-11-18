import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Archive, ArrowRight, ChevronDown, ChevronRight, CopyPlus, FileDown, FlaskConical, Lock, MousePointerClick, Pencil, Plus, Search, Sparkles, UserMinus, UserPlus, Users, Wand2, X } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { PilihGuru } from '../components/PilihGuru'
import { TambahAhli } from '../components/TambahAhli'
import { AutoAgih } from '../components/AutoAgih'
import { BarStatus } from '../components/BarStatus'
import { useCalon } from '../components/useCalon'
import { Avatar, BarIndeks, Kosong, Modal, TITIK_STATUS, WARNA_BIDANG, f1, f2, useSahkan } from '../components/ui'
import { LABEL_STATUS } from '../lib/indeks'
import { boleh } from '../lib/kuasa'
import { STATUS_KUNCI } from '../lib/stor'
import type { Jawatankuasa as JK } from '../lib/types'

/** true jika lebar skrin ≥ px. ≥1024: panel guru di kanan; ≥1280: senarai JK di kiri juga. */
function useLebar(px: number) {
  const q = `(min-width: ${px}px)`
  const [lebar, setLebar] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setLebar(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [q])
  return lebar
}

const PANEL = 'lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]'

export default function Jawatankuasa() {
  const { k, peranan, bidangSaya, ubah, stor, simulasi, mulaSimulasi } = useAplikasi()
  const [qs, setQs] = useSearchParams()
  const lebar = useLebar(1024)
  const xl = useLebar(1280)
  const [bidang, setBidang] = useState<string>(peranan === 'pk' && bidangSaya ? bidangSaya : 'semua')
  const [cari, setCari] = useState('')
  const [kosongSahaja, setKosongSahaja] = useState(qs.get('kosong') === '1')
  const [slotAktif, setSlotAktif] = useState<string | null>(null)
  const [jkPilih, setJkPilih] = useState<string | null>(qs.get('jk'))
  const jkPautan = qs.get('jk')
  if (jkPautan && jkPautan !== jkPilih) { setJkPilih(jkPautan); setSlotAktif(null) }
    const [slotModal, setSlotModal] = useState<string | null>(null)
  const [tambahJK, setTambahJK] = useState<string | null>(null)
  const [auto, setAuto] = useState(false)
  const [suntingJK, setSuntingJK] = useState<Partial<JK> | null>(null)
  const [mesej, setMesej] = useState<string | null>(null)
  const [elSahkan, sahkan] = useSahkan()

  const senarai = useMemo(() => {
    if (!k) return []
    const d = k.data
    return d.jawatankuasa
      .filter((j) => bidang === 'semua' || j.bidang_id === bidang)
      .filter((j) => !cari || j.nama.toLowerCase().includes(cari.toLowerCase()))
      .map((j) => {
        const slot = d.slot.filter((s) => s.jawatankuasa_id === j.id)
        const isi = slot.filter((s) => k.pemegangSlot.has(s.id)).length
        return { j, jumlah: slot.length, isi }
      })
      .filter((x) => !kosongSahaja || x.isi < x.jumlah || x.j.id === jkPilih)
      .sort((a, b) => {
        const ba = d.bidang.find((x) => x.id === a.j.bidang_id)?.susunan ?? 0
        const bb = d.bidang.find((x) => x.id === b.j.bidang_id)?.susunan ?? 0
        return ba - bb || a.j.susunan - b.j.susunan
      })
  }, [k, bidang, cari, kosongSahaja, jkPilih])

  // JK terpilih mesti wujud dalam senarai bertapis; jika tidak, guna yang pertama
  const jkId = senarai.some((x) => x.j.id === jkPilih) ? jkPilih : senarai[0]?.j.id ?? null
  const jkAktif = k?.data.jawatankuasa.find((j) => j.id === jkId) ?? null
  const slotSah = slotAktif && k?.data.slot.some((s) => s.id === slotAktif && s.jawatankuasa_id === jkId) ? slotAktif : null

  if (!k) return null
  const d = k.data
  const terkunci = STATUS_KUNCI.includes(d.kelulusan.status)
  const bolehUrus = (bidangId: string) => !terkunci && boleh(peranan, 'urus_jk', bidangId, bidangSaya)
  const bolehLantik = (bidangId: string) => !terkunci && boleh(peranan, 'lantik', bidangId, bidangSaya)
  const bolehCiptaJK = !terkunci && !simulasi && boleh(peranan, 'urus_jk', bidang !== 'semua' ? bidang : bidangSaya, bidangSaya)
  const jumlahSlot = d.slot.length
  const jumlahIsi = d.slot.filter((s) => k.pemegangSlot.has(s.id)).length

  const salin = async () => {
    let n = 0
    await ubah(async (s) => { n = await s.salinTahunLepas() })
    setMesej(n ? `${n} lantikan disalin daripada ${d.sekolah.tahun_semasa - 1}.` : `Tiada lantikan ${d.sekolah.tahun_semasa - 1} untuk disalin.`)
  }
  const pilihJK = (id: string) => { setJkPilih(id); setSlotAktif(null); if (jkPautan) { qs.delete('jk'); setQs(qs, { replace: true }) } }
  const pilihSlot = (id: string) => (lebar ? setSlotAktif((x) => (x === id ? null : id)) : setSlotModal(id))

  return (
    <div className="animate-naik">
      {elSahkan}
      <TajukHalaman tajuk="Agih Tugas" sub="Pilih jawatankuasa → klik jawatan → klik guru di panel kanan. Paling ringan di atas."
        tindakan={<>
          {!terkunci && boleh(peranan, 'lantik', null, bidangSaya) && <button onClick={() => setAuto(true)} className="btn-gelap"><Wand2 size={16} /> Auto-agih</button>}
          {!terkunci && !simulasi && stor && <button onClick={mulaSimulasi} className="btn-garis text-violet-700"><FlaskConical size={16} /> Simulasi</button>}
          {!terkunci && !simulasi && boleh(peranan, 'urus_tetapan') && <button onClick={salin} className="btn-garis"><CopyPlus size={16} /> Salin {d.sekolah.tahun_semasa - 1}</button>}
          {bolehCiptaJK && <button onClick={() => setSuntingJK({ bidang_id: bidang !== 'semua' ? bidang : bidangSaya ?? d.bidang[0]?.id, tahap_id: d.tahap[1]?.id, tempoh_id: d.tempoh[0]?.id, wajib: false, nama: '' })} className="btn-utama"><Plus size={16} /> Jawatankuasa</button>}
        </>} />

      <BarStatus />
      {mesej && <div className="mb-4 rounded-2xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm flex justify-between">{mesej}<button onClick={() => setMesej(null)}><X size={16} /></button></div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <BtnBidang aktif={bidang === 'semua'} onClick={() => setBidang('semua')} label="Semua" />
          {d.bidang.map((b) => <BtnBidang key={b.id} aktif={bidang === b.id} onClick={() => setBidang(b.id)} label={b.nama} warna={b.warna} kunci={peranan === 'pk' && !!bidangSaya && bidangSaya !== b.id} />)}
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-navy-500">
          <span><b className="text-navy-800">{jumlahIsi}</b>/{jumlahSlot} jawatan diisi</span>
          <div className="w-28 h-1.5 rounded-full bg-navy-100 overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${jumlahSlot ? (jumlahIsi / jumlahSlot) * 100 : 0}%` }} /></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[230px_minmax(0,1fr)_280px] items-start">
        {/* ─── Kiri: senarai JK ─── */}
        <aside className={`kad p-3 flex ${xl ? `flex-col ${PANEL}` : 'flex-col sm:flex-row sm:items-center gap-2 lg:col-span-2'}`}>
          <div className={`relative ${xl ? 'mb-2' : 'sm:w-56 shrink-0'}`}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Cari jawatankuasa…" value={cari} onChange={(e) => setCari(e.target.value)} />
          </div>
          <label className={`flex items-center gap-2 text-xs font-semibold text-navy-600 px-1 cursor-pointer ${xl ? 'mb-2' : 'shrink-0 order-last'}`}>
            <input type="checkbox" className="accent-brand-500" checked={kosongSahaja} onChange={(e) => setKosongSahaja(e.target.checked)} /> Tunjuk yang ada kosong sahaja
          </label>
          {xl ? (
            <nav className="overflow-y-auto -mx-1 px-1 flex-1">
              {senarai.length === 0 && <p className="text-sm text-navy-400 p-3">Tiada jawatankuasa.</p>}
              {senarai.map(({ j, isi, jumlah }, i) => {
                const b = d.bidang.find((x) => x.id === j.bidang_id)
                const w = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
                const tajuk = i === 0 || senarai[i - 1].j.bidang_id !== j.bidang_id
                const aktif = j.id === jkId
                const penuh = isi === jumlah && jumlah > 0
                return (
                  <div key={j.id}>
                    {tajuk && <div className={`sticky top-0 bg-white z-10 text-[10px] font-bold uppercase tracking-wider px-2 pt-3 pb-1 flex items-center gap-1.5 ${w.teks}`}><span className={`h-1.5 w-1.5 rounded-full ${w.titik}`} />{b?.nama}</div>}
                    <button onClick={() => pilihJK(j.id)}
                      className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] leading-snug transition ${aktif ? 'bg-navy-900 text-white' : 'hover:bg-navy-50 text-navy-700'}`}>
                      <span className="flex-1 min-w-0 line-clamp-2">{j.nama}</span>
                      <span className={`shrink-0 font-mono text-[11px] rounded-md px-1.5 py-0.5 ${aktif ? 'bg-white/15' : penuh ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>{isi}/{jumlah}</span>
                    </button>
                  </div>
                )
              })}
            </nav>
          ) : (
            <select className="input flex-1 min-w-0" value={jkId ?? ''} onChange={(e) => pilihJK(e.target.value)}>
              {senarai.map(({ j, isi, jumlah }) => <option key={j.id} value={j.id}>{j.nama} ({isi}/{jumlah})</option>)}
            </select>
          )}
        </aside>

        {/* ─── Tengah: butiran JK ─── */}
        <section className="min-w-0">
          {jkAktif ? (
            <PanelJK jk={jkAktif} slotAktif={slotSah} pilihSlot={pilihSlot}
              lantik={bolehLantik(jkAktif.bidang_id)} urus={bolehUrus(jkAktif.bidang_id) && !simulasi} terkunci={terkunci}
              tambahAhli={() => setTambahJK(jkAktif.id)} sunting={() => setSuntingJK(jkAktif)}
              buangSlot={async (sid, label, nama) => {
                if (await sahkan(`Buang jawatan "${label}" daripada ${jkAktif.nama}?${nama ? `\n${nama} akan digugurkan.` : ''}`, { butang: 'Buang' })) {
                  if (slotSah === sid) setSlotAktif(null)
                  await ubah((st) => st.arkib('slot', sid))
                }
              }} />
          ) : (
            <div className="kad"><Kosong ikon={<Users size={22} />} tajuk="Tiada jawatankuasa" teks="Ubah tapisan atau cipta jawatankuasa baharu." /></div>
          )}
        </section>

        {/* ─── Kanan: senarai guru & beban ─── */}
        {lebar && (
          <aside className={`kad p-3 flex flex-col ${PANEL}`}>
            <PanelGuru slotId={slotSah} tutupSlot={() => setSlotAktif(null)}
              bolehLantik={!!jkAktif && bolehLantik(jkAktif.bidang_id)}
              selepasLantik={(sid) => {
                // Auto ke jawatan kosong seterusnya dalam JK yang sama
                const slotJK = d.slot.filter((s) => s.jawatankuasa_id === jkAktif?.id).sort((a, b) => a.susunan - b.susunan)
                const i = slotJK.findIndex((s) => s.id === sid)
                const seterus = [...slotJK.slice(i + 1), ...slotJK.slice(0, i)].find((s) => !k.pemegangSlot.has(s.id))
                setSlotAktif(seterus?.id ?? null)
              }} />
          </aside>
        )}
      </div>

      <PilihGuru slotId={slotModal} tutup={() => setSlotModal(null)} />
      {tambahJK && <TambahAhli jkId={tambahJK} tutup={() => setTambahJK(null)} />}
      {auto && <AutoAgih tutup={() => setAuto(false)} bidangAwal={bidang !== 'semua' ? bidang : bidangSaya} />}
      {suntingJK && <SuntingJK jk={suntingJK} tutup={() => setSuntingJK(null)} />}
    </div>
  )
}

/** Butiran satu JK: senarai jawatan dalam bentuk jadual. Barisan pentadbir yang berulang dilipat. */
function PanelJK({ jk, slotAktif, pilihSlot, lantik, urus, terkunci, tambahAhli, sunting, buangSlot }: {
  jk: JK; slotAktif: string | null; pilihSlot: (id: string) => void; lantik: boolean; urus: boolean; terkunci: boolean
  tambahAhli: () => void; sunting: () => void; buangSlot: (slotId: string, label: string, nama?: string) => void
}) {
  const { k, ubah, simulasi } = useAplikasi()
  const [bukaPentadbir, setBukaPentadbir] = useState(false)
  if (!k) return null
  const d = k.data
  const b = d.bidang.find((x) => x.id === jk.bidang_id)
  const w = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
  const slot = d.slot.filter((s) => s.jawatankuasa_id === jk.id).sort((a, b) => a.susunan - b.susunan)
  const isi = slot.filter((s) => k.pemegangSlot.has(s.id)).length
  const guru = new Map(d.guru.map((g) => [g.id, g]))
  const peranan = new Map(d.peranan.map((p) => [p.id, p]))

  // Lipat barisan awal yang dipegang pentadbir (dikecualikan) jika ≥ 3 — cth. GB + PK dalam setiap unit HEM
  let nPentadbir = 0
  for (const s of slot) { const g = guru.get(k.pemegangSlot.get(s.id) ?? ''); if (g?.dikecualikan && s.id !== slotAktif) nPentadbir++; else break }
  const lipat = nPentadbir >= 3 && !bukaPentadbir
  const papar = lipat ? slot.slice(nPentadbir) : slot

  const tambahSlot = (perananId: string) => ubah((s) => s.simpan('slot', { jawatankuasa_id: jk.id, peranan_id: perananId, label: null, susunan: slot.length + 1 }))

  return (
    <div className="kad overflow-hidden">
      <div className="p-4 border-b border-navy-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${w.teks}`}>{b?.nama}</div>
          <h2 className="text-lg font-bold leading-snug">{jk.nama}</h2>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {jk.kod && <span className="cip bg-navy-900 text-white" title="Kod MySG">{jk.kod}</span>}
            <span className="cip bg-navy-100 text-navy-600">{d.tahap.find((t) => t.id === jk.tahap_id)?.nama}</span>
            <span className="cip bg-navy-100 text-navy-600">{d.tempoh.find((t) => t.id === jk.tempoh_id)?.nama}</span>
            {jk.wajib && <span className="cip bg-emas-400/20 text-emas-600">Wajib</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`cip ${isi === slot.length ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>{isi}/{slot.length} diisi</span>
          <Link to={`/app/eksport?jk=${jk.id}`} title="Jana dokumen JK ini" className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400"><FileDown size={15} /></Link>
          {urus && <button title="Sunting / buang JK" onClick={sunting} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400"><Pencil size={15} /></button>}
          {!lantik && !terkunci && <span title="Di luar bidang anda" className="p-1.5"><Lock size={14} className="text-navy-300" /></span>}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-navy-400 bg-navy-50/60">
        <span className="flex-1">Jawatan · Guru</span><span className="w-16 text-right" title="Indeks beban guru (1.00 = purata) · mata jawatan ini">Indeks</span><span className="w-5" />
      </div>

      <div className="divide-y divide-navy-50">
        {lipat && (
          <button onClick={() => setBukaPentadbir(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-navy-50/60">
            <ChevronRight size={15} className="text-navy-400" />
            <span className="text-xs font-semibold text-navy-500 w-[150px] shrink-0">Pentadbir ({nPentadbir})</span>
            <span className="flex -space-x-1.5">{slot.slice(0, nPentadbir).map((s) => { const g = guru.get(k.pemegangSlot.get(s.id)!); return g ? <span key={s.id} title={`${s.label || peranan.get(s.peranan_id)?.nama}: ${g.nama}`} className="ring-2 ring-white rounded-full"><Avatar nama={g.nama} kecil /></span> : null })}</span>
            <span className="text-xs text-navy-400 ml-auto">GB & PK · klik untuk lihat</span>
          </button>
        )}
        {!lipat && nPentadbir >= 3 && (
          <button onClick={() => setBukaPentadbir(false)} className="w-full flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold text-navy-400 hover:bg-navy-50/60"><ChevronDown size={13} /> Lipat pentadbir</button>
        )}
        {papar.map((s) => {
          const gid = k.pemegangSlot.get(s.id)
          const g = gid ? guru.get(gid) : null
          const h = gid ? k.hasil.get(gid) : null
          const label = s.label || peranan.get(s.peranan_id)?.nama || ''
          const aktif = slotAktif === s.id
          return (
            <div key={s.id} onClick={() => lantik && pilihSlot(s.id)}
              className={`group flex items-center gap-3 px-4 py-2.5 transition ${lantik ? 'cursor-pointer' : ''} ${aktif ? 'bg-brand-50 ring-2 ring-inset ring-brand-400' : lantik ? 'hover:bg-navy-50/60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-navy-500 leading-snug">{label}</div>
                {g && h ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar nama={g.nama} kecil />
                    <span className="text-sm font-medium leading-snug">{g.nama}</span>
                    <span title={LABEL_STATUS[h.status]} className={`h-2 w-2 shrink-0 rounded-full ${TITIK_STATUS[h.status]}`} />
                  </div>
                ) : (
                  <div className={`mt-1 inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1 text-xs font-semibold ${aktif ? 'border-brand-400 text-brand-700 bg-white' : 'border-navy-200 text-navy-400 group-hover:border-brand-300 group-hover:text-brand-600'}`}>
                    {aktif ? <><MousePointerClick size={13} /> Pilih guru di panel kanan →</> : <><UserPlus size={13} /> Kosong — klik untuk isi</>}
                  </div>
                )}
              </div>
              <div className="w-16 shrink-0 text-right leading-tight">
                <div className={`font-mono text-sm ${h?.status === 'terbeban' ? 'text-rose-600 font-bold' : 'text-navy-700'}`}>{h ? f2(h.indeks) : '—'}</div>
                <div className="font-mono text-[10px] text-navy-400">{f1(k.skorSlot.get(s.id) ?? 0)} mata</div>
              </div>
              {urus ? <button title="Buang jawatan ini" onClick={(e) => { e.stopPropagation(); buangSlot(s.id, label, g?.nama) }} className="w-5 opacity-0 group-hover:opacity-100 p-0.5 text-navy-300 hover:text-rose-600"><X size={14} /></button> : <span className="w-5" />}
            </div>
          )
        })}
        {slot.length === 0 && <p className="px-4 py-6 text-sm text-navy-400 text-center">Belum ada jawatan. Tambah di bawah.</p>}
      </div>

      {(urus || (lantik && !simulasi)) && (
        <div className="p-3 border-t border-navy-100 bg-navy-50/40 flex flex-wrap items-center gap-2">
          {lantik && !simulasi && <button onClick={tambahAhli} className="btn-utama py-1.5 text-xs"><Users size={14} /> Tambah ramai ahli</button>}
          {urus && (
            <select title="Tambah jawatan kosong" className="input py-1.5 text-xs w-48" defaultValue="" onChange={(e) => { if (e.target.value) { void tambahSlot(e.target.value); e.target.value = '' } }}>
              <option value="" disabled>+ Tambah jawatan kosong</option>
              {d.peranan.map((p) => <option key={p.id} value={p.id}>{p.nama} (×{p.berat})</option>)}
            </select>
          )}
          <span className="ml-auto text-[11px] text-navy-400">Indeks: <span className="text-sky-600">●</span> kurang · <span className="text-brand-600">●</span> seimbang · <span className="text-rose-600">●</span> terbeban</span>
        </div>
      )}
    </div>
  )
}

type Tapis = 'semua' | 'ruang' | 'terbeban'

/** Panel kanan: semua guru + indeks beban. Bila jawatan dipilih → pratonton & klik untuk lantik. */
function PanelGuru({ slotId, tutupSlot, bolehLantik, selepasLantik }: { slotId: string | null; tutupSlot: () => void; bolehLantik: boolean; selepasLantik: (slotId: string) => void }) {
  const { k, ubah } = useAplikasi()
  const [cari, setCari] = useState('')
  const [tapis, setTapis] = useState<Tapis>('semua')
  const [sibuk, setSibuk] = useState<string | null>(null)
  const { info, calon } = useCalon(slotId)

  const semua = useMemo(() => {
    if (!k) return []
    return k.data.guru
      .filter((g) => g.status !== 'bertukar' && k.hasil.has(g.id))
      .map((g) => ({ g, kini: k.hasil.get(g.id)!, bil: (k.lantikanGuru.get(g.id) ?? []).length }))
      .sort((a, b) => (a.g.dikecualikan || a.g.status !== 'aktif' ? 1 : 0) - (b.g.dikecualikan || b.g.status !== 'aktif' ? 1 : 0) || a.kini.indeks - b.kini.indeks)
  }, [k])

  if (!k) return null
  const t = k.data.tetapan
  const mod = !!info
  const lulus = (s: string, nama: string) => {
    if (cari && !nama.toLowerCase().includes(cari.toLowerCase())) return false
    if (tapis === 'ruang') return s === 'kurang' || s === 'tiada_tugas'
    if (tapis === 'terbeban') return s === 'terbeban'
    return true
  }
  const baris = mod
    ? calon.filter((c) => lulus(c.kini.status, c.g.nama))
    : semua.filter((c) => lulus(c.kini.status, c.g.nama)).map((c) => ({ ...c, lepas: null, amaran: [] as string[], pakar: null as string | null }))
  const pemegang = info?.pemegang ? k.data.guru.find((g) => g.id === info.pemegang) : null

  const lantik = async (guruId: string) => {
    if (!info) return
    setSibuk(guruId)
    try { await ubah((s) => s.lantik(info.slot.id, guruId)); selepasLantik(info.slot.id) } finally { setSibuk(null) }
  }
  const kosongkan = async () => {
    if (!info) return
    setSibuk('x')
    try { await ubah((s) => s.batal(info.slot.id)) } finally { setSibuk(null) }
  }

  return (
    <>
      {info ? (
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-2.5 mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Lantik ke</div>
              <div className="text-sm font-bold leading-snug">{info.slot.label || info.peranan.nama}</div>
              <div className="text-[11px] text-navy-500 truncate" title={info.jk.nama}>{info.jk.nama} · {f1(info.skor)} mata</div>
            </div>
            <button onClick={tutupSlot} title="Batal pilih" className="p-1 text-navy-400 hover:text-navy-700"><X size={15} /></button>
          </div>
          {pemegang && (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="truncate">Kini: <b title={pemegang.nama}>{pemegang.nama}</b></span>
              <button disabled={!!sibuk || !bolehLantik} onClick={kosongkan} className="shrink-0 inline-flex items-center gap-1 text-rose-600 font-semibold hover:underline"><UserMinus size={12} /> Kosongkan</button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2 px-1">
          <div className="text-sm font-bold">Senarai guru</div>
          <div className="text-[11px] text-navy-500">Klik satu jawatan di tengah untuk mula melantik.</div>
        </div>
      )}

      <div className="relative mb-2">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input className="input pl-9 py-2 text-sm" placeholder="Cari guru…" value={cari} onChange={(e) => setCari(e.target.value)} />
      </div>
      <div className="flex rounded-lg bg-navy-50 p-0.5 text-[11px] font-semibold mb-2">
        {([['semua', 'Semua'], ['ruang', 'Ada ruang'], ['terbeban', 'Terbeban']] as [Tapis, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setTapis(v)} className={`flex-1 px-2 py-1 rounded-md ${tapis === v ? 'bg-white shadow-card text-navy-900' : 'text-navy-500'}`}>{l}</button>
        ))}
      </div>
      {mod && <p className="text-[11px] text-navy-500 mb-1.5 px-1 flex items-center gap-1"><Sparkles size={11} className="text-emas-500" /> Disusun ikut indeks selepas dilantik</p>}

      <div className="overflow-y-auto -mx-1 px-1 flex-1 space-y-0.5">
        {baris.map((c, i) => {
          const semasa = info?.pemegang === c.g.id
          const disyor = mod && i < 3 && !cari && tapis === 'semua' && c.amaran.length === 0
          const klik = mod && bolehLantik && !semasa && !sibuk
          return (
            <button key={c.g.id} disabled={!klik} onClick={() => lantik(c.g.id)}
              title={[c.g.nama, c.g.tag, ...c.amaran].filter(Boolean).join('\n')}
              className={`w-full text-left rounded-lg px-2 py-1.5 transition ${semasa ? 'bg-brand-100' : disyor ? 'bg-brand-50/60 hover:bg-brand-100' : klik ? 'hover:bg-navy-50' : ''} ${klik ? 'cursor-pointer' : 'cursor-default'} ${c.g.dikecualikan || c.g.status !== 'aktif' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TITIK_STATUS[c.kini.status]}`} />
                <span className="flex-1 min-w-0 text-[13px] font-medium leading-snug">{c.g.nama}</span>
                {c.amaran.length > 0 && <AlertTriangle size={12} className="shrink-0 text-amber-500" />}
                <span className="shrink-0 font-mono text-xs font-semibold flex items-center gap-0.5">
                  {c.lepas ? <>{f2(c.kini.indeks)}<ArrowRight size={10} className="text-navy-400" /><span className={c.lepas.indeks > t.ambang_tinggi ? 'text-rose-600' : 'text-brand-700'}>{f2(c.lepas.indeks)}</span></>
                    : <span className={c.kini.status === 'terbeban' ? 'text-rose-600' : 'text-navy-700'}>{f2(c.kini.indeks)}</span>}
                </span>
              </div>
              <div className="pl-4 mt-1"><BarIndeks nilai={c.kini.indeks} pratonton={c.lepas?.indeks} rendah={t.ambang_rendah} tinggi={t.ambang_tinggi} /></div>
              <div className="pl-4 mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-navy-400">
                <span>{c.bil} jawatan</span>
                {c.kini.masaAndaian ? <span className="text-amber-600 font-semibold" title="Masa mengajar belum diisi — indeks guna andaian median">masa belum diisi</span> : <span>{c.g.masa_seminggu} masa</span>}
                {semasa && <span className="text-brand-700 font-bold">dilantik</span>}
                {disyor && <span className="text-brand-700 font-bold">disyorkan</span>}
                {c.pakar && <span className="text-violet-600">{c.pakar}</span>}
              </div>
            </button>
          )
        })}
        {baris.length === 0 && <p className="text-sm text-navy-400 p-3">Tiada guru.</p>}
      </div>
    </>
  )
}

function BtnBidang({ aktif, onClick, label, warna, kunci }: { aktif: boolean; onClick: () => void; label: string; warna?: string; kunci?: boolean }) {
  const w = warna ? WARNA_BIDANG[warna] : null
  return (
    <button onClick={onClick} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${aktif ? 'bg-navy-900 text-white shadow-card' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>
      {w && <span className={`h-2 w-2 rounded-full ${w.titik}`} />}{label}{kunci && <Lock size={11} className="opacity-60" />}
    </button>
  )
}

function SuntingJK({ jk, tutup }: { jk: Partial<JK>; tutup: () => void }) {
  const { k, ubah, peranan, bidangSaya } = useAplikasi()
  const [f, setF] = useState<Partial<JK>>(jk)
  const [sibuk, setSibuk] = useState(false)
  const [elSahkan, sahkan] = useSahkan()
  if (!k) return null
  const d = k.data
  const baru = !jk.id
  const bidangBoleh = d.bidang.filter((b) => boleh(peranan, 'urus_jk', b.id, bidangSaya))
  const simpan = async () => {
    if (!f.nama?.trim() || !f.bidang_id) return
    setSibuk(true)
    try {
      await ubah(async (s) => {
        const id = await s.simpan('jawatankuasa', {
          id: f.id, nama: f.nama!.trim(), bidang_id: f.bidang_id, tahap_id: f.tahap_id, tempoh_id: f.tempoh_id,
          wajib: !!f.wajib, catatan: f.catatan ?? null, bidang_tugas: f.bidang_tugas?.trim() || null,
          susunan: f.susunan ?? d.jawatankuasa.filter((j) => j.bidang_id === f.bidang_id).length + 1,
        })
        if (baru) {
          const p = (n: string) => d.peranan.find((x) => x.nama === n)?.id
          const rows = [p('Pengerusi'), p('Setiausaha'), p('AJK'), p('AJK')].filter(Boolean).map((pid, i) => ({ jawatankuasa_id: id, peranan_id: pid!, label: null, susunan: i + 1 }))
          await s.simpanBanyak('slot', rows)
        }
      })
      tutup()
    } finally { setSibuk(false) }
  }
  const arkib = async () => {
    if (!jk.id) return
    const bil = d.slot.filter((s) => s.jawatankuasa_id === jk.id && k.pemegangSlot.has(s.id)).length
    if (!(await sahkan(`Buang "${jk.nama}" daripada sesi ${d.sekolah.tahun_semasa}?\n\n${bil} lantikan sesi ini akan digugurkan. Rekod tahun-tahun lepas KEKAL dalam sejarah guru.`, { tajuk: 'Buang jawatankuasa', butang: 'Buang JK' }))) return
    await ubah((s) => s.arkib('jawatankuasa', jk.id!)); tutup()
  }
  return (
    <Modal buka tutup={tutup} tajuk={baru ? 'Jawatankuasa baharu' : 'Sunting jawatankuasa'} lebar="max-w-xl"
      sub={baru ? 'Jawatan lalai: Pengerusi, Setiausaha, 2 AJK — tambah lagi bila-bila masa.' : undefined}>
      {elSahkan}
      <div className="space-y-4">
        <div><label className="label">Nama</label><input autoFocus className="input" value={f.nama ?? ''} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="cth. JK Hari Guru" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Bidang / Unit</label>
            <select className="input" value={f.bidang_id} onChange={(e) => setF({ ...f, bidang_id: e.target.value })}>{bidangBoleh.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
          <div><label className="label">Tahap</label>
            <select className="input" value={f.tahap_id} onChange={(e) => setF({ ...f, tahap_id: e.target.value })}>{d.tahap.map((t) => <option key={t.id} value={t.id}>{t.nama} (×{t.faktor})</option>)}</select></div>
          <div><label className="label">Tempoh</label>
            <select className="input" value={f.tempoh_id} onChange={(e) => setF({ ...f, tempoh_id: e.target.value })}>{d.tempoh.map((t) => <option key={t.id} value={t.id}>{t.nama} (×{t.faktor})</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm font-medium mt-6"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={!!f.wajib} onChange={(e) => setF({ ...f, wajib: e.target.checked })} /> JK wajib</label>
        </div>
        <div>
          <label className="label">Bidang tugas (satu baris = satu tugas) — dicetak dalam Buku Pengurusan</label>
          <textarea rows={5} className="input" value={f.bidang_tugas ?? ''} onChange={(e) => setF({ ...f, bidang_tugas: e.target.value })}
            placeholder={'Merancang program tahunan jawatankuasa.\nMengadakan mesyuarat berkala.\nMenyediakan laporan akhir tahun.'} />
        </div>
        <div className="flex justify-between pt-2">
          {!baru ? <button onClick={arkib} className="btn text-rose-600 hover:bg-rose-50"><Archive size={15} /> Buang JK</button> : <span />}
          <div className="flex gap-2"><button onClick={tutup} className="btn-hantu">Batal</button><button disabled={sibuk} onClick={simpan} className="btn-utama"><Sparkles size={15} /> Simpan</button></div>
        </div>
      </div>
    </Modal>
  )
}
