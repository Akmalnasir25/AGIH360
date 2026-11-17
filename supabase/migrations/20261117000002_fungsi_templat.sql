-- NeracaTugas: fungsi daftar sekolah, templat SK/SMK, tuntut akaun, data indeks

-- ───────────────────────── Templat ─────────────────────────
-- Struktur: { bidang: [ {nama, warna, jk: [ {nama, tahap, tempoh, wajib, slot: [[peranan, bil], ...]} ]} ] }
create or replace function public._templat(p_jenis text)
returns jsonb language sql immutable as $$
select case when p_jenis = 'SK' then $j$
{"bidang":[
 {"nama":"Pentadbiran","warna":"indigo","jk":[
  {"nama":"JK Pengurusan Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Pengurusan Kewangan & Akaun","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Keselamatan & Kesihatan Pekerjaan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Pengurusan Aset Alih Kerajaan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Data & Maklumat (EMIS/IDME)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Pembangunan Profesionalisme (LDP)","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Digital & ICT Sekolah","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]}
 ]},
 {"nama":"Kurikulum","warna":"sky","jk":[
  {"nama":"JK Kurikulum Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Pentaksiran Bilik Darjah (PBD)","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Jadual Waktu & Relief","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"Panitia Bahasa Melayu","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Bahasa Inggeris","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Matematik","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Sains","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Pendidikan Islam & Bahasa Arab","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Sejarah","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"Panitia RBT","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"Panitia PJPK","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"Panitia Pendidikan Seni & Muzik","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"JK Pusat Sumber & NILAM","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Literasi & Numerasi (LINUS)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Transisi Tahun 1","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]}
 ]},
 {"nama":"Hal Ehwal Murid","warna":"emerald","jk":[
  {"nama":"JK Hal Ehwal Murid","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Disiplin Murid","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Bimbingan & Kaunseling","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Rancangan Makanan Tambahan (RMT)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Skim Pinjaman Buku Teks (SPBT)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Kesihatan Murid & 3K","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Pengawas Sekolah","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",1]]},
  {"nama":"JK Kantin Sekolah","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",1]]}
 ]},
 {"nama":"Kokurikulum","warna":"amber","jk":[
  {"nama":"JK Kokurikulum Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Sukan Tahunan","tahap":"Sokongan","tempoh":"Program","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",4]]},
  {"nama":"Rumah Sukan Merah","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Biru","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Hijau","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Kuning","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Unit Beruniform: Pengakap","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Unit Beruniform: Tunas Puteri / Puteri Islam","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Kelab Sains & Matematik","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Pasukan Bola Sepak / Olahraga","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Jurulatih",2]]}
 ]}
]}
$j$::jsonb
else $j$
{"bidang":[
 {"nama":"Pentadbiran","warna":"indigo","jk":[
  {"nama":"JK Pengurusan Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",4]]},
  {"nama":"JK Pengurusan Kewangan & Akaun","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Keselamatan & Kesihatan Pekerjaan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Pengurusan Aset Alih Kerajaan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Data & Maklumat (EMIS/IDME)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Pembangunan Profesionalisme (LDP)","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Digital & ICT Sekolah","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]}
 ]},
 {"nama":"Kurikulum","warna":"sky","jk":[
  {"nama":"JK Kurikulum Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",4]]},
  {"nama":"JK Peperiksaan & Pentaksiran (SPM/PT3)","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Setiausaha",1],["Penolong Setiausaha",1],["AJK",4]]},
  {"nama":"JK Pentaksiran Bilik Darjah (PBD)","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",3]]},
  {"nama":"JK Jadual Waktu & Relief","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Pengurusan Tingkatan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Tingkatan",5]]},
  {"nama":"Panitia Bahasa Melayu","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Bahasa Inggeris","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Matematik & Matematik Tambahan","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Sains, Fizik, Kimia & Biologi","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"Panitia Sejarah","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",2]]},
  {"nama":"Panitia Pendidikan Islam & Bahasa Arab","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",2]]},
  {"nama":"Panitia Geografi","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"Panitia PJPK","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Ketua Panitia",1],["AJK",1]]},
  {"nama":"JK Pusat Sumber Sekolah & NILAM","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",2]]},
  {"nama":"JK Makmal Sains","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]}
 ]},
 {"nama":"Hal Ehwal Murid","warna":"emerald","jk":[
  {"nama":"JK Hal Ehwal Murid","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Disiplin Murid","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["Setiausaha",1],["AJK",4]]},
  {"nama":"JK Bimbingan & Kaunseling","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Biasiswa & Bantuan Murid","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Skim Pinjaman Buku Teks (SPBT)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Asrama","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["Warden",3]]},
  {"nama":"JK Kesihatan Murid & 3K","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Lembaga Pengawas","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"JK Kantin Sekolah","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",1]]}
 ]},
 {"nama":"Kokurikulum","warna":"amber","jk":[
  {"nama":"JK Kokurikulum Sekolah","tahap":"Utama","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",3]]},
  {"nama":"JK Sukan Tahunan","tahap":"Sokongan","tempoh":"Program","wajib":true,"slot":[["Pengerusi",1],["Setiausaha",1],["AJK",4]]},
  {"nama":"JK Pentaksiran Aktiviti Jasmani, Sukan & Kokurikulum (PAJSK)","tahap":"Sokongan","tempoh":"Sepanjang tahun","wajib":true,"slot":[["Penyelaras",1],["AJK",2]]},
  {"nama":"Rumah Sukan Merah","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Biru","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Hijau","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Rumah Sukan Kuning","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Ketua Rumah",1],["AJK",2]]},
  {"nama":"Unit Beruniform: Kadet Remaja Sekolah","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Unit Beruniform: Pengakap","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Kelab & Persatuan: Persatuan Bahasa Melayu","tahap":"Sampingan","tempoh":"Sepanjang tahun","wajib":false,"slot":[["Guru Penasihat",1],["AJK",1]]},
  {"nama":"Sukan & Permainan: Bola Sepak","tahap":"Sampingan","tempoh":"Bermusim","wajib":false,"slot":[["Jurulatih",2]]}
 ]}
]}
$j$::jsonb
end
$$;

