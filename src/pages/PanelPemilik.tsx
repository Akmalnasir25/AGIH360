import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2, Clock, LogOut, PauseCircle, Plus, RefreshCw, Search, ShieldCheck, UserPlus } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { Logo, Modal, useSahkan } from '../components/ui'
import { supabase } from '../lib/supabase'
import type { JenisSekolah } from '../lib/types'

interface SekolahPemilik {
  id: string; kod: string; nama: string; jenis: JenisSekolah; daerah: string | null; negeri: string | null
  status: 'menunggu' | 'aktif' | 'digantung'; catatan_status: string | null; dicipta: string
  pemohon_emel: string | null; telefon: string | null; admin_emel: string | null; jemputan_emel: string | null
  bil_guru: number; bil_lantikan: number
}

const GAYA = {
  menunggu: { label: 'Menunggu', kelas: 'bg-amber-100 text-amber-800', ikon: Clock },
  aktif: { label: 'Aktif', kelas: 'bg-brand-100 text-brand-800', ikon: CheckCircle2 },
  digantung: { label: 'Digantung', kelas: 'bg-rose-100 text-rose-700', ikon: PauseCircle },
}

export default function PanelPemilik() {
  const { sesi, keluar, keahlian } = useAplikasi()
  const nav = useNavigate()
  const [senarai, setSenarai] = useState<SekolahPemilik[]>([])
  const [tapis, setTapis] = useState<'semua' | SekolahPemilik['status']>('menunggu')
  const [cari, setCari] = useState('')
  const [memuat, setMemuat] = useState(true)
  const [ralat, setRalat] = useState<string | null>(null)
  const [cipta, setCipta] = useState(false)
  const [tambahAdmin, setTambahAdmin] = useState<SekolahPemilik | null>(null)
  const [elSahkan, sahkan] = useSahkan()

  const muat = async () => {
    if (!supabase) return
    setMemuat(true)
    const { data, error } = await supabase.rpc('pemilik_senarai')
    setMemuat(false)
    if (error) setRalat(error.message); else setSenarai((data ?? []) as SekolahPemilik[])
  }
  useEffect(() => { void muat() }, [])
  useEffect(() => { if (!memuat && senarai.length && !senarai.some((s) => s.status === 'menunggu') && tapis === 'menunggu') setTapis('semua') }, [memuat, senarai, tapis])

  const kiraan = useMemo(() => ({
    semua: senarai.length,
    menunggu: senarai.filter((s) => s.status === 'menunggu').length,
    aktif: senarai.filter((s) => s.status === 'aktif').length,
    digantung: senarai.filter((s) => s.status === 'digantung').length,
  }), [senarai])
  const papar = senarai
    .filter((s) => tapis === 'semua' || s.status === tapis)
    .filter((s) => !cari || `${s.kod} ${s.nama} ${s.daerah ?? ''} ${s.negeri ?? ''}`.toLowerCase().includes(cari.toLowerCase()))

  const tukar = async (s: SekolahPemilik, status: SekolahPemilik['status']) => {
    let catatan: string | undefined
    if (status === 'digantung') {
      if (!(await sahkan(`Gantung ${s.nama} (${s.kod})?\n\nSemua pengguna sekolah ini tidak boleh membuka atau mengubah data sehingga diaktifkan semula. Data tidak dipadam.`, { butang: 'Gantung' }))) return
      catatan = 'Digantung oleh pemilik'
    }
    const { error } = await supabase!.rpc('pemilik_tukar_status', { p_school: s.id, p_status: status, p_catatan: catatan ?? null })
    if (error) setRalat(error.message); else void muat()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {elSahkan}
      <header className="bg-navy-950 text-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <Logo terang kecil />
          <div className="flex items-center gap-2 text-sm">
            {keahlian.length > 0 && <Link to="/app" className="btn bg-white/10 hover:bg-white/15 text-white"><ArrowLeft size={15} /> Sekolah saya</Link>}
            <button onClick={async () => { await keluar(); nav('/') }} className="btn bg-white/10 hover:bg-white/15 text-white"><LogOut size={15} /> Keluar</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 pb-8 pt-2">
          <div className="flex items-center gap-2 text-emas-300 text-xs font-bold uppercase tracking-widest"><ShieldCheck size={15} /> Panel Pemilik</div>
          <h1 className="text-3xl font-black mt-1">Sekolah AGIH360</h1>
          <p className="text-navy-300 text-sm mt-1">{sesi?.user.email} · luluskan permohonan, gantung, atau daftarkan sekolah terus.</p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['menunggu', 'aktif', 'digantung', 'semua'] as const).map((t) => (
              <button key={t} onClick={() => setTapis(t)} className={`rounded-2xl p-3 text-left border transition ${tapis === t ? 'bg-white text-navy-900 border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">{t === 'semua' ? 'Semua' : GAYA[t].label}</div>
                <div className="font-display text-3xl font-black">{kiraan[t]}</div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-9" placeholder="Cari kod, nama, daerah…" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
          <button onClick={() => void muat()} className="btn-garis"><RefreshCw size={15} /> Muat semula</button>
          <button onClick={() => setCipta(true)} className="btn-utama"><Plus size={16} /> Daftar sekolah</button>
        </div>
        {ralat && <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{ralat}</div>}
        {memuat ? <div className="text-center text-navy-400 py-16">Memuat…</div> : papar.length === 0 ? (
          <div className="kad text-center py-14 text-navy-500"><Building2 className="mx-auto mb-3 text-navy-300" />Tiada sekolah dalam senarai ini.</div>
        ) : (
          <div className="space-y-2">
            {papar.map((s) => {
              const g = GAYA[s.status]
              return (
                <div key={s.id} className="kad p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="cip bg-navy-900 text-white font-mono">{s.kod}</span>
                      <span className="cip bg-navy-100 text-navy-600">{s.jenis}</span>
                      <span className={`cip ${g.kelas}`}><g.ikon size={11} />{g.label}</span>
                    </div>
                    <div className="font-bold mt-1">{s.nama}</div>
                    <div className="text-xs text-navy-500 mt-0.5">{[s.daerah, s.negeri].filter(Boolean).join(', ') || '—'} · didaftar {new Date(s.dicipta).toLocaleDateString('ms-MY')}</div>
                    <div className="text-xs text-navy-500 mt-1">
                      Pemohon: <b>{s.pemohon_emel ?? '—'}</b>{s.telefon && <> · {s.telefon}</>}
                      {s.admin_emel && <> · Admin: {s.admin_emel}</>}
                      {s.jemputan_emel && <span className="text-amber-700"> · Dijemput (belum log masuk): {s.jemputan_emel}</span>}
                    </div>
                    {s.status === 'aktif' && <div className="text-[11px] text-navy-400 mt-1">{s.bil_guru} guru · {s.bil_lantikan} lantikan sesi ini</div>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {s.status !== 'aktif' && <button onClick={() => void tukar(s, 'aktif')} className="btn-utama py-1.5"><CheckCircle2 size={15} /> {s.status === 'menunggu' ? 'Luluskan' : 'Aktifkan semula'}</button>}
                    {s.status !== 'digantung' && <button onClick={() => void tukar(s, 'digantung')} className="btn-garis py-1.5 text-rose-600"><PauseCircle size={15} /> {s.status === 'menunggu' ? 'Tolak / gantung' : 'Gantung'}</button>}
                    <button onClick={() => setTambahAdmin(s)} className="btn-garis py-1.5"><UserPlus size={15} /> Admin</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      {cipta && <CiptaSekolah tutup={() => setCipta(false)} selesai={() => { setCipta(false); setTapis('aktif'); void muat() }} />}
      {tambahAdmin && <TambahAdmin s={tambahAdmin} tutup={() => setTambahAdmin(null)} selesai={() => { setTambahAdmin(null); void muat() }} />}
    </div>
  )
}

function CiptaSekolah({ tutup, selesai }: { tutup: () => void; selesai: () => void }) {
  const kini = new Date()
  const [f, setF] = useState({ kod: '', nama: '', jenis: 'SK' as JenisSekolah, daerah: '', negeri: '', nama_ketua: '', emel: '', telefon: '', tahun: kini.getFullYear() + (kini.getMonth() >= 9 ? 1 : 0) })
  const [ralat, setRalat] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const hantar = async () => {
    setSibuk(true); setRalat(null)
    const { data, error } = await supabase!.rpc('pemilik_cipta_sekolah', {
      p_kod: f.kod, p_nama: f.nama, p_jenis: f.jenis, p_emel_admin: f.emel, p_daerah: f.daerah || null, p_negeri: f.negeri || null,
      p_nama_ketua: f.nama_ketua || null, p_tahun: f.tahun, p_pilihan: [], p_telefon: f.telefon || null,
    })
    setSibuk(false)
    if (error) return setRalat(error.message.includes('sekolah_kod_check') ? 'Format kod sekolah: 3 huruf + 4 nombor (cth. ABA1234)' : error.message)
    void data
    selesai()
  }
  return (
    <Modal buka tutup={tutup} tajuk="Daftar sekolah (terus aktif)" lebar="max-w-lg"
      sub="Templat JK MySG disediakan automatik. Admin sekolah dilantik melalui e-mel — jika belum pernah log masuk, dia dijemput dan menjadi admin sebaik log masuk.">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-navy-50 p-1">
          {(['SK', 'SMK'] as JenisSekolah[]).map((j) => <button key={j} onClick={() => setF({ ...f, jenis: j })} className={`rounded-xl py-2 text-sm font-bold ${f.jenis === j ? 'bg-white shadow-card' : 'text-navy-500'}`}>{j === 'SK' ? 'Sekolah Rendah' : 'Sekolah Menengah'}</button>)}
        </div>
        <div className="grid grid-cols-[130px_1fr] gap-3">
          <div><label className="label">Kod</label><input className="input uppercase font-mono" maxLength={7} placeholder="ABA1234" value={f.kod} onChange={(e) => setF({ ...f, kod: e.target.value.toUpperCase() })} /></div>
          <div><label className="label">Nama sekolah</label><input className="input" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></div>
          <div><label className="label">Daerah</label><input className="input" value={f.daerah} onChange={(e) => setF({ ...f, daerah: e.target.value })} /></div>
          <div><label className="label">Negeri</label><input className="input" value={f.negeri} onChange={(e) => setF({ ...f, negeri: e.target.value })} /></div>
        </div>
        <div><label className="label">E-mel admin sekolah</label><input className="input" placeholder="pentadbir@moe-dl.edu.my" value={f.emel} onChange={(e) => setF({ ...f, emel: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nama {f.jenis === 'SK' ? 'Guru Besar' : 'Pengetua'}</label><input className="input" value={f.nama_ketua} onChange={(e) => setF({ ...f, nama_ketua: e.target.value })} /></div>
          <div><label className="label">Telefon</label><input className="input" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} /></div>
        </div>
        {ralat && <div className="text-sm text-rose-600">{ralat}</div>}
        <div className="flex justify-end gap-2 pt-1"><button onClick={tutup} className="btn-hantu">Batal</button>
          <button disabled={sibuk || !f.kod || !f.nama || !f.emel.includes('@')} onClick={hantar} className="btn-utama"><Plus size={15} /> Daftar & aktifkan</button></div>
      </div>
    </Modal>
  )
}

function TambahAdmin({ s, tutup, selesai }: { s: SekolahPemilik; tutup: () => void; selesai: () => void }) {
  const [emel, setEmel] = useState('')
  const [peranan, setPeranan] = useState<'admin' | 'gb'>('admin')
  const [ralat, setRalat] = useState<string | null>(null)
  const hantar = async () => {
    const { error } = await supabase!.rpc('pemilik_tambah_admin', { p_school: s.id, p_emel: emel, p_peranan: peranan })
    if (error) setRalat(error.message); else selesai()
  }
  return (
    <Modal buka tutup={tutup} tajuk={`Lantik admin · ${s.nama}`} lebar="max-w-md" sub="Jika e-mel belum pernah log masuk, jemputan disimpan dan diaktifkan sebaik dia log masuk.">
      <div className="space-y-3">
        <input autoFocus className="input" placeholder="e-mel@moe-dl.edu.my" value={emel} onChange={(e) => setEmel(e.target.value)} />
        <select className="input" value={peranan} onChange={(e) => setPeranan(e.target.value as 'admin' | 'gb')}><option value="admin">Admin sekolah</option><option value="gb">GB / Pengetua</option></select>
        {ralat && <div className="text-sm text-rose-600">{ralat}</div>}
        <div className="flex justify-end gap-2"><button onClick={tutup} className="btn-hantu">Batal</button><button disabled={!emel.includes('@')} onClick={hantar} className="btn-utama">Lantik</button></div>
      </div>
    </Modal>
  )
}
