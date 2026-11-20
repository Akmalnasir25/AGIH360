import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Konteks } from '../lib/indeks'
import type { Sekolah, SeksyenBuku } from '../lib/types'
import { binaCarta, type BidangEksport, type JKEksport } from '../lib/eksport'
import { hex, paletIkut, warnaBahagian, type Palet, type RekaBuku } from '../lib/tema'
import { senaraiGuruBuku, type KumpulanGuruBuku } from '../lib/buku'

const X: CSSProperties = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }
/** Satu halaman A4 (skrin: nisbah A4; cetak: tinggi tetap & pecah halaman) */
const HALAMAN = 'relative overflow-hidden w-full aspect-[210/297] bg-white'

/** Asingkan seksyen: Bahagian A (tiada bidang / bidang tiada dalam buku) vs ikut bab bidang. */
export function asingSeksyen(seksyen: SeksyenBuku[], data: { id: string }[]) {
  const ada = new Set(data.map((b) => b.id))
  const ikut = new Map<string, SeksyenBuku[]>()
  const a: SeksyenBuku[] = []
  for (const x of seksyen) {
    if (x.bidang_id && ada.has(x.bidang_id)) ikut.set(x.bidang_id, [...(ikut.get(x.bidang_id) ?? []), x])
    else a.push(x)
  }
  return { a, ikut }
}

export interface BahagianBuku { huruf: string; tajuk: string; warna: string; item: { kod: string; teks: string }[] }

/** Susun bahagian buku: A = Pengenalan & Maklumat Sekolah (seksyen + carta + senarai guru), kemudian setiap bidang. */
export function binaBahagian(seksyen: SeksyenBuku[], data: BidangEksport[], p: Palet, denganSenarai = true): BahagianBuku[] {
  const out: BahagianBuku[] = []
  const huruf = (i: number) => String.fromCharCode(65 + i)
  const { a: sA, ikut } = asingSeksyen(seksyen, data)
  const a = [...sA.map((x) => x.tajuk), 'Carta Organisasi', ...(denganSenarai ? ['Senarai Guru & Staf'] : [])]
  out.push({ huruf: 'A', tajuk: 'Pengenalan & Maklumat Sekolah', warna: warnaBahagian(p, 0), item: a.map((t, i) => ({ kod: `A${i + 1}`, teks: t })) })
  data.forEach((b) => {
    const i = out.length, h = huruf(i)
    const teks = [...(ikut.get(b.id) ?? []).map((x) => x.tajuk), ...b.jk.map((j) => j.nama)]
    out.push({ huruf: h, tajuk: b.nama, warna: warnaBahagian(p, i), item: teks.map((t, n) => ({ kod: `${h}${n + 1}`, teks: t })) })
  })
  return out
}

// ───────────────────────── Susun atur halaman A4 bernombor ─────────────────────────
const LEBAR = 794, TINGGI = 1123, PX = 64, PT = 64, PB = 76
const ISI_H = TINGGI - PT - PB
const LEBAR_ISI = LEBAR - PX * 2

/** Bilangan item yang muat pada halaman pemisah ikut gaya; selebihnya ke halaman sambungan. */
export const KAPASITI_PEMISAH: Record<RekaBuku['pemisah'], number> = { jalur: 26, geometri: 30, penuh: 20, minimal: 34 }
const KAPASITI_SAMBUNGAN = 56

interface Blok { key: string; el: ReactNode; kod?: string; ulang?: string }

/** Pecahkan teks seksyen kepada perenggan (setiap satu blok boleh berpindah ke halaman seterusnya). */
function perenggan(isi: string, w: string): ReactNode[] {
  return isi.split(/\n\s*\n/).map((para, i) => {
    const baris = para.split('\n').filter((b) => b.trim())
    if (!baris.length) return null
    if (baris.every((b) => /^\s*[-•]\s+/.test(b)))
      return <ul key={i} className="space-y-1">{baris.map((b, j) => <li key={j} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hex(w), ...X }} /><span>{b.replace(/^\s*[-•]\s+/, '')}</span></li>)}</ul>
    const [awal, ...lain] = baris
    const subtajuk = awal.length <= 60 && awal === awal.toUpperCase() && /[A-Z]/.test(awal)
    return <div key={i} className="text-justify">{subtajuk && <div className="font-bold text-[12px] tracking-wide mb-0.5" style={{ color: hex(w) }}>{awal}</div>}<p className="whitespace-pre-wrap">{(subtajuk ? lain : baris).join('\n')}</p></div>
  }).filter(Boolean) as ReactNode[]
}

function blokSeksyen(b: BahagianBuku, seksyen: SeksyenBuku[]): Blok[] {
  const out: Blok[] = []
  seksyen.forEach((x, i) => {
    const kod = b.item[i].kod
    const tajuk = <><TajukSub kod={kod} tajuk={x.tajuk} w={b.warna} /><div className="h-0.5 mb-3" style={{ background: `linear-gradient(90deg, ${hex(b.warna)}, transparent)`, ...X }} /></>
    const ps = x.isi ? perenggan(x.isi, b.warna) : []
    if (x.imej && x.isi && x.isi.length < 1400) {
      out.push({ key: `s${x.id}`, kod, el: <>{tajuk}<div className="grid grid-cols-[1fr_190px] gap-6 items-start"><div className="space-y-2.5">{ps}</div><img src={x.imej} alt="" className="w-full rounded-xl shadow-md" /></div></> })
      return
    }
    if (!ps.length) out.push({ key: `s${x.id}`, kod, el: tajuk })
    ps.forEach((el, j) => out.push({ key: `s${x.id}-${j}`, kod: j === 0 ? kod : undefined, el: j === 0 ? <>{tajuk}{el}</> : el }))
    if (x.imej) out.push({ key: `s${x.id}-img`, kod: ps.length ? undefined : kod, el: <img src={x.imej} alt="" className="mx-auto max-w-full max-h-[900px] rounded-xl border border-slate-200" /> })
    out[out.length - 1] = { ...out[out.length - 1], el: <div className="pb-6">{out[out.length - 1].el}</div> }
  })
  return out
}

