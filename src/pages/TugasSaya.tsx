import { useEffect, useState } from 'react'
import { Award, MessageSquarePlus, Printer, Send, UserRound } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { BarIndeks, CipStatus, Kosong, WARNA_BIDANG, f1, f2 } from '../components/ui'
import { SatuSurat } from './Surat'
import { kiraSatu, ringkas, type BarisIndeks, type HasilIndeks } from '../lib/indeks'
import { supabase } from '../lib/supabase'
import { SejarahGuru } from '../components/SejarahGuru'

export default function TugasSaya() {
  const { k, guruSaya, stor, peranan, ubah } = useAplikasi()
  const [rekod, setRekod] = useState(false)
  const [mesej, setMesej] = useState('')
  const [dihantar, setDihantar] = useState(false)
  const [hasil, setHasil] = useState<{ h: HasilIndeks; medianMasa: number; kedudukan: number; jumlah: number } | null>(null)
  const [surat, setSurat] = useState(false)

  useEffect(() => {
    if (!k || !guruSaya) return
    // Guru biasa (live) tidak boleh baca data guru lain → guna RPC tanpa nama
    if (stor?.mod === 'live' && peranan === 'guru' && supabase) {
      const id = k.data.sekolah.id
      void Promise.all([
        supabase.rpc('data_indeks', { p_school: id, p_tahun: k.data.sekolah.tahun_semasa }),
        supabase.rpc('jumlah_skor_slot', { p_school: id }),
      ]).then(([a, b]) => {
        const rows = (a.data ?? []) as { saya: boolean; masa: number; kelas_peperiksaan: boolean; dikira: boolean; faktor_gred: number; skor: number; relief: number; luar: number }[]
        // Sama seperti binaKonteks: relief → masa; tugas luar lain → skor & sasaran purata
        const baris: BarisIndeks[] = rows.map((r, i) => ({ id: r.saya ? guruSaya : `x${i}`, masa: Number(r.masa), relief: Number(r.relief), kelas_peperiksaan: r.kelas_peperiksaan, dikira: r.dikira, faktor_gred: Number(r.faktor_gred), skor: Number(r.skor) + Number(r.luar) }))
        const jumlahLuar = rows.reduce((x, r) => x + Number(r.luar), 0)
        const rk = ringkas(baris, k.data.tetapan, Number(b.data ?? 0) + jumlahLuar)
        const semua = baris.filter((x) => x.dikira).map((x) => kiraSatu(x, k.data.tetapan, rk).indeks)
        const saya = baris.find((x) => x.id === guruSaya)
        if (!saya) return
        const h = kiraSatu(saya, k.data.tetapan, rk)
        setHasil({ h, medianMasa: rk.medianMasa, kedudukan: semua.filter((v) => v < h.indeks).length, jumlah: semua.length })
      })
    } else {
      const h = k.hasil.get(guruSaya)
      if (!h) return
      const semua = [...k.hasil.values()].filter((x) => x.status !== 'dikecualikan').map((x) => x.indeks)
      setHasil({ h, medianMasa: k.ringkasan.medianMasa, kedudukan: semua.filter((v) => v < h.indeks).length, jumlah: semua.length })
    }
  }, [k, guruSaya, stor, peranan])

  if (!k) return null
  const g = guruSaya ? k.data.guru.find((x) => x.id === guruSaya) : null
  if (!g) return (
    <div className="kad"><Kosong ikon={<UserRound />} tajuk="Akaun belum dipautkan" teks="E-mel log masuk anda tidak sepadan dengan mana-mana guru. Minta pentadbir sekolah masukkan e-mel DELIMa anda dalam senarai guru." /></div>
  )
  const t = k.data.tetapan
  const tugas = (k.lantikanGuru.get(g.id) ?? []).map((sid) => {
    const s = k.data.slot.find((x) => x.id === sid)!
    const jk = k.data.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    return { s, jk, b: k.data.bidang.find((x) => x.id === jk.bidang_id), p: k.data.peranan.find((x) => x.id === s.peranan_id)!, skor: k.skorSlot.get(sid) ?? 0 }
  }).sort((a, b) => b.skor - a.skor)
  const pc = hasil ? Math.round((hasil.kedudukan / Math.max(1, hasil.jumlah)) * 100) : 0

  const mbSaya = k.data.maklumBalas.filter((m) => m.guru_id === g.id)
  const hantar = async () => {
    await ubah((st) => st.simpan('maklum_balas', { guru_id: g.id, tahun: k.data.sekolah.tahun_semasa, mesej: mesej.trim() }))
    setMesej(''); setDihantar(true)
  }

  if (rekod) return (
    <div>
      <div className="no-print flex gap-2 mb-4"><button onClick={() => setRekod(false)} className="btn-garis">← Kembali</button><button onClick={() => window.print()} className="btn-utama"><Printer size={16} /> Cetak / PDF</button></div>
      <div className="bg-white shadow-card print:shadow-none rounded-2xl p-10 text-black text-[13px] max-w-3xl">
        <div className="text-center border-b-2 border-black pb-3">
          <div className="font-bold uppercase">{k.data.sekolah.nama}</div>
          <div className="font-bold mt-1">REKOD SUMBANGAN TUGAS GURU</div>
        </div>
        <table className="mt-4 text-[13px]"><tbody>
          <tr><td className="pr-4 py-0.5">Nama</td><td>: <b>{g.nama}</b></td></tr>
          <tr><td className="pr-4 py-0.5">Gred</td><td>: {k.data.gred.find((x) => x.id === g.gred_id)?.kod ?? '—'}</td></tr>
          <tr><td className="pr-4 py-0.5">Dijana</td><td>: {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        </tbody></table>
        <div className="mt-6"><SejarahGuru guruId={g.id} cetak /></div>
        <p className="mt-8 text-[11px] text-gray-500">Dijana oleh AGIH360 daripada rekod lantikan rasmi sekolah. Sesuai dilampirkan sebagai bukti sumbangan (PBPPP / kenaikan pangkat).</p>
      </div>
    </div>
  )

  if (surat) return (
    <div>
      <div className="no-print flex gap-2 mb-4"><button onClick={() => setSurat(false)} className="btn-garis">← Kembali</button><button onClick={() => window.print()} className="btn-utama"><Printer size={16} /> Cetak / PDF</button></div>
      <SatuSurat k={k} guruId={g.id} bil={1} />
    </div>
  )

  return (
    <div className="animate-naik max-w-4xl">
      <TajukHalaman tajuk={`Salam, ${g.nama.replace(/ (bin|binti|a\/l|a\/p|anak) .*/i, '')}`} sub={`Tugas anda bagi sesi ${k.data.sekolah.tahun_semasa}`}
        tindakan={tugas.length > 0 && <button onClick={() => setSurat(true)} className="btn-utama"><Printer size={16} /> Surat lantikan saya</button>} />
      {hasil && (
        <div className="grid sm:grid-cols-[260px_1fr] gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 text-white p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/30 blur-2xl" />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-wider text-navy-300 font-bold">Indeks beban anda</div>
              <div className="font-display text-6xl font-black mt-2">{f2(hasil.h.indeks)}</div>
              <div className="mt-2"><CipStatus s={hasil.h.status} /></div>
            </div>
          </div>
          <div className="kad p-5">
            <div className="text-sm text-navy-600">Berbanding guru lain di sekolah anda</div>
            <div className="mt-3"><BarIndeks nilai={hasil.h.indeks} rendah={t.ambang_rendah} tinggi={t.ambang_tinggi} /></div>
            <div className="flex justify-between text-[11px] text-navy-400 mt-1 font-mono"><span>0</span><span>1.00 median</span><span>2.0</span></div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-navy-50 p-3"><div className="font-display text-2xl font-black">{f1(hasil.h.masaLaras)}</div><div className="text-[11px] text-navy-500">masa mengajar<br />(median {hasil.medianMasa})</div></div>
              <div className="rounded-xl bg-navy-50 p-3"><div className="font-display text-2xl font-black">{f1(hasil.h.skor)}</div><div className="text-[11px] text-navy-500">mata tugas<br />(sasaran {f1(hasil.h.sasaran)})</div></div>
              <div className="rounded-xl bg-navy-50 p-3"><div className="font-display text-2xl font-black">{pc}%</div><div className="text-[11px] text-navy-500">guru lebih<br />ringan daripada anda</div></div>
            </div>
            <p className="mt-3 text-xs text-navy-500">Mata tugas anda = <b>{f1(hasil.h.nisbahTugas)}×</b> sasaran untuk gred anda.</p>
          </div>
        </div>
      )}
      <div className="kad p-5 mt-4">
        <h3 className="font-bold mb-3">Jawatan saya ({tugas.length})</h3>
        <div className="space-y-2">
          {tugas.map(({ s, jk, b, p, skor }) => {
            const w = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3">
                <div className={`h-10 w-10 rounded-xl ${w.bg} ${w.teks} flex items-center justify-center font-bold text-xs`}>{b?.nama.slice(0, 3).toUpperCase()}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{jk.nama}</div><div className="text-xs text-navy-500">{s.label || p.nama}</div></div>
                <span className="cip bg-emas-400/20 text-emas-600">{f1(skor)} mata</span>
              </div>
            )
          })}
          {tugas.length === 0 && <p className="text-sm text-navy-500">Belum ada jawatan dilantik.</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="kad p-5">
          <h3 className="font-bold flex items-center gap-2"><Award size={18} className="text-emas-500" /> Sejarah tugas saya</h3>
          <p className="text-xs text-navy-500 mb-3">Rekod jawatan 3 tahun — boleh dicetak sebagai bukti sumbangan.</p>
          <button onClick={() => setRekod(true)} className="btn-garis w-full"><Printer size={15} /> Cetak rekod sumbangan</button>
        </div>
        <div className="kad p-5">
          <h3 className="font-bold flex items-center gap-2"><MessageSquarePlus size={18} /> Maklum balas kepada pentadbir</h3>
          <p className="text-xs text-navy-500 mb-2">Contoh: tugas luar yang belum direkod, atau jawatan yang tidak tepat.</p>
          <textarea rows={3} className="input" value={mesej} onChange={(e) => { setMesej(e.target.value); setDihantar(false) }} placeholder="Tulis maklum balas anda…" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-brand-700">{dihantar && 'Dihantar ✓'}</span>
            <button disabled={mesej.trim().length < 3} onClick={hantar} className="btn-utama py-1.5 text-xs"><Send size={13} /> Hantar</button>
          </div>
          {mbSaya.map((m) => (
            <div key={m.id} className="mt-3 rounded-xl border border-navy-100 p-2.5 text-xs">
              <div>{m.mesej}</div>
              {m.balasan ? <div className="mt-1.5 text-brand-700"><b>Balasan:</b> {m.balasan}</div> : <div className="mt-1 text-amber-700">Menunggu jawapan</div>}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-navy-400 italic">Indeks Beban ialah alat bantu keputusan, bukan penilaian prestasi. Anda hanya boleh melihat data anda sendiri.</p>
    </div>
  )
}
