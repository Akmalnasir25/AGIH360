import { useEffect, useState } from 'react'
import { ImagePlus, Plus, Save, Trash2, UserCog } from 'lucide-react'
import { mampatImej } from '../components/KepalaSurat'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import type { NamaJadual } from '../lib/stor'
import { supabase } from '../lib/supabase'
import type { Sekolah, Tetapan as T } from '../lib/types'
import { useSahkan } from '../components/ui'

export default function Tetapan() {
  const { k, ubah, stor } = useAplikasi()
  const [t, setT] = useState<T | null>(null)
  const [s, setS] = useState<Sekolah | null>(null)
  const [disimpan, setDisimpan] = useState(false)
  useEffect(() => { if (k) { setT(k.data.tetapan); setS(k.data.sekolah) } }, [k])
  if (!k || !t || !s) return null
  const d = k.data

  const simpanUmum = async () => {
    await ubah(async (st) => { await st.simpanTetapan(t); await st.simpanSekolah(s) })
    setDisimpan(true); setTimeout(() => setDisimpan(false), 2000)
  }

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Tetapan Pemberat" sub="Semua pemberat boleh diubah ikut keputusan mesyuarat sekolah. Indeks dikira semula serta-merta."
        tindakan={<button onClick={simpanUmum} className="btn-utama"><Save size={16} /> {disimpan ? 'Disimpan ✓' : 'Simpan tetapan'}</button>} />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="kad p-5">
          <h3 className="font-bold">Formula Indeks</h3>
          <p className="text-xs text-navy-500 mb-4">Indeks = w × nisbah mengajar + (1 − w) × nisbah tugas</p>
          <label className="label">Pemberat masa mengajar (w): {Math.round(t.w_mengajar * 100)}% mengajar · {Math.round((1 - t.w_mengajar) * 100)}% tugas</label>
          <input type="range" min={0} max={0.8} step={0.05} value={t.w_mengajar} onChange={(e) => setT({ ...t, w_mengajar: Number(e.target.value) })} className="w-full accent-brand-500" />
          <div className="flex justify-between text-[10px] text-navy-400 -mt-1">
            <button type="button" onClick={() => setT({ ...t, w_mengajar: 0 })} className="hover:text-brand-600">0% · tugas sahaja (sistem mata)</button>
            <button type="button" onClick={() => setT({ ...t, w_mengajar: 0.6 })} className="hover:text-brand-600">60% · lalai</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Nombor label="Ambang terbeban (>)" v={t.ambang_tinggi} set={(v) => setT({ ...t, ambang_tinggi: v })} step={0.05} />
            <Nombor label="Ambang ada ruang (<)" v={t.ambang_rendah} set={(v) => setT({ ...t, ambang_rendah: v })} step={0.05} />
            <Nombor label="Faktor kelas peperiksaan" v={t.faktor_peperiksaan} set={(v) => setT({ ...t, faktor_peperiksaan: v })} step={0.05} />
            <Nombor label="Had jawatan seorang guru" v={t.had_jawatan} set={(v) => setT({ ...t, had_jawatan: v })} step={1} />
          </div>
          <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={t.guna_faktor_gred} onChange={(e) => setT({ ...t, guna_faktor_gred: e.target.checked })} /> Ambil kira gred (gred tinggi dijangka memikul lebih)</label>
        </div>

        <div className="kad p-5">
          <h3 className="font-bold mb-4">Maklumat Sekolah (untuk surat)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nama sekolah</label><input className="input" value={s.nama} onChange={(e) => setS({ ...s, nama: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">Alamat</label><input className="input" value={s.alamat ?? ''} onChange={(e) => setS({ ...s, alamat: e.target.value })} /></div>
            <div><label className="label">Daerah</label><input className="input" value={s.daerah ?? ''} onChange={(e) => setS({ ...s, daerah: e.target.value })} /></div>
            <div><label className="label">Negeri</label><input className="input" value={s.negeri ?? ''} onChange={(e) => setS({ ...s, negeri: e.target.value })} /></div>
            <div><label className="label">Nama {s.jawatan_ketua ?? 'Guru Besar'}</label><input className="input" value={s.nama_ketua ?? ''} onChange={(e) => setS({ ...s, nama_ketua: e.target.value })} /></div>
            <div><label className="label">Sesi semasa</label><input type="number" className="input" value={s.tahun_semasa} onChange={(e) => setS({ ...s, tahun_semasa: Number(e.target.value) })} /></div>
            <div className="col-span-2"><label className="label">No. telefon sekolah</label><input className="input" value={s.telefon ?? ''} onChange={(e) => setS({ ...s, telefon: e.target.value })} placeholder="cth. 06-123 4567" /></div>
          </div>
          <div className="mt-5 pt-4 border-t border-navy-100 space-y-4">
            <div className="text-xs text-navy-500">Untuk cetakan <b>Surat Lantikan</b> &amp; <b>Senarai AJK</b>. Tekan <b>Simpan tetapan</b> selepas memuat naik.</div>
            <MuatImej label="Logo sekolah" nota="PNG/JPG segi empat. Dipapar di sebelah nama sekolah." nilai={s.logo_url} set={(v) => setS({ ...s, logo_url: v })} lebar={400} jenis="image/png" had={550000} kelas="h-20 w-20 object-contain" />
            <MuatImej label="Imej kepala surat penuh (pilihan)" nota="Hanya jika sekolah ada kepala surat siap (imej melintang, cth. 2000×400 px). Tidak perlu jika guna mod Format KPM — Jata Negara & logo sekolah dijana automatik." nilai={s.kepala_surat ?? null} set={(v) => setS({ ...s, kepala_surat: v })} lebar={2000} jenis="image/jpeg" had={1400000} kelas="w-full max-h-28 object-contain object-left" melintang />
          </div>
        </div>

        <JadualPemberat tajuk="Tahap Jawatankuasa" jadual="tahap" baris={d.tahap.map((x) => ({ id: x.id, nama: x.nama, nilai: x.faktor, susunan: x.susunan }))} medan="faktor" />
        <JadualPemberat tajuk="Tempoh" jadual="tempoh" baris={d.tempoh.map((x) => ({ id: x.id, nama: x.nama, nilai: x.faktor, susunan: x.susunan }))} medan="faktor" />
        <JadualPemberat tajuk="Berat Peranan" jadual="peranan_jk" baris={d.peranan.map((x) => ({ id: x.id, nama: x.nama, nilai: x.berat, susunan: x.susunan }))} medan="berat" />
        <JadualPemberat tajuk="Faktor Gred" jadual="gred" baris={d.gred.map((x) => ({ id: x.id, nama: x.kod, nilai: x.faktor, susunan: x.susunan, sub: x.peranan }))} medan="faktor" namaMedan="kod" />
      </div>
      {stor?.mod === 'live' && <Pengguna />}
    </div>
  )
}

function Nombor({ label, v, set, step }: { label: string; v: number; set: (n: number) => void; step: number }) {
  return <div><label className="label">{label}</label><input type="number" step={step} className="input" value={v} onChange={(e) => set(Number(e.target.value))} /></div>
}

function JadualPemberat({ tajuk, jadual, baris, medan, namaMedan = 'nama' }: {
  tajuk: string; jadual: NamaJadual; baris: { id: string; nama: string; nilai: number; susunan: number; sub?: string | null }[]; medan: string; namaMedan?: string
}) {
  const { ubah } = useAplikasi()
  const [r, setR] = useState(baris)
  const [elSahkan, sahkan] = useSahkan()
  const [ralat, setRalat] = useState<string | null>(null)
  useEffect(() => setR(baris), [JSON.stringify(baris)]) // eslint-disable-line react-hooks/exhaustive-deps
  const ubahsuai = r.some((x, i) => x.nilai !== baris[i]?.nilai || x.nama !== baris[i]?.nama) || r.length !== baris.length
  const simpan = () => ubah((s) => s.simpanBanyak(jadual, r.map((x) => ({ id: x.id.startsWith('baru') ? undefined : x.id, [namaMedan]: x.nama, [medan]: x.nilai, susunan: x.susunan }))))
  return (
    <div className="kad p-5">
      {elSahkan}
      {ralat && <div className="mb-2 text-xs text-rose-600">{ralat}</div>}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">{tajuk}</h3>
        <div className="flex gap-1">
          <button onClick={() => setR([...r, { id: `baru${Date.now()}`, nama: '', nilai: 1, susunan: r.length + 1 }])} className="btn-hantu py-1 text-xs"><Plus size={14} /> Tambah</button>
          {ubahsuai && <button onClick={simpan} className="btn-utama py-1 text-xs"><Save size={13} /> Simpan</button>}
        </div>
      </div>
      <div className="space-y-1.5">
        {r.map((x, i) => (
          <div key={x.id} className="flex items-center gap-2">
            <input className="input py-1.5 flex-1" value={x.nama} onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, nama: e.target.value } : y)))} />
            {x.sub && <span className="hidden sm:block text-[11px] text-navy-400 w-36 truncate">{x.sub}</span>}
            <input type="number" step={0.1} className="input py-1.5 w-20 text-center font-mono" value={x.nilai} onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, nilai: Number(e.target.value) } : y)))} />
            <button onClick={async () => { if (x.id.startsWith('baru')) setR(r.filter((_, j) => j !== i)); else if (await sahkan(`Buang "${x.nama}"?`, { butang: 'Buang' })) { try { setRalat(null); await ubah((s) => s.buang(jadual, x.id)) } catch { setRalat(`"${x.nama}" tidak boleh dibuang kerana masih digunakan.`) } } }} className="p-1.5 text-navy-300 hover:text-rose-600"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pengguna() {
  const { k } = useAplikasi()
  const [ahli, setAhli] = useState<{ user_id: string | null; emel: string; peranan: string; bidang_id: string | null; dijemput: boolean }[]>([])
  const [emel, setEmel] = useState('')
  const [p, setP] = useState('pk')
  const [bidang, setBidang] = useState('')
  const [mesej, setMesej] = useState('')
  const id = k?.data.sekolah.id
  const muat = async () => { if (supabase && id) setAhli(((await supabase.rpc('senarai_ahli', { p_school: id })).data ?? []) as typeof ahli) }
  useEffect(() => { void muat() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k || !supabase) return null
  const tambah = async () => {
    const r = await supabase!.rpc('tetapkan_peranan', { p_school: id, p_emel: emel, p_peranan: p, p_bidang: bidang || null })
    setMesej(r.error ? r.error.message : r.data === 'dijemput' ? `${emel} dijemput — peranan aktif sebaik dia log masuk kali pertama.` : 'Peranan dikemas kini.')
    if (!r.error) setEmel('')
    void muat()
  }
  return (
    <div className="kad p-5 mt-5">
      <h3 className="font-bold flex items-center gap-2"><UserCog size={18} /> Pengguna & Peranan</h3>
      <p className="text-xs text-navy-500 mb-4">Guru dipautkan automatik melalui e-mel dalam senarai Guru. Peranan boleh ditetapkan walaupun orang itu belum pernah log masuk — ia aktif sebaik dia log masuk. Di sini anda tetapkan GB/Pengetua (lulus & muktamad), PK (urus JK & lantik dalam bidangnya) atau Admin.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className="input" placeholder="e-mel@moe-dl.edu.my" value={emel} onChange={(e) => setEmel(e.target.value)} />
        <select className="input sm:w-32" value={p} onChange={(e) => setP(e.target.value)}><option value="gb">GB / Pengetua</option><option value="pk">PK</option><option value="admin">Admin</option><option value="guru">Guru</option></select>
        <select className="input sm:w-48" value={bidang} onChange={(e) => setBidang(e.target.value)}><option value="">Semua bidang</option>{k.data.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select>
        <button onClick={tambah} className="btn-gelap">Tetapkan</button>
      </div>
      {mesej && <div className="text-sm mt-2 text-navy-600">{mesej}</div>}
      <div className="mt-4 divide-y divide-navy-100">
        {ahli.map((a) => <div key={a.emel} className="flex justify-between py-2 text-sm"><span>{a.emel}{a.dijemput && <span className="cip bg-amber-100 text-amber-800 ml-2">dijemput · belum log masuk</span>}</span><span className="cip bg-navy-100 text-navy-700 uppercase">{a.peranan}{a.bidang_id ? ` · ${k.data.bidang.find((b) => b.id === a.bidang_id)?.nama}` : ''}</span></div>)}
      </div>
    </div>
  )
}

function MuatImej({ label, nota, nilai, set, lebar, jenis, had, kelas, melintang }: {
  label: string; nota: string; nilai: string | null; set: (v: string | null) => void; lebar: number; jenis: 'image/png' | 'image/jpeg'; had: number; kelas: string; melintang?: boolean
}) {
  const [nisbah, setNisbah] = useState<number | null>(null)
  const [ralat, setRalat] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const pilih = async (f?: File) => {
    if (!f) return
    setRalat(null); setSibuk(true)
    try { set(await mampatImej(f, lebar, jenis, had)) } catch (e) { setRalat((e as Error).message) } finally { setSibuk(false) }
  }
  return (
    <div>
      <label className="label">{label}</label>
      <div className="rounded-xl border border-dashed border-navy-200 p-3">
        {nilai ? <img src={nilai} alt={label} className={kelas} onLoad={(e) => setNisbah(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))} /> : <div className="text-xs text-navy-400 py-3 text-center">Belum dimuat naik</div>}
        <div className="mt-2 flex items-center gap-2">
          <label className="btn-garis py-1.5 text-xs cursor-pointer"><ImagePlus size={14} /> {sibuk ? 'Memproses…' : nilai ? 'Tukar' : 'Muat naik'}
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { void pilih(e.target.files?.[0]); e.target.value = '' }} /></label>
          {nilai && <button type="button" onClick={() => set(null)} className="btn-hantu py-1.5 text-xs text-rose-600"><Trash2 size={14} /> Buang</button>}
        </div>
        <p className="text-[11px] text-navy-400 mt-1.5">{nota}</p>
        {ralat && <p className="text-xs text-rose-600 mt-1">{ralat}</p>}
        {melintang && nilai && nisbah !== null && nisbah < 3 && <p className="text-xs text-amber-700 mt-1 font-semibold">Imej ini tidak melintang — ia akan nampak sangat besar di atas surat. Kepala surat penuh biasanya 4–6 kali lebih lebar daripada tingginya. Jika ini logo, buang dan guna mod "Format KPM" sahaja.</p>}
      </div>
    </div>
  )
}
