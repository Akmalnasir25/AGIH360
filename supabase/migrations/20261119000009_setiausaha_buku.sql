-- AGIH360 009: Peranan "su" (Setiausaha dokumen) + Bab Pengenalan Buku Pengurusan.
-- su = boleh BACA data agihan & URUS dokumen (Buku Pengurusan, Surat Lantikan), tidak boleh melantik/mengubah agihan.

-- ───────────── Peranan su ─────────────
alter table public.ahli drop constraint if exists ahli_peranan_check;
alter table public.ahli add constraint ahli_peranan_check check (peranan in ('admin','gb','pk','su','guru'));
alter table public.jemputan drop constraint if exists jemputan_peranan_check;
alter table public.jemputan add constraint jemputan_peranan_check check (peranan in ('admin','gb','pk','su','guru'));

-- Pembaca data agihan penuh (pengurus + su)
create or replace function public.pembaca_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = (select auth.uid()) and school_id = p_school and peranan in ('admin','gb','pk','su'))
     and public.sekolah_aktif(p_school)
$$;
-- Pengurus dokumen (Buku Pengurusan & surat)
create or replace function public.urus_dokumen(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.pembaca_sekolah(p_school)
$$;

drop policy if exists guru_baca on public.guru;
create policy guru_baca on public.guru for select using (
  public.pembaca_sekolah(school_id) or id = public.guru_saya(school_id)
);
drop policy if exists lantikan_baca on public.lantikan;
create policy lantikan_baca on public.lantikan for select using (
  public.pembaca_sekolah(school_id) or guru_id = public.guru_saya(school_id)
);
drop policy if exists tugas_luar_baca on public.tugas_luar;
create policy tugas_luar_baca on public.tugas_luar for select using (
  public.pembaca_sekolah(school_id) or guru_id = public.guru_saya(school_id)
);

-- tetapkan_peranan: terima 'su'
create or replace function public.tetapkan_peranan(p_school uuid, p_emel text, p_peranan text, p_bidang uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_emel text := lower(trim(p_emel));
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  if p_peranan not in ('admin','gb','pk','su','guru') then raise exception 'Peranan tidak sah'; end if;
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

-- ───────────── Bab Pengenalan (seksyen Buku Pengurusan) ─────────────
create table if not exists public.buku_seksyen (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  tajuk text not null check (length(tajuk) between 1 and 200),
  isi text check (isi is null or length(isi) <= 60000),
  imej text check (imej is null or length(imej) <= 1500000),
  susunan int not null default 0,
  dikemaskini timestamptz not null default now()
);
create index if not exists buku_seksyen_school on public.buku_seksyen(school_id, susunan);
alter table public.buku_seksyen enable row level security;
create policy buku_baca on public.buku_seksyen for select using (public.ahli_sekolah(school_id));
create policy buku_tambah on public.buku_seksyen for insert with check (public.urus_dokumen(school_id));
create policy buku_ubah on public.buku_seksyen for update using (public.urus_dokumen(school_id)) with check (public.urus_dokumen(school_id));
create policy buku_buang on public.buku_seksyen for delete using (public.urus_dokumen(school_id));

-- ───────────── Reka bentuk Buku Pengurusan (palet, gaya kulit/pemisah/isi, moto) ─────────────
alter table public.sekolah add column if not exists reka_buku jsonb not null default '{}'::jsonb
  check (pg_column_size(reka_buku) <= 4000);
-- Admin/GB/PK/SU boleh ubah (sekolah_ubah hanya admin), jadi melalui fungsi
create or replace function public.tetap_reka_buku(p_school uuid, p_reka jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.urus_dokumen(p_school) then raise exception 'Tiada kebenaran'; end if;
  if jsonb_typeof(p_reka) <> 'object' then raise exception 'Reka bentuk tidak sah'; end if;
  update public.sekolah set reka_buku = p_reka where id = p_school;
end $$;
revoke execute on function public.tetap_reka_buku(uuid, jsonb) from public, anon;
grant execute on function public.tetap_reka_buku(uuid, jsonb) to authenticated;
