import { seksyenLalai } from './buku'
import templat from './templat.json'
import type { DataSekolah, Guru, JenisSekolah, Lantikan, StatusAgihan, TugasLuar } from './types'
import type { Baris, NamaJadual, Stor } from './stor'
import type { RekaBuku } from './tema'

let seq = 0
const uid = () => `d${(++seq).toString(36)}${Math.random().toString(36).slice(2, 7)}`

// RNG berbenih supaya demo sentiasa sama
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const NAMA = [
  'Pn. Siti Aminah binti Hassan', 'En. Mohd Faizal bin Rahman', 'Cik Nurul Izzah binti Kamal', 'En. Wan Ahmad Fauzi bin Wan Ismail',
  'Pn. Maznah binti Idris', 'En. Hafiz bin Othman', 'Pn. Chong Mei Ling', 'En. Azman bin Yusof', 'Pn. Kavitha a/p Subramaniam',
  'En. Jeffry anak Jalong', 'Pn. Hjh. Norhayati binti Abdullah', 'Cik Amira Syazwani binti Rosli', 'Pn. Elizabeth anak Ngau',
  'Ustazah Nor Aini binti Salleh', 'Pn. Sharifah Nabila binti Syed Ali', 'En. Khairul Anuar bin Hashim', 'Pn. Aishah binti Mohd Noor',
  'En. Tan Chee Keong', 'Pn. Rohani binti Ismail', 'Ustaz Muhammad Hakim bin Zakaria', 'Pn. Lim Siew Fong', 'En. Ravi a/l Muniandy',
  'Pn. Faridah binti Omar', 'Cik Nur Syafiqah binti Azhar', 'En. Shahrul Nizam bin Ahmad', 'Pn. Rosnah binti Daud',
  'En. Kamarul Ariffin bin Mat', 'Pn. Zuraidah binti Ali', 'Cik Hidayah binti Rahim', 'En. Lee Wei Jie', 'Pn. Salmah binti Yaakob',
  'En. Zulkifli bin Hamzah', 'Pn. Nor Azlina binti Musa', 'Ustazah Fatimah binti Sulaiman', 'En. Ahmad Shukri bin Bakar',
  'Pn. Rubiah binti Jusoh', 'Cik Athirah binti Nordin', 'En. Mohd Rizal bin Saad', 'Pn. Junaidah binti Taib', 'En. Firdaus bin Hamid',
]

const SUBJEK = ['Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Pendidikan Islam', 'Sejarah', 'RBT', 'PJPK', 'Seni']

