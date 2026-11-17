import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Archive, CopyPlus, FileDown, FlaskConical, Lock, Pencil, Plus, Search, Sparkles, UserPlus, Users, Wand2, X } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { PilihGuru } from '../components/PilihGuru'
import { TambahAhli } from '../components/TambahAhli'
import { AutoAgih } from '../components/AutoAgih'
import { BarStatus } from '../components/BarStatus'
import { Avatar, Modal, TITIK_STATUS, WARNA_BIDANG, f1, f2, namaPendek, useSahkan } from '../components/ui'
import { LABEL_STATUS } from '../lib/indeks'
import { boleh } from '../lib/kuasa'
import { STATUS_KUNCI } from '../lib/stor'
import type { Jawatankuasa as JK } from '../lib/types'

export default function Jawatankuasa() {
  const { k, peranan, bidangSaya, ubah, stor, simulasi, mulaSimulasi } = useAplikasi()
  const [qs, setQs] = useSearchParams()
  const [bidang, setBidang] = useState<string>(peranan === 'pk' && bidangSaya ? bidangSaya : 'semua')
  const [cari, setCari] = useState('')
  const [kosongSahaja, setKosongSahaja] = useState(qs.get('kosong') === '1')
  const [slotPilih, setSlotPilih] = useState<string | null>(null)
  const [tambahJK, setTambahJK] = useState<string | null>(null)
  const [auto, setAuto] = useState(false)
  const [suntingJK, setSuntingJK] = useState<Partial<JK> | null>(null)
  const [mesej, setMesej] = useState<string | null>(null)
  const [elSahkan, sahkan] = useSahkan()
  const fokusJK = qs.get('jk')

  const senarai = useMemo(() => {
    if (!k) return []
    const d = k.data
    return d.jawatankuasa
      .filter((j) => bidang === 'semua' || j.bidang_id === bidang)
      .filter((j) => !fokusJK || j.id === fokusJK)
      .filter((j) => !cari || j.nama.toLowerCase().includes(cari.toLowerCase()))
      .map((j) => {
        const slot = d.slot.filter((s) => s.jawatankuasa_id === j.id).sort((a, b) => a.susunan - b.susunan)
        const isi = slot.filter((s) => k.pemegangSlot.has(s.id)).length
        return { j, slot, isi }
      })
      .filter((x) => !kosongSahaja || x.isi < x.slot.length)
      .sort((a, b) => {
        const ba = d.bidang.find((x) => x.id === a.j.bidang_id)?.susunan ?? 0
        const bb = d.bidang.find((x) => x.id === b.j.bidang_id)?.susunan ?? 0
        return ba - bb || a.j.susunan - b.j.susunan
      })
  }, [k, bidang, cari, kosongSahaja, fokusJK])

  if (!k) return null
  const d = k.data
  const terkunci = STATUS_KUNCI.includes(d.kelulusan.status)
  const bolehUrus = (bidangId: string) => !terkunci && boleh(peranan, 'urus_jk', bidangId, bidangSaya)
  const bolehLantik = (bidangId: string) => !terkunci && boleh(peranan, 'lantik', bidangId, bidangSaya)
  const bolehCiptaJK = !terkunci && !simulasi && boleh(peranan, 'urus_jk', bidang !== 'semua' ? bidang : bidangSaya, bidangSaya)
  const peta = {
    guru: new Map(d.guru.map((g) => [g.id, g])),
    peranan: new Map(d.peranan.map((p) => [p.id, p])),
    tahap: new Map(d.tahap.map((t) => [t.id, t])),
    tempoh: new Map(d.tempoh.map((t) => [t.id, t])),
    bidang: new Map(d.bidang.map((b) => [b.id, b])),
  }

  const tambahSlot = (jkId: string, perananId: string, susunan: number) =>
    ubah((s) => s.simpan('slot', { jawatankuasa_id: jkId, peranan_id: perananId, label: null, susunan }))
  const salin = async () => {
    let n = 0
    await ubah(async (s) => { n = await s.salinTahunLepas() })
    setMesej(n ? `${n} lantikan disalin daripada ${d.sekolah.tahun_semasa - 1}.` : `Tiada lantikan ${d.sekolah.tahun_semasa - 1} untuk disalin.`)
  }

  return (
    <div className="animate-naik">
      {elSahkan}
      <TajukHalaman tajuk="Agih Tugas" sub="Pilih jawatan, sistem cadangkan guru paling ringan. Indeks semua guru dikira serta-merta."
        tindakan={<>
          {!terkunci && boleh(peranan, 'lantik', null, bidangSaya) && <button onClick={() => setAuto(true)} className="btn-gelap"><Wand2 size={16} /> Auto-agih</button>}
          {!terkunci && !simulasi && stor && <button onClick={mulaSimulasi} className="btn-garis text-violet-700"><FlaskConical size={16} /> Simulasi</button>}
          {!terkunci && !simulasi && boleh(peranan, 'urus_tetapan') && <button onClick={salin} className="btn-garis"><CopyPlus size={16} /> Salin {d.sekolah.tahun_semasa - 1}</button>}
          {bolehCiptaJK && <button onClick={() => setSuntingJK({ bidang_id: bidang !== 'semua' ? bidang : bidangSaya ?? d.bidang[0]?.id, tahap_id: d.tahap[1]?.id, tempoh_id: d.tempoh[0]?.id, wajib: false, nama: '' })} className="btn-utama"><Plus size={16} /> Jawatankuasa</button>}
        </>} />

      <BarStatus />
      {mesej && <div className="mb-4 rounded-2xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm flex justify-between">{mesej}<button onClick={() => setMesej(null)}><X size={16} /></button></div>}

      <div className="sticky top-14 lg:top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-slate-50/90 backdrop-blur mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <BtnBidang aktif={bidang === 'semua'} onClick={() => setBidang('semua')} label="Semua" />
          {d.bidang.map((b) => <BtnBidang key={b.id} aktif={bidang === b.id} onClick={() => setBidang(b.id)} label={b.nama} warna={b.warna} kunci={peranan === 'pk' && !!bidangSaya && bidangSaya !== b.id} />)}
        </div>
        <div className="flex gap-2 md:ml-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input className="input pl-9" placeholder="Cari jawatankuasa…" value={cari} onChange={(e) => setCari(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap bg-white border border-navy-200 rounded-xl px-3 cursor-pointer">
            <input type="checkbox" className="accent-brand-500" checked={kosongSahaja} onChange={(e) => setKosongSahaja(e.target.checked)} /> Ada kosong
          </label>
        </div>
      </div>
      {fokusJK && <button onClick={() => { qs.delete('jk'); setQs(qs) }} className="btn-garis mb-4"><X size={14} /> Tunjuk semua JK</button>}

      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {senarai.map(({ j, slot, isi }) => {
          const b = peta.bidang.get(j.bidang_id)
          const w = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
          const lantik = bolehLantik(j.bidang_id)
          const urus = bolehUrus(j.bidang_id) && !simulasi
          return (
            <div key={j.id} className={`kad p-4 flex flex-col ${!lantik && !terkunci ? 'opacity-75' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${w.teks}`}>{b?.nama}</div>
                  <h3 className="font-bold leading-snug">{j.nama}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="cip bg-navy-100 text-navy-600">{peta.tahap.get(j.tahap_id)?.nama}</span>
                    <span className="cip bg-navy-100 text-navy-600">{peta.tempoh.get(j.tempoh_id)?.nama}</span>
                    {j.wajib && <span className="cip bg-emas-400/20 text-emas-600">Wajib</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`cip ${isi === slot.length ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>{isi}/{slot.length}</span>
                  <Link to={`/app/eksport?jk=${j.id}`} title="Jana dokumen JK ini" className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400"><FileDown size={14} /></Link>
                  {urus && <button title="Sunting / arkib" onClick={() => setSuntingJK(j)} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400"><Pencil size={14} /></button>}
                  {!lantik && !terkunci && <span title="Di luar bidang anda"><Lock size={13} className="text-navy-300" /></span>}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 flex-1">
                {slot.map((s) => {
                  const gid = k.pemegangSlot.get(s.id)
                  const g = gid ? peta.guru.get(gid) : null
                  const h = gid ? k.hasil.get(gid) : null
                  const pnm = peta.peranan.get(s.peranan_id)
                  return (
                    <div key={s.id} className="group flex items-center gap-2 rounded-xl hover:bg-navy-50/70 px-2 py-1.5 -mx-2">
                      <div className="w-24 shrink-0 text-xs font-semibold text-navy-500 truncate">{s.label || pnm?.nama}</div>
                      {g && h ? (
                        <button disabled={!lantik} onClick={() => setSlotPilih(s.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left disabled:cursor-default">
                          <Avatar nama={g.nama} kecil />
                          <span className="text-sm font-medium truncate flex-1" title={g.nama}>{namaPendek(g.nama)}</span>
                          <span title={LABEL_STATUS[h.status]} className={`h-2 w-2 shrink-0 rounded-full ${TITIK_STATUS[h.status]}`} />
                          <span className={`font-mono text-[11px] ${h.status === 'terbeban' ? 'text-rose-600 font-bold' : 'text-navy-500'}`}>{f2(h.indeks)}</span>
                        </button>
                      ) : (
                        <button disabled={!lantik} onClick={() => setSlotPilih(s.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy-200 py-1.5 text-xs font-semibold text-navy-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-navy-400 disabled:hover:border-navy-200">
                          <UserPlus size={13} /> Pilih guru
                        </button>
                      )}
                      <span className="text-[10px] text-navy-300 font-mono w-8 text-right">{f1(k.skorSlot.get(s.id) ?? 0)}</span>
                      {urus && <button title="Buang jawatan ini" onClick={async () => { if (await sahkan(`Buang jawatan "${s.label || pnm?.nama}" daripada ${j.nama}?${g ? `\n${g.nama} akan digugurkan.` : ''}`, { butang: 'Buang' })) await ubah((st) => st.arkib('slot', s.id)) }} className="opacity-0 group-hover:opacity-100 p-1 text-navy-300 hover:text-rose-600"><X size={13} /></button>}
                    </div>
                  )
                })}
              </div>

              {(urus || lantik) && (
                <div className="mt-3 pt-3 border-t border-navy-100 flex items-center gap-2">
                  {lantik && !simulasi && <button onClick={() => setTambahJK(j.id)} className="btn-utama py-1.5 text-xs flex-1"><Users size={14} /> Tambah ahli</button>}
                  {urus && (
                    <select title="Tambah jawatan kosong" className="input py-1.5 text-xs w-36" defaultValue="" onChange={(e) => { if (e.target.value) { void tambahSlot(j.id, e.target.value, slot.length + 1); e.target.value = '' } }}>
                      <option value="" disabled>+ Jawatan kosong</option>
                      {d.peranan.map((p) => <option key={p.id} value={p.id}>{p.nama} (×{p.berat})</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <PilihGuru slotId={slotPilih} tutup={() => setSlotPilih(null)} />
      {tambahJK && <TambahAhli jkId={tambahJK} tutup={() => setTambahJK(null)} />}
      {auto && <AutoAgih tutup={() => setAuto(false)} bidangAwal={bidang !== 'semua' ? bidang : bidangSaya} />}
      {suntingJK && <SuntingJK jk={suntingJK} tutup={() => setSuntingJK(null)} />}
    </div>
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
