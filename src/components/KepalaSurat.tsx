import { useState } from 'react'
import type { Sekolah } from '../lib/types'

export type ModKepala = 'kosong' | 'logo' | 'imej'

const KUNCI = 'agih360.kepalaSurat'

/** Mod kepala surat untuk cetakan — diingati dalam pelayar ini sahaja. */
export function useModKepala(s: Sekolah): [ModKepala, (m: ModKepala) => void] {
  const [mod, setMod] = useState<ModKepala>(() => {
    let m: string | null = null
    try { m = localStorage.getItem(KUNCI) } catch { /* storan disekat */ }
    if (m === 'kosong' || m === 'logo' || (m === 'imej' && s.kepala_surat)) return m
    return s.kepala_surat ? 'imej' : 'logo'
  })
  const set = (m: ModKepala) => { setMod(m); try { localStorage.setItem(KUNCI, m) } catch { /* abaikan */ } }
  // Jika imej kepala surat dibuang, jatuh balik ke logo
  return [mod === 'imej' && !s.kepala_surat ? 'logo' : mod, set]
}

export function PilihKepala({ mod, set, s }: { mod: ModKepala; set: (m: ModKepala) => void; s: Sekolah }) {
  const pilihan: [ModKepala, string, string][] = [
    ['imej', 'Kepala surat', s.kepala_surat ? 'Imej kepala surat rasmi sekolah' : 'Muat naik di Tetapan dahulu'],
    ['logo', 'Logo + nama', 'Logo, nama & alamat sekolah dijana automatik'],
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

/** Kepala dokumen bercetak. */
export function KepalaSurat({ s, mod }: { s: Sekolah; mod: ModKepala }) {
  if (mod === 'kosong') return <div className="h-[32mm]" aria-hidden />
  if (mod === 'imej' && s.kepala_surat) return <img src={s.kepala_surat} alt={s.nama} className="block w-full h-auto" />
  const alamat = [s.alamat, s.daerah, s.negeri].filter(Boolean).join(', ')
  return (
    <div className="flex items-center gap-4 border-b-2 border-black pb-3">
      {s.logo_url ? <img src={s.logo_url} alt="" className="h-20 w-20 object-contain shrink-0" /> : <div className="w-0" />}
      <div className={`flex-1 ${s.logo_url ? 'text-left' : 'text-center'}`}>
        <div className="font-bold text-base uppercase">{s.nama}</div>
        {alamat && <div>{alamat}</div>}
        {s.telefon && <div>Tel: {s.telefon}</div>}
      </div>
    </div>
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
