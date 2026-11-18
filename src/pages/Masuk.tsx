import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Clock, Mail, PauseCircle, RefreshCw } from 'lucide-react'
import { useAplikasi, type Keahlian } from '../context/Aplikasi'
import { Logo } from '../components/ui'
import { supabase, supabaseAda } from '../lib/supabase'
import type { JenisSekolah } from '../lib/types'

function Bingkai({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-navy-950 text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-emas-400/15 blur-3xl" />
        <Link to="/" className="relative"><Logo terang /></Link>
        <div className="relative">
          <h2 className="text-4xl font-black leading-tight">Amanah diagih,<br /><span className="text-brand-400">beban ditimbang.</span></h2>
          <p className="text-navy-300 mt-4 max-w-sm">Setiap jawatan ada pemberatnya. Setiap guru ada angkanya. Mesyuarat agihan tugas jadi lebih tenang.</p>
        </div>
        <div className="relative text-xs text-navy-400">Data setiap sekolah diasingkan sepenuhnya.</div>
      </div>
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden mb-6 inline-block"><img src="/logo-penuh.png" alt="AGIH360" className="h-28 w-28 object-contain" /></Link>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LogMasuk() {
  const { sesi, keahlian, keahlianSedia, mulaDemo, pemilik } = useAplikasi()
  const nav = useNavigate()
  const [emel, setEmel] = useState('')
  const [kod, setKod] = useState('')
  const [hantar, setHantar] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [ralat, setRalat] = useState<string | null>(null)

  useEffect(() => {
    if (sesi && keahlianSedia) nav(keahlian.length ? '/app' : pemilik ? '/pemilik' : '/daftar', { replace: true })
  }, [sesi, keahlian, keahlianSedia, pemilik, nav])

  const google = async () => {
    setRalat(null)
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/log-masuk`, queryParams: { hd: 'moe-dl.edu.my', prompt: 'select_account' } },
    })
    if (error) setRalat('Log masuk Google belum diaktifkan. Guna e-mel buat masa ini.')
  }
  const mintaKod = async () => {
    setSibuk(true); setRalat(null)
    const { error } = await supabase!.auth.signInWithOtp({ email: emel.trim(), options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/log-masuk` } })
    setSibuk(false)
    if (error) setRalat(error.message); else setHantar(true)
  }
  const sahKod = async () => {
    setSibuk(true); setRalat(null)
    const { error } = await supabase!.auth.verifyOtp({ email: emel.trim(), token: kod.trim(), type: 'email' })
    setSibuk(false)
    if (error) setRalat('Kod tidak sah atau tamat tempoh.')
  }

  return (
    <Bingkai>
      <h1 className="text-3xl font-black">Log masuk</h1>
      <p className="text-navy-500 mt-1 text-sm">Pentadbir, PK dan guru guna pintu yang sama.</p>
      {!supabaseAda ? (
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm">Pelayan belum dikonfigurasi. Cuba mod demo dahulu.</div>
      ) : (
        <>
          <button onClick={google} className="mt-8 w-full btn-garis py-3">
            <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
            Log masuk dengan DELIMa
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-navy-400"><div className="h-px flex-1 bg-navy-100" />atau kod e-mel<div className="h-px flex-1 bg-navy-100" /></div>
          {!hantar ? (
            <div className="space-y-3">
              <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-9 py-2.5" type="email" placeholder="nama@moe-dl.edu.my" value={emel} onChange={(e) => setEmel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && mintaKod()} /></div>
              <button disabled={!emel.includes('@') || sibuk} onClick={mintaKod} className="btn-utama w-full py-2.5">Hantar kod 6 digit</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-navy-600">Kod 6 digit dihantar ke <b>{emel}</b>. Semak juga folder Spam/Promosi.</p>
              <input autoFocus inputMode="numeric" maxLength={6} className="input py-3 text-center text-2xl font-mono tracking-[.5em]" placeholder="••••••" value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && sahKod()} />
              <button disabled={kod.length !== 6 || sibuk} onClick={sahKod} className="btn-utama w-full py-2.5">Sahkan & masuk</button>
              <button onClick={() => { setHantar(false); setKod('') }} className="btn-hantu w-full text-xs">Tukar e-mel</button>
            </div>
          )}
          {ralat && <div className="mt-3 text-sm text-rose-600">{ralat}</div>}
        </>
      )}
      <div className="mt-10 text-center"><button onClick={() => { mulaDemo('SK'); nav('/app') }} className="text-[10px] text-navy-300 hover:text-navy-500 hover:underline">demo</button></div>
    </Bingkai>
  )
}