function binaBlokA(b: BahagianBuku, seksyen: SeksyenBuku[], carta: ReturnType<typeof binaCarta>, guru: KumpulanGuruBuku[], p: Palet, telefon: boolean): Blok[] {
  const out: Blok[] = blokSeksyen(b, seksyen)
  out.push({ key: 'carta', kod: b.item[seksyen.length].kod, el: <Carta carta={carta} p={p} kod={b.item[seksyen.length].kod} w={b.warna} /> })
  const kodGuru = b.item[seksyen.length + 1]?.kod
  if (kodGuru) {
    let n = 0
    const lajur = <colgroup><col style={{ width: 30 }} /><col /><col style={{ width: 48 }} /><col style={{ width: 130 }} /><col style={{ width: 150 }} />{telefon && <col style={{ width: 92 }} />}</colgroup>
    out.push({ key: 'g-tajuk', kod: kodGuru, el: <TajukSub kod={kodGuru} tajuk="Senarai Guru & Staf" w={b.warna} /> })
    guru.forEach((kg, gi) => {
      const kepala = `g-kepala-${gi}`
      out.push({ key: kepala, el: (
        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: hex(p.utama) }}>{kg.tajuk} <span className="text-slate-400">({kg.baris.length})</span></div>
          <table className="w-full table-fixed border-collapse text-[10px]">{lajur}<thead><tr className="text-white" style={{ background: hex(b.warna), ...X }}>
            <th className="px-1.5 py-1 text-left">Bil</th><th className="px-1.5 py-1 text-left">Nama</th><th className="px-1.5 py-1 text-left">Gred</th>
            <th className="px-1.5 py-1 text-left">Jawatan</th><th className="px-1.5 py-1 text-left">Opsyen / Subjek</th>{telefon && <th className="px-1.5 py-1 text-left">No. Tel</th>}
          </tr></thead></table>
        </div>) })
      kg.baris.forEach((g, ri) => { n++; out.push({ key: `g-${gi}-${ri}`, ulang: kepala, el: (
        <table className="w-full table-fixed border-collapse text-[10px]">{lajur}<tbody><tr className={`border-b border-slate-100 ${n % 2 ? 'bg-slate-50' : ''}`} style={X}>
          <td className="px-1.5 py-[3px] text-slate-500 align-top">{n}</td><td className="px-1.5 py-[3px] font-semibold align-top">{g.nama}</td><td className="px-1.5 py-[3px] align-top">{g.gred}</td>
          <td className="px-1.5 py-[3px] align-top">{g.jawatan}</td><td className="px-1.5 py-[3px] text-slate-600 align-top">{g.opsyen}</td>{telefon && <td className="px-1.5 py-[3px] font-mono align-top">{g.telefon}</td>}
        </tr></tbody></table>) }) })
    })
  }
  return out
}

/** Agih blok ke halaman ikut tinggi diukur. Blok "ulang" mengulang kepala jadual pada halaman baharu. */
function agihHalaman(blok: Blok[], tinggi: Record<string, number>): Blok[][] {
  const kepala = new Map(blok.map((b) => [b.key, b]))
  const out: Blok[][] = [[]]
  let h = 0
  for (const b of blok) {
    const t = tinggi[b.key] ?? 80
    if (h + t > ISI_H && out[out.length - 1].length) {
      out.push([]); h = 0
      const k = b.ulang ? kepala.get(b.ulang) : null
      if (k) { out[out.length - 1].push({ ...k, key: `${k.key}#${out.length}`, kod: undefined }); h += tinggi[k.key] ?? 60 }
    }
    out[out.length - 1].push(b); h += t
  }
  return out
}

/** Ukur tinggi setiap blok dalam bekas tersembunyi (lebar sama dengan ruang isi halaman). */
function useTinggi(blok: Blok[]) {
  const ref = useRef<HTMLDivElement>(null)
  const [tinggi, setTinggi] = useState<Record<string, number>>({})
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ukur = () => {
      const t: Record<string, number> = {}
      el.querySelectorAll<HTMLElement>('[data-blok]').forEach((n) => { t[n.dataset.blok!] = Math.ceil(n.getBoundingClientRect().height) })
      setTinggi((lama) => (JSON.stringify(lama) === JSON.stringify(t) ? lama : t))
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    el.querySelectorAll('[data-blok]').forEach((n) => ro.observe(n))
    return () => ro.disconnect()
  }, [blok])
  const ukuran = (
    <div ref={ref} aria-hidden className="no-print" style={{ position: 'absolute', left: -20000, top: 0, width: LEBAR_ISI, visibility: 'hidden' }}>
      {blok.map((b) => <div key={b.key} data-blok={b.key} className="flow-root">{b.el}</div>)}
    </div>
  )
  return { tinggi, ukuran }
}

function HalamanIsi({ s, b, ms, children }: { s: Sekolah; b: BahagianBuku; ms: number; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-white shadow-card print:shadow-none break-after-page" style={{ width: LEBAR, height: TINGGI }}>
      <div className="absolute inset-x-0 top-0 flex items-center gap-3" style={{ padding: `26px ${PX}px 0` }}>
        <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: hex(b.warna), ...X }}>{b.huruf}</span>
        <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: hex(b.warna) }}>{b.tajuk}</span>
        <span className="flex-1 h-px" style={{ background: hex(b.warna), opacity: 0.35 }} />
      </div>
      <div className="absolute" style={{ left: PX, right: PX, top: PT, height: ISI_H }}>{children}</div>
      <Kaki s={s} w={b.warna} ms={ms} />
    </section>
  )
}

