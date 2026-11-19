import { useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, ImagePlus, Pencil, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { Kosong, Modal, useSahkan } from '../components/ui'
import { mampatImej } from '../components/KepalaSurat'
import { SEKSYEN_LALAI } from '../lib/buku'
import type { SeksyenBuku } from '../lib/types'

/** Kandungan Bab Pengenalan Buku Pengurusan — disunting oleh admin, GB, PK & Setiausaha. */
export function KandunganPengenalan() {
  const { k, ubah } = useAplikasi()
  const [sunting, setSunting] = useState<Partial<SeksyenBuku> | null>(null)
  const [elSahkan, sahkan] = useSahkan()
  if (!k) return null
  const senarai = [...k.data.buku].sort((a, b) => a.susunan - b.susunan)
  const seterus = (senarai.at(-1)?.susunan ?? 0) + 1

  const mulaTemplat = () => ubah((s) => s.simpanBanyak('buku_seksyen', SEKSYEN_LALAI.map((x, i) => ({ ...x, imej: null, susunan: i + 1 }))))
  const alih = async (i: number, arah: -1 | 1) => {
    const a = senarai[i], b = senarai[i + arah]
    if (!a || !b) return
    await ubah(async (s) => {
      await s.simpan('buku_seksyen', { id: a.id, susunan: b.susunan })
      await s.simpan('buku_seksyen', { id: b.id, susunan: a.susunan })
    })
  }
  const buang = async (x: SeksyenBuku) => {
    if (await sahkan(`Buang seksyen "${x.tajuk}"?`, { butang: 'Buang', bahaya: true })) await ubah((s) => s.buang('buku_seksyen', x.id))
  }

  return (
    <div className="animate-naik">
      {elSahkan}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-navy-500">Seksyen ini menjadi <b>Bahagian A: Pengenalan & Maklumat Sekolah</b> dalam buku. Susun dengan anak panah; sunting untuk tambah teks atau imej.</p>
        <button onClick={() => setSunting({ tajuk: '', isi: '', imej: null, susunan: seterus })} className="btn-utama"><Plus size={16} /> Seksyen</button>
      </div>

      {senarai.length === 0 ? (
        <div className="kad"><Kosong ikon={<BookOpen />} tajuk="Belum ada seksyen" teks="Mulakan dengan templat lazim (Setitip Harapan GB, Maklumat Sekolah, Sejarah, Lencana, Lagu, Visi & Misi, Ikrar, Takwim) — boleh diubah selepas itu.">
          <button onClick={mulaTemplat} className="btn-utama"><Sparkles size={16} /> Guna templat</button>
        </Kosong></div>
      ) : (
        <div className="space-y-3">
          {senarai.map((x, i) => (
            <div key={x.id} className="kad p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-navy-900 text-white text-sm font-bold flex items-center justify-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{x.tajuk}</h3>
                  {x.isi && <p className="mt-1 text-sm text-navy-600 whitespace-pre-wrap line-clamp-6">{x.isi}</p>}
                  {x.imej && <img src={x.imej} alt="" className="mt-2 max-h-40 rounded-lg border border-navy-100" />}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button title="Naik" disabled={i === 0} onClick={() => alih(i, -1)} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button title="Turun" disabled={i === senarai.length - 1} onClick={() => alih(i, 1)} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400 disabled:opacity-30"><ArrowDown size={15} /></button>
                  <button title="Sunting" onClick={() => setSunting(x)} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-500"><Pencil size={15} /></button>
                  <button title="Buang" onClick={() => buang(x)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {sunting && <SuntingSeksyen x={sunting} tutup={() => setSunting(null)} />}
    </div>
  )
}

function SuntingSeksyen({ x, tutup }: { x: Partial<SeksyenBuku>; tutup: () => void }) {
  const { ubah } = useAplikasi()
  const [f, setF] = useState<Partial<SeksyenBuku>>(x)
  const [sibuk, setSibuk] = useState(false)
  const [ralat, setRalat] = useState<string | null>(null)
  const muatImej = async (fail?: File) => {
    if (!fail) return
    setRalat(null)
    try { setF({ ...f, imej: await mampatImej(fail, 1600, 'image/jpeg', 1400000) }) } catch (e) { setRalat((e as Error).message) }
  }
  const simpan = async () => {
    if (!f.tajuk?.trim()) { setRalat('Tajuk diperlukan.'); return }
    setSibuk(true)
    try {
      await ubah((s) => s.simpan('buku_seksyen', { id: f.id, tajuk: f.tajuk!.trim(), isi: f.isi?.trim() || null, imej: f.imej ?? null, susunan: f.susunan ?? 1 }))
      tutup()
    } catch (e) { setRalat((e as Error).message) } finally { setSibuk(false) }
  }
  return (
    <Modal buka tutup={tutup} tajuk={x.id ? 'Sunting seksyen' : 'Seksyen baharu'} lebar="max-w-3xl">
      <div className="space-y-4">
        <div><label className="label">Tajuk</label><input autoFocus className="input" value={f.tajuk ?? ''} onChange={(e) => setF({ ...f, tajuk: e.target.value })} placeholder="cth. Sejarah Sekolah" /></div>
        <div>
          <label className="label">Isi</label>
          <textarea rows={14} className="input font-[Arial,sans-serif] leading-relaxed" value={f.isi ?? ''} onChange={(e) => setF({ ...f, isi: e.target.value })}
            placeholder="Taip atau tampal teks. Baris kosong = perenggan baharu." />
          <p className="text-[11px] text-navy-400 mt-1">Baris kosong memisahkan perenggan. Baris bermula dengan "- " dicetak sebagai senarai.</p>
        </div>
        <div>
          <label className="label">Imej (pilihan) — gambar GB, lencana, pelan bangunan, jadual dsb.</label>
          <div className="rounded-xl border border-dashed border-navy-200 p-3">
            {f.imej ? <img src={f.imej} alt="" className="max-h-48 rounded-lg" /> : <div className="text-xs text-navy-400 py-2 text-center">Tiada imej</div>}
            <div className="mt-2 flex gap-2">
              <label className="btn-garis py-1.5 text-xs cursor-pointer"><ImagePlus size={14} /> {f.imej ? 'Tukar' : 'Muat naik'}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { void muatImej(e.target.files?.[0]); e.target.value = '' }} /></label>
              {f.imej && <button type="button" onClick={() => setF({ ...f, imej: null })} className="btn-hantu py-1.5 text-xs text-rose-600"><Trash2 size={14} /> Buang imej</button>}
            </div>
          </div>
        </div>
        {ralat && <p className="text-sm text-rose-600">{ralat}</p>}
        <div className="flex justify-end gap-2"><button onClick={tutup} className="btn-hantu">Batal</button><button disabled={sibuk} onClick={simpan} className="btn-utama"><Save size={15} /> Simpan</button></div>
      </div>
    </Modal>
  )
}