export function binaDemo(jenis: JenisSekolah = 'SK'): DataSekolah {
  const r = rng(42)
  const school_id = 'demo'
  const tahun = new Date().getFullYear() + (new Date().getMonth() >= 10 ? 1 : 0)
  const tahap = [
    { id: uid(), nama: 'Utama', faktor: 3, susunan: 1 },
    { id: uid(), nama: 'Sokongan', faktor: 2, susunan: 2 },
    { id: uid(), nama: 'Sampingan', faktor: 1, susunan: 3 },
  ]
  const tempoh = [
    { id: uid(), nama: 'Sepanjang tahun', faktor: 1, susunan: 1 },
    { id: uid(), nama: 'Bermusim', faktor: 0.6, susunan: 2 },
    { id: uid(), nama: 'Program', faktor: 0.3, susunan: 3 },
  ]
  const peranan = (
    [
      ['Pengerusi', 5], ['Naib Pengerusi', 4], ['Setiausaha', 4], ['Penolong Setiausaha', 3], ['Bendahari', 3],
      ['Penyelaras', 3], ['Ketua Panitia', 4], ['Ketua Tingkatan', 3], ['Ketua Rumah', 3], ['Guru Penasihat', 2],
      ['Penasihat', 2], ['Jurulatih', 3], ['Warden', 3], ['Guru Kelas', 3], ['AJK', 1],
    ] as [string, number][]
  ).map(([nama, berat], i) => ({ id: uid(), nama, berat, susunan: i + 1 }))
  const gred = (
    [
      ['DG9 dan ke bawah', 'Pelaksana', 1], ['DG10', 'Penggerak', 1.1], ['DG12', 'Pembimbing dan Mentor', 1.2],
      ['DG13', 'Peneraju Perubahan', 1.3], ['DG14', 'Pemikir Strategik', 1.4], ['Gred Khas', 'Pemikir Holistik', 1.5],
    ] as [string, string, number][]
  ).map(([kod, p, faktor], i) => ({ id: uid(), kod, peranan: p, faktor, susunan: i + 1 }))

  const bidang: DataSekolah['bidang'] = []
  const jawatankuasa: DataSekolah['jawatankuasa'] = []
  const slot: DataSekolah['slot'] = []
  type JKT = { kod: string; nama: string; tahap: string; tempoh: string; wajib: boolean; slot: [string, number][]; bidang_tugas: string; syarat?: string }
  const t = (templat as unknown as Record<string, { bidang: { nama: string; warna: string; jk: JKT[] }[] }>)[jenis]
  const pilihanDemo = ['prasekolah', 'ppki']  // demo: sekolah ada prasekolah & PPKI
  t.bidang.forEach((b, bi) => {
    const bid = { id: uid(), nama: b.nama, warna: b.warna, susunan: bi + 1 }
    bidang.push(bid)
    b.jk.filter((j) => !j.syarat || pilihanDemo.includes(j.syarat)).forEach((j, ji) => {
      const jk = {
        id: uid(), bidang_id: bid.id, kod: j.kod || null, nama: j.nama, wajib: j.wajib, catatan: null, susunan: ji + 1,
        tahap_id: tahap.find((x) => x.nama === j.tahap)!.id,
        tempoh_id: tempoh.find((x) => x.nama === j.tempoh)!.id,
        bidang_tugas: j.bidang_tugas,
      }
      jawatankuasa.push(jk)
      let si = 0
      for (const [p, n] of j.slot)
        for (let i = 0; i < n; i++)
          slot.push({ id: uid(), jawatankuasa_id: jk.id, peranan_id: peranan.find((x) => x.nama === p)!.id, label: null, susunan: ++si })
    })
  })

  const gredPick = () => {
    const x = r()
    return gred[x < 0.35 ? 0 : x < 0.6 ? 1 : x < 0.85 ? 2 : x < 0.97 ? 3 : 4].id
  }
  const guru: Guru[] = NAMA.map((nama, i) => ({
    id: uid(), nama,
    emel: i === 33 ? null : nama.toLowerCase().replace(/^(pn|en|cik|ustazah|ustaz)\.?\s+/, '').replace(/hjh\.\s+/, '').split(' ')[0] + (i + 1) + '@moe-dl.edu.my',
    telefon: i % 3 === 0 ? `01${2 + (i % 7)}${String(3000000 + i * 7919).slice(0, 7)}` : null,
    gred_id: i === 0 ? gred[5].id : i < 4 ? gred[4].id : gredPick(),
    masa_seminggu: i === 0 ? 4 : i < 4 ? 12 : Math.round(22 + r() * 10),
    kelas_peperiksaan: jenis === 'SMK' ? r() < 0.3 : false,
    status: i === 38 ? 'cuti' : 'aktif',
    dikecualikan: i < 4,
    tag: i === 0 ? (jenis === 'SK' ? 'Guru Besar' : 'Pengetua') : i === 1 ? 'PK Pentadbiran' : i === 2 ? 'PK HEM' : i === 3 ? 'PK Kokurikulum' : null,
    kepakaran: i < 4 ? null : SUBJEK[i % SUBJEK.length] + (i % 4 === 0 ? `, ${SUBJEK[(i + 3) % SUBJEK.length]}` : ''),
  }))

  const snap = (slotId: string) => {
    const s = slot.find((x) => x.id === slotId)!
    const jk = jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
    return { jk_nama: jk.nama, peranan_nama: peranan.find((p) => p.id === s.peranan_id)!.nama, bidang_nama: bidang.find((b) => b.id === jk.bidang_id)!.nama }
  }

  // Agihan "tradisi": nama yang sama keluar lagi dan lagi → beberapa guru terbeban.
  // Dijana untuk 3 tahun (2 tahun lepas + semasa); SU JK utama dipegang orang sama → amaran giliran.
  const lantikan: Lantikan[] = []
  const kegemaran = [4, 5, 6, 10, 15]
  const pentadbir = [0, 1, 2, 3]
  const tetap = new Map<string, number>()
  for (const th of [tahun - 2, tahun - 1, tahun]) {
    const rr = th === tahun ? r : rng(1000 + th)
    for (const s of slot) {
      if (rr() < 0.1) continue
      const jk = jawatankuasa.find((j) => j.id === s.jawatankuasa_id)!
      const pnm = peranan.find((p) => p.id === s.peranan_id)!.nama
      let gi: number
      if (pnm === 'Pengerusi') gi = pentadbir[Math.floor(rr() * 4)]
      else if (pnm === 'Setiausaha' && jk.tahap_id === tahap[0].id) {
        gi = tetap.get(s.id) ?? kegemaran[Math.floor(rr() * kegemaran.length)]
        tetap.set(s.id, gi)
      } else if (rr() < 0.28) gi = kegemaran[Math.floor(rr() * kegemaran.length)]
      else gi = 4 + Math.floor(rr() * 34)
      if (gi >= 30 && rr() < 0.6) continue
      lantikan.push({ id: uid(), tahun: th, slot_id: s.id, guru_id: guru[gi].id, ...snap(s.id) })
    }
  }

  const tugasLuar: TugasLuar[] = [
    { id: uid(), guru_id: guru[7].id, tahun, jenis: 'relief', keterangan: 'Purata relief seminggu', nilai: 3 },
    { id: uid(), guru_id: guru[12].id, tahun, jenis: 'jurulatih', keterangan: 'Jurulatih bola sepak MSSD', nilai: 6 },
    { id: uid(), guru_id: guru[20].id, tahun, jenis: 'pemeriksa', keterangan: 'Pemeriksa kertas UASA', nilai: 4 },
    { id: uid(), guru_id: guru[25].id, tahun, jenis: 'luar', keterangan: 'Jurulatih Utama Daerah (JU) PBD', nilai: 5 },
  ]

  return {
    sekolah: {
      id: school_id, kod: jenis === 'SK' ? 'ABA0001' : 'ABA1001',
      nama: jenis === 'SK' ? 'SK Contoh Seri Harmoni' : 'SMK Contoh Seri Harmoni',
      jenis, alamat: 'Jalan Pendidikan, 31650 Ipoh', daerah: 'Kinta Utara', negeri: 'Perak', logo_url: null, kepala_surat: null,
      nama_ketua: guru[0].nama, jawatan_ketua: jenis === 'SK' ? 'Guru Besar' : 'Pengetua', tahun_semasa: tahun,
    },
    tetapan: {
      school_id, w_mengajar: 0.6, ambang_tinggi: 1.3, ambang_rendah: 0.7, faktor_peperiksaan: 1.2,
      minit_semasa: 30, had_jawatan: 8, guna_faktor_gred: true,
    },
    tahap, peranan, tempoh, gred, bidang, guru, jawatankuasa, slot, lantikan, tugasLuar,
    kelulusan: { status: 'draf', catatan: null, dikemaskini: null },
    log: [
      { id: 2, masa: new Date(Date.now() - 3600e3).toISOString(), pengguna: 'pk.kurikulum@moe-dl.edu.my', tindakan: 'lantik', butiran: `${guru[9].nama} — AJK, Panitia Matematik` },
      { id: 1, masa: new Date(Date.now() - 86400e3).toISOString(), pengguna: 'admin@moe-dl.edu.my', tindakan: 'status', butiran: `Sesi ${tahun} dibuka sebagai draf` },
    ],
    maklumBalas: [
      { id: uid(), guru_id: guru[5].id, tahun, mesej: 'Saya juga jurulatih olahraga peringkat daerah setiap Sabtu. Mohon ambil kira dalam beban saya.', status: 'baru', balasan: null, dicipta: new Date(Date.now() - 7200e3).toISOString() },
    ],
    buku: [],
  }
}