-- Isi templat ke dalam sekolah
create or replace function public._isi_templat(p_school uuid, p_jenis text)
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
    (p_school,'Guru Penasihat',2,10),(p_school,'Jurulatih',3,11),(p_school,'Warden',3,12),
    (p_school,'Guru Kelas',3,13),(p_school,'AJK',1,14);
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
      ji := ji + 1;
      insert into public.jawatankuasa(school_id, bidang_id, nama, tahap_id, tempoh_id, wajib, susunan)
      values (p_school, v_bidang, j->>'nama',
        (select id from public.tahap where school_id = p_school and nama = j->>'tahap'),
        (select id from public.tempoh where school_id = p_school and nama = j->>'tempoh'),
        coalesce((j->>'wajib')::boolean, false), ji)
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

revoke all on function public._isi_templat(uuid, text) from public, anon, authenticated;

-- ───────────────────────── Daftar sekolah ─────────────────────────
create or replace function public.daftar_sekolah(
  p_kod text, p_nama text, p_jenis text,
  p_daerah text default null, p_negeri text default null, p_alamat text default null,
  p_nama_ketua text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_kod text := upper(trim(p_kod));
begin
  if auth.uid() is null then raise exception 'Sila log masuk dahulu'; end if;
  if p_jenis not in ('SK','SMK') then raise exception 'Jenis sekolah tidak sah'; end if;
  if exists(select 1 from public.sekolah where kod = v_kod) then
    raise exception 'Kod sekolah % sudah didaftarkan. Minta pentadbir sekolah tambah anda sebagai ahli.', v_kod;
  end if;
  insert into public.sekolah(kod, nama, jenis, daerah, negeri, alamat, nama_ketua, jawatan_ketua)
  values (v_kod, trim(p_nama), p_jenis, p_daerah, p_negeri, p_alamat, p_nama_ketua,
          case when p_jenis = 'SK' then 'Guru Besar' else 'Pengetua' end)
  returning id into v_id;
  insert into public.ahli(user_id, school_id, peranan) values (auth.uid(), v_id, 'admin');
  perform public._isi_templat(v_id, p_jenis);
  return v_id;
end $$;

-- ───────────────────────── Tuntut akaun guru (padan e-mel) ─────────────────────────
-- Guru log masuk (DELIMa/e-mel) → automatik dipautkan ke rekod guru dengan e-mel sama.
create or replace function public.tuntut_akaun()
returns int language plpgsql security definer set search_path = public as $$
declare v_emel text; v_n int := 0; r record;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into v_emel from auth.users where id = auth.uid();
  if v_emel is null then return 0; end if;
  for r in select g.id, g.school_id from public.guru g where lower(g.emel) = v_emel loop
    insert into public.ahli(user_id, school_id, peranan, guru_id)
    values (auth.uid(), r.school_id, 'guru', r.id)
    on conflict (user_id, school_id) do update set guru_id = coalesce(public.ahli.guru_id, excluded.guru_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ───────────────────────── Data indeks tanpa nama (untuk Tugas Saya) ─────────────────────────
-- Guru biasa tak boleh baca guru lain, tetapi perlukan taburan untuk kira indeks sendiri.
-- Pulangkan baris tanpa nama: masa, peperiksaan, kecuali, faktor gred, skor tugas, adakah saya.
create or replace function public.data_indeks(p_school uuid, p_tahun int)
returns table(saya boolean, masa numeric, kelas_peperiksaan boolean, dikira boolean, faktor_gred numeric, skor numeric)
language sql stable security definer set search_path = public as $$
  select g.id = public.guru_saya(p_school),
         g.masa_seminggu, g.kelas_peperiksaan,
         (g.status = 'aktif' and not g.dikecualikan),
         coalesce(gr.faktor, 1),
         coalesce((
           select sum(t.faktor * p.berat * tp.faktor)
           from public.lantikan l
           join public.slot s on s.id = l.slot_id
           join public.jawatankuasa j on j.id = s.jawatankuasa_id
           join public.tahap t on t.id = j.tahap_id
           join public.tempoh tp on tp.id = j.tempoh_id
           join public.peranan_jk p on p.id = s.peranan_id
           where l.guru_id = g.id and l.tahun = p_tahun
         ), 0)
  from public.guru g
  left join public.gred gr on gr.id = g.gred_id
  where g.school_id = p_school and public.ahli_sekolah(p_school)
$$;

-- Jumlah skor semua slot (untuk sasaran purata jangkaan)
create or replace function public.jumlah_skor_slot(p_school uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(t.faktor * p.berat * tp.faktor), 0)
  from public.slot s
  join public.jawatankuasa j on j.id = s.jawatankuasa_id
  join public.tahap t on t.id = j.tahap_id
  join public.tempoh tp on tp.id = j.tempoh_id
  join public.peranan_jk p on p.id = s.peranan_id
  where s.school_id = p_school and public.ahli_sekolah(p_school)
$$;

-- ───────────────────────── Salin lantikan tahun lepas ─────────────────────────
create or replace function public.salin_tahun_lepas(p_school uuid, p_tahun int)
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  insert into public.lantikan(school_id, tahun, slot_id, guru_id, dilantik_oleh)
  select l.school_id, p_tahun, l.slot_id, l.guru_id, auth.uid()
  from public.lantikan l join public.guru g on g.id = l.guru_id
  where l.school_id = p_school and l.tahun = p_tahun - 1 and g.status = 'aktif'
  on conflict (tahun, slot_id) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ───────────────────────── Urus ahli (admin) ─────────────────────────
-- Admin melantik PK/admin lain berdasarkan e-mel (pengguna mesti pernah log masuk)
create or replace function public.tetapkan_peranan(p_school uuid, p_emel text, p_peranan text, p_bidang uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  if p_peranan not in ('admin','pk','guru') then raise exception 'Peranan tidak sah'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_emel));
  if v_uid is null then return 'belum_log_masuk'; end if;
  insert into public.ahli(user_id, school_id, peranan, bidang_id, guru_id)
  values (v_uid, p_school, p_peranan, p_bidang,
          (select id from public.guru where school_id = p_school and lower(emel) = lower(trim(p_emel)) limit 1))
  on conflict (user_id, school_id) do update set peranan = excluded.peranan, bidang_id = excluded.bidang_id;
  return 'ok';
end $$;

create or replace function public.senarai_ahli(p_school uuid)
returns table(user_id uuid, emel text, peranan text, bidang_id uuid, guru_id uuid)
language sql stable security definer set search_path = public as $$
  select a.user_id, u.email::text, a.peranan, a.bidang_id, a.guru_id
  from public.ahli a join auth.users u on u.id = a.user_id
  where a.school_id = p_school and public.admin_sekolah(p_school)
  order by a.peranan, u.email
$$;

grant execute on function public.daftar_sekolah, public.tuntut_akaun, public.data_indeks,
  public.jumlah_skor_slot, public.salin_tahun_lepas, public.tetapkan_peranan, public.senarai_ahli to authenticated;
revoke execute on function public.daftar_sekolah, public.tuntut_akaun, public.data_indeks,
  public.jumlah_skor_slot, public.salin_tahun_lepas, public.tetapkan_peranan, public.senarai_ahli from anon;
