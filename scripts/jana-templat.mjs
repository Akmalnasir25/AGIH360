// Sumber tunggal templat JK NeracaTugas, diselaraskan dengan MySG (Malaysian School Governance, KPM).
// Jana: node scripts/jana-templat.mjs  →  src/lib/templat.json  +  supabase/migrations/<ts>_templat_mysg.sql
// Bidang tugas ditulis semula secara ringkas (bukan salinan teks MySG). Rujuk dokumen MySG rasmi untuk perincian penuh.
import { writeFileSync } from 'node:fs'

const UTAMA = [['Pengerusi', 1], ['Naib Pengerusi', 1], ['Setiausaha', 1], ['AJK', 4]]
const BIASA = [['Pengerusi', 1], ['Setiausaha', 1], ['AJK', 3]]
const KECIL = [['Penyelaras', 1], ['AJK', 2]]

// Bidang tugas ringkas (satu baris = satu tugas)
const BT = {
  pengurusan: ['Menetapkan hala tuju, dasar dan perancangan strategik sekolah.', 'Menyelaras takwim sekolah dan penyediaan Buku Pengurusan.', 'Merancang program kecemerlangan dan memantau prestasi sekolah (termasuk penilaian kendiri).', 'Mengurus penyelenggaraan fizikal, bilik khas, majlis rasmi dan perhubungan luar.', 'Memantau kontrak keselamatan & kebersihan serta dokumentasi laporan sekolah.', 'Bermesyuarat sekurang-kurangnya 2 kali setahun (dipengerusikan PGB).'],
  maklumat: ['Mengurus pengumpulan, pengemaskinian dan kesahihan data sekolah (EMIS/APDM/IDME).', 'Memastikan data dihantar kepada PPD/JPN/KPM mengikut tarikh ditetapkan.', 'Menyimpan dokumen data dengan selamat dan menyelenggara peralatan data.', 'Melaporkan kerosakan peralatan/talian kepada pihak berkenaan.'],
  sdm: ['Mengurus perjawatan dan Anggaran Belanja Mengurus (ABM) perjawatan.', 'Menyelaras penilaian prestasi, kenaikan pangkat dan rekod HRMIS.', 'Merancang latihan profesional (LDP/PLC) dan program guru baharu.', 'Mengurus kebajikan, kesejahteraan dan isu staf bermasalah mengikut prosedur.'],
  kewangan: ['Merancang dan memantau agihan bajet serta perbelanjaan sekolah.', 'Memastikan perolehan, terimaan dan bayaran mematuhi tatacara kewangan.', 'Mengurus rekod akaun, penyata dan audit dalaman.', 'Mengurus aset alih kerajaan: penerimaan, pendaftaran, pemeriksaan dan pelupusan.'],
  skpm: ['Menyelaras penilaian kendiri sekolah berdasarkan SKPM.', 'Mengumpul eviden dan menganalisis dapatan setiap standard.', 'Merancang tindakan penambahbaikan berdasarkan dapatan.', 'Melapor pencapaian SKPM kepada pentadbir dan PPD.'],
  pendKhas: ['Merancang dan mengurus program pendidikan khas/integrasi/inklusif.', 'Menyediakan Rancangan Pendidikan Individu (RPI) murid berkeperluan khas.', 'Menyelaras penempatan, kemudahan dan bantuan murid berkeperluan khas.', 'Berhubung dengan ibu bapa dan agensi berkaitan.'],
  prasekolah: ['Mengurus pendaftaran dan pemilihan murid prasekolah.', 'Memastikan pelaksanaan kurikulum prasekolah kebangsaan.', 'Menyelaras RMT/makanan, keselamatan dan kebajikan murid prasekolah.', 'Melapor perkembangan murid kepada ibu bapa.'],
  bencana: ['Menyediakan pelan tindakan kecemasan dan bencana sekolah.', 'Melaksanakan latihan kebakaran/pengungsian sekurang-kurangnya sekali setahun.', 'Menyenggara peralatan keselamatan dan laluan kecemasan.', 'Menyelaras tindakan semasa bencana bersama agensi berkaitan.'],
  pibg: ['Menyelaras mesyuarat agung dan mesyuarat AJK PIBG.', 'Merancang program kerjasama sekolah dan ibu bapa.', 'Mengurus kutipan dan penggunaan sumbangan PIBG secara telus.', 'Mematuhi peraturan PIBG yang berkuat kuasa.'],
  kebajikan: ['Mengurus kebajikan guru dan kakitangan (ziarah, sumbangan, penghargaan).', 'Menganjurkan aktiviti kesejahteraan dan sambutan warga sekolah.', 'Mengurus yuran dan kewangan kelab dengan telus.'],
  orangAsal: ['Memantau kehadiran dan mencegah keciciran murid Orang Asal.', 'Menyelaras bantuan, asrama dan program khas murid Orang Asal.', 'Berhubung dengan keluarga dan agensi berkaitan.'],
  kurikulum: ['Menentukan dan menyelaras dasar kurikulum sekolah selari dengan KPM/JPN.', 'Menyelaras jadual waktu, agihan mata pelajaran dan guru ganti (relief).', 'Memantau pelaksanaan PdP dan program peningkatan akademik.', 'Mengenal pasti isu kurikulum dan merancang tindakan susulan.', 'Bermesyuarat sekurang-kurangnya 2 kali setahun (dipengerusikan PGB).'],
  panitia: ['Merancang rancangan tahunan mata pelajaran dan program panitia.', 'Memastikan PdP mematuhi DSKP dan memantau kemajuan murid.', 'Menyelaras bahan bantu mengajar, pencerapan dan perkongsian amalan terbaik.', 'Menganalisis pencapaian dan merancang intervensi.'],
  pentaksiran: ['Menyelaras pelaksanaan Pentaksiran Bilik Darjah (PBD) dan pelaporan.', 'Mengurus pentaksiran/peperiksaan dalaman dan analisis keputusan.', 'Memastikan kerahsiaan dan keselamatan instrumen pentaksiran.', 'Melapor tahap penguasaan murid kepada pentadbir dan ibu bapa.'],
  peperiksaan: ['Mengurus peperiksaan awam (SPM/STPM) dan pentaksiran dalaman.', 'Menyelaras pendaftaran calon, jadual dan bilik peperiksaan.', 'Menyelaras Pentaksiran Bilik Darjah (PBD) dan pelaporan.', 'Menganalisis keputusan dan merancang program peningkatan.'],
  pss: ['Mengurus perpustakaan, bahan sumber dan media pendidikan.', 'Melaksanakan program galakan membaca (NILAM) dan literasi maklumat.', 'Menyokong guru dengan sumber PdP dan teknologi pendidikan.'],
  hem: ['Mengurus pendaftaran, pertukaran dan pemberhentian murid.', 'Menyelaras pengurusan kelas, guru kelas dan pembangunan sahsiah murid.', 'Mengurus bantuan & kebajikan murid (biasiswa, SPBT, RMT, insurans).', 'Memantau kantin dan kesejahteraan murid.', 'Bermesyuarat sekurang-kurangnya 2 kali setahun (dipengerusikan PGB).'],
  disiplin: ['Menggubal dan menguatkuasa peraturan sekolah.', 'Mengendali kes disiplin mengikut prosedur dan merekod dalam sistem (SSDM).', 'Mengurus lembaga pengawas dan program pencegahan salah laku/ponteng.', 'Berhubung dengan ibu bapa dan agensi bagi kes berat.'],
  tigaK: ['Memastikan kebersihan persekitaran sekolah dan tandas.', 'Melaksanakan program kesihatan murid (saringan, imunisasi, PROSTAR).', 'Mengenal pasti risiko keselamatan dan mengambil tindakan pembetulan.', 'Merekod dan melapor insiden 3K.'],
  bk: ['Memberi perkhidmatan kaunseling individu dan kelompok.', 'Melaksanakan program pembangunan sahsiah dan pencegahan.', 'Menyelaras bimbingan kerjaya dan kemahiran belajar.', 'Merekod sesi dan menjaga kerahsiaan klien.'],
  asrama: ['Mengurus kemasukan dan penempatan murid asrama.', 'Menyelaras tugas warden, jadual dan disiplin asrama.', 'Memastikan makanan, kebersihan dan keselamatan asrama.'],
  koku: ['Menentukan dasar dan takwim kokurikulum sekolah.', 'Menyelaras unit beruniform, kelab/persatuan dan sukan/permainan.', 'Memastikan pentaksiran PAJSK direkod dan dilapor.', 'Mengurus penyertaan pertandingan dan keselamatan aktiviti.', 'Bermesyuarat sekurang-kurangnya 2 kali setahun (dipengerusikan PGB).'],
  pembSukan: ['Merancang program pembangunan sukan dan bakat murid.', 'Menyelaras jurulatih, latihan dan penyertaan kejohanan.', 'Melaksanakan dasar Satu Murid Satu Sukan.'],
  sukanTahunan: ['Merancang dan melaksanakan kejohanan sukan tahunan sekolah.', 'Menyelaras rumah sukan, pegawai teknikal dan keputusan.', 'Memastikan keselamatan, peralatan dan kelengkapan kejohanan.'],
  t6: ['Mengurus pendaftaran, kurikulum dan pentaksiran Tingkatan Enam.', 'Menyelaras kerja kursus, aktiviti dan kebajikan pelajar Tingkatan Enam.'],
  skm: ['Mengurus pelaksanaan program Sijil Kemahiran Malaysia (SKM).', 'Menyelaras penilaian, pentauliahan dan rekod pelajar.'],
  pima: ['Mengurus program perantisan industri (PIMA) bersama rakan industri.', 'Memantau penempatan, penilaian dan kebajikan pelajar perantis.'],
  koperasi: ['Mengurus operasi koperasi sekolah mengikut peraturan koperasi.', 'Melatih murid dalam keusahawanan dan pengurusan koperasi.', 'Menyediakan penyata kewangan dan mesyuarat agung tahunan.'],
  rumahSukan: ['Mengurus ahli rumah, latihan dan penyertaan sukan tahunan.', 'Menjaga kebajikan dan disiplin ahli rumah.'],
  beruniform: ['Merancang aktiviti unit, perkhemahan dan kenaikan lencana.', 'Merekod kehadiran dan penilaian PAJSK ahli.'],
  kelab: ['Merancang aktiviti kelab/persatuan sepanjang tahun.', 'Merekod kehadiran dan penilaian PAJSK ahli.'],
  rmt: ['Menyelaras senarai penerima dan pelaksanaan Rancangan Makanan Tambahan.', 'Memantau kualiti makanan dan rekod harian.'],
  spbt: ['Mengurus pesanan, penerimaan, pinjaman dan pemulangan buku teks.', 'Menyelenggara rekod dan stok SPBT.'],
}

