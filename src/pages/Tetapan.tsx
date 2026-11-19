import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Save, Trash2, UserCog } from 'lucide-react'
import { mampatImej } from '../components/KepalaSurat'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import type { NamaJadual } from '../lib/stor'
import { supabase } from '../lib/supabase'
import type { Sekolah, Tetapan as T } from '../lib/types'
import { WARNA_BIDANG, useSahkan } from '../components/ui'

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
      <TajukHalaman tajuk="Tetapan" sub="Maklumat sekolah untuk surat & dokumen, pemberat indeks beban tugas, bidang dan pengguna."
        tindakan={<button onClick={simpanUmum} className="btn-utama"><Save size={16} /> {disimpan ? 'Disimpan ✓' : 'Simpan tetapan'}</button>} />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="kad p-5">
          <h3 className="font-bold">Maklumat Sekolah</h3>
          <p className="text-xs text-navy-500 mb-4">Digunakan dalam kepala surat format KPM, Surat Lantikan, Senarai AJK &amp; Buku Pengurusan.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nama sekolah</label><input className="input" value={s.nama} onChange={(e) => setS({ ...s, nama: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">Alamat (satu baris = satu baris kepala surat)</label><textarea rows={3} className="input" value={s.alamat ?? ''} onChange={(e) => setS({ ...s, alamat: e.target.value })} placeholder={'Jalan / Kampung / Taman\n31500 Lahat'} /><div className="text-[11px] text-navy-400 mt-1">Baris terakhir biasanya poskod + bandar. Negeri ditambah automatik dalam bentuk penuh (cth. Perak Darul Ridzuan).</div></div>
            <div><label className="label">Daerah</label><input className="input" value={s.daerah ?? ''} onChange={(e) => setS({ ...s, daerah: e.target.value })} /></div>
            <div><label className="label">Negeri</label><input className="input" value={s.negeri ?? ''} onChange={(e) => setS({ ...s, negeri: e.target.value })} /></div>
            <div><label className="label">Nama {s.jawatan_ketua ?? 'Guru Besar'}</label><input className="input" value={s.nama_ketua ?? ''} onChange={(e) => setS({ ...s, nama_ketua: e.target.value })} /></div>
            <div><label className="label">Sesi semasa</label><input type="number" className="input" value={s.tahun_semasa} onChange={(e) => setS({ ...s, tahun_semasa: Number(e.target.value) })} /></div>
            <div><label className="label">No. telefon sekolah</label><input className="input" value={s.telefon ?? ''} onChange={(e) => setS({ ...s, telefon: e.target.value })} placeholder="cth. 05-321 6399" /></div>
            <div><label className="label">No. faks (pilihan)</label><input className="input" value={s.faks ?? ''} onChange={(e) => setS({ ...s, faks: e.target.value })} placeholder="cth. 05-321 3563" /></div>
            <div className="col-span-2"><label className="label">E-mel rasmi sekolah</label><input className="input" value={s.emel ?? ''} onChange={(e) => setS({ ...s, emel: e.target.value })} placeholder={`${s.kod}@moe.edu.my`} /></div>
          </div>
          <div className="mt-5 pt-4 border-t border-navy-100 space-y-4">
            <div className="text-xs text-navy-500">Untuk cetakan <b>Surat Lantikan</b> &amp; <b>Senarai AJK</b>. Tekan <b>Simpan tetapan</b> selepas memuat naik.</div>
            <MuatImej label="Logo sekolah" nota="PNG/JPG segi empat. Dipapar di sebelah nama sekolah." nilai={s.logo_url} set={(v) => setS({ ...s, logo_url: v })} lebar={400} jenis="image/png" had={550000} kelas="h-20 w-20 object-contain" />
            <MuatImej label="Imej kepala surat penuh (pilihan)" nota="Hanya jika sekolah ada kepala surat siap (imej melintang, cth. 2000×400 px). Tidak perlu jika guna mod Format KPM — Jata Negara & logo sekolah dijana automatik." nilai={s.kepala_surat ?? null} set={(v) => setS({ ...s, kepala_surat: v })} lebar={2000} jenis="image/jpeg" had={1400000} kelas="w-full max-h-28 object-contain object-left" melintang />
          </div>
        </div>

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
            <Nombor label="Ambang beban ringan (<)" v={t.ambang_rendah} set={(v) => setT({ ...t, ambang_rendah: v })} step={0.05} />
            <Nombor label="Faktor kelas peperiksaan" v={t.faktor_peperiksaan} set={(v) => setT({ ...t, faktor_peperiksaan: v })} step={0.05} />
            <Nombor label="Had jawatan seorang guru" v={t.had_jawatan} set={(v) => setT({ ...t, had_jawatan: v })} step={1} />
          </div>
          <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={t.guna_faktor_gred} onChange={(e) => setT({ ...t, guna_faktor_gred: e.target.checked })} /> Ambil kira gred (gred tinggi dijangka memikul lebih)</label>
        </div>

        <UrusBidang />
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
  const [ahli, setAhli] = useState<{ user_id: string | null; emel: string; peranan: string; bidang_id: string | null; guru_id: string | null; dijemput: boolean }[]>([])
  const [emel, setEmel] = useState('')
  const [p, setP] = useState('pk')
  const [bidang, setBidang] = useState('')
  const [mesej, setMesej] = useState('')
  const [elSahkan, sahkan] = useSahkan()
  const id = k?.data.sekolah.id
  const muat = async () => { if (supabase && id) setAhli(((await supabase.rpc('senarai_ahli', { p_school: id })).data ?? []) as typeof ahli) }
  useEffect(() => { void muat() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k || !supabase) return null
  const tetap = async (e: string, per: string, bid: string | null) => {
    const r = await supabase!.rpc('tetapkan_peranan', { p_school: id, p_emel: e, p_peranan: per, p_bidang: bid || null })
    setMesej(r.error ? r.error.message : r.data === 'dijemput' ? `${e} dijemput — peranan aktif sebaik dia log masuk kali pertama.` : `Peranan ${e} dikemas kini.`)
    void muat()
    return !r.error
  }
  const tambah = async () => { if (await tetap(emel, p, bidang)) setEmel('') }
  const keluar = async (e: string) => {
    if (!(await sahkan(`Keluarkan ${e} daripada sekolah ini?\n\nDia tidak lagi boleh log masuk ke data sekolah. Rekod guru & lantikan tidak terjejas.`, { butang: 'Keluarkan', bahaya: true }))) return
    const r = await supabase!.rpc('buang_ahli', { p_school: id, p_emel: e })
    setMesej(r.error ? r.error.message : `${e} dikeluarkan.`)
    void muat()
  }
  const namaGuru = (a: (typeof ahli)[number]) => k.data.guru.find((g) => g.id === a.guru_id || (g.emel && g.emel.toLowerCase() === a.emel.toLowerCase()))?.nama
  const PERANAN: [string, string][] = [['admin', 'Admin'], ['gb', 'GB / Pengetua'], ['pk', 'PK'], ['su', 'Setiausaha (dokumen)'], ['guru', 'Guru']]
  return (
    <div className="kad p-5 mt-5">
      {elSahkan}
      <h3 className="font-bold flex items-center gap-2"><UserCog size={18} /> Pengguna & Peranan</h3>
      <p className="text-xs text-navy-500 mb-4">Guru dengan e-mel DELIMa dalam senarai Guru boleh log masuk sebagai <b>Guru</b> secara automatik. Di sini tetapkan peranan khas: GB/Pengetua (lulus & muktamad), PK (urus JK dalam bidangnya), Setiausaha (Buku Pengurusan & surat) atau Admin. Boleh ditetapkan sebelum orang itu log masuk.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className="input" list="senarai-emel-guru" placeholder="e-mel@moe-dl.edu.my (taip nama untuk cari)" value={emel} onChange={(e) => setEmel(e.target.value)} />
        <datalist id="senarai-emel-guru">{k.data.guru.filter((g) => g.emel).map((g) => <option key={g.id} value={g.emel!}>{g.nama}</option>)}</datalist>
        <select className="input sm:w-44" value={p} onChange={(e) => setP(e.target.value)}>{PERANAN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select className="input sm:w-44" value={bidang} onChange={(e) => setBidang(e.target.value)}><option value="">Semua bidang</option>{k.data.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select>
        <button onClick={tambah} disabled={!emel.trim()} className="btn-gelap">Tetapkan</button>
      </div>
      {mesej && <div className="text-sm mt-2 text-navy-600">{mesej}</div>}
      <div className="mt-4 divide-y divide-navy-100">
        {ahli.map((a) => (
          <div key={a.emel} className="flex flex-wrap items-center gap-2 py-2 text-sm">
            <div className="flex-1 min-w-[220px]">
              <div className="font-semibold">{namaGuru(a) ?? <span className="text-navy-400 font-normal">— tiada rekod guru —</span>}</div>
              <div className="text-[11px] text-navy-500">{a.emel}{a.dijemput && <span className="cip bg-amber-100 text-amber-800 ml-2">dijemput · belum log masuk</span>}</div>
            </div>
            <select className="input py-1 text-xs w-40" value={a.peranan} onChange={(e) => void tetap(a.emel, e.target.value, a.bidang_id)}>{PERANAN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select className="input py-1 text-xs w-40" value={a.bidang_id ?? ''} disabled={a.peranan !== 'pk'} title={a.peranan !== 'pk' ? 'Bidang hanya untuk PK' : ''} onChange={(e) => void tetap(a.emel, a.peranan, e.target.value || null)}>
              <option value="">Semua bidang</option>{k.data.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
            <button onClick={() => keluar(a.emel)} title="Keluarkan" className="p-1.5 rounded-lg text-navy-300 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

const WARNA_PILIHAN = Object.keys(WARNA_BIDANG)

/** Bidang / Unit: tambah, tukar nama & warna, susun, buang (jika tiada JK). */
function UrusBidang() {
  const { k, ubah } = useAplikasi()
  const [r, setR] = useState<{ id: string; nama: string; warna: string }[] | null>(null)
  const [ralat, setRalat] = useState<string | null>(null)
  const [elSahkan, sahkan] = useSahkan()
  if (!k) return null
  const asal = [...k.data.bidang].sort((a, b) => a.susunan - b.susunan).map((b) => ({ id: b.id, nama: b.nama, warna: b.warna }))
  const baris = r ?? asal
  const berubah = r !== null
  const bilJK = (id: string) => k.data.jawatankuasa.filter((j) => j.bidang_id === id).length
  const alih = (i: number, d: -1 | 1) => { const x = [...baris]; const j = i + d; if (j < 0 || j >= x.length) return; [x[i], x[j]] = [x[j], x[i]]; setR(x) }
  const simpan = async () => {
    setRalat(null)
    try {
      await ubah(async (s) => {
        for (const [i, b] of baris.entries()) {
          if (!b.nama.trim()) continue
          await s.simpan('bidang', { ...(b.id.startsWith('baru') ? {} : { id: b.id }), nama: b.nama.trim(), warna: b.warna, susunan: i + 1 })
        }
      })
      setR(null)
    } catch (e) { setRalat((e as Error).message) }
  }
  const buang = async (b: { id: string; nama: string }) => {
    if (b.id.startsWith('baru')) { setR(baris.filter((x) => x.id !== b.id)); return }
    if (bilJK(b.id)) { setRalat(`"${b.nama}" masih ada ${bilJK(b.id)} jawatankuasa. Pindahkan JK ke bidang lain (Agih Tugas → sunting JK) dahulu.`); return }
    if (!(await sahkan(`Buang bidang "${b.nama}"?`, { butang: 'Buang', bahaya: true }))) return
    try { setRalat(null); await ubah((s) => s.buang('bidang', b.id)); setR(null) } catch (e) { setRalat((e as Error).message) }
  }
  return (
    <div className="kad p-5">
      {elSahkan}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold">Bidang / Unit</h3>
        <div className="flex gap-2">
          <button onClick={() => setR([...baris, { id: `baru-${Date.now()}`, nama: '', warna: WARNA_PILIHAN[baris.length % WARNA_PILIHAN.length] }])} className="btn-hantu py-1 text-xs"><Plus size={13} /> Tambah</button>
          {berubah && <button onClick={simpan} className="btn-utama py-1 text-xs"><Save size={13} /> Simpan</button>}
        </div>
      </div>
      <p className="text-xs text-navy-500 mb-3">Bahagian dalam Agih Tugas, Senarai AJK & Buku Pengurusan (cth. Pentadbiran, Kurikulum, HEM, Kokurikulum, Pendidikan Khas). Susunan di sini = susunan bahagian dalam buku.</p>
      {ralat && <div className="text-xs text-rose-600 mb-2">{ralat}</div>}
      <div className="space-y-1.5">
        {baris.map((b, i) => {
          const w = WARNA_BIDANG[b.warna] ?? WARNA_BIDANG.slate
          return (
            <div key={b.id} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full shrink-0 ${w.titik}`} />
              <input className="input py-1.5 flex-1" value={b.nama} placeholder="Nama bidang" onChange={(e) => setR(baris.map((x) => (x.id === b.id ? { ...x, nama: e.target.value } : x)))} />
              <select className="input py-1.5 w-28 text-xs" value={b.warna} onChange={(e) => setR(baris.map((x) => (x.id === b.id ? { ...x, warna: e.target.value } : x)))}>{WARNA_PILIHAN.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <span className="text-[11px] text-navy-400 w-12 text-right">{b.id.startsWith('baru') ? 'baharu' : `${bilJK(b.id)} JK`}</span>
              <button onClick={() => alih(i, -1)} disabled={i === 0} className="p-1 text-navy-400 disabled:opacity-30"><ArrowUp size={14} /></button>
              <button onClick={() => alih(i, 1)} disabled={i === baris.length - 1} className="p-1 text-navy-400 disabled:opacity-30"><ArrowDown size={14} /></button>
              <button onClick={() => buang(b)} className="p-1.5 text-navy-300 hover:text-rose-600"><Trash2 size={14} /></button>
            </div>
          )
        })}
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
