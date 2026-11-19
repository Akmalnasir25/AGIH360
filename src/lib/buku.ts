import type { Sekolah } from './types'
import { barisAlamat } from './kepala'

/** Teks rasmi peringkat kebangsaan — sama untuk semua sekolah. */
const FALSAFAH = `FALSAFAH PENDIDIKAN KEBANGSAAN
Pendidikan di Malaysia adalah suatu usaha berterusan ke arah memperkembangkan lagi potensi individu secara menyeluruh dan bersepadu untuk mewujudkan insan yang seimbang dan harmonis dari segi intelek, rohani, emosi dan jasmani berdasarkan kepercayaan dan kepatuhan kepada Tuhan. Usaha ini adalah bagi melahirkan rakyat Malaysia yang berilmu pengetahuan, berketerampilan, berakhlak mulia, bertanggungjawab dan berkeupayaan mencapai kesejahteraan diri, serta memberi sumbangan terhadap keharmonian dan kemakmuran keluarga, masyarakat dan negara.`

const VISI_KPM = `VISI DAN MISI KPM
Visi: Pendidikan Berkualiti, Insan Terdidik, Negara Sejahtera.
Misi: Melestarikan Sistem Pendidikan yang Berkualiti untuk Membangunkan Potensi Individu bagi Memenuhi Aspirasi Negara.`

const IKRAR = `IKRAR PENJAWAT AWAM
Kami yang telah dilantik berkhidmat dengan Kerajaan Malaysia membuat ikrar di sini bahawa semasa dan selagi kami berkhidmat dengan Kerajaan, kami akan patuh dengan mengamalkan teras-teras perkhidmatan semasa menjalankan tugas. Ke arah ini kami:

- Berazam meningkatkan mutu perkhidmatan
- Bekerja dengan penuh tanggungjawab
- Berusaha mengikis sikap mementingkan diri sendiri
- Berkhidmat dengan penuh muhibah dan kemesraan
- Bekerja ke arah memajukan pemikiran rakyat dan pembangunan negara
- Bekerjasama dalam membanteras kelemahan dan musuh-musuh negara
- Berpegang teguh kepada ajaran agama

IKRAR GURU MALAYSIA
Bahawasanya kami
Guru-guru negara Malaysia
Dengan ini berikrar
Mendukung terus cita-cita kami
Terhadap tugas kami
Dan menyatakan keyakinan kami
Pada cita-cita murni pekerjaan kami

Kami akan berbakti
Kepada masyarakat
Dan negara kami
Kami sentiasa menjunjung
Perlembagaan negara
Kami mengamalkan
Prinsip-prinsip Rukun Negara
Pada setiap masa`

/**
 * Seksyen lalai Bab Pengenalan untuk sekolah baharu: teks kebangsaan sudah terisi,
 * maklumat sekolah diambil daripada sistem, bahagian khusus sekolah ditanda [isi …].
 */
