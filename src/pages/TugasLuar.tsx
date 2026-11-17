import { useState } from 'react'
import { Dumbbell, Plus, Trash2 } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, Kosong, Modal, f2, useSahkan } from '../components/ui'
import type { JenisTugasLuar, TugasLuar as TL } from '../lib/types'

export const JENIS_LUAR: Record<JenisTugasLuar, { label: string; unit: string; contoh: string }> = {
  relief: { label: 'Relief', unit: 'masa / minggu', contoh: 'Purata relief seminggu' },
  jurulatih: { label: 'Jurulatih pasukan', unit: 'mata', contoh: 'Jurulatih bola sepak MSSD' },
  pemeriksa: { label: 'Pemeriksa / penggubal', unit: 'mata', contoh: 'Pemeriksa kertas UASA' },
  luar: { label: 'Tugas luar sekolah', unit: 'mata', contoh: 'Jurulatih Utama Daerah' },
  lain: { label: 'Lain-lain', unit: 'mata', contoh: 'Penyelaras program khas' },
}

export default function TugasLuar() {
  const { k, ubah } = useAplikasi()
  const [borang, setBorang] = useState<Partial<TL> | null>(null)
  const [elSahkan, sahkan] = useSahkan()
  if (!k) return null
  const d = k.data
  const tahun = d.sekolah.tahun_semasa
  const senarai = d.tugasLuar.filter((t) => t.tahun === tahun)
  const guru = new Map(d.guru.map((g) => [g.id, g]))

  const simpan = async () => {
    if (!borang?.guru_id || !borang.jenis) return
    await ubah((s) => s.simpan('tugas_luar', { id: borang.id, guru_id: borang.guru_id, tahun, jenis: borang.jenis, keterangan: borang.keterangan ?? '', nilai: Number(borang.nilai) || 0 }))
    setBorang(null)
  }

  return (
    <div className="animate-naik">
      {elSahkan}
      <TajukHalaman tajuk="Tugas Luar & Relief" sub="Beban yang tiada dalam jawatankuasa — jurulatih, pemeriksa, JU daerah dan relief — tetap dikira dalam indeks."
        tindakan={<button onClick={() => setBorang({ jenis: 'jurulatih', nilai: 3 })} className="btn-utama"><Plus size={16} /> Tugas luar</button>} />
      <div className="grid lg:grid-cols-3 gap-3 mb-5 text-sm">
        <div className="kad p-4"><b>Relief</b> — ditambah terus ke <b>masa mengajar</b> (purata masa seminggu).</div>
        <div className="kad p-4"><b>Lain-lain</b> — ditambah ke <b>mata tugas</b>. Panduan: 3 = ringan, 6 = sederhana, 10 = berat.</div>
        <div className="kad p-4"><b>Sasaran purata</b> turut mengambil kira jumlah mata tugas luar supaya indeks kekal adil.</div>
      </div>
      {senarai.length === 0 ? <div className="kad"><Kosong ikon={<Dumbbell />} tajuk="Belum ada tugas luar" teks="Rekod jurulatih, pemeriksa, tugas daerah atau relief di sini." /></div> : (
        <div className="kad overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-50/70 text-[11px] uppercase tracking-wider text-navy-500"><tr><th className="text-left px-4 py-3">Guru</th><th className="text-left px-3">Jenis</th><th className="text-left px-3">Keterangan</th><th className="px-3">Nilai</th><th className="px-3">Indeks kini</th><th /></tr></thead>
            <tbody className="divide-y divide-navy-100">
              {senarai.map((t) => {
                const g = guru.get(t.guru_id)
                return (
                  <tr key={t.id} className="hover:bg-navy-50/50 cursor-pointer" onClick={() => setBorang(t)}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar nama={g?.nama ?? '?'} kecil />{g?.nama}</div></td>
                    <td className="px-3"><span className={`cip ${t.jenis === 'relief' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>{JENIS_LUAR[t.jenis].label}</span></td>
                    <td className="px-3 text-navy-600">{t.keterangan}</td>
                    <td className="px-3 text-center font-mono">{t.nilai} <span className="text-[10px] text-navy-400">{JENIS_LUAR[t.jenis].unit}</span></td>
                    <td className="px-3 text-center font-mono">{k.hasil.get(t.guru_id) ? f2(k.hasil.get(t.guru_id)!.indeks) : '—'}</td>
                    <td className="px-3 text-right"><button onClick={async (e) => { e.stopPropagation(); if (await sahkan(`Buang tugas luar "${t.keterangan}" untuk ${g?.nama}?`, { butang: 'Buang' })) await ubah((s) => s.buang('tugas_luar', t.id)) }} className="p-1.5 text-navy-300 hover:text-rose-600"><Trash2 size={14} /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {borang && (
        <Modal buka tutup={() => setBorang(null)} tajuk={borang.id ? 'Sunting tugas luar' : 'Tugas luar baharu'} lebar="max-w-lg">
          <div className="space-y-3">
            <div><label className="label">Guru</label>
              <select className="input" value={borang.guru_id ?? ''} onChange={(e) => setBorang({ ...borang, guru_id: e.target.value })}>
                <option value="">— pilih —</option>{d.guru.filter((g) => g.status !== 'bertukar').sort((a, b) => a.nama.localeCompare(b.nama)).map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Jenis</label>
                <select className="input" value={borang.jenis} onChange={(e) => setBorang({ ...borang, jenis: e.target.value as JenisTugasLuar })}>
                  {Object.entries(JENIS_LUAR).map(([v, x]) => <option key={v} value={v}>{x.label}</option>)}
                </select></div>
              <div><label className="label">Nilai ({JENIS_LUAR[borang.jenis ?? 'lain'].unit})</label><input type="number" min={0} step={0.5} className="input" value={borang.nilai ?? 0} onChange={(e) => setBorang({ ...borang, nilai: Number(e.target.value) })} /></div>
            </div>
            <div><label className="label">Keterangan</label><input className="input" placeholder={JENIS_LUAR[borang.jenis ?? 'lain'].contoh} value={borang.keterangan ?? ''} onChange={(e) => setBorang({ ...borang, keterangan: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setBorang(null)} className="btn-hantu">Batal</button><button disabled={!borang.guru_id} onClick={simpan} className="btn-utama">Simpan</button></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
