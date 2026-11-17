import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BarChart3, ClipboardCheck, Dumbbell, FileDown, FileText, FlaskConical, LayoutDashboard, LogOut, Menu,
  Network, Settings, Sparkles, UserRound, Users, X,
} from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { Logo, Modal } from './ui'
import type { Peranan } from '../lib/types'
import { boleh, LABEL_PERANAN, type Tindakan } from '../lib/kuasa'
import { kiraAmaran } from '../lib/amaran'
import { binaKonteks } from '../lib/indeks'

const MENU: { ke: string; label: string; ikon: typeof Users; perlu: Tindakan | null; lencana?: 'amaran' }[] = [
  { ke: '/app', label: 'Papan Pemuka', ikon: LayoutDashboard, perlu: 'lihat_pengurusan' },
  { ke: '/app/jawatankuasa', label: 'Agih Tugas', ikon: Network, perlu: 'lihat_pengurusan' },
  { ke: '/app/amaran', label: 'Amaran', ikon: AlertTriangle, perlu: 'lihat_pengurusan', lencana: 'amaran' },
  { ke: '/app/analisis', label: 'Analisis Beban', ikon: BarChart3, perlu: 'lihat_pengurusan' },
  { ke: '/app/guru', label: 'Guru', ikon: Users, perlu: 'urus_guru' },
  { ke: '/app/tugas-luar', label: 'Tugas Luar & Relief', ikon: Dumbbell, perlu: 'tugas_luar' },
  { ke: '/app/kelulusan', label: 'Kelulusan & Log', ikon: ClipboardCheck, perlu: 'log' },
  { ke: '/app/eksport', label: 'Jana Dokumen', ikon: FileDown, perlu: 'eksport' },
  { ke: '/app/surat', label: 'Surat Lantikan', ikon: FileText, perlu: 'surat' },
  { ke: '/app/tetapan', label: 'Tetapan Pemberat', ikon: Settings, perlu: 'urus_tetapan' },
  { ke: '/app/tugas-saya', label: 'Tugas Saya', ikon: UserRound, perlu: null },
]