export function DaftarSekolah() {
  const { sesi, muatKeahlian, keahlian, keluar } = useAplikasi()
  const nav = useNavigate()
  const kini = new Date()
  const sesiLalai = kini.getFullYear() + (kini.getMonth() >= 9 ? 1 : 0)  // Okt ke atas → rancang sesi tahun depan
  const [f, setF] = useState({ kod: '', nama: '', jenis: 'SK' as JenisSekolah, daerah: '', negeri: '', nama_ketua: '', telefon: '', tahun: sesiLalai })
  const [pilihan, setPilihan] = useState<string[]>([])
  const SYARAT: { k: string; l: string; untuk: JenisSekolah[] }[] = [
    { k: 'prasekolah', l: 'Ada kelas prasekolah', untuk: ['SK'] },
    { k: 'ppki', l: 'Ada Program Pendidikan Khas (PPKI)', untuk: ['SK', 'SMK'] },
    { k: 'asrama', l: 'Ada asrama', untuk: ['SK', 'SMK'] },
    { k: 'orang_asal', l: 'Ada murid Orang Asal', untuk: ['SK', 'SMK'] },
    { k: 't6', l: 'Ada Tingkatan Enam', untuk: ['SMK'] },
    { k: 'skm', l: 'Program Sijil Kemahiran Malaysia (SKM)', untuk: ['SMK'] },
    { k: 'pima', l: 'Program Perantisan Industri (PIMA)', untuk: ['SMK'] },
  ]
  const [sibuk, setSibuk] = useState(false)
  const [ralat, setRalat] = useState<string | null>(null)
  useEffect(() => { if (!sesi && supabaseAda) nav('/log-masuk') }, [sesi, nav])

  const daftar = async () => {
    setSibuk(true); setRalat(null)
    const { error } = await supabase!.rpc('daftar_sekolah', {
      p_kod: f.kod, p_nama: f.nama, p_jenis: f.jenis, p_daerah: f.daerah || null, p_negeri: f.negeri || null, p_nama_ketua: f.nama_ketua || null, p_tahun: f.tahun, p_telefon: f.telefon || null,
      p_pilihan: pilihan.filter((x) => SYARAT.find((y) => y.k === x)?.untuk.includes(f.jenis)),
    })
    setSibuk(false)
    if (error) return setRalat(error.message.includes('sekolah_kod_check') ? 'Format kod sekolah: 3 huruf + 4 nombor (cth. ABA1234)' : error.message)
    await muatKeahlian()
    location.assign('/app')
  }
  return (
    <Bingkai>
      {keahlian.length > 0 && <Link to="/app" className="btn-hantu -ml-3 mb-4"><ArrowLeft size={16} /> Kembali ke sistem</Link>}
      <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><Building2 /></div>
      <h1 className="text-3xl font-black mt-4">Daftar sekolah</h1>
      <p className="text-navy-500 mt-1 text-sm">Anda akan menjadi pentadbir. Senarai jawatankuasa ikut MySG ({f.jenis === 'SK' ? 'JR01–JR23' : 'JM01–JM33'}), bidang tugas dan pemberat lalai disediakan automatik.</p>
      <p className="text-xs text-navy-400 mt-3">Guru biasa tidak perlu daftar. Cukup log masuk dengan DELIMa, dan tugas anda dipaparkan selepas pentadbir memasukkan e-mel anda.</p>
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-navy-50 p-1">
          {(['SK', 'SMK'] as JenisSekolah[]).map((j) => <button key={j} onClick={() => setF({ ...f, jenis: j })} className={`rounded-xl py-2 text-sm font-bold ${f.jenis === j ? 'bg-white shadow-card' : 'text-navy-500'}`}>{j === 'SK' ? 'Sekolah Rendah' : 'Sekolah Menengah'}</button>)}
        </div>
        <div><label className="label">Kod sekolah</label><input className="input uppercase font-mono" maxLength={7} placeholder="ABA1234" value={f.kod} onChange={(e) => setF({ ...f, kod: e.target.value.toUpperCase() })} /></div>
        <div><label className="label">Nama sekolah</label><input className="input" placeholder={f.jenis === 'SK' ? 'SK Taman Ilmu' : 'SMK Taman Ilmu'} value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Daerah</label><input className="input" value={f.daerah} onChange={(e) => setF({ ...f, daerah: e.target.value })} /></div>
          <div><label className="label">Negeri</label><input className="input" value={f.negeri} onChange={(e) => setF({ ...f, negeri: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div><label className="label">Nama {f.jenis === 'SK' ? 'Guru Besar' : 'Pengetua'}</label><input className="input" value={f.nama_ketua} onChange={(e) => setF({ ...f, nama_ketua: e.target.value })} /></div>
          <div><label className="label">Sesi agihan</label>
            <select className="input" value={f.tahun} onChange={(e) => setF({ ...f, tahun: Number(e.target.value) })}>
              {[kini.getFullYear(), kini.getFullYear() + 1].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
        </div>
        <div className="rounded-2xl border border-navy-100 p-3">
          <div className="label">Jawatankuasa ikut MySG</div>
          <p className="text-[11px] text-navy-500 mb-2">4 JK Pengurusan Utama (wajib) dan JK standard MySG disediakan automatik. Tanda yang berkaitan dengan sekolah anda:</p>
          <div className="grid gap-1">
            {SYARAT.filter((x) => x.untuk.includes(f.jenis)).map((x) => (
              <label key={x.k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-500" checked={pilihan.includes(x.k)} onChange={(e) => setPilihan(e.target.checked ? [...pilihan, x.k] : pilihan.filter((y) => y !== x.k))} />{x.l}</label>
            ))}
          </div>
        </div>
        <div><label className="label">No. telefon untuk dihubungi</label><input className="input" placeholder="012-3456789" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} /></div>
        <p className="text-[11px] text-navy-500">Permohonan akan disemak oleh pemilik AGIH360. Anda boleh mula guna sebaik diluluskan.</p>
        {ralat && <div className="text-sm text-rose-600">{ralat}</div>}
        <button disabled={sibuk || !f.kod || !f.nama} onClick={daftar} className="btn-utama w-full py-3">{sibuk ? 'Menghantar…' : 'Hantar permohonan'}</button>
        {sesi && <button onClick={async () => { await keluar(); nav('/') }} className="btn-hantu w-full text-xs">Log keluar ({sesi.user.email})</button>}
      </div>
    </Bingkai>
  )
}

/** Skrin bagi sekolah yang menunggu kelulusan atau digantung */
export function SekolahTidakAktif({ kh }: { kh: Keahlian }) {
  const { keahlian, pilihSekolah, keluar, muatKeahlian, sesi } = useAplikasi()
  const nav = useNavigate()
  const menunggu = kh.status === 'menunggu'
  const lain = keahlian.filter((x) => x.school_id !== kh.school_id)
  return (
    <Bingkai>
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${menunggu ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{menunggu ? <Clock /> : <PauseCircle />}</div>
      <h1 className="text-3xl font-black mt-4">{menunggu ? 'Menunggu kelulusan' : 'Akaun sekolah digantung'}</h1>
      <p className="text-navy-600 mt-2 text-sm"><b>{kh.nama}</b> ({kh.kod})</p>
      <p className="text-navy-500 mt-3 text-sm">{menunggu
        ? 'Permohonan anda telah diterima dan sedang disemak oleh pemilik AGIH360. Anda akan boleh menggunakan sistem sebaik diluluskan. Semak semula sebentar lagi.'
        : 'Akses sekolah ini digantung buat sementara. Data tidak dipadam. Sila hubungi pemilik AGIH360 untuk maklumat lanjut.'}</p>
      <div className="mt-6 space-y-2">
        <button onClick={async () => { await muatKeahlian(); location.reload() }} className="btn-utama w-full"><RefreshCw size={15} /> Semak semula status</button>
        {lain.map((x) => <button key={x.school_id} onClick={() => pilihSekolah(x.school_id)} className="btn-garis w-full">Buka {x.nama}</button>)}
        <button onClick={async () => { await keluar(); nav('/') }} className="btn-hantu w-full text-xs">Log keluar ({sesi?.user.email})</button>
      </div>
    </Bingkai>
  )
}
