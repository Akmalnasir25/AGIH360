import { useMemo, useState } from 'react'
import { Mail, MessageCircle, Printer, Search } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import type { Konteks } from '../lib/indeks'
import { pautanWhatsApp } from '../components/ui'
import { teksTugas } from '../components/SejarahGuru'
import { NotifikasiEmel } from '../components/NotifikasiEmel'
import { boleh } from '../lib/kuasa'
import { KepalaSurat, PilihKepala, useModKepala, type ModKepala } from '../components/KepalaSurat'

export default function Surat() {
  const { k, peranan } = useAplikasi()
  const [pilih, setPilih] = useState<Set<string>>(new Set())
  const [cari, setCari] = useState('')
  const [emel, setEmel] = useState(false)
  const ada = useMemo(() => (k ? k.data.guru.filter((g) => (k.lantikanGuru.get(g.id) ?? []).length > 0).sort((a, b) => a.nama.localeCompare(b.nama)) : []), [k])
  const [mod, setMod] = useModKepalaAman(k?.data.sekolah)
  if (!k) return null
  const cetak = pilih.size ? ada.filter((g) => pilih.has(g.id)) : ada
  const tog = (id: string) => { const s = new Set(pilih); if (s.has(id)) s.delete(id); else s.add(id); setPilih(s) }

  return (
    <div>
      <TajukHalaman tajuk="Surat Lantikan" sub="Satu surat untuk setiap guru dengan Lampiran A senarai tugas. Cetak atau Simpan sebagai PDF."
        tindakan={<>
          {boleh(peranan, 'lulus') && <button onClick={() => setEmel(true)} className="btn-garis"><Mail size={16} /> E-mel kepada guru</button>}
          <button onClick={() => window.print()} className="btn-utama"><Printer size={16} /> Cetak {cetak.length} surat</button>
        </>} />
      {!['lulus', 'muktamad'].includes(k.data.kelulusan.status) && (
        <div className="no-print mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">Agihan masih <b>{k.data.kelulusan.status}</b> — surat dicetak dengan tera <b>DRAF</b>. Luluskan agihan (Agih Tugas → Luluskan) untuk surat rasmi.</div>
      )}
      <div className="mb-4"><PilihKepala mod={mod} set={setMod} s={k.data.sekolah} /></div>
      {emel && <NotifikasiEmel tutup={() => setEmel(false)} />}
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        <div className="kad p-3 h-fit lg:sticky lg:top-6 no-print">
          <div className="relative mb-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-9" placeholder="Tapis guru…" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
          <div className="text-xs text-navy-500 px-1 mb-2">{pilih.size ? `${pilih.size} dipilih` : 'Tiada dipilih = cetak semua'}{pilih.size > 0 && <button className="ml-2 text-brand-600 font-semibold" onClick={() => setPilih(new Set())}>reset</button>}</div>
          <div className="max-h-[60vh] overflow-y-auto space-y-0.5">
            {ada.filter((g) => !cari || g.nama.toLowerCase().includes(cari.toLowerCase())).map((g) => (
              <label key={g.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-navy-50 cursor-pointer">
                <input type="checkbox" className="accent-brand-500" checked={pilih.has(g.id)} onChange={() => tog(g.id)} />
                <span className="truncate flex-1">{g.nama}</span>
                <a title="Kongsi senarai tugas melalui WhatsApp" href={pautanWhatsApp(teksTugas(k, g.id), g.telefon)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="opacity-40 group-hover:opacity-100 text-[#25D366]"><MessageCircle size={15} /></a>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-6 print:space-y-0">
          {cetak.slice(0, pilih.size ? undefined : 3).map((g, i) => <SatuSurat key={g.id} k={k} guruId={g.id} bil={i + 1} mod={mod} />)}
          {!pilih.size && cetak.length > 3 && <div className="no-print text-center text-sm text-navy-500">Pratonton 3 surat pertama · {cetak.length - 3} lagi akan dicetak</div>}
          <div className="hidden print:block">{!pilih.size && cetak.slice(3).map((g, i) => <SatuSurat key={g.id} k={k} guruId={g.id} bil={i + 4} mod={mod} />)}</div>
        </div>
      </div>
    </div>
  )
}

export function SatuSurat({ k, guruId, bil, mod }: { k: Konteks; guruId: string; bil: number; mod?: ModKepala }) {
  const d = k.data
  const s = d.sekolah
  const g = d.guru.find((x) => x.id === guruId)!
  const tugas = (k.lantikanGuru.get(guruId) ?? []).map((sid) => {
    const sl = d.slot.find((x) => x.id === sid)!
    const jk = d.jawatankuasa.find((j) => j.id === sl.jawatankuasa_id)!
    return { jk, b: d.bidang.find((x) => x.id === jk.bidang_id)!, p: d.peranan.find((x) => x.id === sl.peranan_id)!, label: sl.label }
  }).sort((a, b) => a.b.susunan - b.b.susunan || a.jk.susunan - b.jk.susunan)
  const tarikh = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
  const draf = !['lulus', 'muktamad'].includes(d.kelulusan.status)
  return (
    <div className="relative overflow-hidden bg-white shadow-card print:shadow-none rounded-2xl print:rounded-none p-10 sm:p-14 text-[13px] leading-relaxed text-black page-break font-serif">
      {draf && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="text-[120px] font-black text-rose-500/10 -rotate-[30deg] [print-color-adjust:exact]">DRAF</span></div>}
      <KepalaSurat s={s} mod={mod ?? (s.kepala_surat ? 'imej' : 'logo')} />
      <div className="flex justify-between mt-4">
        <div>Ruj. Kami: {s.kod}/AT/{s.tahun_semasa}/{String(bil).padStart(3, '0')}</div>
        <div>Tarikh: {tarikh}</div>
      </div>
      <div className="mt-5"><b>{g.nama}</b><br />{s.nama}</div>
      <p className="mt-5">Tuan/Puan,</p>
      <p className="font-bold uppercase mt-3">Pelantikan Tugas dan Tanggungjawab Sesi {s.tahun_semasa}</p>
      <p className="mt-3 text-justify">Dengan hormatnya perkara di atas adalah dirujuk. Sukacita dimaklumkan bahawa tuan/puan dilantik untuk memegang jawatan seperti di <b>Lampiran A</b> bagi sesi persekolahan {s.tahun_semasa}, berkuat kuasa mulai tarikh surat ini sehingga dimaklumkan kelak.</p>
      <p className="mt-3 text-justify">Tuan/puan diharap dapat melaksanakan tugas dengan penuh amanah, dedikasi dan bertanggungjawab demi kecemerlangan sekolah. Kerjasama dan komitmen tuan/puan amatlah dihargai.</p>
      <p className="mt-4">Sekian, terima kasih.</p>
      <p className="mt-2 font-bold italic">"MALAYSIA MADANI"</p>
      <p className="mt-2">Saya yang menjalankan amanah,</p>
      <div className="mt-14">
        <div className="w-56 border-t border-black pt-1 font-bold">{s.nama_ketua ?? '..................................'}</div>
        <div>{s.jawatan_ketua ?? (s.jenis === 'SK' ? 'Guru Besar' : 'Pengetua')}</div>
        <div>{s.nama}</div>
      </div>
      <div className="mt-10 pt-5 border-t border-dashed border-gray-400">
        <div className="font-bold">LAMPIRAN A: Senarai Tugas {g.nama}</div>
        <table className="w-full mt-2 border-collapse text-[12px]">
          <thead><tr><th className="border border-black p-1.5 w-8">Bil</th><th className="border border-black p-1.5 text-left">Jawatankuasa</th><th className="border border-black p-1.5 text-left">Jawatan</th><th className="border border-black p-1.5 text-left">Bidang</th></tr></thead>
          <tbody>{tugas.map((t, i) => <tr key={i}><td className="border border-black p-1.5 text-center">{i + 1}</td><td className="border border-black p-1.5">{t.jk.nama}</td><td className="border border-black p-1.5">{t.label || t.p.nama}</td><td className="border border-black p-1.5">{t.b.nama}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

/** useModKepala memerlukan sekolah; sebelum data dimuat guna nilai sementara. */
function useModKepalaAman(s: Konteks['data']['sekolah'] | undefined) {
  return useModKepala(s ?? ({ kepala_surat: null } as Konteks['data']['sekolah']))
}
