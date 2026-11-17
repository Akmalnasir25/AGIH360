// Ujian pengasingan data (RLS) NeracaTugas terhadap Supabase TEMPATAN.
// Jalankan: node scripts/uji-rls.mjs   (perlu `supabase start`; guna kunci demo tempatan sahaja)
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SB_URL ?? 'http://127.0.0.1:56421'
const ANON = process.env.SB_ANON ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE = process.env.SB_SERVICE ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
if (!URL.includes('127.0.0.1') && !URL.includes('localhost')) throw new Error('Skrip ini hanya untuk Supabase tempatan')

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const run = Date.now().toString(36)
const KATA = 'Ujian-' + run + '!x'
let lulus = 0, gagal = 0
const uji = (nama, ok, butir = '') => { if (ok) { lulus++; console.log('  ✓', nama) } else { gagal++; console.log('  ✗', nama, butir) } }

async function pengguna(nama) {
  const email = `${nama}.${run}@moe-dl.edu.my`
  const { error } = await admin.auth.admin.createUser({ email, password: KATA, email_confirm: true })
  if (error) throw error
  const c = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: KATA })
  if (e2) throw e2
  return { c, email }
}
const kod = (p) => p + String(Math.floor(1000 + Math.random() * 8999))

const A = await pengguna('adminA'), B = await pengguna('adminB'), G = await pengguna('guruA'), PK = await pengguna('pkA'), G2 = await pengguna('guruA2')

console.log('\n▶ Sediakan dua sekolah')
const { data: sA, error: eA } = await A.c.rpc('daftar_sekolah', { p_kod: kod('AAA'), p_nama: 'SK Ujian A', p_jenis: 'SK' })
const { data: sB, error: eB } = await B.c.rpc('daftar_sekolah', { p_kod: kod('BBB'), p_nama: 'SMK Ujian B', p_jenis: 'SMK' })
uji('daftar sekolah A & B', sA && sB, eA?.message ?? eB?.message)
const tahun = (await A.c.from('sekolah').select('tahun_semasa').eq('id', sA).single()).data.tahun_semasa
const bidangA = (await A.c.from('bidang').select('id,nama').eq('school_id', sA)).data
const kur = bidangA.find((b) => b.nama === 'Kurikulum').id, pent = bidangA.find((b) => b.nama === 'Pentadbiran').id
const { data: guruA } = await A.c.from('guru').insert([
  { school_id: sA, nama: 'Guru A Satu', emel: G.email, masa_seminggu: 26 },
  { school_id: sA, nama: 'Guru A Dua', emel: G2.email, masa_seminggu: 24 },
  { school_id: sA, nama: 'Guru A Tiga', masa_seminggu: 28 },
]).select('id,nama')
await B.c.from('guru').insert({ school_id: sB, nama: 'Guru B Rahsia', masa_seminggu: 30 })
uji('admin A tambah 3 guru', guruA?.length === 3)

// slot JK kurikulum & pentadbiran
const slotKur = (await A.c.from('slot').select('id,jawatankuasa_id,jawatankuasa!inner(bidang_id)').eq('school_id', sA).eq('jawatankuasa.bidang_id', kur).limit(3)).data
const slotPent = (await A.c.from('slot').select('id,jawatankuasa_id,jawatankuasa!inner(bidang_id)').eq('school_id', sA).eq('jawatankuasa.bidang_id', pent).limit(2)).data
const L = (slot, guru, t = tahun) => ({ school_id: sA, tahun: t, slot_id: slot, guru_id: guru })
await A.c.from('lantikan').insert([L(slotKur[0].id, guruA[0].id), L(slotKur[1].id, guruA[1].id), L(slotPent[0].id, guruA[2].id, tahun - 1)])

