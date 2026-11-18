import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, ClipboardPaste, FileText, History, Scale, ShieldCheck, Sparkles, UsersRound, Vote, Wand2 } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { Logo } from '../components/ui'

export default function Utama() {
  const { mulaDemo, sesi } = useAplikasi()
  const nav = useNavigate()
  const demo = (j: 'SK' | 'SMK') => { mulaDemo(j); nav('/app') }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute -bottom-52 -left-32 h-[460px] w-[460px] rounded-full bg-emas-400/15 blur-3xl" />

        <header className="relative max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <Logo terang />
          <div className="flex items-center gap-2">
            <a href="#cara" className="hidden sm:inline btn text-navy-200 hover:text-white">Cara kira</a>
            <Link to={sesi ? '/app' : '/log-masuk'} className="btn bg-white/10 hover:bg-white/15 text-white">{sesi ? 'Buka sistem' : 'Log masuk'}</Link>
          </div>
        </header>

        <div className="relative max-w-6xl mx-auto px-5 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-naik">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-emas-300">
              <Sparkles size={14} /> Untuk SK & SMK seluruh Malaysia
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-black leading-[1.05]">
              Agih tugas guru,<br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emas-400 bg-clip-text text-transparent">tanpa agak-agak.</span>
            </h1>
            <p className="mt-5 text-lg text-navy-200 max-w-lg">
              "Cikgu tu dah banyak kerja" — banyak berbanding siapa? AGIH360 menimbang setiap jawatan dan masa mengajar,
              lalu memberi satu angka yang adil untuk setiap guru.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => demo('SK')} className="btn-utama px-6 py-3 text-base">Cuba demo SK <ArrowRight size={18} /></button>
              <button onClick={() => demo('SMK')} className="btn bg-white/10 hover:bg-white/15 text-white px-6 py-3 text-base">Demo SMK</button>
              <Link to="/log-masuk" className="btn text-emas-300 hover:text-emas-400 px-4 py-3">Daftar sekolah →</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-300">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-400" /> Data setiap sekolah terasing</span>
              <span className="flex items-center gap-2"><UsersRound size={16} className="text-brand-400" /> Log masuk DELIMa</span>
            </div>
          </div>

          {/* Kad pratonton */}
          <div className="relative animate-naik [animation-delay:.15s]">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/30 to-emas-400/20 blur-2xl" />
            <div className="relative rounded-3xl bg-white text-navy-900 shadow-pop p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-navy-400">Setiausaha · JK Disiplin Murid</div>
                  <div className="font-display font-bold text-lg">Pilih guru</div>
                </div>
                <span className="cip bg-emas-400/20 text-emas-600">= 12 mata</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ['Cik Amira Syazwani', 0.52, 0.78, true],
                  ['En. Khairul Anuar', 0.71, 0.97, true],
                  ['Pn. Elizabeth Ngau', 0.84, 1.1, false],
                  ['En. Mohd Faizal', 1.42, 1.68, false],
                ].map(([n, a, b, ok]) => (
                  <div key={n as string} className={`rounded-2xl border p-3 ${ok ? 'border-brand-200 bg-brand-50/50' : 'border-navy-100'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{n as string}</span>
                      <span className="font-mono text-xs font-semibold">{(a as number).toFixed(2)} → <span className={(b as number) > 1.3 ? 'text-rose-600' : 'text-brand-700'}>{(b as number).toFixed(2)}</span></span>
                    </div>
                    <div className="relative mt-2 h-2 rounded-full bg-navy-100 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-brand-500/25" style={{ width: `${(b as number) * 50}%` }} />
                      <div className={`absolute inset-y-0 left-0 rounded-full ${(a as number) > 1.3 ? 'bg-rose-500' : (a as number) < 0.7 ? 'bg-sky-500' : 'bg-brand-500'}`} style={{ width: `${(a as number) * 50}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-navy-500 flex items-center gap-1.5"><Sparkles size={13} className="text-emas-500" /> Guru paling ringan disusun paling atas</div>
            </div>
          </div>
        </div>
      </section>

      {/* MASALAH */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-brand-600 font-bold text-sm uppercase tracking-widest">Kenapa AGIH360</div>
          <h2 className="text-3xl sm:text-4xl font-black mt-2">"Dia kan senior. Dia kan muda. Dia kan rajin."</h2>
          <p className="text-navy-500 mt-3">Tanpa sedar, nama yang sama keluar lagi dan lagi. Guru yang bekerja senyap jarang dikira. AGIH360 menukar perasaan kepada angka yang boleh dirujuk dalam mesyuarat.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            [ClipboardPaste, 'Tampal terus dari Excel', 'Salin senarai guru dari Excel atau Google Sheet, tampal, siap. Tiada taip semula.'],
            [Scale, 'Indeks Beban satu angka', 'Masa mengajar + skor jawatankuasa, dibanding dengan median sekolah sendiri. 1.00 = setara.'],
            [Wand2, 'Pratonton sebelum lantik', 'Nampak terus 0.78 → 0.97 jika dilantik. Calon paling ringan di atas, dengan amaran automatik.'],
            [BarChart3, 'Papan pemuka telus', 'Siapa terbeban, siapa ada ruang, siapa belum ditugaskan, JK mana masih kosong — sekali pandang.'],
            [FileText, 'Surat lantikan sekali klik', 'Jana surat untuk semua guru dengan Lampiran senarai tugas. Cetak atau simpan PDF.'],
            [History, 'Salin tahun lepas', 'Mula sesi baharu dengan lantikan tahun lepas, kemudian laras. Guru bertukar keluar diabaikan.'],
          ].map(([I, t, d]) => {
            const Ikon = I as typeof Scale
            return (
              <div key={t as string} className="kad p-6 hover:shadow-pop transition">
                <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Ikon size={22} /></div>
                <h3 className="font-bold text-lg mt-4">{t as string}</h3>
                <p className="text-sm text-navy-500 mt-1.5">{d as string}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CARA KIRA */}
      <section id="cara" className="bg-slate-50 border-y border-navy-100">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-brand-600 font-bold text-sm uppercase tracking-widest">Cara kira</div>
            <h2 className="text-3xl sm:text-4xl font-black mt-2">Telus. Boleh diubah ikut mesyuarat sekolah.</h2>
            <p className="text-navy-500 mt-3">Semua pemberat ditetapkan oleh sekolah sendiri. Nilai di bawah ialah lalai yang munasabah untuk bermula.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-3"><span className="cip bg-navy-900 text-white h-fit">1</span><span><b>Skor tugas</b> = tahap JK (Utama 3 · Sokongan 2 · Sampingan 1) × berat peranan (Pengerusi 5 · Setiausaha 4 · AJK 1 …) × tempoh (Setahun 1.0 · Bermusim 0.6 · Program 0.3)</span></li>
              <li className="flex gap-3"><span className="cip bg-navy-900 text-white h-fit">2</span><span><b>Masa mengajar</b> seminggu, kelas peperiksaan ×1.2</span></li>
              <li className="flex gap-3"><span className="cip bg-navy-900 text-white h-fit">3</span><span><b>Gred dikira</b> — guru DG13 dijangka memikul lebih daripada DG9, selaras Deskripsi Tugas</span></li>
              <li className="flex gap-3"><span className="cip bg-navy-900 text-white h-fit">4</span><span><b>Indeks</b> = 60% nisbah mengajar + 40% nisbah tugas. GB/PK/GKMP dikecualikan daripada median.</span></li>
            </ul>
          </div>
          <div className="kad p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-navy-400">Contoh: Pn. Siti, DG10</div>
            <div className="mt-4 font-mono text-sm space-y-2">
              <div className="flex justify-between"><span>Masa mengajar</span><span>28 ÷ median 30 = <b>0.93</b></span></div>
              <div className="flex justify-between"><span>Skor tugas</span><span>14.0 ÷ sasaran 13.1 = <b>1.07</b></span></div>
              <div className="h-px bg-navy-100 my-3" />
              <div className="flex justify-between"><span>0.6 × 0.93 + 0.4 × 1.07</span><span className="text-brand-700 font-bold text-lg">0.99</span></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <div className="rounded-xl bg-sky-50 text-sky-700 p-2">&lt; 0.70<br />Ada ruang</div>
              <div className="rounded-xl bg-brand-50 text-brand-700 p-2">0.70 – 1.30<br />Seimbang</div>
              <div className="rounded-xl bg-rose-50 text-rose-700 p-2">&gt; 1.30<br />Terbeban</div>
            </div>
            <p className="mt-4 text-xs text-navy-500 italic">Indeks Beban ialah alat bantu keputusan, bukan penilaian prestasi. Indeks rendah mungkin guru baharu atau baru kembali bertugas.</p>
          </div>
        </div>
      </section>

      {/* AKAN DATANG */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-black">Lebih adil daripada sekadar angka.</h2>
              <p className="text-navy-300 mt-3">Dibina daripada maklum balas guru di seluruh negara. Dalam pembangunan:</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[[Vote, 'Undian pemberat oleh guru'], [History, 'Giliran merentas tahun'], [Wand2, 'Auto-agih satu butang'], [ShieldCheck, 'Aliran kelulusan GB/Pengetua']].map(([I, t]) => {
                const Ikon = I as typeof Vote
                return <div key={t as string} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3"><Ikon size={18} className="text-emas-400" />{t as string}</div>
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100 py-8 text-center text-sm text-navy-400">
        <div className="flex justify-center"><img src="/logo-penuh.png" alt="AGIH360" className="h-24 w-24 object-contain" /></div> <div className="mt-3">© {new Date().getFullYear()} AGIH360 · Dibina oleh guru, untuk guru.</div>
      </footer>
    </div>
  )
}