export function seksyenLalai(s: Sekolah, bilGuru = 0): { tajuk: string; isi: string }[] {
  const ketua = s.jawatan_ketua ?? (s.jenis === 'SK' ? 'Guru Besar' : 'Pengetua')
  const maklumat = [
    `Nama Sekolah: ${s.nama} (${s.kod})`,
    `Alamat Sekolah: ${[...barisAlamat(s.alamat), s.negeri].filter(Boolean).join(', ') || '[isi alamat]'}`,
    `No. Telefon: ${s.telefon || '[isi no. telefon]'}`,
    `E-mel (Rasmi Sekolah): ${s.kod}@moe.edu.my`,
    `Jabatan Pendidikan Negeri: ${s.negeri ? `Jabatan Pendidikan Negeri ${s.negeri}` : '[isi JPN]'}`,
    `Pejabat Pendidikan Daerah: ${s.daerah ? `Pejabat Pendidikan Daerah ${s.daerah}` : '[isi PPD]'}`,
    `Jenis Sekolah: ${s.jenis === 'SK' ? 'Sekolah Kebangsaan' : 'Sekolah Menengah Kebangsaan'}`,
    `${ketua}: ${s.nama_ketua || '[isi nama]'}`,
    `Bilangan Guru: ${bilGuru || '[isi]'}`,
    'Sesi: [Pagi / Pagi dan Petang]',
    'Bilangan Kelas: [isi]',
    'Bilangan Murid: [isi]',
  ].map((x) => `- ${x}`).join('\n')
  return [
    { tajuk: `Setitip Harapan ${ketua}`, isi: `[Tulis kata alu-aluan ${ketua.toLowerCase()} untuk sesi ${s.tahun_semasa} di sini.]\n\n${(s.nama_ketua || '[NAMA]').toUpperCase()}\n${ketua}\n${s.nama}` },
    { tajuk: 'Maklumat Sekolah', isi: maklumat },
    { tajuk: 'Sejarah Sekolah', isi: '[Ringkasan sejarah penubuhan sekolah: tahun dibuka, perpindahan tapak, pembangunan bangunan dan pencapaian penting.]' },
    { tajuk: 'Lencana Sekolah', isi: '[Maksud setiap lambang dan warna pada lencana sekolah.]\n\nMoto: [isi moto sekolah]' },
    { tajuk: 'Lagu Sekolah', isi: '[Lirik lagu sekolah — satu baris kosong antara rangkap.]' },
    { tajuk: 'Hala Tuju Sekolah', isi: `${FALSAFAH}\n\n${VISI_KPM}\n\nVISI SEKOLAH\n[isi visi sekolah]\n\nMISI SEKOLAH\n[isi misi sekolah]\n\nSLOGAN SEKOLAH\n[isi slogan]` },
    { tajuk: 'Ikrar', isi: IKRAR },
    { tajuk: 'Takwim Persekolahan', isi: `[Kalendar persekolahan ${s.tahun_semasa}, cuti perayaan dan takwim peperiksaan — boleh dimuat naik sebagai imej.]` },
  ]
}

export interface BarisGuruBuku { nama: string; gred: string; jawatan: string; opsyen: string; telefon: string }
export interface KumpulanGuruBuku { tajuk: string; baris: BarisGuruBuku[] }

/** Senarai guru & staf untuk Buku Pengurusan: Sesi Pagi / Sesi Petang / Staf Sokongan; pentadbir di atas. */
export function senaraiGuruBuku(d: { guru: import('./types').Guru[]; gred: import('./types').Gred[] }): KumpulanGuruBuku[] {
  const gred = new Map(d.gred.map((g) => [g.id, g.kod.replace(' dan ke bawah', '')]))
  const staf = (t: string) => /^staf sokongan/i.test(t)
  const pentadbir = /guru besar|pengetua|^pk\b|penolong kanan/i
  const jawatan = (tag: string | null) => (tag ?? '').split(',').map((x) => x.trim())
    .filter((x) => x && !/^sesi (pagi|petang)$/i.test(x) && !/^staf sokongan$/i.test(x)).join(', ')
  const aktif = d.guru.filter((g) => g.status !== 'bertukar')
  const ke = (g: import('./types').Guru): BarisGuruBuku => ({
    nama: g.nama, gred: g.gred_id ? gred.get(g.gred_id) ?? '' : '', jawatan: jawatan(g.tag), opsyen: g.kepakaran ?? '', telefon: g.telefon ?? '',
  })
  const susun = (a: import('./types').Guru, b: import('./types').Guru) =>
    (pentadbir.test(b.tag ?? '') ? 1 : 0) - (pentadbir.test(a.tag ?? '') ? 1 : 0) || a.nama.localeCompare(b.nama)
  const petang = (g: import('./types').Guru) => /sesi petang/i.test(g.tag ?? '')
  const kump: KumpulanGuruBuku[] = [
    { tajuk: 'Guru Sesi Pagi', baris: aktif.filter((g) => !staf(g.tag ?? '') && !petang(g)).sort(susun).map(ke) },
    { tajuk: 'Guru Sesi Petang', baris: aktif.filter((g) => !staf(g.tag ?? '') && petang(g)).sort(susun).map(ke) },
    { tajuk: 'Staf Sokongan', baris: aktif.filter((g) => staf(g.tag ?? '')).sort((a, b) => a.nama.localeCompare(b.nama)).map(ke) },
  ]
  return kump.filter((k) => k.baris.length)
}
