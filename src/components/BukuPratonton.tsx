import type { CSSProperties, ReactNode } from 'react'
import type { Konteks } from '../lib/indeks'
import type { Sekolah, SeksyenBuku } from '../lib/types'
import { binaCarta, type BidangEksport, type JKEksport } from '../lib/eksport'
import { hex, paletIkut, warnaBahagian, type Palet, type RekaBuku } from '../lib/tema'
import { senaraiGuruBuku, type KumpulanGuruBuku } from '../lib/buku'

const X: CSSProperties = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }
/** Satu halaman A4 (skrin: nisbah A4; cetak: tinggi tetap & pecah halaman) */
const HALAMAN = 'relative overflow-hidden w-full aspect-[210/297] print:aspect-auto print:h-[270mm] print:break-after-page bg-white'

export interface BahagianBuku { huruf: string; tajuk: string; warna: string; item: { kod: string; teks: string }[] }

/** Susun bahagian buku: A = Pengenalan & Maklumat Sekolah (seksyen + carta + senarai guru), kemudian setiap bidang. */
export function binaBahagian(seksyen: SeksyenBuku[], data: BidangEksport[], p: Palet, denganSenarai = true): BahagianBuku[] {
  const out: BahagianBuku[] = []
  const huruf = (i: number) => String.fromCharCode(65 + i)
  const a = [...seksyen.map((x) => x.tajuk), 'Carta Organisasi', ...(denganSenarai ? ['Senarai Guru & Staf'] : [])]
  out.push({ huruf: 'A', tajuk: 'Pengenalan & Maklumat Sekolah', warna: warnaBahagian(p, 0), item: a.map((t, i) => ({ kod: `A${i + 1}`, teks: t })) })
  data.forEach((b) => {
    const i = out.length, h = huruf(i)
    out.push({ huruf: h, tajuk: b.nama, warna: warnaBahagian(p, i), item: b.jk.map((j, n) => ({ kod: `${h}${n + 1}`, teks: j.nama })) })
  })
  return out
}

