import { useMemo, useState } from 'react'
import { Mail, MessageCircle, Printer, Search } from 'lucide-react'
import { useAplikasi } from '../context/Aplikasi'
import { TajukHalaman } from '../components/Kerangka'
import type { Konteks } from '../lib/indeks'
import type { Sekolah } from '../lib/types'
import { pautanWhatsApp } from '../components/ui'
import { teksTugas } from '../components/SejarahGuru'
import { NotifikasiEmel } from '../components/NotifikasiEmel'
import { boleh } from '../lib/kuasa'
import { Skala } from '../components/SkalaA4'
import { KepalaSurat, PilihKepala, useModKepala, type ModKepala } from '../components/KepalaSurat'

export default function Surat() {
  const { k, peranan } = useAplikasi()
  const [pilih, setPilih] = useState<Set<string>>(new Set())
  const [cari, setCari] = useState('')
  const [emel, setEmel] = useState(false)
  const ada = useMemo(() => (k ? k.data.guru.filter((g) => (k.lantikanGuru.get(g.id) ?? []).length > 0).sort((a, b) => a.nama.localeCompare(b.nama)) : []), [k])
  const [mod, setMod] = useModKepalaAman(k?.data.sekolah)
  const [butiran, setButiran] = useButiran(k?.data.sekolah)
  if (!k) return null
  const cetak = pilih.size ? ada.filter((g) => pilih.has(g.id)) : ada
  const tog = (id: string) => { const s = new Set(pilih); if (s.has(id)) s.delete(id); else s.add(id); setPilih(s) }

  return (
    <div>
      <TajukHalaman tajuk="Surat Lantikan" sub="Surat rasmi format KPM untuk setiap guru — senarai jawatan dalam badan surat. Cetak atau Simpan sebagai PDF."
        tindakan={<>
          {boleh(peranan, 'lulus') && <button onClick={() => setEmel(true)} className="btn-garis"><Mail size={16} /> E-mel kepada guru</button>}
          <button onClick={() => window.print()} className="btn-utama"><Printer size={16} /> Cetak {cetak.length} surat</button>
        </>} />
      {!['lulus', 'muktamad'].includes(k.data.kelulusan.status) && (
        <div className="no-print mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">Agihan masih <b>{k.data.kelulusan.status}</b> — surat dicetak dengan tera <b>DRAF</b>. Luluskan agihan (Agih Tugas → Luluskan) untuk surat rasmi.</div>
      )}
      <div className="kad p-4 mb-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="font-bold text-sm">Butiran surat</div>
          <PilihKepala mod={mod} set={setMod} s={k.data.sekolah} />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div><label className="label">No. rujukan fail</label><input className="input" value={butiran.rujukan} onChange={(e) => setButiran({ ...butiran, rujukan: e.target.value })} /></div>
          <div><label className="label">Tarikh surat</label><input type="date" className="input" value={butiran.tarikh} onChange={(e) => setButiran({ ...butiran, tarikh: e.target.value })} /></div>
          <div><label className="label">Berkuat kuasa mulai</label><input type="date" className="input" value={butiran.mula} onChange={(e) => setButiran({ ...butiran, mula: e.target.value })} /></div>
          <div><label className="label">Hingga</label><input type="date" className="input" value={butiran.tamat} onChange={(e) => setButiran({ ...butiran, tamat: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Tajuk surat</label><input className="input" value={butiran.tajuk} onChange={(e) => setButiran({ ...butiran, tajuk: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">s.k. (satu baris = satu penerima)</label><textarea rows={2} className="input" value={butiran.sk} onChange={(e) => setButiran({ ...butiran, sk: e.target.value })} /></div>
        </div>
        <p className="text-[11px] text-navy-400 mt-2">Jika tarikh berkuat kuasa dikosongkan, surat menyebut "mulai tarikh surat ini sehingga dimaklumkan kelak". Butiran ini diingati dalam pelayar ini.</p>
      </div>
      {emel && <NotifikasiEmel tutup={() => setEmel(false)} />}
      <div className="grid xl:grid-cols-[260px_1fr] gap-5 print:block">
        <div className="kad p-3 h-fit xl:sticky xl:top-6 no-print">
          <div className="relative mb-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" /><input className="input pl-9" placeholder="Tapis guru…" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
          <div className="text-xs text-navy-500 px-1 mb-2">{pilih.size ? `${pilih.size} dipilih` : 'Tiada dipilih = cetak semua'}{pilih.size > 0 && <button className="ml-2 text-brand-600 font-semibold" onClick={() => setPilih(new Set())}>reset</button>}</div>
          <div className="max-h-[40vh] xl:max-h-[60vh] overflow-y-auto space-y-0.5 grid sm:grid-cols-2 xl:grid-cols-1 gap-x-2">
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
          {cetak.slice(0, pilih.size ? undefined : 3).map((g, i) => <SatuSurat key={g.id} k={k} guruId={g.id} bil={i + 1} mod={mod} butiran={butiran} />)}
          {!pilih.size && cetak.length > 3 && <div className="no-print text-center text-sm text-navy-500">Pratonton 3 surat pertama · {cetak.length - 3} lagi akan dicetak</div>}
          <div className="hidden print:block">{!pilih.size && cetak.slice(3).map((g, i) => <SatuSurat key={g.id} k={k} guruId={g.id} bil={i + 4} mod={mod} butiran={butiran} />)}</div>
        </div>
      </div>
    </div>
  )
}

export interface ButiranSurat { rujukan: string; tarikh: string; mula: string; tamat: string; tajuk: string; sk: string }

const hariIni = () => new Date().toISOString().slice(0, 10)
export function butiranLalai(s: Sekolah): ButiranSurat {
  return {
    rujukan: `${s.kod} 600-3/1/1`, tarikh: hariIni(), mula: '', tamat: '',
    tajuk: `PELANTIKAN JAWATANKUASA DAN TUGAS GURU TAHUN ${s.tahun_semasa}`,
    sk: 'Fail Unit Pengurusan',
  }
}
function useButiran(s: Sekolah | undefined): [ButiranSurat, (b: ButiranSurat) => void] {
  const kunci = `agih360.butiranSurat.${s?.kod ?? ''}`
  const [b, setB] = useState<ButiranSurat>(() => {
    const lalai = s ? butiranLalai(s) : { rujukan: '', tarikh: hariIni(), mula: '', tamat: '', tajuk: '', sk: '' }
    try { const x = localStorage.getItem(kunci); if (x) return { ...lalai, ...JSON.parse(x), tarikh: lalai.tarikh } } catch { /* abaikan */ }
    return lalai
  })
  const set = (n: ButiranSurat) => { setB(n); try { localStorage.setItem(kunci, JSON.stringify(n)) } catch { /* abaikan */ } }
  return [b, set]
}
const tarikhPanjang = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })

/** Surat lantikan rasmi format KPM. */
export function SatuSurat({ k, guruId, mod, butiran }: { k: Konteks; guruId: string; bil?: number; mod?: ModKepala; butiran?: ButiranSurat }) {
  const d = k.data
  const s = d.sekolah
  const bt = butiran ?? butiranLalai(s)
  const g = d.guru.find((x) => x.id === guruId)!
  const tugas = (k.lantikanGuru.get(guruId) ?? []).map((sid) => {
    const sl = d.slot.find((x) => x.id === sid)!
    const jk = d.jawatankuasa.find((j) => j.id === sl.jawatankuasa_id)!
    return { jk, b: d.bidang.find((x) => x.id === jk.bidang_id)!, p: d.peranan.find((x) => x.id === sl.peranan_id)!, label: sl.label }
  }).sort((a, b) => a.b.susunan - b.b.susunan || a.jk.susunan - b.jk.susunan)
  const draf = !['lulus', 'muktamad'].includes(d.kelulusan.status)
  const ketua = s.jawatan_ketua ?? (s.jenis === 'SK' ? 'Guru Besar' : 'Pengetua')
  const tempoh = bt.mula
    ? `Berkuat kuasa mulai ${tarikhPanjang(bt.mula)}${bt.tamat ? ` hingga ${tarikhPanjang(bt.tamat)}` : ' sehingga dimaklumkan kelak'}.`
    : 'Berkuat kuasa mulai tarikh surat ini sehingga dimaklumkan kelak.'
  const sk = bt.sk.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
  return (
    <Skala className="page-break">
    <div className="relative overflow-hidden bg-white shadow-card print:shadow-none w-[210mm] min-h-[297mm] print:min-h-0 px-[22mm] py-[16mm] print:py-0 text-[13px] leading-relaxed text-black font-[Arial,sans-serif]">
      {draf && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="text-[120px] font-black text-rose-500/10 -rotate-[30deg] [print-color-adjust:exact]">DRAF</span></div>}
      <KepalaSurat s={s} mod={mod ?? 'logo'} />
      <table className="mt-4 ml-auto"><tbody>
        <tr><td className="pr-2 whitespace-nowrap align-top">Rujukan Kami</td><td className="align-top">: {bt.rujukan}</td></tr>
        <tr><td className="pr-2 whitespace-nowrap align-top">Tarikh</td><td className="align-top">: {tarikhPanjang(bt.tarikh)}</td></tr>
      </tbody></table>
      <div className="mt-4">Kepada</div>
      <div className="font-bold uppercase">{g.nama}</div>
      <div className="uppercase">{s.nama}</div>
      <p className="mt-4">Tuan/Puan,</p>
      <p className="mt-3 font-bold uppercase">{bt.tajuk}</p>
      <p className="mt-3">Dengan segala hormatnya perkara di atas dirujuk.</p>
      <p className="mt-3 text-justify"><span className="inline-block w-7">2.</span>Sehubungan dengan itu, sukacita dimaklumkan bahawa dengan kuasa yang diberikan kepada saya oleh Seksyen 130 Akta Pendidikan 1996, seperti termaktub dalam peraturan (4) Warta Kerajaan bertarikh 21 Mei 1998 PU (A) 196, tuan/puan telah dilantik sebagai :-</p>
      <ol className="mt-2 ml-7 space-y-0.5">
        {tugas.map((t, i) => (
          <li key={i} className="flex gap-2 uppercase"><span className="w-9 shrink-0">2.{i + 1}</span><span>{t.label || t.p.nama}, {t.jk.nama}</span></li>
        ))}
      </ol>
      <p className="mt-3 ml-7">{tempoh}</p>
      <p className="mt-3 text-justify"><span className="inline-block w-7">3.</span>Penjelasan tugas dan bidang pengurusan boleh dirujuk dalam Buku Pengurusan dan Takwim Sekolah bagi pelaksanaan tugas. Semoga dengan pelantikan ini, tuan/puan dapat melaksanakan amanah dan tanggungjawab yang diberikan secara profesional dan penuh komitmen, cekap dan berkualiti, seterusnya meningkatkan prestasi dan kecemerlangan pendidikan {s.nama}.</p>
      <p className="mt-3"><span className="inline-block w-7">4.</span>Kerjasama dan keprihatinan pihak tuan/puan amat dihargai.</p>
      <p className="mt-4">Sekian, terima kasih.</p>
      <p className="mt-3 font-bold">"MALAYSIA MADANI"</p>
      <p className="font-bold">"BERKHIDMAT UNTUK NEGARA"</p>
      <p className="mt-3">Saya yang menjalankan amanah,</p>
      <div className="mt-14 break-inside-avoid">
        <div className="font-bold uppercase">{s.nama_ketua ?? '..................................'}</div>
        <div className="uppercase">{ketua}</div>
        <div className="uppercase">{s.nama}</div>
      </div>
      {sk.length > 0 && (
        <div className="mt-6 text-[12px] flex gap-2"><span>s.k.</span><div>{sk.map((x, i) => <div key={i}>- {x}</div>)}</div></div>
      )}
    </div>
    </Skala>
  )
}

/** useModKepala memerlukan sekolah; sebelum data dimuat guna nilai sementara. */
function useModKepalaAman(s: Konteks['data']['sekolah'] | undefined) {
  return useModKepala(s ?? ({ kepala_surat: null } as Konteks['data']['sekolah']))
}
