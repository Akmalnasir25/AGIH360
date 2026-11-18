import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { LABEL_STATUS, type StatusBeban } from '../lib/indeks'

export function Logo({ kecil = false, terang = false }: { kecil?: boolean; terang?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <img src="/logo-ikon.png" alt="" className={`${kecil ? 'h-9 w-9' : 'h-11 w-11'} object-contain drop-shadow-sm`} />
      <div className="leading-none">
        <div className={`font-display font-black italic tracking-tight ${kecil ? 'text-lg' : 'text-xl'} ${terang ? 'text-white' : 'text-[#123E8C]'}`}>
          AGIH<span className="bg-gradient-to-r from-[#2FB24A] to-[#7DC92B] bg-clip-text text-transparent">360</span>
        </div>
        {!kecil && <div className={`text-[10px] font-semibold tracking-[.18em] uppercase mt-1 ${terang ? 'text-navy-300' : 'text-navy-400'}`}>Agihan tugas seimbang</div>}
      </div>
    </div>
  )
}

const WARNA_STATUS: Record<StatusBeban, string> = {
  terbeban: 'bg-rose-100 text-rose-700',
  seimbang: 'bg-brand-100 text-brand-800',
  kurang: 'bg-sky-100 text-sky-700',
  tiada_tugas: 'bg-amber-100 text-amber-800',
  dikecualikan: 'bg-navy-100 text-navy-500',
}
export const TITIK_STATUS: Record<StatusBeban, string> = {
  terbeban: 'bg-rose-500', seimbang: 'bg-brand-500', kurang: 'bg-sky-500', tiada_tugas: 'bg-amber-500', dikecualikan: 'bg-navy-300',
}

export function CipStatus({ s }: { s: StatusBeban }) {
  return (
    <span className={`cip ${WARNA_STATUS[s]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TITIK_STATUS[s]}`} />
      {LABEL_STATUS[s]}
    </span>
  )
}

/** Bar indeks: skala 0 → 2.0, dengan jalur seimbang ditanda */
export function BarIndeks({ nilai, rendah, tinggi, pratonton }: { nilai: number; rendah: number; tinggi: number; pratonton?: number }) {
  const max = 2
  const pc = (v: number) => `${Math.min(100, (Math.max(0, v) / max) * 100)}%`
  const warna = (v: number) => (v > tinggi ? 'bg-rose-500' : v < rendah ? 'bg-sky-500' : 'bg-brand-500')
  return (
    <div className="relative h-2 w-full rounded-full bg-navy-100 overflow-hidden">
      <div className="absolute inset-y-0 bg-brand-500/10" style={{ left: pc(rendah), width: `calc(${pc(tinggi)} - ${pc(rendah)})` }} />
      {pratonton !== undefined && pratonton > nilai && (
        <div className={`absolute inset-y-0 left-0 ${warna(pratonton)} opacity-30`} style={{ width: pc(pratonton) }} />
      )}
      <div className={`absolute inset-y-0 left-0 rounded-full ${warna(nilai)} transition-all duration-500`} style={{ width: pc(nilai) }} />
      <div className="absolute inset-y-0 w-px bg-navy-400/60" style={{ left: pc(1) }} />
    </div>
  )
}

