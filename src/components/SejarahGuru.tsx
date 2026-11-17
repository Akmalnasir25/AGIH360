import { useAplikasi } from '../context/Aplikasi'
import type { Konteks } from '../lib/indeks'
import { sejarahGuru } from '../lib/sejarah'
import { PERANAN_UTAMA } from '../lib/sejarah'

/** Garis masa jawatan guru merentas tahun (daripada snapshot lantikan). */
export function SejarahGuru({ guruId, cetak = false }: { guruId: string; cetak?: boolean }) {
  const { k } = useAplikasi()
  if (!k) return null
  const sej = sejarahGuru(k.data, guruId)
  if (!sej.length) return <p className="text-sm text-navy-500">Tiada rekod.</p>
  return (
    <div className={cetak ? 'space-y-4' : 'grid sm:grid-cols-3 gap-3'}>
      {sej.map((y) => (
        <div key={y.tahun} className={cetak ? '' : 'rounded-2xl border border-navy-100 p-3'}>
          <div className="flex items-center justify-between">
            <div className="font-display font-black text-lg">{y.tahun}</div>
            <span className="cip bg-navy-100 text-navy-600">{y.jawatan.length} jawatan</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {y.jawatan.map((j, i) => (
              <li key={i} className="flex gap-1.5">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${PERANAN_UTAMA.test(j.peranan) ? 'bg-emas-500' : 'bg-navy-300'}`} />
                <span><b>{j.peranan}</b>, {j.jk}</span>
              </li>
            ))}
            {y.luar.map((t) => <li key={t.id} className="flex gap-1.5 text-violet-700"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />{t.keterangan}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** Teks ringkas senarai tugas guru — untuk WhatsApp/Telegram */
export function teksTugas(k: Konteks, guruId: string) {
  const d = k.data
  const g = d.guru.find((x) => x.id === guruId)
  const baris = (k.lantikanGuru.get(guruId) ?? []).map((sid, i) => {
    const s = d.slot.find((x) => x.id === sid)!
    const jk = d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    return `${i + 1}. ${s.label || d.peranan.find((p) => p.id === s.peranan_id)?.nama}, ${jk.nama}`
  })
  return [
    `Assalamualaikum / Salam sejahtera ${g?.nama ?? ''},`,
    '',
    `Senarai tugas anda bagi sesi ${d.sekolah.tahun_semasa} di ${d.sekolah.nama}:`,
    ...baris,
    '',
    'Surat lantikan rasmi boleh dimuat turun di NeracaTugas → "Tugas Saya". Terima kasih atas komitmen cikgu.',
  ].join('\n')
}