console.log('\n▶ Guru: hanya data sendiri')
await G.c.rpc('tuntut_akaun'); await G2.c.rpc('tuntut_akaun')
const gG = (await G.c.from('guru').select('id,nama')).data
uji('guru nampak hanya rekodnya (1 baris)', gG?.length === 1 && gG[0].nama === 'Guru A Satu', JSON.stringify(gG))
const lG = (await G.c.from('lantikan').select('guru_id')).data
uji('guru nampak hanya lantikan sendiri', lG.length === 1 && lG[0].guru_id === guruA[0].id)
const di = (await G.c.rpc('data_indeks', { p_school: sA, p_tahun: tahun })).data
uji('data_indeks sekolah sendiri tanpa nama (3 baris, 1 "saya")', di?.length === 3 && di.filter((r) => r.saya).length === 1 && !('nama' in di[0]))
const diB = (await G.c.rpc('data_indeks', { p_school: sB, p_tahun: tahun })).data
uji('data_indeks sekolah lain = kosong', (diB ?? []).length === 0)
uji('guru tidak boleh baca log audit', ((await G.c.from('log_audit').select('id')).data ?? []).length === 0)
const { error: eMbLain } = await G.c.from('maklum_balas').insert({ school_id: sA, guru_id: guruA[1].id, tahun, mesej: 'menyamar guru lain' })
uji('guru tidak boleh hantar maklum balas atas nama guru lain', !!eMbLain)
const { error: eMb } = await G.c.from('maklum_balas').insert({ school_id: sA, guru_id: guruA[0].id, tahun, mesej: 'Saya jurulatih daerah' })
uji('guru boleh hantar maklum balas sendiri', !eMb, eMb?.message)
const { error: eTL } = await G.c.from('tugas_luar').insert({ school_id: sA, guru_id: guruA[0].id, tahun, jenis: 'luar', nilai: 50 })
uji('guru tidak boleh tambah tugas luar sendiri', !!eTL)
const { error: eLG } = await G.c.from('lantikan').insert(L(slotKur[2].id, guruA[0].id))
uji('guru tidak boleh melantik', !!eLG)

console.log('\n▶ Antara sekolah')
uji('admin B tidak nampak guru A', ((await B.c.from('guru').select('id').eq('school_id', sA)).data ?? []).length === 0)
uji('admin B tidak nampak sekolah A', ((await B.c.from('sekolah').select('id').eq('id', sA)).data ?? []).length === 0)
uji('admin A tidak nampak guru B', ((await A.c.from('guru').select('id').eq('school_id', sB)).data ?? []).length === 0)
const { error: eX } = await B.c.from('lantikan').insert(L(slotKur[2].id, guruA[0].id))
uji('admin B tidak boleh melantik di sekolah A', !!eX)
const slotB = (await B.c.from('slot').select('id').eq('school_id', sB).limit(1)).data[0]
const { error: eX2 } = await A.c.from('lantikan').insert({ school_id: sA, tahun, slot_id: slotB.id, guru_id: guruA[0].id })
uji('admin A tidak boleh guna slot sekolah B', !!eX2)
const { error: eX3 } = await B.c.rpc('arkib', { p_jadual: 'jawatankuasa', p_id: slotKur[0].jawatankuasa_id })
uji('admin B tidak boleh arkib JK sekolah A', !!eX3)

console.log('\n▶ PK: hanya bidangnya')
const r = await A.c.rpc('tetapkan_peranan', { p_school: sA, p_emel: PK.email, p_peranan: 'pk', p_bidang: kur })
uji('admin tetapkan PK Kurikulum', r.data === 'ok', r.error?.message)
const tahapId = (await PK.c.from('tahap').select('id').eq('school_id', sA).limit(1)).data[0].id
const tempohId = (await PK.c.from('tempoh').select('id').eq('school_id', sA).limit(1)).data[0].id
const { data: jkBaru, error: eJ1 } = await PK.c.from('jawatankuasa').insert({ school_id: sA, bidang_id: kur, nama: 'JK Ujian PK', tahap_id: tahapId, tempoh_id: tempohId }).select('id').single()
uji('PK cipta JK dalam Kurikulum', !eJ1, eJ1?.message)
const { error: eJ2 } = await PK.c.from('jawatankuasa').insert({ school_id: sA, bidang_id: pent, nama: 'JK Haram', tahap_id: tahapId, tempoh_id: tempohId })
uji('PK TIDAK boleh cipta JK dalam Pentadbiran', !!eJ2)
const { error: eJ3 } = await PK.c.from('lantikan').insert(L(slotKur[2].id, guruA[2].id))
uji('PK lantik dalam Kurikulum', !eJ3, eJ3?.message)
const { error: eJ4 } = await PK.c.from('lantikan').insert(L(slotPent[1].id, guruA[2].id))
uji('PK TIDAK boleh lantik dalam Pentadbiran', !!eJ4)
const { error: eJ5 } = await PK.c.rpc('arkib', { p_jadual: 'jawatankuasa', p_id: slotPent[0].jawatankuasa_id })
uji('PK TIDAK boleh arkib JK Pentadbiran', !!eJ5)
const { error: eJ6 } = await PK.c.from('guru').insert({ school_id: sA, nama: 'Guru Palsu' })
uji('PK TIDAK boleh tambah guru', !!eJ6)
const { error: eJ7 } = await PK.c.rpc('arkib', { p_jadual: 'jawatankuasa', p_id: jkBaru.id })
uji('PK arkib JK dalam bidangnya', !eJ7, eJ7?.message)

