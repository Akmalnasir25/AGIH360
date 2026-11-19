import { useState } from 'react'
import { Skala } from './SkalaA4'
import type { Sekolah } from '../lib/types'
import { emelRasmi, isiKepala } from '../lib/kepala'

export type ModKepala = 'kosong' | 'logo' | 'imej'

const KUNCI = 'agih360.kepalaSurat'

/** Mod kepala surat untuk cetakan — diingati dalam pelayar ini sahaja. */
export function useModKepala(s: Sekolah): [ModKepala, (m: ModKepala) => void] {
  const [mod, setMod] = useState<ModKepala>(() => {
    let m: string | null = null
    try { m = localStorage.getItem(KUNCI) } catch { /* storan disekat */ }
    if (m === 'kosong' || m === 'logo' || (m === 'imej' && s.kepala_surat)) return m
    return 'logo'
  })
  const set = (m: ModKepala) => { setMod(m); try { localStorage.setItem(KUNCI, m) } catch { /* abaikan */ } }
  // Jika imej kepala surat dibuang, jatuh balik ke logo
  return [mod === 'imej' && !s.kepala_surat ? 'logo' : mod, set]
}

export function PilihKepala({ mod, set, s }: { mod: ModKepala; set: (m: ModKepala) => void; s: Sekolah }) {
  const pilihan: [ModKepala, string, string][] = [
    ['logo', 'Format KPM', 'Jata Negara + KPM + maklumat sekolah + logo sekolah (dijana automatik)'],
    ['imej', 'Imej kepala surat', s.kepala_surat ? 'Imej kepala surat penuh yang dimuat naik' : 'Muat naik di Tetapan dahulu'],
    ['kosong', 'Kosong', 'Ruang kosong — untuk kertas yang sudah bercetak kepala surat'],
  ]
  return (
    <div className="flex items-center gap-2 no-print">
      <span className="text-xs font-semibold text-navy-500 whitespace-nowrap">Kepala surat:</span>
      <div className="flex rounded-xl bg-navy-50 p-1 text-xs font-semibold">
        {pilihan.map(([v, l, t]) => (
          <button key={v} title={t} disabled={v === 'imej' && !s.kepala_surat} onClick={() => set(v)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-40 ${mod === v ? 'bg-white shadow-card text-navy-900' : 'text-navy-500'}`}>{l}</button>
        ))}
      </div>
    </div>
  )
}

export const emelSekolah = (s: Sekolah) => emelRasmi(s)

/** Kepala dokumen bercetak. Mod 'logo' = format rasmi KPM:
 *  Jata | KEMENTERIAN PENDIDIKAN, nama, alamat, negeri, kod (rata kiri) | Telefon/Faks/Email sebaris 3 baris akhir; logo sekolah kanan atas. */
export function KepalaSurat({ s, mod }: { s: Sekolah; mod: ModKepala }) {
  if (mod === 'kosong') return <div className="h-[32mm]" aria-hidden />
  if (mod === 'imej' && s.kepala_surat) return <img src={s.kepala_surat} alt={s.nama} className="block w-full h-auto" />
  const { kiri, kanan } = isiKepala(s)
  const baris = ['KEMENTERIAN PENDIDIKAN', ...kiri]
  const mulaKanan = baris.length - kanan.length
  return (
    <Skala lebar={642}>
    <table className="w-full border-collapse font-['Times_New_Roman',Times,serif] text-black leading-[1.2]">
      <tbody>
        {baris.map((t, i) => (
          <tr key={i} className="align-baseline">
            {i === 0 && <td rowSpan={baris.length} className="w-[1%] align-middle p-0 pr-[3mm]"><img src="/jata-negara.jpg" alt="Jata Negara" className="block h-[25mm] w-[29mm] max-w-none object-contain" /></td>}
            <td className={`w-full p-0 pr-[4mm] text-[16px] whitespace-nowrap align-baseline ${i === 0 ? 'font-bold' : ''}`}>{t}</td>
            {i === 0 && mulaKanan > 0 && <td colSpan={3} rowSpan={mulaKanan} className="relative p-0">{s.logo_url && <img src={s.logo_url} alt="" className="absolute left-1/2 bottom-[1mm] -translate-x-1/2 h-[19mm] w-auto max-w-none object-contain" />}</td>}
            {i >= mulaKanan && (() => { const [l, v] = kanan[i - mulaKanan]; return <><td className="p-0 pl-[2mm] pr-[6mm] text-[15px] whitespace-nowrap align-baseline">{l}</td><td className="p-0 pr-[4mm] text-[15px] align-baseline">:</td><td className="p-0 text-[15px] whitespace-nowrap align-baseline">{v}</td></> })()}
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-[3mm] border-b border-[#a0a0a0]" />
    </Skala>
  )
}

/** Baca fail imej, kecilkan (lebar maks) & mampatkan → data URL. PNG kekal lut sinar untuk logo. */
export async function mampatImej(fail: File, lebarMaks: number, jenis: 'image/png' | 'image/jpeg', had: number): Promise<string> {
  if (!fail.type.startsWith('image/')) throw new Error('Sila pilih fail imej (PNG atau JPG).')
  const url = URL.createObjectURL(fail)
  try {
    const img = await new Promise<HTMLImageElement>((ok, gagal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => gagal(new Error('Imej tidak dapat dibaca.')); i.src = url })
    let lebar = Math.min(lebarMaks, img.naturalWidth)
    for (let cuba = 0; cuba < 5; cuba++) {
      const tinggi = Math.round((img.naturalHeight / img.naturalWidth) * lebar)
      const c = document.createElement('canvas')
      c.width = lebar; c.height = tinggi
      const x = c.getContext('2d')!
      if (jenis === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, lebar, tinggi) }
      x.drawImage(img, 0, 0, lebar, tinggi)
      const data = c.toDataURL(jenis, 0.85)
      if (data.length <= had) return data
      lebar = Math.round(lebar * 0.75)
    }
    throw new Error('Imej terlalu besar walaupun selepas dikecilkan.')
  } finally { URL.revokeObjectURL(url) }
}