/** Buku Pengurusan penuh — halaman A4 bernombor (skrin & cetak/PDF). */
export function BukuPratonton({ k, data, reka }: { k: Konteks; data: BidangEksport[]; reka: RekaBuku }) {
  const s = k.data.sekolah
  const p = paletIkut(reka.palet)
  const seksyen = useMemo(() => [...k.data.buku].sort((a, b) => a.susunan - b.susunan), [k])
  const denganSenarai = reka.senaraiGuru !== false
  const telefon = reka.telefon !== false
  const bhg = useMemo(() => binaBahagian(seksyen, data, p, denganSenarai), [seksyen, data, p, denganSenarai])
  const blokBhg = useMemo(() => {
    const carta = binaCarta(k, data)
    const guru = denganSenarai ? senaraiGuruBuku(k.data) : []
    const { a: sA, ikut } = asingSeksyen(seksyen, data)
    return bhg.map((b, bi) => {
      if (bi === 0) return binaBlokA(b, sA, carta, guru, p, telefon)
      const bd = data[bi - 1], sB = bd ? ikut.get(bd.id) ?? [] : [], n = sB.length
      return [...blokSeksyen(b, sB), ...(bd?.jk ?? []).map((j, ji): Blok => ({ key: `${b.huruf}-${j.no}`, kod: b.item[n + ji].kod, el: <IsiJK j={j} kod={b.item[n + ji].kod} w={b.warna} gaya={reka.isi} p={p} /> }))]
    })
  }, [k, data, bhg, seksyen, p, denganSenarai, telefon, reka.isi])
  const semuaBlok = useMemo(() => blokBhg.flat(), [blokBhg])
  const { tinggi, ukuran } = useTinggi(semuaBlok)

  // ── Isi kandungan: 2 lajur, tinggi baris tetap → bilangan halaman boleh dikira dahulu
  const TJ = 34, TI = 19, TAJUK_TOC = 120
  const entri = bhg.flatMap((b) => [{ jenis: 'b' as const, b, kod: b.huruf }, ...b.item.map((x) => ({ jenis: 'i' as const, b, kod: x.kod, teks: x.teks }))])
  type E = (typeof entri)[number]
  const tocHalaman: E[][][] = []
  {
    let hal: E[][] = [[], []], lj = 0, h = 0, had = ISI_H - TAJUK_TOC
    for (const e of entri) {
      const t = e.jenis === 'b' ? TJ : TI
      if (h + t > had) { if (lj === 0) { lj = 1 } else { tocHalaman.push(hal); hal = [[], []]; lj = 0; had = ISI_H }; h = 0 }
      hal[lj].push(e); h += t
    }
    tocHalaman.push(hal)
  }

  // ── Nombor muka surat: kulit tidak bernombor; isi kandungan = ms 1
  let ms = 1
  const msToc = tocHalaman.map(() => ms++)
  const susun = bhg.map((b, bi) => {
    const cap = KAPASITI_PEMISAH[reka.pemisah]
    const sambungan: BahagianBuku['item'][] = []
    for (let i = cap; i < b.item.length; i += KAPASITI_SAMBUNGAN) sambungan.push(b.item.slice(i, i + KAPASITI_SAMBUNGAN))
    const msPemisah = ms++
    const msSambungan = sambungan.map(() => ms++)
    const halaman = agihHalaman(blokBhg[bi], tinggi).map((blok) => ({ blok, ms: ms++ }))
    return { b, bi, sambungan, msPemisah, msSambungan, halaman }
  })
  const msItem: Record<string, number> = {}
  susun.forEach((x) => { msItem[x.b.huruf] = x.msPemisah; x.halaman.forEach((h) => h.blok.forEach((bl) => { if (bl.kod && !msItem[bl.kod]) msItem[bl.kod] = h.ms })) })

  return (
    <div className="relative text-[12.5px] leading-relaxed text-slate-800 font-[Arial,sans-serif]" style={X}>
      <style>{`@media print { @page { size: A4; margin: 0 } main { padding: 0 !important; max-width: none !important } .break-after-page { break-after: page } }`}</style>
      {ukuran}
      <div className="flex flex-col items-center gap-6 print:block print:gap-0 overflow-x-auto">
        <div style={{ width: LEBAR }} className="break-after-page"><Kulit s={s} p={p} reka={reka} bhg={bhg} /></div>
        {tocHalaman.map((hal, i) => (
          <section key={`toc${i}`} className="relative overflow-hidden bg-white shadow-card print:shadow-none break-after-page" style={{ width: LEBAR, height: TINGGI }}>
            <div className="absolute" style={{ left: PX, right: PX, top: PT, height: ISI_H }}>
              {i === 0 && <div style={{ height: TAJUK_TOC }}>
                <div className="text-[9px] font-bold tracking-[0.35em]" style={{ color: hex(p.aksen) }}>KANDUNGAN</div>
                <div className="text-4xl font-black" style={{ color: hex(p.utama) }}>Isi Kandungan</div>
                <div className="mt-3 h-1.5 w-20 rounded-full" style={{ background: hex(p.aksen), ...X }} />
              </div>}
              <div className="grid grid-cols-2 gap-x-8">
                {hal.map((lajur, li) => (
                  <div key={li}>{lajur.map((e) => e.jenis === 'b' ? (
                    <div key={e.kod} className="flex items-center gap-2" style={{ height: TJ }}>
                      <span className="h-6 w-6 rounded-lg text-white text-[11px] font-black flex items-center justify-center shrink-0" style={{ background: hex(e.b.warna), ...X }}>{e.b.huruf}</span>
                      <span className="flex-1 truncate text-[11.5px] font-extrabold uppercase" style={{ color: hex(e.b.warna) }}>{e.b.tajuk}</span>
                      <span className="text-[11px] font-black" style={{ color: hex(e.b.warna) }}>{msItem[e.kod] ?? ''}</span>
                    </div>
                  ) : (
                    <div key={e.kod} className="flex items-baseline gap-1.5 text-[10.5px]" style={{ height: TI }}>
                      <b className="w-7 shrink-0" style={{ color: hex(e.b.warna) }}>{e.kod}</b>
                      <span className="truncate text-slate-700">{e.teks}</span>
                      <span className="flex-1 border-b border-dotted border-slate-300 min-w-3" />
                      <span className="font-semibold text-slate-600">{msItem[e.kod] ?? ''}</span>
                    </div>
                  ))}</div>
                ))}
              </div>
            </div>
            <Kaki s={s} w={p.aksen} ms={msToc[i]} />
          </section>
        ))}
        {susun.map(({ b, bi, sambungan, msPemisah, msSambungan, halaman }) => (
          <Fragment key={b.huruf}>
            <div style={{ width: LEBAR }} className="break-after-page shadow-card print:shadow-none"><Pemisah s={s} p={p} gaya={reka.pemisah} b={b} no={bi + 1} ms={msItem} halaman={msPemisah} /></div>
            {sambungan.map((item, i) => <PemisahSambungan key={i} s={s} b={b} item={item} ms={msItem} halaman={msSambungan[i]} />)}
            {halaman.map((h) => <HalamanIsi key={h.ms} s={s} b={b} ms={h.ms}>{h.blok.map((bl) => <div key={bl.key} className="flow-root">{bl.el}</div>)}</HalamanIsi>)}
          </Fragment>
        ))}
        <div style={{ width: LEBAR }} className="shadow-card print:shadow-none"><KulitBelakang s={s} p={p} reka={reka} bhg={bhg} /></div>
      </div>
    </div>
  )
}

