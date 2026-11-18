import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { ClipboardPaste, FileDown, FileUp, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { bacaExcelGuru, janaTemplatGuru } from '../lib/templatGuru'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import { Avatar, CipStatus, Kosong, Modal, f2, useSahkan } from '../components/ui'
import type { Guru as G, Gred } from '../lib/types'

const KECUALI = /guru besar|pengetua|^pk|penolong kanan|penyelia petang|gkmp|kanan mata pelajaran/i

export default function Guru() {
  const { k } = useAplikasi()
  const [cari, setCari] = useState('')
  const [tapis, setTapis] = useState<'semua' | 'masa' | 'emel'>('semua')
  const [sunting, setSunting] = useState<Partial<G> | null>(null)
  const [tampal, setTampal] = useState(false)
  const [dariFail, setDariFail] = useState<{ nama: string; baris: string[][] } | null>(null)
  const [ralatFail, setRalatFail] = useState<string | null>(null)
  const failRef = useRef<HTMLInputElement>(null)
  const pilihFail = async (f: File | undefined) => {
    if (!f) return
    setRalatFail(null)
    try { const baris = await bacaExcelGuru(f); if (!baris.length) throw new Error('Tiada baris guru ditemui dalam fail.'); setDariFail({ nama: f.name, baris }); setTampal(true) }
    catch (e) { setRalatFail((e as Error).message) }
    if (failRef.current) failRef.current.value = ''
  }
  const senarai = useMemo(() => (k ? k.data.guru
    .filter((g) => !cari || g.nama.toLowerCase().includes(cari.toLowerCase()))
    .filter((g) => tapis === 'semua' || (tapis === 'masa' ? !(g.masa_seminggu > 0) : !g.emel))
    .sort((a, b) => a.nama.localeCompare(b.nama)) : []), [k, cari, tapis])
  if (!k) return null
  const gred = new Map(k.data.gred.map((g) => [g.id, g.kod]))
  const bilTiadaMasa = k.data.guru.filter((g) => !(g.masa_seminggu > 0)).length
  const bilTiadaEmel = k.data.guru.filter((g) => !g.emel).length

  return (
    <div className="animate-naik">
      <TajukHalaman tajuk="Guru" sub={`${k.data.guru.length} guru berdaftar · e-mel DELIMa digunakan untuk log masuk "Tugas Saya"`}
        tindakan={<>
          <button onClick={() => janaTemplatGuru(k.data.sekolah, k.data.gred)} className="btn-garis"><FileDown size={16} /> Templat Excel</button>
          <button onClick={() => failRef.current?.click()} className="btn-garis"><FileUp size={16} /> Muat naik Excel</button>
          <input ref={failRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => void pilihFail(e.target.files?.[0])} />
          <button onClick={() => { setDariFail(null); setTampal(true) }} className="btn-garis"><ClipboardPaste size={16} /> Tampal</button>
          <button onClick={() => setSunting({ status: 'aktif', masa_seminggu: 0, kelas_peperiksaan: false, dikecualikan: false })} className="btn-utama"><Plus size={16} /> Guru</button>
        </>} />

      {k.data.guru.length === 0 ? (
        <div className="kad"><Kosong ikon={<Users />} tajuk="Belum ada guru" teks="Cara paling pantas: salin lajur Nama, Gred, Masa mengajar dan E-mel dari Excel, kemudian tampal.">
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => janaTemplatGuru(k.data.sekolah, k.data.gred)} className="btn-garis"><FileDown size={16} /> 1. Muat turun templat Excel</button>
            <button onClick={() => failRef.current?.click()} className="btn-utama"><FileUp size={16} /> 2. Muat naik Excel yang diisi</button>
            <button onClick={() => { setDariFail(null); setTampal(true) }} className="btn-hantu"><ClipboardPaste size={16} /> atau tampal</button>
          </div>
        </Kosong></div>
      ) : (
        <div className="kad overflow-hidden">
          <div className="p-3 border-b border-navy-100 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-9" placeholder="Cari guru…" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
            <div className="flex rounded-xl bg-navy-50 p-1 text-xs font-semibold">
              {([['semua', `Semua (${k.data.guru.length})`], ['masa', `Masa belum diisi (${bilTiadaMasa})`], ['emel', `Tiada e-mel (${bilTiadaEmel})`]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setTapis(v)} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${tapis === v ? 'bg-white shadow-card text-navy-900' : 'text-navy-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-50/70 text-[11px] uppercase tracking-wider text-navy-500">
                <tr><th className="text-left px-4 py-3">Guru</th><th className="px-3 py-3 text-left">Gred</th><th className="px-3 py-3 text-center">Masa / minggu</th><th className="px-3 py-3 text-left hidden xl:table-cell">Kepakaran</th><th className="px-3 py-3 text-left">Beban</th><th className="w-10" /></tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {senarai.map((g) => {
                  const h = k.hasil.get(g.id)
                  return (
                    <tr key={g.id} onClick={() => setSunting(g)} className="hover:bg-navy-50/50 cursor-pointer">
                      <td className="px-4 py-2.5 min-w-[240px]">
                        <div className="flex items-center gap-2.5">
                          <Avatar nama={g.nama} kecil />
                          <div className="min-w-0">
                            <div className="font-semibold leading-snug">{g.nama}</div>
                            <div className="text-[11px] text-navy-400 flex flex-wrap gap-x-2">
                              {g.tag && <span>{g.tag}</span>}
                              {g.emel ? <span className="text-navy-400">{g.emel}</span> : <span className="text-amber-600 font-semibold">tiada e-mel</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs">{g.gred_id ? gred.get(g.gred_id)?.replace(' dan ke bawah', '↓') : <span className="text-navy-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-center">
                        {g.masa_seminggu > 0 ? <span className="font-mono">{g.masa_seminggu}</span> : <span title="Belum diisi — diandaikan median" className="cip bg-amber-100 text-amber-800 whitespace-nowrap">belum diisi</span>}
                        {g.kelas_peperiksaan && <div className="text-[10px] text-violet-600 font-semibold">+ peperiksaan</div>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-navy-600 hidden xl:table-cell max-w-[200px]"><span className="line-clamp-2">{g.kepakaran ?? ''}</span></td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {g.status !== 'aktif' ? <span className="cip bg-navy-100 text-navy-600 capitalize">{g.status}</span> : h && <span className="inline-flex items-center gap-2"><span className="font-mono text-xs w-9 text-right">{f2(h.indeks)}</span><CipStatus s={h.status} /></span>}
                      </td>
                      <td className="px-2 py-2.5 text-right"><Pencil size={14} className="text-navy-300 inline" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {senarai.length === 0 && <p className="p-6 text-center text-sm text-navy-400">Tiada guru sepadan.</p>}
          </div>
        </div>
      )}
      {sunting && <SuntingGuru g={sunting} tutup={() => setSunting(null)} />}
      {ralatFail && <div className="fixed bottom-4 right-4 z-50 rounded-2xl bg-rose-600 text-white p-4 text-sm shadow-pop">{ralatFail} <button className="ml-3 underline" onClick={() => setRalatFail(null)}>Tutup</button></div>}
      {tampal && <TampalGuru awal={dariFail} tutup={() => { setTampal(false); setDariFail(null) }} />}
    </div>
  )
}

function SuntingGuru({ g, tutup }: { g: Partial<G>; tutup: () => void }) {
  const { k, ubah } = useAplikasi()
  const [f, setF] = useState<Partial<G>>(g)
  const [ralat, setRalat] = useState<string | null>(null)
  const [elSahkan, sahkan] = useSahkan()
  if (!k) return null
  const simpan = async () => {
    if (!f.nama?.trim()) return setRalat('Nama diperlukan')
    try {
      await ubah((s) => s.simpan('guru', {
        id: f.id, nama: f.nama!.trim(), emel: f.emel?.trim().toLowerCase() || null, telefon: f.telefon || null,
        gred_id: f.gred_id || null, masa_seminggu: Number(f.masa_seminggu) || 0, kelas_peperiksaan: !!f.kelas_peperiksaan,
        status: f.status ?? 'aktif', dikecualikan: !!f.dikecualikan, tag: f.tag || null, kepakaran: f.kepakaran || null,
      }))
      tutup()
    } catch (e) { setRalat((e as Error).message) }
  }
  const buang = async () => {
    if (!g.id || !(await sahkan(`Buang ${g.nama} daripada senarai guru?

Jika guru bertukar keluar, lebih baik tukar status kepada "Bertukar keluar" supaya sejarahnya kekal.`, { butang: 'Buang guru' }))) return
    await ubah((s) => s.buang('guru', g.id!)); tutup()
  }
  return (
    <Modal buka tutup={tutup} tajuk={g.id ? 'Sunting guru' : 'Guru baharu'} lebar="max-w-lg">
      {elSahkan}
      <div className="space-y-4">
        <div><label className="label">Nama penuh</label><input autoFocus className="input" value={f.nama ?? ''} onChange={(e) => setF({ ...f, nama: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Gred</label><select className="input" value={f.gred_id ?? ''} onChange={(e) => setF({ ...f, gred_id: e.target.value || null })}><option value="">—</option>{k.data.gred.map((x) => <option key={x.id} value={x.id}>{x.kod}</option>)}</select></div>
          <div><label className="label">Masa mengajar / minggu</label><input type="number" min={0} className="input" value={f.masa_seminggu ?? 0} onChange={(e) => setF({ ...f, masa_seminggu: Number(e.target.value) })} /></div>
          <div className="col-span-2"><label className="label">E-mel DELIMa</label><input className="input" placeholder="nama@moe-dl.edu.my" value={f.emel ?? ''} onChange={(e) => setF({ ...f, emel: e.target.value })} /></div>
          <div><label className="label">Status</label><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as G['status'] })}><option value="aktif">Aktif</option><option value="cuti">Cuti</option><option value="bertukar">Bertukar keluar</option></select></div>
          <div><label className="label">Telefon (WhatsApp)</label><input className="input" placeholder="0123456789" value={f.telefon ?? ''} onChange={(e) => setF({ ...f, telefon: e.target.value })} /></div>
          <div><label className="label">Kepakaran / subjek</label><input className="input" placeholder="cth. Matematik, Sains" value={f.kepakaran ?? ''} onChange={(e) => setF({ ...f, kepakaran: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Jawatan / tag</label><input className="input" placeholder="cth. PK HEM, GKMP" value={f.tag ?? ''} onChange={(e) => { const tag = e.target.value; setF({ ...f, tag, dikecualikan: f.dikecualikan || KECUALI.test(tag) }) }} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={!!f.kelas_peperiksaan} onChange={(e) => setF({ ...f, kelas_peperiksaan: e.target.checked })} /> Mengajar kelas peperiksaan (masa ×{k.data.tetapan.faktor_peperiksaan})</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-500 h-4 w-4" checked={!!f.dikecualikan} onChange={(e) => setF({ ...f, dikecualikan: e.target.checked })} /> Dikecualikan daripada median (GB/PK/GKMP)</label>
        {ralat && <div className="text-sm text-rose-600">{ralat}</div>}
        <div className="flex justify-between pt-2">
          {g.id ? <button onClick={buang} className="btn text-rose-600 hover:bg-rose-50"><Trash2 size={15} /> Buang</button> : <span />}
          <div className="flex gap-2"><button onClick={tutup} className="btn-hantu">Batal</button><button onClick={simpan} className="btn-utama">Simpan</button></div>
        </div>
      </div>
    </Modal>
  )
}

function padanGred(teks: string, gred: Gred[]): string | null {
  const t = teks.toUpperCase().replace(/\s+/g, '')
  if (!t) return null
  if (/KHAS|JUSA/.test(t)) return gred.find((g) => /khas/i.test(g.kod))?.id ?? null
  const n = Number(t.match(/(\d{1,2})/)?.[1])
  const peta: Record<number, string> = { 41: 'DG9', 44: 'DG10', 48: 'DG12', 52: 'DG13', 54: 'DG14' }  // gred lama → baharu
  const kod = n >= 41 ? peta[n] : n ? `DG${n}` : ''
  if (!kod) return null
  return gred.find((g) => g.kod.replace(/\s/g, '').toUpperCase().startsWith(kod))?.id
    ?? (n <= 9 || n === 41 ? gred.find((g) => /DG9/i.test(g.kod))?.id ?? null : null)
}

function TampalGuru({ tutup, awal }: { tutup: () => void; awal?: { nama: string; baris: string[][] } | null }) {
  const { k, ubah } = useAplikasi()
  const [teks, setTeks] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const baris = useMemo(() => {
    if (!k || (!awal && !teks.trim())) return []
    const mentah = awal ? awal.baris : Papa.parse<string[]>(teks.trim(), { delimiter: teks.includes('\t') ? '\t' : '', skipEmptyLines: true }).data
    return mentah
      .filter((row) => row[0] && !/^nama$/i.test(row[0].trim()))
      .map((row) => {
        const [nama, gred = '', masa = '', pep = '', emel = '', tag = '', kepakaran = '', telefon = ''] = row.map((c) => (c ?? '').trim())
        return {
          nama, emel: emel.toLowerCase() || null, gred_id: padanGred(gred, k.data.gred), gredTeks: gred,
          masa_seminggu: Number(masa) || 0, kelas_peperiksaan: /^(y|ya|yes|1|true|✓)$/i.test(pep),
          tag: tag || null, dikecualikan: KECUALI.test(tag), kepakaran: kepakaran || null, telefon: telefon || null,
        }
      })
  }, [teks, k, awal])
  if (!k) return null
  const sedia = new Set(k.data.guru.map((g) => g.nama.toLowerCase()))
  const simpan = async () => {
    setSibuk(true)
    try {
      await ubah((s) => s.simpanBanyak('guru', baris.filter((b) => !sedia.has(b.nama.toLowerCase())).map((b) => ({
        nama: b.nama, emel: b.emel, gred_id: b.gred_id, masa_seminggu: b.masa_seminggu, kelas_peperiksaan: b.kelas_peperiksaan,
        status: 'aktif', dikecualikan: b.dikecualikan, tag: b.tag, telefon: b.telefon, kepakaran: b.kepakaran,
      }))))
      tutup()
    } finally { setSibuk(false) }
  }
  return (
    <Modal buka tutup={tutup} tajuk={awal ? 'Semak data dari fail Excel' : 'Tampal senarai guru dari Excel'} lebar="max-w-3xl"
      sub={awal ? `Fail: ${awal.nama} — semak pratonton, kemudian tekan Import.` : 'Susunan lajur: Nama · Gred · Masa mengajar seminggu · Kelas peperiksaan (Ya/Tidak) · E-mel · Jawatan · Kepakaran · Telefon'}>
      {!awal && (
        <textarea autoFocus value={teks} onChange={(e) => setTeks(e.target.value)} rows={7}
          placeholder={'Pn. Siti Aminah binti Hassan\tDG10\t26\tTidak\tsiti@moe-dl.edu.my\nEn. Mohd Faizal bin Rahman\tDG12\t24\tYa\tfaizal@moe-dl.edu.my\tGKMP'}
          className="input font-mono text-xs" />
      )}
      {baris.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold mb-2">{baris.length} baris dikesan · {baris.filter((b) => sedia.has(b.nama.toLowerCase())).length} sudah wujud (diabaikan)</div>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-navy-100">
            <table className="w-full text-xs">
              <thead className="bg-navy-50 sticky top-0"><tr><th className="text-left p-2">Nama</th><th className="p-2">Gred</th><th className="p-2">Masa</th><th className="p-2">Pep.</th><th className="p-2 text-left">E-mel</th><th className="p-2 text-left">Jawatan</th></tr></thead>
              <tbody>
                {baris.map((b, i) => (
                  <tr key={i} className={`border-t border-navy-100 ${sedia.has(b.nama.toLowerCase()) ? 'opacity-40 line-through' : ''}`}>
                    <td className="p-2">{b.nama}</td>
                    <td className={`p-2 text-center ${b.gredTeks && !b.gred_id ? 'text-rose-600 font-semibold' : ''}`}>{b.gred_id ? k.data.gred.find((g) => g.id === b.gred_id)?.kod : b.gredTeks || '—'}</td>
                    <td className="p-2 text-center">{b.masa_seminggu}</td><td className="p-2 text-center">{b.kelas_peperiksaan ? 'Ya' : ''}</td>
                    <td className="p-2">{b.emel}</td><td className="p-2">{b.tag}{b.dikecualikan && <span className="cip bg-navy-100 text-navy-500 ml-1">dikecualikan</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={tutup} className="btn-hantu">Batal</button>
        <button disabled={!baris.length || sibuk} onClick={simpan} className="btn-utama"><ClipboardPaste size={16} /> Import {baris.filter((b) => !sedia.has(b.nama.toLowerCase())).length} guru</button>
      </div>
    </Modal>
  )
}