/** Buku Pengurusan penuh — pratonton skrin & susun atur cetak/PDF. */
export function BukuPratonton({ k, data, reka }: { k: Konteks; data: BidangEksport[]; reka: RekaBuku }) {
  const s = k.data.sekolah
  const p = paletIkut(reka.palet)
  const seksyen = [...k.data.buku].sort((a, b) => a.susunan - b.susunan)
  const denganSenarai = reka.senaraiGuru !== false
  const bhg = binaBahagian(seksyen, data, p, denganSenarai)
  const carta = binaCarta(k, data)
  const guru = denganSenarai ? senaraiGuruBuku(k.data) : []
  return (
    <div className="space-y-8 print:space-y-0 text-[12.5px] leading-relaxed text-slate-800 font-[Arial,sans-serif]" style={X}>
      <Kulit s={s} p={p} reka={reka} bhg={bhg} />
      <IsiKandungan p={p} bhg={bhg} />
      {bhg.map((b, bi) => {
        const bidang = data[bi - 1]
        return (
          <div key={b.huruf} className="space-y-8 print:space-y-0">
            <Pemisah s={s} p={p} gaya={reka.pemisah} b={b} no={bi + 1} />
            <div className="halaman-isi bg-white p-10 print:p-0 print:break-after-page">
              {bi === 0 ? <>
                {seksyen.map((x, i) => <Seksyen key={x.id} x={x} kod={b.item[i].kod} w={b.warna} />)}
                <Carta carta={carta} p={p} kod={b.item[seksyen.length].kod} w={b.warna} />
                {denganSenarai && <SenaraiGuru kump={guru} kod={b.item[seksyen.length + 1].kod} w={b.warna} p={p} telefon={reka.telefon !== false} />}
              </> : bidang?.jk.map((j, ji) => <IsiJK key={j.no} j={j} kod={b.item[ji].kod} w={b.warna} gaya={reka.isi} p={p} />)}
            </div>
          </div>
        )
      })}
      <KulitBelakang s={s} p={p} reka={reka} bhg={bhg} />
    </div>
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
function Kaki({ s, w, gelap = false }: { s: Sekolah; w: string; gelap?: boolean }) {
  return (
    <div className={`absolute bottom-0 inset-x-0 flex items-center justify-between px-10 py-4 text-[9px] font-bold tracking-[0.25em] uppercase ${gelap ? 'text-white/60' : 'text-slate-400'}`}>
      <span>{namaPendek(s)}</span><span className="h-1 w-10 rounded-full" style={{ background: hex(w), ...X }} /><span>Buku Pengurusan {s.tahun_semasa}</span>
    </div>
  )
}

// ───────────────────────── Kulit depan ─────────────────────────
export function Kulit({ s, p, reka, bhg }: { s: Sekolah; p: Palet; reka: RekaBuku; bhg: BahagianBuku[] }) {
  const moto = reka.moto?.trim()
  const tajukBawah = (
    <div className="flex">{bhg.slice(0, 5).map((b) => (
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
function IsiKandungan({ p, bhg }: { p: Palet; bhg: BahagianBuku[] }) {
  return (
    <section className="bg-white p-12 print:p-0 print:break-after-page">
      <div className="text-[9px] font-bold tracking-[0.35em]" style={{ color: hex(p.aksen) }}>KANDUNGAN</div>
      <div className="text-4xl font-black" style={{ color: hex(p.utama) }}>Isi Kandungan</div>
      <div className="mt-3 h-1.5 w-20 rounded-full" style={{ background: hex(p.aksen), ...X }} />
      <div className="mt-8 space-y-6">
        {bhg.map((b) => (
          <div key={b.huruf} className="break-inside-avoid">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl text-white font-black flex items-center justify-center" style={{ background: hex(b.warna), ...X }}>{b.huruf}</span>
              <span className="text-base font-extrabold uppercase" style={{ color: hex(b.warna) }}>{b.tajuk}</span>
            </div>
            <div className="mt-2 ml-12 grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11px] text-slate-600">
              {b.item.map((x) => <div key={x.kod} className="flex gap-2 border-b border-dotted border-slate-200 py-0.5"><b className="w-7 shrink-0" style={{ color: hex(b.warna) }}>{x.kod}</b><span className="truncate">{x.teks}</span></div>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ───────────────────────── Pemisah bahagian ─────────────────────────
function SenaraiItem({ b, lajur, had, putih = false }: { b: BahagianBuku; lajur: 1 | 2; had: number; putih?: boolean }) {
  const papar = b.item.slice(0, had), lebih = b.item.length - papar.length
  return (
    <div className={lajur === 2 ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
      {papar.map((x) => (
        <div key={x.kod} className={`flex items-center gap-2.5 ${lajur === 2 ? 'rounded-lg border-l-4 px-2.5 py-1.5' : 'border-b py-1'} ${putih ? 'bg-white/90' : lajur === 2 ? 'bg-slate-50' : 'border-slate-100'}`} style={lajur === 2 ? { borderColor: hex(b.warna), ...X } : undefined}>
          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black text-white" style={{ background: hex(b.warna), ...X }}>{x.kod}</span>
          <span className="text-[10px] font-semibold text-slate-700 leading-tight">{x.teks}</span>
        </div>
      ))}
      {lebih > 0 && <div className="text-[10px] font-semibold text-slate-400 px-1">+ {lebih} lagi</div>}
    </div>
  )
}
export function Pemisah({ s, p, gaya, b, no }: { s: Sekolah; p: Palet; gaya: RekaBuku['pemisah']; b: BahagianBuku; no: number }) {
  const w = hex(b.warna)
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
      <div className="absolute inset-x-10 top-[48%]"><SenaraiItem b={b} lajur={2} had={26} /></div>
      <Kaki s={s} w={b.warna} />
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
      <div className="absolute inset-x-12 bottom-16 rounded-2xl bg-white/95 p-5 shadow-xl"><SenaraiItem b={b} lajur={2} had={22} /></div>
      <Kaki s={s} w={p.kedua} gelap />
    </section>
  )
  if (gaya === 'minimal') return (
    <section className={HALAMAN}>
      <div className="p-12">
        <div className="text-[200px] font-black leading-none" style={{ color: 'transparent', WebkitTextStroke: `3px ${w}` }}>{b.huruf}</div>
        <div className="text-xs font-bold tracking-[0.4em] mt-2" style={{ color: w }}>BAHAGIAN {b.huruf}</div>
        <div className="mt-1 text-4xl font-black uppercase" style={{ color: hex(p.utama) }}>{b.tajuk}</div>
        <div className="mt-4 h-1.5 w-16 rounded-full" style={{ background: w, ...X }} />
        <div className="mt-8"><SenaraiItem b={b} lajur={2} had={24} /></div>
      </div>
      <Kaki s={s} w={b.warna} />
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
        <div className="mt-8"><SenaraiItem b={b} lajur={1} had={22} /></div>
      </div>
      <Kaki s={s} w={b.warna} />
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
function Seksyen({ x, kod, w }: { x: SeksyenBuku; kod: string; w: string }) {
  return (
    <section className="mb-10 break-inside-avoid-page">
      <TajukSub kod={kod} tajuk={x.tajuk} w={w} />
      <div className="h-0.5 mb-3" style={{ background: `linear-gradient(90deg, ${hex(w)}, transparent)`, ...X }} />
      {x.imej && x.isi ? (
        <div className="grid grid-cols-[1fr_190px] gap-6 items-start"><TeksSeksyen isi={x.isi} w={w} /><img src={x.imej} alt="" className="w-full rounded-xl shadow-md" /></div>
      ) : <>
        {x.isi && <TeksSeksyen isi={x.isi} w={w} />}
        {x.imej && <img src={x.imej} alt="" className="mt-2 mx-auto max-w-full max-h-[820px] rounded-xl border border-slate-200" />}
      </>}
    </section>
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
function SenaraiGuru({ kump, kod, w, p, telefon }: { kump: KumpulanGuruBuku[]; kod: string; w: string; p: Palet; telefon: boolean }) {
  let n = 0
  return (
    <section className="mb-6 print:break-before-page">
      <TajukSub kod={kod} tajuk="Senarai Guru & Staf" w={w} />
      {kump.map((k) => (
        <div key={k.tajuk} className="mt-4">
          <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: hex(p.utama) }}>{k.tajuk} <span className="text-slate-400">({k.baris.length})</span></div>
          <table className="w-full border-collapse text-[10.5px]">
            <thead><tr className="text-white" style={{ background: hex(w), ...X }}>
              <th className="px-2 py-1 text-left w-8">Bil</th><th className="px-2 py-1 text-left">Nama</th><th className="px-2 py-1 text-left w-14">Gred</th>
              <th className="px-2 py-1 text-left">Jawatan</th><th className="px-2 py-1 text-left">Opsyen / Subjek</th>{telefon && <th className="px-2 py-1 text-left w-24">No. Tel</th>}
            </tr></thead>
            <tbody>{k.baris.map((g) => { n++; return (
              <tr key={g.nama + n} className="border-b border-slate-100 break-inside-avoid odd:bg-slate-50" style={X}>
                <td className="px-2 py-1 text-slate-500">{n}</td><td className="px-2 py-1 font-semibold">{g.nama}</td><td className="px-2 py-1">{g.gred}</td>
                <td className="px-2 py-1">{g.jawatan}</td><td className="px-2 py-1 text-slate-600">{g.opsyen}</td>{telefon && <td className="px-2 py-1 font-mono">{g.telefon}</td>}
              </tr>) })}</tbody>
          </table>
        </div>
      ))}
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

/** Baris kosong = perenggan; baris "- " = senarai; baris HURUF BESAR pendek = subtajuk. */
function TeksSeksyen({ isi, w }: { isi: string; w: string }) {
  return (
    <div className="space-y-2.5 text-justify">
      {isi.split(/\n\s*\n/).map((para, i) => {
        const baris = para.split('\n').filter((b) => b.trim())
        if (!baris.length) return null
        if (baris.every((b) => /^\s*[-•]\s+/.test(b)))
          return <ul key={i} className="space-y-1">{baris.map((b, j) => <li key={j} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hex(w), ...X }} /><span>{b.replace(/^\s*[-•]\s+/, '')}</span></li>)}</ul>
        const [awal, ...lain] = baris
        const subtajuk = awal.length <= 60 && awal === awal.toUpperCase() && /[A-Z]/.test(awal)
        return <div key={i}>{subtajuk && <div className="font-bold text-[12px] tracking-wide mb-0.5" style={{ color: hex(w) }}>{awal}</div>}<p className="whitespace-pre-wrap">{(subtajuk ? lain : baris).join('\n')}</p></div>
      })}
    </div>
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