let logSeq = 100

/** Stor dalam memori — untuk demo DAN mod simulasi (dibina daripada salinan data sebenar). */
export class StorDemo implements Stor {
  mod: 'demo' | 'simulasi' = 'demo'
  private d: DataSekolah
  constructor(asal: JenisSekolah | DataSekolah = 'SK') {
    if (typeof asal === 'string') {
      this.d = binaDemo(asal)
      this.d.buku = seksyenLalai(this.d.sekolah, this.d.guru.length).map((x, n) => ({ id: uid(), ...x, imej: null, susunan: n + 1 }))
    }
    else { this.d = structuredClone(asal); this.mod = 'simulasi' }
  }
  async muat() {
    return structuredClone(this.d)
  }
  private get tahun() { return this.d.sekolah.tahun_semasa }
  private kunci() {
    if (['lulus', 'muktamad'].includes(this.d.kelulusan.status))
      throw new Error(`Agihan telah ${this.d.kelulusan.status}. Buka semula sebagai draf untuk mengubah.`)
  }
  private log(tindakan: string, butiran: string) {
    this.d.log.unshift({ id: ++logSeq, masa: new Date().toISOString(), pengguna: this.mod === 'simulasi' ? 'simulasi' : 'demo@agih360', tindakan, butiran })
  }
  private strukturSahaja() {
    if (this.mod === 'simulasi') throw new Error('Mod simulasi hanya membenarkan perubahan lantikan.')
  }
  private senarai(j: NamaJadual): { id: string }[] {
    const peta: Record<NamaJadual, keyof DataSekolah> = {
      guru: 'guru', jawatankuasa: 'jawatankuasa', slot: 'slot', tahap: 'tahap', peranan_jk: 'peranan', tempoh: 'tempoh',
      gred: 'gred', bidang: 'bidang', tugas_luar: 'tugasLuar', maklum_balas: 'maklumBalas', buku_seksyen: 'buku',
    }
    return this.d[peta[j]] as unknown as { id: string }[]
  }
  private snap(slotId: string) {
    const s = this.d.slot.find((x) => x.id === slotId)
    const jk = s && this.d.jawatankuasa.find((j) => j.id === s.jawatankuasa_id)
    return {
      jk_nama: jk?.nama ?? null,
      peranan_nama: this.d.peranan.find((p) => p.id === s?.peranan_id)?.nama ?? null,
      bidang_nama: this.d.bidang.find((b) => b.id === jk?.bidang_id)?.nama ?? null,
    }
  }
  async lantik(slotId: string, guruId: string) { await this.lantikBanyak([{ slotId, guruId }]) }
  async lantikBanyak(pasangan: { slotId: string; guruId: string }[]) {
    this.kunci()
    for (const { slotId, guruId } of pasangan) {
      this.d.lantikan = this.d.lantikan.filter((l) => !(l.slot_id === slotId && l.tahun === this.tahun))
      const sn = this.snap(slotId)
      this.d.lantikan.push({ id: uid(), tahun: this.tahun, slot_id: slotId, guru_id: guruId, ...sn })
      this.log('lantik', `${this.d.guru.find((g) => g.id === guruId)?.nama} — ${sn.peranan_nama}, ${sn.jk_nama}`)
    }
  }
  async batal(slotId: string) { await this.batalBanyak([slotId]) }
  async batalBanyak(slotIds: string[]) {
    this.kunci()
    const set = new Set(slotIds)
    for (const l of this.d.lantikan.filter((x) => set.has(x.slot_id) && x.tahun === this.tahun))
      this.log('gugur', `${this.d.guru.find((g) => g.id === l.guru_id)?.nama} — ${l.peranan_nama}, ${l.jk_nama}`)
    this.d.lantikan = this.d.lantikan.filter((l) => !(set.has(l.slot_id) && l.tahun === this.tahun))
  }
  async tambahAhli(jkId: string, perananId: string, guruIds: string[], label: string | null = null) {
    this.strukturSahaja(); this.kunci()
    let n = Math.max(0, ...this.d.slot.filter((s) => s.jawatankuasa_id === jkId).map((s) => s.susunan))
    const pasangan = guruIds.map((guruId) => {
      const id = uid()
      this.d.slot.push({ id, jawatankuasa_id: jkId, peranan_id: perananId, label, susunan: ++n })
      return { slotId: id, guruId }
    })
    await this.lantikBanyak(pasangan)
  }
  async simpan(j: NamaJadual, baris: Baris) {
    if (j !== 'maklum_balas') this.strukturSahaja()
    const arr = this.senarai(j)
    if (baris.id) {
      const i = arr.findIndex((x) => x.id === baris.id)
      if (i >= 0) { arr[i] = { ...arr[i], ...baris } as { id: string }; return baris.id }
    }
    const id = uid()
    const extra = j === 'maklum_balas' ? { dicipta: new Date().toISOString(), status: 'baru', balasan: null } : {}
    arr.push({ ...extra, ...baris, id } as { id: string })
    return id
  }
  async simpanBanyak(j: NamaJadual, baris: Baris[]) {
    for (const b of baris) await this.simpan(j, b)
  }
  async buang(j: NamaJadual, id: string) {
    this.strukturSahaja()
    if (j === 'jawatankuasa' || j === 'slot') return this.arkib(j, id)
    const arr = this.senarai(j)
    const i = arr.findIndex((x) => x.id === id)
    if (i >= 0) arr.splice(i, 1)
    if (j === 'guru') this.d.lantikan = this.d.lantikan.filter((l) => l.guru_id !== id)
  }
  async arkib(j: 'jawatankuasa' | 'slot', id: string) {
    this.strukturSahaja()
    const slotIds = j === 'slot' ? [id] : this.d.slot.filter((s) => s.jawatankuasa_id === id).map((s) => s.id)
    const set = new Set(slotIds)
    // sejarah tahun lepas kekal (snapshot nama), tahun semasa digugurkan
    this.d.lantikan = this.d.lantikan.filter((l) => !(set.has(l.slot_id) && l.tahun === this.tahun))
    this.d.slot = this.d.slot.filter((s) => !set.has(s.id))
    if (j === 'jawatankuasa') {
      const nama = this.d.jawatankuasa.find((x) => x.id === id)?.nama
      this.d.jawatankuasa = this.d.jawatankuasa.filter((x) => x.id !== id)
      this.log('arkib', `Jawatankuasa diarkib: ${nama}`)
    }
  }
  async simpanTetapan(t: Partial<DataSekolah['tetapan']>) {
    this.strukturSahaja()
    this.d.tetapan = { ...this.d.tetapan, ...t }
  }
  async simpanRekaBuku(r: RekaBuku) {
    this.d.sekolah = { ...this.d.sekolah, reka_buku: r }
  }
  async simpanSekolah(s: Partial<DataSekolah['sekolah']>) {
    this.strukturSahaja()
    this.d.sekolah = { ...this.d.sekolah, ...s }
  }
  async salinTahunLepas() {
    this.kunci()
    const ada = new Set(this.d.lantikan.filter((l) => l.tahun === this.tahun).map((l) => l.slot_id))
    const slotAda = new Set(this.d.slot.map((s) => s.id))
    const aktif = new Set(this.d.guru.filter((g) => g.status === 'aktif').map((g) => g.id))
    const lepas = this.d.lantikan.filter((l) => l.tahun === this.tahun - 1 && !ada.has(l.slot_id) && slotAda.has(l.slot_id) && aktif.has(l.guru_id))
    await this.lantikBanyak(lepas.map((l) => ({ slotId: l.slot_id, guruId: l.guru_id })))
    return lepas.length
  }
  async tukarStatus(status: StatusAgihan, catatan?: string) {
    this.strukturSahaja()
    const lama = this.d.kelulusan.status
    this.d.kelulusan = { status, catatan: catatan ?? null, dikemaskini: new Date().toISOString() }
    this.log('status', `${lama} → ${status}${catatan ? `: ${catatan}` : ''}`)
  }
}