console.log('\n▶ Kelulusan & kunci')
const s1 = await PK.c.rpc('tukar_status', { p_school: sA, p_tahun: tahun, p_status: 'semakan' })
uji('PK hantar draf → semakan', !s1.error, s1.error?.message)
const s2 = await PK.c.rpc('tukar_status', { p_school: sA, p_tahun: tahun, p_status: 'lulus' })
uji('PK TIDAK boleh luluskan', !!s2.error)
const s3 = await A.c.rpc('tukar_status', { p_school: sA, p_tahun: tahun, p_status: 'lulus', p_catatan: 'Mesyuarat 1' })
uji('admin/GB luluskan', !s3.error, s3.error?.message)
const { error: eK } = await A.c.from('lantikan').insert(L(slotPent[1].id, guruA[1].id))
uji('lantikan dikunci selepas lulus', !!eK && /lulus/.test(eK.message), eK?.message)
const s4 = await A.c.rpc('tukar_status', { p_school: sA, p_tahun: tahun, p_status: 'draf' })
const { error: eK2 } = await A.c.from('lantikan').insert(L(slotPent[1].id, guruA[1].id))
uji('buka semula → boleh lantik semula', !s4.error && !eK2, eK2?.message)

console.log('\n▶ Arkib & sejarah, log audit, snapshot')
const jkPent = slotPent[0].jawatankuasa_id
const namaJK = (await A.c.from('jawatankuasa').select('nama').eq('id', jkPent).single()).data.nama
const { error: eAr } = await A.c.rpc('arkib', { p_jadual: 'jawatankuasa', p_id: jkPent })
uji('admin arkib JK Pentadbiran', !eAr, eAr?.message)
const sej = (await A.c.from('lantikan').select('tahun,jk_nama,peranan_nama').eq('school_id', sA).eq('tahun', tahun - 1)).data
uji('sejarah tahun lepas kekal dengan snapshot nama', sej.length === 1 && sej[0].jk_nama === namaJK && !!sej[0].peranan_nama, JSON.stringify(sej))
const log = (await A.c.from('log_audit').select('tindakan,butiran').eq('school_id', sA)).data
uji('log audit merekod lantik/status', log.some((l) => l.tindakan === 'lantik') && log.some((l) => l.tindakan === 'status'), log.map((l) => l.tindakan).join(','))
uji('log admin B tidak mengandungi sekolah A', ((await B.c.from('log_audit').select('id').eq('school_id', sA)).data ?? []).length === 0)

console.log('\n▶ Maklum balas: balasan admin')
const mb = (await A.c.from('maklum_balas').select('id').eq('school_id', sA).limit(1)).data[0]
const rG = (await G.c.from('maklum_balas').update({ status: 'selesai', balasan: 'saya tanda sendiri' }).eq('id', mb.id).select('id')).data ?? []
uji('guru TIDAK boleh tanda maklum balas selesai (0 baris)', rG.length === 0)
const rA = (await A.c.from('maklum_balas').update({ status: 'selesai', balasan: 'Diambil perhatian' }).eq('id', mb.id).select('id')).data ?? []
uji('admin boleh balas maklum balas (1 baris)', rA.length === 1)
const rB = (await B.c.from('maklum_balas').update({ balasan: 'ceroboh' }).eq('id', mb.id).select('id')).data ?? []
uji('admin sekolah lain TIDAK boleh balas (0 baris)', rB.length === 0)

console.log('\n▶ Peranan GB')
const GB = await pengguna('gbA')
await A.c.rpc('tetapkan_peranan', { p_school: sA, p_emel: GB.email, p_peranan: 'gb' })
const s5 = await GB.c.rpc('tukar_status', { p_school: sA, p_tahun: tahun, p_status: 'lulus' })
uji('GB boleh luluskan', !s5.error, s5.error?.message)
uji('GB nampak semua guru sekolahnya', ((await GB.c.from('guru').select('id').eq('school_id', sA)).data ?? []).length === 3)

console.log(`\n${gagal ? '❌' : '✅'} ${lulus} lulus, ${gagal} gagal\n`)
process.exit(gagal ? 1 : 0)