export function Modal({ buka, tutup, tajuk, sub, children, lebar = 'max-w-2xl' }: {
  buka: boolean; tutup: () => void; tajuk: ReactNode; sub?: ReactNode; children: ReactNode; lebar?: string
}) {
  useEffect(() => {
    if (!buka) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && tutup()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [buka, tutup])
  if (!buka) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={tutup} />
      <div className={`relative w-full ${lebar} max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-pop animate-naik`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-navy-100">
          <div>
            <h3 className="text-lg font-bold">{tajuk}</h3>
            {sub && <div className="text-sm text-navy-500 mt-0.5">{sub}</div>}
          </div>
          <button onClick={tutup} className="rounded-full p-2 hover:bg-navy-50 text-navy-400"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Nama ringkas: buang 'bin/binti …' untuk paparan padat */
export const namaPendek = (n: string) => n.replace(/ (bin|binti|a\/l|a\/p|anak) .*/i, '')

export function KadStat({ label, nilai, sub, ikon, warna = 'navy', onClick, aktif }: {
  label: string; nilai: ReactNode; sub?: ReactNode; ikon: ReactNode; warna?: 'navy' | 'brand' | 'rose' | 'sky' | 'amber'; onClick?: () => void; aktif?: boolean
}) {
  const w: Record<string, string> = {
    navy: 'from-navy-800 to-navy-950 text-white',
    brand: 'from-brand-500 to-brand-700 text-white',
    rose: 'from-rose-500 to-rose-700 text-white',
    sky: 'from-sky-500 to-sky-700 text-white',
    amber: 'from-amber-400 to-amber-600 text-white',
  }
  return (
    <button onClick={onClick} className={`text-left rounded-2xl p-4 bg-gradient-to-br ${w[warna]} shadow-card relative overflow-hidden transition hover:-translate-y-0.5 ${aktif ? 'ring-4 ring-offset-2 ring-brand-300' : ''}`}>
      <div className="absolute -right-4 -top-4 opacity-15 scale-[2.2]">{ikon}</div>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider opacity-90">{ikon}{label}</div>
      <div className="font-display text-4xl font-extrabold mt-2">{nilai}</div>
      {sub && <div className="text-xs opacity-85 mt-1">{sub}</div>}
    </button>
  )
}

export function Kosong({ ikon, tajuk, teks, children }: { ikon: ReactNode; tajuk: string; teks?: string; children?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-navy-50 text-navy-400 flex items-center justify-center">{ikon}</div>
      <div className="font-display font-bold text-lg mt-4">{tajuk}</div>
      {teks && <p className="text-sm text-navy-500 mt-1 max-w-md mx-auto">{teks}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

export const WARNA_BIDANG: Record<string, { bg: string; teks: string; titik: string }> = {
  indigo: { bg: 'bg-indigo-50', teks: 'text-indigo-700', titik: 'bg-indigo-500' },
  sky: { bg: 'bg-sky-50', teks: 'text-sky-700', titik: 'bg-sky-500' },
  emerald: { bg: 'bg-emerald-50', teks: 'text-emerald-700', titik: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', teks: 'text-amber-700', titik: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', teks: 'text-rose-700', titik: 'bg-rose-500' },
  violet: { bg: 'bg-violet-50', teks: 'text-violet-700', titik: 'bg-violet-500' },
  slate: { bg: 'bg-slate-100', teks: 'text-slate-700', titik: 'bg-slate-500' },
}

export function Avatar({ nama, kecil = false }: { nama: string; kecil?: boolean }) {
  const bersih = nama.replace(/^(Pn\.|En\.|Cik|Ustazah|Ustaz|Hjh\.|Hj\.|Tn\.|Dr\.)\s*/gi, '').replace(/^(Hjh\.|Hj\.)\s*/i, '')
  const ini = bersih.split(/\s+/).filter((w) => !/^(bin|binti|a\/l|a\/p|anak)$/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const hues = ['bg-brand-100 text-brand-800', 'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-800', 'bg-rose-100 text-rose-800', 'bg-indigo-100 text-indigo-800']
  const h = hues[[...nama].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length]
  return <div className={`${kecil ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'} shrink-0 rounded-full font-bold flex items-center justify-center ${h}`}>{ini}</div>
}

export const f2 = (n: number) => n.toFixed(2)
export const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

/** Modal pengesahan dalam aplikasi (ganti window.confirm). Guna: const [el, sahkan] = useSahkan(); if (await sahkan('…')) … */
export function useSahkan(): [ReactNode, (mesej: string, opsyen?: { tajuk?: string; butang?: string; bahaya?: boolean }) => Promise<boolean>] {
  const [s, setS] = useState<{ mesej: string; tajuk: string; butang: string; bahaya: boolean; selesai: (v: boolean) => void } | null>(null)
  const tanya = (mesej: string, o: { tajuk?: string; butang?: string; bahaya?: boolean } = {}) =>
    new Promise<boolean>((selesai) => setS({ mesej, tajuk: o.tajuk ?? 'Pasti?', butang: o.butang ?? 'Ya, teruskan', bahaya: o.bahaya ?? true, selesai }))
  const tutup = (v: boolean) => { s?.selesai(v); setS(null) }
  const el = s ? (
    <Modal buka tutup={() => tutup(false)} tajuk={s.tajuk} lebar="max-w-md">
      <p className="text-sm text-navy-600 whitespace-pre-line">{s.mesej}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={() => tutup(false)} className="btn-hantu">Batal</button>
        <button autoFocus onClick={() => tutup(true)} className={s.bahaya ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-utama'}>{s.butang}</button>
      </div>
    </Modal>
  ) : null
  return [el, tanya]
}

/** Pautan WhatsApp (wa.me) dengan teks — nombor Malaysia dinormalkan ke 60… */
export function pautanWhatsApp(teks: string, telefon?: string | null) {
  const no = (telefon ?? '').replace(/\D/g, '').replace(/^0/, '60')
  return `https://wa.me/${no}?text=${encodeURIComponent(teks)}`
}