export function Kerangka() {
  const { data, k, peranan, bidangSaya, stor, keluar, keluarDemo, tukarPerananDemo, keahlian, pilihSekolah, sesi, simulasi, ralat, tutupRalat } = useAplikasi()
  const [buka, setBuka] = useState(false)
  const nav = useNavigate()
  const demo = stor?.mod === 'demo' || (simulasi && !sesi)
  const bilAmaran = useMemo(() => (k && boleh(peranan, 'lihat_pengurusan') ? kiraAmaran(k).filter((a) => a.tahap === 'tinggi').length : 0), [k, peranan])
  const namaBidang = bidangSaya ? data?.bidang.find((b) => b.id === bidangSaya)?.nama : null

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-navy-200">
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <Logo terang />
        <button className="lg:hidden text-navy-300" onClick={() => setBuka(false)}><X /></button>
      </div>
      {data && (
        <div className="mx-4 mb-4 rounded-2xl bg-white/5 border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-navy-400 font-bold">{data.sekolah.kod} · {data.sekolah.jenis}</div>
          <div className="text-sm font-semibold text-white leading-snug mt-0.5">{data.sekolah.nama}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-emas-400 font-semibold">Sesi {data.sekolah.tahun_semasa}</span>
            <span className="text-[10px] font-bold uppercase text-navy-300">{LABEL_PERANAN[peranan]}{namaBidang ? ` · ${namaBidang}` : ''}</span>
          </div>
          {keahlian.length > 1 && !demo && (
            <select className="mt-2 w-full rounded-lg bg-navy-900 border border-white/10 text-xs p-1.5" value={data.sekolah.id} onChange={(e) => pilihSekolah(e.target.value)}>
              {keahlian.map((x) => <option key={x.school_id} value={x.school_id}>{x.nama}</option>)}
            </select>
          )}
        </div>
      )}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {MENU.filter((m) => !m.perlu || boleh(peranan, m.perlu)).map((m) => (
          <NavLink key={m.ke} to={m.ke} end={m.ke === '/app'} onClick={() => setBuka(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white shadow-glow' : 'hover:bg-white/5 hover:text-white'}`}>
            <m.ikon size={17} /> <span className="flex-1">{m.label}</span>
            {m.lencana === 'amaran' && bilAmaran > 0 && <span className="rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5">{bilAmaran}</span>}
          </NavLink>
        ))}
      </nav>
      {demo && (
        <div className="mx-4 mb-3 rounded-2xl bg-emas-400/10 border border-emas-400/30 p-3">
          <div className="flex items-center gap-1.5 text-emas-300 text-xs font-bold"><Sparkles size={14} /> MOD DEMO</div>
          <div className="text-[11px] text-navy-300 mt-1">Data rekaan. Cuba setiap peranan:</div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-[11px]">
            {(['admin', 'gb', 'pk', 'guru'] as Peranan[]).map((p) => (
              <button key={p} disabled={!!simulasi} onClick={() => { tukarPerananDemo(p); nav(p === 'guru' ? '/app/tugas-saya' : '/app') }}
                className={`rounded-lg py-1 font-semibold ${peranan === p ? 'bg-emas-400 text-navy-950' : 'bg-white/5 hover:bg-white/10'}`}>
                {p === 'admin' ? 'Admin' : p === 'gb' ? 'GB' : p === 'pk' ? 'PK' : 'Guru'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 border-t border-white/10">
        {sesi && !demo && <div className="text-[11px] text-navy-400 truncate mb-2">{sesi.user.email}</div>}
        <button onClick={async () => { if (demo) keluarDemo(); else await keluar(); nav('/') }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">
          <LogOut size={16} /> {demo ? 'Keluar demo' : 'Log keluar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 no-print">{sidebar}</aside>
      {buka && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setBuka(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-naik">{sidebar}</div>
        </div>
      )}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur border-b border-navy-100 px-4 py-3 no-print">
        <Logo kecil />
        <button onClick={() => setBuka(true)} className="rounded-xl p-2 hover:bg-navy-50"><Menu /></button>
      </header>
      {simulasi && <SepandukSimulasi />}
      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <Outlet />
      </main>
      {ralat && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl bg-rose-600 text-white shadow-pop p-4 text-sm flex gap-3 animate-naik no-print">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" /><div className="flex-1">{ralat}</div>
          <button onClick={tutupRalat}><X size={16} /></button>
        </div>
      )}
    </div>
  )
}

function SepandukSimulasi() {
  const { simulasi, data, terapkanSimulasi, buangSimulasi } = useAplikasi()
  const [banding, setBanding] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const r = useMemo(() => {
    if (!simulasi || !data) return null
    const a = binaKonteks(simulasi.dataAsal), b = binaKonteks(data)
    const kira = (k: typeof a) => {
      const h = [...k.hasil.values()].filter((x) => x.status !== 'dikecualikan')
      const c = (s: string) => h.filter((x) => x.status === s).length
      const ind = h.map((x) => x.indeks)
      const purata = ind.reduce((p, q) => p + q, 0) / Math.max(1, ind.length)
      const sisihan = Math.sqrt(ind.reduce((p, q) => p + (q - purata) ** 2, 0) / Math.max(1, ind.length))
      return { terbeban: c('terbeban'), seimbang: c('seimbang'), kurang: c('kurang'), tiada: c('tiada_tugas'), kosong: k.data.slot.length - k.pemegangSlot.size, sisihan }
    }
    const tahun = data.sekolah.tahun_semasa
    const lama = new Map(simulasi.dataAsal.lantikan.filter((l) => l.tahun === tahun).map((l) => [l.slot_id, l.guru_id]))
    const baru = new Map(data.lantikan.filter((l) => l.tahun === tahun).map((l) => [l.slot_id, l.guru_id]))
    const ubah = new Set([...lama.keys(), ...baru.keys()].filter((s) => lama.get(s) !== baru.get(s))).size
    const berubah = data.guru.map((g) => ({ g, a: a.hasil.get(g.id)?.indeks ?? 0, b: b.hasil.get(g.id)?.indeks ?? 0 }))
      .filter((x) => Math.abs(x.a - x.b) > 0.005).sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a))
    return { sebelum: kira(a), selepas: kira(b), ubah, berubah }
  }, [simulasi, data])
  if (!r) return null
  return (
    <div className="sticky top-0 z-30 bg-violet-600 text-white no-print">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center gap-3 text-sm">
        <FlaskConical size={18} />
        <b>Mod Simulasi</b>
        <span className="opacity-90">{r.ubah} perubahan belum disimpan · terbeban {r.sebelum.terbeban} → {r.selepas.terbeban}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setBanding(true)} className="btn bg-white/15 hover:bg-white/25 py-1">Banding</button>
          <button onClick={buangSimulasi} className="btn bg-white/15 hover:bg-white/25 py-1">Buang</button>
          <button disabled={sibuk || !r.ubah} onClick={async () => { setSibuk(true); try { await terapkanSimulasi() } finally { setSibuk(false) } }} className="btn bg-white text-violet-700 hover:bg-violet-50 py-1">Terapkan {r.ubah}</button>
        </div>
      </div>
      <Modal buka={banding} tutup={() => setBanding(false)} tajuk="Sebelum vs selepas simulasi" lebar="max-w-2xl">
        <div className="grid grid-cols-3 gap-2 text-sm text-navy-900">
          <div className="font-semibold text-navy-500" /><div className="font-bold text-center">Sebelum</div><div className="font-bold text-center">Selepas</div>
          {([['Terbeban', 'terbeban'], ['Seimbang', 'seimbang'], ['Ada ruang', 'kurang'], ['Belum ditugaskan', 'tiada'], ['Jawatan kosong', 'kosong']] as const).map(([l, kk]) => (
            <div key={kk} className="contents">
              <div className="text-navy-600">{l}</div>
              <div className="text-center font-mono">{r.sebelum[kk]}</div>
              <div className={`text-center font-mono font-bold ${r.selepas[kk] === r.sebelum[kk] ? '' : (kk === 'seimbang') === (r.selepas[kk] > r.sebelum[kk]) ? 'text-brand-600' : 'text-rose-600'}`}>{r.selepas[kk]}</div>
            </div>
          ))}
          <div className="text-navy-600">Sisihan indeks (lebih rendah = lebih adil)</div>
          <div className="text-center font-mono">{r.sebelum.sisihan.toFixed(3)}</div>
          <div className={`text-center font-mono font-bold ${r.selepas.sisihan < r.sebelum.sisihan ? 'text-brand-600' : 'text-rose-600'}`}>{r.selepas.sisihan.toFixed(3)}</div>
        </div>
        <h4 className="font-bold mt-6 mb-2 text-navy-900">Guru yang berubah ({r.berubah.length})</h4>
        <div className="max-h-64 overflow-y-auto divide-y divide-navy-100 text-sm text-navy-900">
          {r.berubah.map((x) => (
            <div key={x.g.id} className="flex justify-between py-1.5"><span>{x.g.nama}</span><span className="font-mono">{x.a.toFixed(2)} → <b className={x.b > 1.3 ? 'text-rose-600' : x.b < 0.7 ? 'text-sky-600' : 'text-brand-600'}>{x.b.toFixed(2)}</b></span></div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export function TajukHalaman({ tajuk, sub, tindakan }: { tajuk: string; sub?: string; tindakan?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 no-print">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{tajuk}</h1>
        {sub && <p className="text-navy-500 text-sm mt-1">{sub}</p>}
      </div>
      {tindakan && <div className="flex flex-wrap gap-2">{tindakan}</div>}
    </div>
  )
}
