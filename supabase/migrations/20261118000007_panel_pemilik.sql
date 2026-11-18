-- AGIH360 007: Panel Pemilik — kelulusan sekolah, pemilik platform, jemputan admin.
-- Sekolah baharu berstatus 'menunggu' sehingga diluluskan pemilik. Hanya sekolah 'aktif' boleh digunakan.

-- ───────────── Pemilik platform (e-mel) — tiada polisi: hanya melalui fungsi ─────────────
create table public.pemilik (emel text primary key check (emel = lower(emel)));
alter table public.pemilik enable row level security;
revoke all on public.pemilik from anon, authenticated;

create or replace function public.saya_pemilik()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.pemilik p join auth.users u on lower(u.email) = p.emel
    where u.id = (select auth.uid())
  )
$$;

-- ───────────── Status sekolah ─────────────
alter table public.sekolah add column status text not null default 'menunggu'
  check (status in ('menunggu','aktif','digantung'));
alter table public.sekolah add column catatan_status text;
alter table public.sekolah add column status_dikemaskini timestamptz;
alter table public.sekolah add column pemohon_emel text;
alter table public.sekolah add column telefon text;
update public.sekolah set status = 'aktif';  -- sekolah sedia ada kekal aktif

create or replace function public.sekolah_aktif(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.sekolah where id = p_school and status = 'aktif')
$$;

-- Keahlian tanpa mengira status (untuk membaca baris sekolah sendiri ketika menunggu)
create or replace function public.ahli_mentah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = (select auth.uid()) and school_id = p_school)
$$;

-- Semua pembantu RLS kini memerlukan sekolah aktif
create or replace function public.peranan_saya(p_school uuid)
returns text language sql stable security definer set search_path = public as $$
  select a.peranan from public.ahli a where a.user_id = (select auth.uid()) and a.school_id = p_school and public.sekolah_aktif(p_school)
$$;
create or replace function public.ahli_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.ahli_mentah(p_school) and public.sekolah_aktif(p_school)
$$;
create or replace function public.pengurus_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = (select auth.uid()) and school_id = p_school and peranan in ('admin','gb','pk'))
     and public.sekolah_aktif(p_school)
$$;
create or replace function public.admin_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = (select auth.uid()) and school_id = p_school and peranan in ('admin','gb'))
     and public.sekolah_aktif(p_school)