function PemisahSambungan({ s, b, item, ms, halaman }: { s: Sekolah; b: BahagianBuku; item: BahagianBuku['item']; ms: Record<string, number>; halaman: number }) {
  return (
    <section className="relative overflow-hidden bg-white shadow-card print:shadow-none break-after-page" style={{ width: LEBAR, height: TINGGI }}>
      <div className="flex items-center gap-4 px-16 py-8 text-white" style={{ background: hex(b.warna), ...X }}>
        <span className="text-5xl font-black">{b.huruf}</span>
        <div><div className="text-[9px] font-bold tracking-[0.35em] opacity-80">BAHAGIAN {b.huruf} · SAMBUNGAN</div><div className="text-xl font-black uppercase">{b.tajuk}</div></div>
      </div>
      <div className="px-16 pt-8"><SenaraiItem b={b} item={item} lajur={2} ms={ms} /></div>
      <Kaki s={s} w={b.warna} ms={halaman} />
    </section>
  )
}

// ───────────────────────── Elemen kecil ─────────────────────────
function Logo({ s, saiz, bulat = true, kelas = '' }: { s: Sekolah; saiz: number; bulat?: boolean; kelas?: string }) {
  const ini = s.nama.replace(/^(SK|SMK|SEKOLAH KEBANGSAAN|SEKOLAH MENENGAH KEBANGSAAN)\s+/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('')
  return (
    <div className={`${bulat ? 'rounded-full' : 'rounded-2xl'} bg-white flex items-center justify-center shadow-lg shrink-0 ${kelas}`} style={{ width: saiz, height: saiz, padding: saiz * 0.08 }}>
      {s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-contain" /> : <span className="font-black text-slate-700" style={{ fontSize: saiz * 0.32 }}>{ini}</span>}
    </div>
  )
}
const namaPendek = (s: Sekolah) => s.nama.replace(/^SEKOLAH KEBANGSAAN\s+/i, 'SK ').replace(/^SEKOLAH MENENGAH KEBANGSAAN\s+/i, 'SMK ')
const alamat = (s: Sekolah) => [s.alamat, s.daerah, s.negeri].filter(Boolean).join(', ')
function Kaki({ s, w, gelap = false, ms }: { s: Sekolah; w: string; gelap?: boolean; ms?: number }) {
  return (
    <div className={`absolute bottom-0 inset-x-0 flex items-center justify-between px-16 py-6 text-[9px] font-bold tracking-[0.25em] uppercase ${gelap ? 'text-white/70' : 'text-slate-400'}`}>
      <span className="w-1/3">{namaPendek(s)}</span>
      {ms ? <span className="h-7 min-w-7 px-2 rounded-full flex items-center justify-center text-[11px] tracking-normal text-white" style={{ background: hex(w), ...X }}>{ms}</span> : <span className="h-1 w-10 rounded-full" style={{ background: hex(w), ...X }} />}
      <span className="w-1/3 text-right">Buku Pengurusan {s.tahun_semasa}</span>
    </div>
  )
}

// ───────────────────────── Kulit depan ─────────────────────────
export function Kulit({ s, p, reka, bhg }: { s: Sekolah; p: Palet; reka: RekaBuku; bhg: BahagianBuku[] }) {
  const moto = reka.moto?.trim()
  const tajukBawah = (
    <div className="flex">{bhg.slice(0, 6).map((b) => (
      <div key={b.huruf} className="flex-1 px-3 py-3 text-white" style={{ background: hex(b.warna), ...X }}>
        <div className="text-[8px] font-bold tracking-widest opacity-80">BAHAGIAN {b.huruf}</div>
        <div className="text-[10px] font-extrabold uppercase leading-tight">{b.tajuk.replace(/ & Maklumat Sekolah/, '')}</div>
      </div>))}
    </div>
  )
  if (reka.kulit === 'geometri') return (
    <section className={HALAMAN} style={{ background: hex(p.utama), ...X }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div className="absolute right-[-18%] top-[38%] h-[46%] aspect-square rounded-full" style={{ background: hex(p.kedua), ...X }} />
      <div className="absolute left-[30%] top-[58%] h-[34%] aspect-square rounded-full" style={{ background: hex(p.aksen), ...X }} />
      <div className="absolute left-[-14%] bottom-[-10%] h-[30%] aspect-square rounded-full" style={{ background: hex(warnaBahagian(p, 3)), ...X }} />
      <div className="absolute right-[18%] top-[16%] h-[11%] aspect-square rounded-full border-[10px]" style={{ borderColor: hex(p.aksen) }} />
      <div className="relative p-12 flex items-center gap-4 text-white">
        <Logo s={s} saiz={78} bulat={false} />
        <div><div className="text-[9px] font-bold tracking-[0.3em] opacity-70">{s.jenis === 'SK' ? 'SEKOLAH KEBANGSAAN' : 'SEKOLAH MENENGAH'}</div><div className="text-lg font-extrabold uppercase leading-tight">{namaPendek(s)}</div></div>
      </div>
      <div className="relative px-12 mt-[14%] text-white">
        <div className="text-sm font-black tracking-[0.5em]" style={{ color: hex(p.kedua) }}>BUKU</div>
        <div className="text-[64px] font-black leading-[0.95]">PENGURUSAN<br />SEKOLAH</div>
        <div className="mt-6 inline-block rounded-full bg-white px-5 py-1.5 text-sm font-black tracking-widest" style={{ color: hex(p.utama) }}>SESI {s.tahun_semasa}</div>
      </div>
      <div className="absolute bottom-12 left-12 text-white max-w-[55%]">
        {moto && <div className="text-2xl font-bold italic">“{moto}”</div>}
        <div className="mt-3 text-[10px] opacity-70">{alamat(s)}</div>
      </div>
    </section>
  )
  if (reka.kulit === 'minimal') return (
    <section className={`${HALAMAN} flex flex-col`}>
      <div className="p-12 flex items-center gap-3"><Logo s={s} saiz={64} /><div className="text-sm font-extrabold uppercase" style={{ color: hex(p.utama) }}>{s.nama}</div></div>
      <div className="px-12 mt-auto">
        <div className="text-[120px] font-black leading-none" style={{ color: 'transparent', WebkitTextStroke: `2px ${hex(p.aksen)}` }}>{s.tahun_semasa}</div>
        <div className="mt-2 text-[58px] font-black leading-[0.95]" style={{ color: hex(p.utama) }}>Buku<br />Pengurusan</div>
        <div className="mt-6 h-2 w-28 rounded-full" style={{ background: hex(p.aksen), ...X }} />
        {moto && <div className="mt-6 text-lg italic text-slate-600">“{moto}”</div>}
        <div className="mt-2 text-[11px] text-slate-500">{alamat(s)}</div>
      </div>
      <div className="mt-12 flex h-4">{p.bahagian.map((c) => <div key={c} className="flex-1" style={{ background: hex(c), ...X }} />)}</div>
    </section>
  )
  if (reka.kulit === 'bingkai') return (
    <section className={`${HALAMAN} p-8`} style={{ background: hex(p.lembut), ...X }}>
      <div className="h-full border-[3px] p-2" style={{ borderColor: hex(p.utama) }}>
        <div className="h-full border flex flex-col items-center justify-center text-center px-10" style={{ borderColor: hex(p.aksen) }}>
          <div className="text-[11px] font-bold tracking-[0.4em]" style={{ color: hex(p.aksen) }}>{s.jenis === 'SK' ? 'SEKOLAH KEBANGSAAN' : 'SEKOLAH MENENGAH KEBANGSAAN'}</div>
          <div className="mt-1 text-xl font-extrabold uppercase" style={{ color: hex(p.utama) }}>{namaPendek(s).replace(/^(SK|SMK) /, '')}</div>
          <div className="my-10"><Logo s={s} saiz={170} /></div>
          <div className="flex items-center gap-4 w-full"><span className="flex-1 h-px" style={{ background: hex(p.aksen) }} /><span className="text-xs font-bold tracking-[0.4em]" style={{ color: hex(p.aksen) }}>SESI {s.tahun_semasa}</span><span className="flex-1 h-px" style={{ background: hex(p.aksen) }} /></div>
          <div className="mt-6 text-[46px] font-black leading-[1.05] font-serif" style={{ color: hex(p.utama) }}>BUKU PENGURUSAN<br />SEKOLAH</div>
          {moto && <div className="mt-8 text-lg italic font-serif" style={{ color: hex(p.utama) }}>“{moto}”</div>}
          <div className="mt-auto pb-6 text-[10px] text-slate-500">{alamat(s)}</div>
        </div>
      </div>
    </section>
  )
  // jalur (lalai)
  return (
    <section className={`${HALAMAN} flex flex-col`}>
      <div className="absolute inset-x-0 top-0 h-[60%]" style={{ background: hex(p.utama), clipPath: 'polygon(0 0,100% 0,100% 78%,0 100%)', ...X }} />
      <div className="absolute inset-x-0 top-[55%] h-[3%]" style={{ background: hex(p.aksen), clipPath: 'polygon(0 55%,100% 0,100% 40%,0 100%)', ...X }} />
      <div className="absolute inset-x-0 top-[57.5%] h-[3%]" style={{ background: hex(p.kedua), clipPath: 'polygon(0 55%,100% 0,100% 40%,0 100%)', ...X }} />
      <div className="relative p-12 text-white">
        <div className="border-l-4 pl-3" style={{ borderColor: hex(p.kedua) }}>
          <div className="text-[9px] font-bold tracking-[0.3em] opacity-70">{s.jenis === 'SK' ? 'SEKOLAH KEBANGSAAN' : 'SEKOLAH MENENGAH'}</div>
          <div className="text-base font-extrabold uppercase">{namaPendek(s).replace(/^(SK|SMK) /, '')}</div>
        </div>
        <div className="mt-[12%] text-[60px] font-black leading-[0.95]">BUKU<br />PENGURUSAN<br /><span style={{ color: hex(p.kedua) }}>SEKOLAH</span></div>
        <div className="mt-6 inline-block rounded-md px-4 py-1.5 text-sm font-black tracking-widest" style={{ background: hex(p.aksen), ...X }}>SESI {s.tahun_semasa}</div>
      </div>
      <div className="absolute right-12 top-[38%]"><div className="rounded-full p-2" style={{ background: hex(p.kedua), ...X }}><Logo s={s} saiz={180} /></div></div>
      <div className="relative mt-auto px-12 pb-6">
        {moto && <><div className="text-[9px] font-bold tracking-[0.3em] text-slate-400">MOTO SEKOLAH</div><div className="text-2xl font-bold italic font-serif" style={{ color: hex(p.utama) }}>“{moto}”</div></>}
        <div className="mt-4 border-l-4 pl-3 text-[10px] text-slate-500" style={{ borderColor: hex(p.kedua) }}><b className="text-slate-700">{namaPendek(s)}</b><br />{alamat(s)}</div>
      </div>
      <div className="relative">{tajukBawah}</div>
    </section>
  )
}

// ───────────────────────── Isi kandungan ─────────────────────────
// ───────────────────────── Pemisah bahagian ─────────────────────────
function SenaraiItem({ b, item, lajur, putih = false, ms }: { b: BahagianBuku; item: BahagianBuku['item']; lajur: 1 | 2; putih?: boolean; ms?: Record<string, number> }) {
  return (
    <div className={lajur === 2 ? 'grid grid-cols-2 gap-1.5' : 'space-y-1'}>
      {item.map((x) => (
        <div key={x.kod} className={`flex items-center gap-2 ${lajur === 2 ? 'rounded-lg border-l-4 px-2 py-1' : 'border-b py-1'} ${putih ? 'bg-white/90' : lajur === 2 ? 'bg-slate-50' : 'border-slate-100'}`} style={lajur === 2 ? { borderColor: hex(b.warna), ...X } : undefined}>
          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black text-white" style={{ background: hex(b.warna), ...X }}>{x.kod}</span>
          <span className="flex-1 text-[9.5px] font-semibold text-slate-700 leading-tight">{x.teks}</span>
          {ms?.[x.kod] && <span className="shrink-0 text-[9px] font-bold text-slate-400">{ms[x.kod]}</span>}
        </div>
      ))}
    </div>
  )
}
export function Pemisah({ s, p, gaya, b, no, ms, halaman }: { s: Sekolah; p: Palet; gaya: RekaBuku['pemisah']; b: BahagianBuku; no: number; ms?: Record<string, number>; halaman?: number }) {
  const w = hex(b.warna)
  const item = b.item.slice(0, KAPASITI_PEMISAH[gaya])
  const lagi = b.item.length - item.length
  if (gaya === 'geometri') return (
    <section className={HALAMAN}>
      <div className="absolute inset-x-0 top-0 h-[42%] overflow-hidden" style={{ background: w, ...X }}>
        <div className="absolute right-[6%] top-[-6%] text-[240px] font-black leading-none" style={{ color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,.25)' }}>{String(no).padStart(2, '0')}</div>
        <div className="absolute right-[-10%] top-[-20%] h-[90%] aspect-square rounded-full bg-white/10" />
        <div className="absolute right-[10%] top-[12%] h-[16%] aspect-square rounded-full border-[8px] border-white/80" />
        <div className="absolute right-[-6%] bottom-[-18%] h-[50%] aspect-square rounded-full" style={{ background: hex(b.warna === p.kedua ? p.aksen : p.kedua), ...X }} />
        <div className="relative p-10 text-white">
          <div className="text-[9px] font-bold tracking-[0.35em] opacity-80">BAHAGIAN</div>
          <div className="text-[110px] font-black leading-none">{b.huruf}</div>
          <div className="mt-6 text-2xl font-black uppercase leading-tight max-w-[60%]">{b.tajuk}</div>
        </div>
      </div>
      <div className="absolute right-10 top-[37%]"><Logo s={s} saiz={64} bulat={false} /></div>
      <div className="absolute inset-x-10 top-[48%]"><SenaraiItem b={b} item={item} lajur={2} ms={ms} />{lagi > 0 && <div className="mt-2 text-[10px] font-semibold text-slate-400">Bersambung di halaman sebelah ({lagi} lagi) →</div>}</div>
      <Kaki s={s} w={b.warna} ms={halaman} />
    </section>
  )
  if (gaya === 'penuh') return (
    <section className={HALAMAN} style={{ background: w, ...X }}>
      <div className="absolute inset-0 flex items-center justify-center text-[420px] font-black text-white/10 leading-none select-none">{b.huruf}</div>
      <div className="relative p-12 text-white">
        <div className="text-xs font-bold tracking-[0.4em] opacity-80">BAHAGIAN {b.huruf}</div>
        <div className="mt-2 text-5xl font-black uppercase leading-[1.05]">{b.tajuk}</div>
        <div className="mt-5 h-1.5 w-20 rounded-full bg-white/80" />
      </div>
      <div className="absolute inset-x-12 bottom-16 rounded-2xl bg-white/95 p-5 shadow-xl"><SenaraiItem b={b} item={item} lajur={2} ms={ms} />{lagi > 0 && <div className="mt-2 text-[10px] font-semibold text-slate-400">Bersambung di halaman sebelah ({lagi} lagi) →</div>}</div>
      <Kaki s={s} w={p.kedua} gelap ms={halaman} />
    </section>
  )
  if (gaya === 'minimal') return (
    <section className={HALAMAN}>
      <div className="p-12">
        <div className="text-[200px] font-black leading-none" style={{ color: 'transparent', WebkitTextStroke: `3px ${w}` }}>{b.huruf}</div>
        <div className="text-xs font-bold tracking-[0.4em] mt-2" style={{ color: w }}>BAHAGIAN {b.huruf}</div>
        <div className="mt-1 text-4xl font-black uppercase" style={{ color: hex(p.utama) }}>{b.tajuk}</div>
        <div className="mt-4 h-1.5 w-16 rounded-full" style={{ background: w, ...X }} />
        <div className="mt-8"><SenaraiItem b={b} item={item} lajur={2} ms={ms} />{lagi > 0 && <div className="mt-2 text-[10px] font-semibold text-slate-400">Bersambung di halaman sebelah ({lagi} lagi) →</div>}</div>
      </div>
      <Kaki s={s} w={b.warna} ms={halaman} />
    </section>
  )
  // jalur (lalai)
  return (
    <section className={HALAMAN}>
      <div className="absolute inset-y-0 left-0 w-[36%] flex flex-col text-white" style={{ background: w, ...X }}>
        <div className="p-8"><div className="text-[9px] font-bold tracking-[0.35em] opacity-80">BAHAGIAN</div><div className="text-[9px] font-bold tracking-[0.2em] opacity-60">BUKU PENGURUSAN {s.tahun_semasa}</div></div>
        <div className="flex-1 flex items-center justify-center text-[180px] font-black leading-none">{b.huruf}</div>
        <div className="p-8 flex items-center gap-2"><Logo s={s} saiz={44} /><div className="text-[9px] font-bold leading-tight">{namaPendek(s)}</div></div>
      </div>
      <div className="absolute right-0 top-[10%] w-7 h-16 rounded-l-lg flex items-center justify-center text-white text-xs font-black" style={{ background: w, ...X }}>{b.huruf}</div>
      <div className="absolute left-[36%] right-0 inset-y-0 p-10 pr-12">
        <div className="text-[9px] font-bold tracking-[0.35em]" style={{ color: w }}>BAHAGIAN {b.huruf}</div>
        <div className="mt-1 text-3xl font-black uppercase leading-tight" style={{ color: hex(p.utama) }}>{b.tajuk}</div>
        <div className="mt-3 flex gap-1"><span className="h-1.5 w-10 rounded-full" style={{ background: w, ...X }} /><span className="h-1.5 w-4 rounded-full" style={{ background: hex(p.kedua), ...X }} /></div>
        <div className="mt-8"><SenaraiItem b={b} item={item} lajur={1} ms={ms} />{lagi > 0 && <div className="mt-2 text-[10px] font-semibold text-slate-400">Bersambung di halaman sebelah ({lagi} lagi) →</div>}</div>
      </div>
      <Kaki s={s} w={b.warna} ms={halaman} />
    </section>
  )
}

// ───────────────────────── Isi ─────────────────────────
function TajukSub({ kod, tajuk, w, kanan }: { kod: string; tajuk: string; w: string; kanan?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="rounded-md px-2 py-0.5 text-[10px] font-black text-white" style={{ background: hex(w), ...X }}>{kod}</span>
      <h3 className="text-[15px] font-extrabold uppercase tracking-wide flex-1" style={{ color: hex(w) }}>{tajuk}</h3>
      {kanan}
    </div>
  )
}
function Carta({ carta, p, kod, w }: { carta: ReturnType<typeof binaCarta>; p: Palet; kod: string; w: string }) {
  return (
    <section className="mb-6 break-inside-avoid print:break-before-page">
      <TajukSub kod={kod} tajuk="Carta Organisasi" w={w} />
      <div className="flex justify-center mt-4">
        <div className="rounded-2xl text-white text-center px-8 py-4 shadow-md" style={{ background: hex(p.utama), ...X }}>
          <div className="text-[10px] font-bold tracking-widest opacity-80">{carta.ketua.jawatan.toUpperCase()}</div><div className="font-bold">{carta.ketua.nama}</div>
        </div>
      </div>
      <div className="mx-auto h-6 w-0.5" style={{ background: hex(w) }} />
      <div className="grid gap-3 pt-6 border-t-2" style={{ borderColor: hex(w), gridTemplateColumns: `repeat(${Math.max(1, carta.cabang.length)}, minmax(0,1fr))` }}>
        {carta.cabang.map((c, i) => (
          <div key={c.bidang} className="rounded-xl overflow-hidden border border-slate-200">
            <div className="px-2 py-2 text-center text-white" style={{ background: hex(warnaBahagian(p, i + 1)), ...X }}>
              <div className="font-bold text-[10.5px] uppercase">{c.bidang}</div>{c.pk && <div className="text-[9.5px] opacity-90">{c.pk}</div>}
            </div>
            <ul className="p-2 text-[10px] space-y-0.5 bg-slate-50">{c.jk.slice(0, 18).map((j) => <li key={j}>• {j}</li>)}{c.jk.length > 18 && <li className="text-slate-400">+ {c.jk.length - 18} lagi</li>}</ul>
          </div>
        ))}
      </div>
    </section>
  )
}
function IsiJK({ j, kod, w, gaya, p }: { j: JKEksport; kod: string; w: string; gaya: RekaBuku['isi']; p: Palet }) {
  const nama = (a: JKEksport['ahli'][number]) => a.nama.map((nm, ni) => <div key={ni} className={nm === '(belum diisi)' ? 'italic text-slate-400' : ''}>{a.nama.length > 1 ? `${ni + 1}. ` : ''}{nm}</div>)
  const tugas = j.bidangTugas.length > 0 && (
    <div className="mt-2 text-[11px]"><div className="font-bold uppercase tracking-wide text-[10px]" style={{ color: hex(w) }}>Bidang tugas</div>
      <ol className="list-decimal ml-5 space-y-0.5">{j.bidangTugas.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
  )
  if (gaya === 'jadual') return (
    <section className="mb-7 break-inside-avoid">
      <TajukSub kod={kod} tajuk={j.nama} w={w} kanan={j.kod && <span className="text-[10px] text-slate-400">{j.kod}</span>} />
      <table className="w-full border-collapse text-[11.5px]">
        <thead><tr style={{ background: hex(w), ...X }}><th className="border border-slate-300 px-3 py-1.5 text-left text-white w-[34%]">Jawatan</th><th className="border border-slate-300 px-3 py-1.5 text-left text-white">Nama</th></tr></thead>
        <tbody>{j.ahli.map((a, i) => <tr key={i} className={i % 2 ? '' : 'bg-slate-50'}><td className="border border-slate-300 px-3 py-1 font-semibold align-top">{a.jawatan}</td><td className="border border-slate-300 px-3 py-1">{nama(a)}</td></tr>)}
          {j.ahli.length === 0 && <tr><td colSpan={2} className="border border-slate-300 px-3 py-1 italic text-slate-400">Belum ada ahli dilantik</td></tr>}</tbody>
      </table>
      {tugas}
    </section>
  )
  if (gaya === 'senarai') return (
    <section className="mb-5 break-inside-avoid">
      <div className="flex items-baseline gap-2 border-b-2 pb-0.5 mb-1" style={{ borderColor: hex(w) }}>
        <b className="text-[11px]" style={{ color: hex(w) }}>{kod}</b><b className="text-[12.5px] uppercase" style={{ color: hex(p.utama) }}>{j.nama}</b>
      </div>
      {j.ahli.map((a, i) => (
        <div key={i} className="flex gap-2 text-[11px] leading-snug">
          <span className="w-[30%] shrink-0 font-semibold text-slate-600">{a.jawatan}</span>
          <span className="flex-1">{a.nama.join(', ')}</span>
        </div>
      ))}
      {tugas}
    </section>
  )
  // kad (lalai)
  return (
    <section className="mb-6 break-inside-avoid rounded-xl overflow-hidden border border-slate-200">
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: hex(p.lembut), borderLeft: `5px solid ${hex(w)}`, ...X }}>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md text-white" style={{ background: hex(w), ...X }}>{kod}</span>
        <span className="font-bold flex-1" style={{ color: hex(p.utama) }}>{j.nama}</span>
        {j.kod && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: hex(w), color: hex(w) }}>{j.kod}</span>}
      </div>
      <table className="w-full border-collapse text-[11.5px]"><tbody>
        {j.ahli.map((a, i) => <tr key={i} className="border-t border-slate-100"><td className="px-4 py-1.5 w-[32%] align-top font-semibold" style={{ color: hex(p.utama) }}>{a.jawatan}</td><td className="px-4 py-1.5">{nama(a)}</td></tr>)}
        {j.ahli.length === 0 && <tr><td colSpan={2} className="px-4 py-2 italic text-slate-400">Belum ada ahli dilantik</td></tr>}
      </tbody></table>
      {tugas && <div className="px-4 pb-3">{tugas}</div>}
    </section>
  )
}

// ───────────────────────── Kulit belakang ─────────────────────────
export function KulitBelakang({ s, p, reka, bhg }: { s: Sekolah; p: Palet; reka: RekaBuku; bhg: BahagianBuku[] }) {
  const gelap = reka.kulit === 'geometri'
  return (
    <section className={`${HALAMAN} flex flex-col items-center justify-center text-center`} style={gelap ? { background: hex(p.utama), ...X } : undefined}>
      {!gelap && <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: hex(p.utama), clipPath: 'polygon(0 30%,100% 0,100% 100%,0 100%)', ...X }} />}
      {gelap && <><div className="absolute -left-[12%] -top-[8%] h-[40%] aspect-square rounded-full" style={{ background: hex(p.aksen), ...X }} /><div className="absolute -right-[10%] top-[25%] h-[22%] aspect-square rounded-full" style={{ background: hex(p.kedua), ...X }} /></>}
      <div className="relative -mt-[20%] flex flex-col items-center">
        <div className="rounded-full p-2" style={{ background: hex(p.kedua), ...X }}><Logo s={s} saiz={150} /></div>
        <div className={`mt-6 text-[10px] font-bold tracking-[0.4em] ${gelap ? 'text-white/70' : 'text-slate-400'}`}>{s.jenis === 'SK' ? 'SEKOLAH KEBANGSAAN' : 'SEKOLAH MENENGAH KEBANGSAAN'}</div>
        <div className={`text-2xl font-black uppercase ${gelap ? 'text-white' : ''}`} style={gelap ? undefined : { color: hex(p.utama) }}>{namaPendek(s).replace(/^(SK|SMK) /, '')}</div>
        {reka.moto?.trim() && <div className="mt-3 text-xl italic font-serif" style={{ color: hex(gelap ? p.kedua : p.aksen) }}>“{reka.moto}”</div>}
        {reka.slogan?.trim() && <div className={`mt-2 text-xs font-bold tracking-widest ${gelap ? 'text-white/80' : 'text-slate-500'}`}>{reka.slogan.toUpperCase()}</div>}
      </div>
      <div className="absolute bottom-10 inset-x-12 text-white text-center">
        <div className="text-[9px] font-bold tracking-[0.3em] opacity-90">PENDIDIKAN BERKUALITI · INSAN TERDIDIK · NEGARA SEJAHTERA</div>
        <div className="mt-3 text-[10px] opacity-80">{alamat(s)}</div>
        <div className="text-[10px] opacity-80">{[s.telefon && `Tel: ${s.telefon}`, `E-mel: ${s.kod}@moe.edu.my`].filter(Boolean).join('  |  ')}</div>
      </div>
      <div className="absolute bottom-0 inset-x-0 flex h-2">{bhg.map((b) => <div key={b.huruf} className="flex-1" style={{ background: hex(b.warna), ...X }} />)}</div>
    </section>
  )
}