// [kod, nama, tahap, tempoh, wajib, slot, bt, syarat?]
const J = (kod, nama, tahap, tempoh, wajib, slot, bt, syarat) => ({ kod, nama, tahap, tempoh, wajib, slot, bidang_tugas: BT[bt].join('\n'), ...(syarat ? { syarat } : {}) })
const S = 'Sepanjang tahun', M = 'Bermusim'

const SK = { bidang: [
  { nama: 'Pentadbiran', warna: 'indigo', jk: [
    J('JR01', 'JK Pengurusan Sekolah', 'Utama', S, true, UTAMA, 'pengurusan'),
    J('JR02', 'JK Pengurusan Maklumat Sekolah', 'Sokongan', S, false, KECIL, 'maklumat'),
    J('JR03', 'JK Pengurusan Sumber Manusia', 'Sokongan', S, false, BIASA, 'sdm'),
    J('JR04', 'JK Pengurusan Kewangan, Akaun dan Aset Sekolah', 'Utama', S, false, BIASA, 'kewangan'),
    J('JR05', 'JK Standard Kualiti Pendidikan Malaysia (SKPM)', 'Sokongan', S, false, KECIL, 'skpm'),
    J('JR06', 'JK Pendidikan Khas Sekolah', 'Sokongan', S, false, KECIL, 'pendKhas', 'ppki'),
    J('JR07', 'JK Pengurusan Prasekolah', 'Sokongan', S, false, KECIL, 'prasekolah', 'prasekolah'),
    J('JR08', 'JK Pengurusan Bencana Sekolah', 'Sokongan', S, false, BIASA, 'bencana'),
    J('JR09', 'JK Persatuan Ibu Bapa dan Guru (PIBG)', 'Sokongan', S, false, BIASA, 'pibg'),
    J('JR10', 'JK Kelab Kebajikan Guru dan Kakitangan', 'Sampingan', S, false, BIASA, 'kebajikan'),
    J('JR11', 'JK Pengurusan Murid Orang Asal', 'Sokongan', S, false, KECIL, 'orangAsal', 'orang_asal'),
  ] },
  { nama: 'Kurikulum', warna: 'sky', jk: [
    J('JR12', 'JK Pengurusan Kurikulum', 'Utama', S, true, UTAMA, 'kurikulum'),
    J('JR13', 'Panitia Bahasa Melayu', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JR13', 'Panitia Bahasa Inggeris', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JR13', 'Panitia Matematik', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JR13', 'Panitia Sains', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JR13', 'Panitia Pendidikan Islam & Bahasa Arab', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JR13', 'Panitia Sejarah', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JR13', 'Panitia RBT', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JR13', 'Panitia PJPK', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JR13', 'Panitia Pendidikan Seni & Muzik', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JR14', 'JK Pentaksiran', 'Utama', S, false, [['Penyelaras', 1], ['Setiausaha', 1], ['AJK', 3]], 'pentaksiran'),
    J('JR15', 'JK Pusat Sumber Sekolah (PSS)', 'Sokongan', S, false, [['Penyelaras', 1], ['Setiausaha', 1], ['AJK', 2]], 'pss'),
  ] },
  { nama: 'Hal Ehwal Murid', warna: 'emerald', jk: [
    J('JR16', 'JK Pengurusan Hal Ehwal Murid', 'Utama', S, true, UTAMA, 'hem'),
    J('JR17', 'JK Pengurusan Disiplin Murid', 'Utama', S, false, [['Penyelaras', 1], ['Setiausaha', 1], ['AJK', 3]], 'disiplin'),
    J('JR18', 'JK Pengurusan 3K (Kebersihan, Kesihatan, Keselamatan)', 'Sokongan', S, false, BIASA, 'tigaK'),
    J('JR19', 'JK Bimbingan dan Kaunseling', 'Sokongan', S, false, KECIL, 'bk'),
    J('JR20', 'JK Pengurusan Asrama', 'Utama', S, false, [['Penyelaras', 1], ['Warden', 3]], 'asrama', 'asrama'),
    J('', 'JK Rancangan Makanan Tambahan (RMT)', 'Sokongan', S, false, KECIL, 'rmt'),
    J('', 'JK Skim Pinjaman Buku Teks (SPBT)', 'Sokongan', S, false, KECIL, 'spbt'),
  ] },
  { nama: 'Kokurikulum', warna: 'amber', jk: [
    J('JR21', 'JK Pengurusan Kokurikulum', 'Utama', S, true, UTAMA, 'koku'),
    J('JR22', 'JK Pembangunan Sukan Sekolah', 'Sokongan', S, false, KECIL, 'pembSukan'),
    J('JR23', 'JK Sukan Tahunan Sekolah', 'Sokongan', M, false, [['Pengerusi', 1], ['Setiausaha', 1], ['AJK', 4]], 'sukanTahunan'),
    J('', 'Rumah Sukan Merah', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Biru', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Hijau', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Kuning', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Unit Beruniform: Pengakap', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'beruniform'),
    J('', 'Unit Beruniform: Tunas Puteri / Puteri Islam', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'beruniform'),
    J('', 'Kelab Sains & Matematik', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'kelab'),
  ] },
] }

const SMK = { bidang: [
  { nama: 'Pentadbiran', warna: 'indigo', jk: [
    J('JM01', 'JK Pengurusan Sekolah', 'Utama', S, true, UTAMA, 'pengurusan'),
    J('JM02', 'JK Pengurusan Maklumat Sekolah', 'Sokongan', S, false, KECIL, 'maklumat'),
    J('JM03', 'JK Pengurusan Sumber Manusia', 'Sokongan', S, false, BIASA, 'sdm'),
    J('JM04', 'JK Pengurusan Kewangan, Akaun dan Aset Sekolah', 'Utama', S, false, BIASA, 'kewangan'),
    J('JM05', 'JK Standard Kualiti Pendidikan Malaysia (SKPM)', 'Sokongan', S, false, KECIL, 'skpm'),
    J('JM06', 'JK Pendidikan Khas Sekolah', 'Sokongan', S, false, KECIL, 'pendKhas', 'ppki'),
    J('JM07', 'JK Pengurusan Bencana Sekolah', 'Sokongan', S, false, BIASA, 'bencana'),
    J('JM08', 'JK Persatuan Ibu Bapa dan Guru (PIBG)', 'Sokongan', S, false, BIASA, 'pibg'),
    J('JM09', 'JK Kelab Kebajikan Guru dan Kakitangan', 'Sampingan', S, false, BIASA, 'kebajikan'),
    J('JM10', 'JK Pengurusan Murid Orang Asal', 'Sokongan', S, false, KECIL, 'orangAsal', 'orang_asal'),
    J('JM11', 'JK Pengurusan Tingkatan Enam', 'Utama', S, false, BIASA, 't6', 't6'),
    J('JM12', 'JK Program Sijil Kemahiran Malaysia (SKM)', 'Sokongan', S, false, KECIL, 'skm', 'skm'),
    J('JM13', 'JK Program Perantisan Industri Menengah Atas (PIMA)', 'Sokongan', S, false, KECIL, 'pima', 'pima'),
  ] },
  { nama: 'Kurikulum', warna: 'sky', jk: [
    J('JM21', 'JK Pengurusan Kurikulum', 'Utama', S, true, UTAMA, 'kurikulum'),
    J('JM22', 'Panitia Bahasa Melayu', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Bahasa Inggeris', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Matematik & Matematik Tambahan', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Sains, Fizik, Kimia & Biologi', 'Sokongan', S, false, [['Ketua Panitia', 1], ['Setiausaha', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Sejarah', 'Sokongan', S, false, [['Ketua Panitia', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Pendidikan Islam & Bahasa Arab', 'Sokongan', S, false, [['Ketua Panitia', 1], ['AJK', 2]], 'panitia'),
    J('JM22', 'Panitia Geografi', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JM22', 'Panitia PJPK', 'Sampingan', S, false, [['Ketua Panitia', 1], ['AJK', 1]], 'panitia'),
    J('JM23', 'JK Pentaksiran dan Peperiksaan', 'Utama', S, false, [['Setiausaha', 1], ['Penolong Setiausaha', 1], ['AJK', 4]], 'peperiksaan'),
    J('JM24', 'JK Pusat Sumber Sekolah (PSS)', 'Sokongan', S, false, [['Penyelaras', 1], ['Setiausaha', 1], ['AJK', 2]], 'pss'),
  ] },
  { nama: 'Hal Ehwal Murid', warna: 'emerald', jk: [
    J('JM25', 'JK Pengurusan Hal Ehwal Murid', 'Utama', S, true, UTAMA, 'hem'),
    J('JM26', 'JK Pengurusan Disiplin Murid', 'Utama', S, false, [['Penyelaras', 1], ['Setiausaha', 1], ['AJK', 4]], 'disiplin'),
    J('JM27', 'JK Pengurusan 3K (Kebersihan, Kesihatan, Keselamatan)', 'Sokongan', S, false, BIASA, 'tigaK'),
    J('JM28', 'JK Unit Bimbingan dan Kaunseling', 'Sokongan', S, false, KECIL, 'bk'),
    J('JM29', 'JK Pengurusan Asrama', 'Utama', S, false, [['Penyelaras', 1], ['Warden', 3]], 'asrama', 'asrama'),
    J('', 'JK Skim Pinjaman Buku Teks (SPBT)', 'Sokongan', S, false, KECIL, 'spbt'),
  ] },
  { nama: 'Kokurikulum', warna: 'amber', jk: [
    J('JM30', 'JK Pengurusan Kokurikulum', 'Utama', S, true, UTAMA, 'koku'),
    J('JM31', 'JK Pembangunan Sukan Sekolah', 'Sokongan', S, false, KECIL, 'pembSukan'),
    J('JM32', 'JK Sukan Tahunan Sekolah', 'Sokongan', M, false, [['Pengerusi', 1], ['Setiausaha', 1], ['AJK', 4]], 'sukanTahunan'),
    J('JM33', 'JK Koperasi Sekolah', 'Sampingan', S, false, [['Penasihat', 1], ['AJK', 2]], 'koperasi'),
    J('', 'Rumah Sukan Merah', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Biru', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Hijau', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Rumah Sukan Kuning', 'Sampingan', M, false, [['Ketua Rumah', 1], ['AJK', 2]], 'rumahSukan'),
    J('', 'Unit Beruniform: Kadet Remaja Sekolah', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'beruniform'),
    J('', 'Unit Beruniform: Pengakap', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'beruniform'),
    J('', 'Kelab & Persatuan: Persatuan Bahasa Melayu', 'Sampingan', S, false, [['Guru Penasihat', 1], ['AJK', 1]], 'kelab'),
  ] },
] }

const templat = { SK, SMK }
writeFileSync(new URL('../src/lib/templat.json', import.meta.url), JSON.stringify(templat))

// Jana fungsi SQL _templat(jenis) daripada JSON yang sama
const sql = `-- NeracaTugas 006: templat JK diselaraskan dengan MySG (kod JR/JM), bidang tugas, JK bersyarat.
-- DIJANA oleh scripts/jana-templat.mjs — jangan sunting tangan.

alter table public.jawatankuasa add column if not exists kod text;

create or replace function public._templat(p_jenis text)
returns jsonb language sql immutable set search_path = public as $fn$
select case when p_jenis = 'SK' then $j$${JSON.stringify(SK)}$j$::jsonb
else $j$${JSON.stringify(SMK)}$j$::jsonb end
$fn$;
revoke execute on function public._templat(text) from public, anon, authenticated;

-- p_pilihan: syarat JK bersyarat yang dipilih semasa daftar (prasekolah, ppki, asrama, orang_asal, t6, skm, pima)
drop function if exists public._isi_templat(uuid, text);
create function public._isi_templat(p_school uuid, p_jenis text, p_pilihan text[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare
  t jsonb := public._templat(p_jenis);
  b jsonb; j jsonb; s jsonb;
  v_bidang uuid; v_jk uuid; i int; n int; bi int := 0; ji int; si int;
begin
  insert into public.tetapan(school_id) values (p_school) on conflict do nothing;
  insert into public.tahap(school_id, nama, faktor, susunan) values
    (p_school,'Utama',3,1),(p_school,'Sokongan',2,2),(p_school,'Sampingan',1,3);
  insert into public.tempoh(school_id, nama, faktor, susunan) values
    (p_school,'Sepanjang tahun',1.0,1),(p_school,'Bermusim',0.6,2),(p_school,'Program',0.3,3);
  insert into public.peranan_jk(school_id, nama, berat, susunan) values
    (p_school,'Pengerusi',5,1),(p_school,'Naib Pengerusi',4,2),(p_school,'Setiausaha',4,3),
    (p_school,'Penolong Setiausaha',3,4),(p_school,'Bendahari',3,5),(p_school,'Penyelaras',3,6),
    (p_school,'Ketua Panitia',4,7),(p_school,'Ketua Tingkatan',3,8),(p_school,'Ketua Rumah',3,9),
    (p_school,'Guru Penasihat',2,10),(p_school,'Penasihat',2,11),(p_school,'Jurulatih',3,12),(p_school,'Warden',3,13),
    (p_school,'Guru Kelas',3,14),(p_school,'AJK',1,15);
  insert into public.gred(school_id, kod, peranan, faktor, susunan) values
    (p_school,'DG9 dan ke bawah','Pelaksana',1.0,1),(p_school,'DG10','Penggerak',1.1,2),
    (p_school,'DG12','Pembimbing dan Mentor',1.2,3),(p_school,'DG13','Peneraju Perubahan',1.3,4),
    (p_school,'DG14','Pemikir Strategik',1.4,5),(p_school,'Gred Khas','Pemikir Holistik',1.5,6);

  for b in select * from jsonb_array_elements(t->'bidang') loop
    bi := bi + 1;
    insert into public.bidang(school_id, nama, warna, susunan)
      values (p_school, b->>'nama', b->>'warna', bi) returning id into v_bidang;
    ji := 0;
    for j in select * from jsonb_array_elements(b->'jk') loop
      continue when j ? 'syarat' and not ((j->>'syarat') = any(p_pilihan));
      ji := ji + 1;
      insert into public.jawatankuasa(school_id, bidang_id, kod, nama, tahap_id, tempoh_id, wajib, bidang_tugas, susunan)
      values (p_school, v_bidang, nullif(j->>'kod',''), j->>'nama',
        (select id from public.tahap where school_id = p_school and nama = j->>'tahap'),
        (select id from public.tempoh where school_id = p_school and nama = j->>'tempoh'),
        coalesce((j->>'wajib')::boolean, false), j->>'bidang_tugas', ji)
      returning id into v_jk;
      si := 0;
      for s in select * from jsonb_array_elements(j->'slot') loop
        n := (s->>1)::int;
        for i in 1..n loop
          si := si + 1;
          insert into public.slot(school_id, jawatankuasa_id, peranan_id, susunan)
          values (p_school, v_jk, (select id from public.peranan_jk where school_id = p_school and nama = s->>0), si);
        end loop;
      end loop;
    end loop;
  end loop;
end $$;
revoke execute on function public._isi_templat(uuid, text, text[]) from public, anon, authenticated;

drop function if exists public.daftar_sekolah(text, text, text, text, text, text, text, int);
create function public.daftar_sekolah(
  p_kod text, p_nama text, p_jenis text,
  p_daerah text default null, p_negeri text default null, p_alamat text default null,
  p_nama_ketua text default null, p_tahun int default null, p_pilihan text[] default '{}'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_kod text := upper(trim(p_kod));
  v_tahun int := coalesce(p_tahun, extract(year from now())::int + case when extract(month from now()) >= 10 then 1 else 0 end);
begin
  if auth.uid() is null then raise exception 'Sila log masuk dahulu'; end if;
  if p_jenis not in ('SK','SMK') then raise exception 'Jenis sekolah tidak sah'; end if;
  if v_tahun not between 2020 and 2100 then raise exception 'Sesi tidak sah'; end if;
  if exists(select 1 from public.sekolah where kod = v_kod) then
    raise exception 'Kod sekolah % sudah didaftarkan. Minta pentadbir sekolah tambah anda sebagai ahli.', v_kod;
  end if;
  insert into public.sekolah(kod, nama, jenis, daerah, negeri, alamat, nama_ketua, jawatan_ketua, tahun_semasa)
  values (v_kod, trim(p_nama), p_jenis, p_daerah, p_negeri, p_alamat, p_nama_ketua,
          case when p_jenis = 'SK' then 'Guru Besar' else 'Pengetua' end, v_tahun)
  returning id into v_id;
  insert into public.ahli(user_id, school_id, peranan) values (auth.uid(), v_id, 'admin');
  perform public._isi_templat(v_id, p_jenis, coalesce(p_pilihan, '{}'));
  return v_id;
end $$;
revoke execute on function public.daftar_sekolah(text, text, text, text, text, text, text, int, text[]) from public, anon;
grant execute on function public.daftar_sekolah(text, text, text, text, text, text, text, int, text[]) to authenticated;
`
writeFileSync(new URL('../supabase/migrations/20261118000006_templat_mysg.sql', import.meta.url), sql)
console.log('SK', SK.bidang.map((b) => b.jk.length), 'SMK', SMK.bidang.map((b) => b.jk.length))