$$;
create or replace function public.guru_saya(p_school uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select guru_id from public.ahli where user_id = (select auth.uid()) and school_id = p_school and public.sekolah_aktif(p_school)
$$;
create or replace function public.urus_bidang(p_school uuid, p_bidang uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.sekolah_aktif(p_school) and exists(
    select 1 from public.ahli a where a.user_id = (select auth.uid()) and a.school_id = p_school
      and (a.peranan in ('admin','gb') or (a.peranan = 'pk' and (a.bidang_id is null or a.bidang_id = p_bidang)))
  )
$$;

drop policy sekolah_baca on public.sekolah;
create policy sekolah_baca on public.sekolah for select using (public.ahli_mentah(id) or public.saya_pemilik());

-- ───────────── Jemputan (e-mel yang belum pernah log masuk) ─────────────
create table public.jemputan (
  school_id uuid not null references public.sekolah(id) on delete cascade,
  emel text not null check (emel = lower(emel)),
  peranan text not null default 'admin' check (peranan in ('admin','gb','pk','guru')),
  dicipta timestamptz not null default now(),
  primary key (school_id, emel)
);
alter table public.jemputan enable row level security;
revoke all on public.jemputan from anon, authenticated;

-- Lantik admin melalui e-mel: terus jika pengguna wujud, jika tidak simpan jemputan
create or replace function public._lantik_emel(p_school uuid, p_emel text, p_peranan text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_emel text := lower(trim(p_emel));
begin
  if v_emel !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mel tidak sah'; end if;
  select id into v_uid from auth.users where lower(email) = v_emel;
  if v_uid is null then
    insert into public.jemputan(school_id, emel, peranan) values (p_school, v_emel, p_peranan)
    on conflict (school_id, emel) do update set peranan = excluded.peranan;
    return 'dijemput';
  end if;
  insert into public.ahli(user_id, school_id, peranan) values (v_uid, p_school, p_peranan)
  on conflict (user_id, school_id) do update set peranan = excluded.peranan;
  return 'dilantik';
end $$;
revoke execute on function public._lantik_emel(uuid, text, text) from public, anon, authenticated;

-- tuntut_akaun: pautan guru ikut e-mel + tebus jemputan
create or replace function public.tuntut_akaun()
returns int language plpgsql security definer set search_path = public as $$
declare v_emel text; v_n int := 0; r record;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into v_emel from auth.users where id = auth.uid();
  if v_emel is null then return 0; end if;
  for r in select j.school_id, j.peranan from public.jemputan j where j.emel = v_emel loop
    insert into public.ahli(user_id, school_id, peranan) values (auth.uid(), r.school_id, r.peranan)
    on conflict (user_id, school_id) do update set peranan = excluded.peranan;
    delete from public.jemputan where school_id = r.school_id and emel = v_emel;
    v_n := v_n + 1;
  end loop;
  for r in select g.id, g.school_id from public.guru g where lower(g.emel) = v_emel loop
    insert into public.ahli(user_id, school_id, peranan, guru_id)
    values (auth.uid(), r.school_id, 'guru', r.id)
    on conflict (user_id, school_id) do update set guru_id = coalesce(public.ahli.guru_id, excluded.guru_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ───────────── Daftar sekolah: status menunggu (kecuali pemilik) + had permohonan ─────────────
drop function if exists public.daftar_sekolah(text, text, text, text, text, text, text, int, text[]);
create function public.daftar_sekolah(
  p_kod text, p_nama text, p_jenis text,
  p_daerah text default null, p_negeri text default null, p_alamat text default null,
  p_nama_ketua text default null, p_tahun int default null, p_pilihan text[] default '{}', p_telefon text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_kod text := upper(trim(p_kod)); v_emel text;
  v_tahun int := coalesce(p_tahun, extract(year from now())::int + case when extract(month from now()) >= 10 then 1 else 0 end);
  v_pemilik boolean := public.saya_pemilik();
begin
  if auth.uid() is null then raise exception 'Sila log masuk dahulu'; end if;
  if p_jenis not in ('SK','SMK') then raise exception 'Jenis sekolah tidak sah'; end if;
  if v_tahun not between 2020 and 2100 then raise exception 'Sesi tidak sah'; end if;
  select lower(email) into v_emel from auth.users where id = auth.uid();
  if not v_pemilik and (select count(*) from public.sekolah where pemohon_emel = v_emel and status = 'menunggu') >= 3 then
    raise exception 'Anda sudah mempunyai 3 permohonan yang menunggu kelulusan.';
  end if;
  if exists(select 1 from public.sekolah where kod = v_kod) then
    raise exception 'Kod sekolah % sudah didaftarkan. Minta pentadbir sekolah tambah anda sebagai ahli.', v_kod;
  end if;
  insert into public.sekolah(kod, nama, jenis, daerah, negeri, alamat, nama_ketua, jawatan_ketua, tahun_semasa, status, pemohon_emel, telefon, status_dikemaskini)
  values (v_kod, trim(p_nama), p_jenis, p_daerah, p_negeri, p_alamat, p_nama_ketua,
          case when p_jenis = 'SK' then 'Guru Besar' else 'Pengetua' end, v_tahun,
          case when v_pemilik then 'aktif' else 'menunggu' end, v_emel, p_telefon, now())
  returning id into v_id;
  insert into public.ahli(user_id, school_id, peranan) values (auth.uid(), v_id, 'admin');
  perform public._isi_templat(v_id, p_jenis, coalesce(p_pilihan, '{}'));
  return v_id;
end $$;

-- ───────────── RPC Panel Pemilik ─────────────
create or replace function public.pemilik_senarai()
returns table(id uuid, kod text, nama text, jenis text, daerah text, negeri text, status text, catatan_status text,
              dicipta timestamptz, pemohon_emel text, telefon text, admin_emel text, jemputan_emel text, bil_guru bigint, bil_lantikan bigint)
language sql stable security definer set search_path = public as $$
  select s.id, s.kod, s.nama, s.jenis, s.daerah, s.negeri, s.status, s.catatan_status, s.dicipta, s.pemohon_emel, s.telefon,
    (select string_agg(u.email::text, ', ') from public.ahli a join auth.users u on u.id = a.user_id where a.school_id = s.id and a.peranan in ('admin','gb')),
    (select string_agg(j.emel, ', ') from public.jemputan j where j.school_id = s.id),
    (select count(*) from public.guru g where g.school_id = s.id),
    (select count(*) from public.lantikan l where l.school_id = s.id and l.tahun = s.tahun_semasa)
  from public.sekolah s
  where public.saya_pemilik()
  order by case s.status when 'menunggu' then 0 when 'aktif' then 1 else 2 end, s.dicipta desc
$$;

create or replace function public.pemilik_tukar_status(p_school uuid, p_status text, p_catatan text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.saya_pemilik() then raise exception 'Hanya pemilik platform'; end if;
  if p_status not in ('menunggu','aktif','digantung') then raise exception 'Status tidak sah'; end if;
  update public.sekolah set status = p_status, catatan_status = p_catatan, status_dikemaskini = now() where id = p_school;
  perform public._log(p_school, 'status', format('Sekolah %s oleh pemilik%s', p_status, coalesce(': ' || p_catatan, '')));
end $$;

create or replace function public.pemilik_cipta_sekolah(
  p_kod text, p_nama text, p_jenis text, p_emel_admin text,
  p_daerah text default null, p_negeri text default null, p_nama_ketua text default null,
  p_tahun int default null, p_pilihan text[] default '{}', p_telefon text default null
) returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_kod text := upper(trim(p_kod));
  v_tahun int := coalesce(p_tahun, extract(year from now())::int + case when extract(month from now()) >= 10 then 1 else 0 end);
begin
  if not public.saya_pemilik() then raise exception 'Hanya pemilik platform'; end if;
  if p_jenis not in ('SK','SMK') then raise exception 'Jenis sekolah tidak sah'; end if;
  if exists(select 1 from public.sekolah where kod = v_kod) then raise exception 'Kod sekolah % sudah wujud', v_kod; end if;
  insert into public.sekolah(kod, nama, jenis, daerah, negeri, nama_ketua, jawatan_ketua, tahun_semasa, status, pemohon_emel, telefon, status_dikemaskini)
  values (v_kod, trim(p_nama), p_jenis, p_daerah, p_negeri, p_nama_ketua,
          case when p_jenis = 'SK' then 'Guru Besar' else 'Pengetua' end, v_tahun, 'aktif', lower(trim(p_emel_admin)), p_telefon, now())
  returning id into v_id;
  perform public._isi_templat(v_id, p_jenis, coalesce(p_pilihan, '{}'));
  return public._lantik_emel(v_id, p_emel_admin, 'admin');
end $$;

create or replace function public.pemilik_tambah_admin(p_school uuid, p_emel text, p_peranan text default 'admin')
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.saya_pemilik() then raise exception 'Hanya pemilik platform'; end if;
  if p_peranan not in ('admin','gb') then raise exception 'Peranan tidak sah'; end if;
  return public._lantik_emel(p_school, p_emel, p_peranan);
end $$;

-- Keselamatan fungsi
revoke execute on function public.saya_pemilik(), public.sekolah_aktif(uuid), public.ahli_mentah(uuid),
  public.daftar_sekolah(text, text, text, text, text, text, text, int, text[], text),
  public.pemilik_senarai(), public.pemilik_tukar_status(uuid, text, text),
  public.pemilik_cipta_sekolah(text, text, text, text, text, text, text, int, text[], text),
  public.pemilik_tambah_admin(uuid, text, text) from public, anon;
grant execute on function public.saya_pemilik(), public.sekolah_aktif(uuid), public.ahli_mentah(uuid),
  public.daftar_sekolah(text, text, text, text, text, text, text, int, text[], text),
  public.pemilik_senarai(), public.pemilik_tukar_status(uuid, text, text),
  public.pemilik_cipta_sekolah(text, text, text, text, text, text, text, int, text[], text),
  public.pemilik_tambah_admin(uuid, text, text) to authenticated;

-- ───────────── Admin sekolah boleh pratetapkan peranan (jemputan) sebelum pengguna log masuk ─────────────
alter table public.jemputan add column bidang_id uuid references public.bidang(id) on delete set null;

create or replace function public.tetapkan_peranan(p_school uuid, p_emel text, p_peranan text, p_bidang uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_emel text := lower(trim(p_emel));
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  if p_peranan not in ('admin','gb','pk','guru') then raise exception 'Peranan tidak sah'; end if;
  if v_emel !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mel tidak sah'; end if;
  select id into v_uid from auth.users where lower(email) = v_emel;
  if v_uid is null then
    insert into public.jemputan(school_id, emel, peranan, bidang_id) values (p_school, v_emel, p_peranan, p_bidang)
    on conflict (school_id, emel) do update set peranan = excluded.peranan, bidang_id = excluded.bidang_id;
    perform public._log(p_school, 'peranan', format('%s dijemput sebagai %s', v_emel, p_peranan));
    return 'dijemput';
  end if;
  insert into public.ahli(user_id, school_id, peranan, bidang_id, guru_id)
  values (v_uid, p_school, p_peranan, p_bidang,
          (select id from public.guru where school_id = p_school and lower(emel) = v_emel limit 1))
  on conflict (user_id, school_id) do update set peranan = excluded.peranan, bidang_id = excluded.bidang_id;
  perform public._log(p_school, 'peranan', format('%s → %s', v_emel, p_peranan));
  return 'ok';
end $$;

-- Tebus jemputan: peranan + bidang + pautan rekod guru (jika e-mel sama)
create or replace function public.tuntut_akaun()
returns int language plpgsql security definer set search_path = public as $$
declare v_emel text; v_n int := 0; r record;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into v_emel from auth.users where id = auth.uid();
  if v_emel is null then return 0; end if;
  for r in select j.school_id, j.peranan, j.bidang_id from public.jemputan j where j.emel = v_emel loop
    insert into public.ahli(user_id, school_id, peranan, bidang_id, guru_id)
    values (auth.uid(), r.school_id, r.peranan, r.bidang_id,
            (select id from public.guru g where g.school_id = r.school_id and lower(g.emel) = v_emel limit 1))
    on conflict (user_id, school_id) do update set peranan = excluded.peranan, bidang_id = excluded.bidang_id;
    delete from public.jemputan where school_id = r.school_id and emel = v_emel;
    v_n := v_n + 1;
  end loop;
  for r in select g.id, g.school_id from public.guru g where lower(g.emel) = v_emel loop
    insert into public.ahli(user_id, school_id, peranan, guru_id)
    values (auth.uid(), r.school_id, 'guru', r.id)
    on conflict (user_id, school_id) do update set guru_id = coalesce(public.ahli.guru_id, excluded.guru_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Senarai ahli + jemputan (untuk Tetapan → Pengguna & Peranan)
drop function if exists public.senarai_ahli(uuid);
create function public.senarai_ahli(p_school uuid)
returns table(user_id uuid, emel text, peranan text, bidang_id uuid, guru_id uuid, dijemput boolean)
language sql stable security definer set search_path = public as $$
  select a.user_id, u.email::text, a.peranan, a.bidang_id, a.guru_id, false
  from public.ahli a join auth.users u on u.id = a.user_id
  where a.school_id = p_school and public.admin_sekolah(p_school)
  union all
  select null, j.emel, j.peranan, j.bidang_id, null, true
  from public.jemputan j where j.school_id = p_school and public.admin_sekolah(p_school)
  order by 3, 2
$$;
revoke execute on function public.senarai_ahli(uuid) from public, anon;
grant execute on function public.senarai_ahli(uuid) to authenticated;
