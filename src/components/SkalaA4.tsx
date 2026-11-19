import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** A4 pada 96 dpi */
export const LEBAR_A4 = 794

/**
 * Lukis kandungan pada lebar tetap (saiz cetakan sebenar) dan kecilkan berkadar pada skrin yang lebih sempit.
 * Semasa cetak, skala dibatalkan — kandungan dicetak pada saiz sebenar.
 */
export function Skala({ lebar = LEBAR_A4, children, className = '' }: { lebar?: number; children: ReactNode; className?: string }) {
  const luar = useRef<HTMLDivElement>(null)
  const dalam = useRef<HTMLDivElement>(null)
  const [u, setU] = useState({ k: 1, t: 0 })
  useLayoutEffect(() => {
    const L = luar.current, D = dalam.current
    if (!L || !D) return
    const kira = () => { const k = Math.min(1, L.clientWidth / lebar); setU({ k, t: D.offsetHeight * k }) }
    kira()
    const ro = new ResizeObserver(kira); ro.observe(L); ro.observe(D)
    return () => ro.disconnect()
  }, [lebar])
  return (
    <div ref={luar} className={`w-full overflow-hidden print:!h-auto print:overflow-visible ${className}`} style={{ height: u.t || undefined }}>
      <div ref={dalam} className="print:!transform-none" style={{ width: lebar, transform: u.k < 1 ? `scale(${u.k})` : undefined, transformOrigin: 'top left' }}>{children}</div>
    </div>
  )
}
