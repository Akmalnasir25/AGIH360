import { useMemo, useState } from 'react'
import { ArrowRight, Check, Wand2 } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { autoAgih, type PilihanAuto } from '../lib/autoagih'
import { boleh } from '../lib/kuasa'
import { Avatar, Modal, WARNA_BIDANG, f2 } from './ui'

export function AutoAgih({ tutup, bidangAwal }: { tutup: () => void; bidangAwal: string | null }) {
  const { k, ubah, peranan, bidangSaya } = useAplikasi()
  const bidangBoleh = k?.data.bidang.filter((b) => boleh(peranan, 'lantik', b.id, bidangSaya)) ?? []
  const [p, setP] = useState<PilihanAuto>({
    bidang: bidangAwal ? [bidangAwal] : bidangBoleh.map((b) => b.id),
    hormatHad: true, elakTerbeban: true, utamakanKepakaran: true, elakGiliran: true, termasukPengerusi: false,
  })
  const [tolak, setTolak] = useState<Set<string>>(new Set())
  const [sibuk, setSibuk] = useState(false)

  const cadangan = useMemo(() => (k ? autoAgih(k, p) : []), [k, p])
  if (!k) return null
  const d = k.data
  const ada = cadangan.filter((c) => c.guruId)
  const terima = ada.filter((c) => !tolak.has(c.slotId))
  const togB = (id: string) => setP({ ...p, bidang: p.bidang?.includes(id) ? p.bidang.filter((x) => x !== id) : [...(p.bidang ?? []), id] })
  const terap = async () => {
    setSibuk(true)
    try { await ubah((s) => s.lantikBanyak(terima.map((c) => ({ slotId: c.slotId, guruId: c.guruId! })))); tutup() } finally { setSibuk(false) }
  }
  const info = (slotId: string) => {
    const s = d.slot.find((x) => x.id === slotId)!
    const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    return { jk, b: d.bidang.find((x) => x.id === jk.bidang_id), p: d.peranan.find((x) => x.id === s.peranan_id)!.nama }
  }

  return (
    <Modal buka tutup={tutup} lebar="max-w-4xl" tajuk={<span className="flex items-center gap-2"><Wand2 className="text-brand-600" size={20} /> Auto-agih jawatan kosong</span>}
      sub="Jawatan paling berat diisi dahulu. Setiap cadangan disertakan sebab. Semak, nyahtanda yang tidak setuju, kemudian terapkan.">
      <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {bidangBoleh.map((b) => {
            const w = WARNA_BIDANG[b.warna] ?? WARNA_BIDANG.slate
            const on = p.bidang?.includes(b.id)
            return <button key={b.id} onClick={() => togB(b.id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 border ${on ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-navy-200'}`}><span className={`h-2 w-2 rounded-full ${w.titik}`} />{b.nama}</button>
          })}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {([['hormatHad', `Patuhi had ${d.tetapan.had_jawatan} jawatan`], ['elakTerbeban', 'Elak jadikan terbeban'], ['utamakanKepakaran', 'Utamakan kepakaran'], ['elakGiliran', 'Elak 3 tahun berturut'], ['termasukPengerusi', 'Termasuk Pengerusi']] as [keyof PilihanAuto, string][]).map(([kk, l]) => (
            <label key={kk} className="flex items-center gap-1.5"><input type="checkbox" className="accent-brand-500" checked={!!p[kk]} onChange={(e) => setP({ ...p, [kk]: e.target.checked })} />{l}</label>
          ))}
        </div>
      </div>

      {cadangan.length === 0 ? <div className="text-center py-10 text-navy-500">Tiada jawatan kosong dalam bidang dipilih. 🎉</div> : (
        <div className="max-h-[52vh] overflow-y-auto space-y-1.5 pr-1">
          {cadangan.map((c) => {
            const { jk, b, p: pnm } = info(c.slotId)
            const g = c.guruId ? d.guru.find((x) => x.id === c.guruId)! : null
            const on = g && !tolak.has(c.slotId)
            const w = WARNA_BIDANG[b?.warna ?? 'slate'] ?? WARNA_BIDANG.slate
            return (
              <div key={c.slotId} className={`rounded-2xl border p-3 flex items-start gap-3 ${!g ? 'border-amber-200 bg-amber-50/50' : on ? 'border-brand-200 bg-brand-50/30' : 'border-navy-100 opacity-60'}`}>
                {g ? (
                  <button onClick={() => setTolak((t) => { const n = new Set(t); if (n.has(c.slotId)) n.delete(c.slotId); else n.add(c.slotId); return n })}
                    className={`mt-1 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center ${on ? 'bg-brand-500 border-brand-500 text-white' : 'border-navy-300'}`}>{on && <Check size={13} strokeWidth={3} />}</button>
                ) : <span className="mt-1 h-5 w-5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-navy-500 flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${w.titik}`} />{pnm} · <b className="text-navy-800">{jk.nama}</b> · {(k.skorSlot.get(c.slotId) ?? 0).toFixed(1)} mata</div>
                  {g ? (
                    <div className="flex items-center gap-2 mt-1"><Avatar nama={g.nama} kecil /><span className="font-semibold text-sm">{g.nama}</span>
                      <span className="ml-auto text-xs font-mono font-semibold flex items-center gap-1">{f2(c.indeksSebelum)}<ArrowRight size={11} />{f2(c.indeksSelepas)}</span></div>
                  ) : <div className="font-semibold text-sm text-amber-800 mt-1">Dibiarkan kosong</div>}
                  <div className="mt-1 flex flex-wrap gap-1">{c.sebab.map((s) => <span key={s} className="cip bg-white border border-navy-100 text-navy-600 font-medium">{s}</span>)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy-100">
        <span className="text-sm text-navy-500">{terima.length} daripada {cadangan.length} jawatan akan diisi</span>
        <div className="flex gap-2"><button onClick={tutup} className="btn-hantu">Batal</button>
          <button disabled={!terima.length || sibuk} onClick={terap} className="btn-utama"><Wand2 size={16} /> Terapkan {terima.length}</button></div>
      </div>
    </Modal>
  )
}
