-- NeracaTugas 003: peranan GB, PK urus JK bidangnya, arkib (soft delete), snapshot sejarah,
-- tugas luar/relief, kelulusan + kunci, log audit, maklum balas guru.

-- ───────────── Peranan GB ─────────────
alter table public.ahli drop constraint ahli_peranan_check;
alter table public.ahli add constraint ahli_peranan_check check (peranan in ('admin','gb','pk','guru'));

create or replace function public.admin_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = auth.uid() and school_id = p_school and peranan in ('admin','gb'))
$$;

create or replace function public.pengurus_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = auth.uid() and school_id = p_school and peranan in ('admin','gb','pk'))
$$;

-- Boleh urus (tambah/ubah/arkib JK & slot, lantik) dalam bidang ini?
create or replace function public.urus_bidang(p_school uuid, p_bidang uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.ahli a where a.user_id = auth.uid() and a.school_id = p_school
      and (a.peranan in ('admin','gb') or (a.peranan = 'pk' and (a.bidang_id is null or a.bidang_id = p_bidang)))
  )
$$;

create or replace function public.boleh_lantik_slot(p_slot uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.slot s join public.jawatankuasa j on j.id = s.jawatankuasa_id
    where s.id = p_slot and public.urus_bidang(s.school_id, j.bidang_id)
  )
$$;

-- ───────────── Arkib & bidang tugas & snapshot ─────────────
alter table public.jawatankuasa add column diarkib boolean not null default false;
alter table public.jawatankuasa add column bidang_tugas text;
alter table public.slot add column diarkib boolean not null default false;
alter table public.lantikan add column jk_nama text;
alter table public.lantikan add column peranan_nama text;
alter table public.lantikan add column bidang_nama text;

-- Snapshot nama JK/peranan pada masa lantikan supaya sejarah kekal walaupun JK dinamakan semula/diarkib
create or replace function public.snapshot_lantikan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select j.nama, p.nama, b.nama into new.jk_nama, new.peranan_nama, new.bidang_nama
  from public.slot s
  join public.jawatankuasa j on j.id = s.jawatankuasa_id
  join public.peranan_jk p on p.id = s.peranan_id
  join public.bidang b on b.id = j.bidang_id
  where s.id = new.slot_id;
  return new;
end $$;
create trigger lantikan_snapshot before insert or update of slot_id on public.lantikan
  for each row execute function public.snapshot_lantikan();

-- Slot & lantikan tidak lagi dibuang secara lata apabila slot dipadam; padam keras hanya untuk slot tanpa sejarah
alter table public.lantikan drop constraint lantikan_slot_id_fkey;
alter table public.lantikan add constraint lantikan_slot_id_fkey foreign key (slot_id) references public.slot(id) on delete restrict;

-- Polisi JK & slot: admin/GB semua; PK dalam bidangnya
drop policy jawatankuasa_tambah on public.jawatankuasa;
drop policy jawatankuasa_ubah on public.jawatankuasa;
drop policy jawatankuasa_buang on public.jawatankuasa;
create policy jawatankuasa_tambah on public.jawatankuasa for insert with check (public.urus_bidang(school_id, bidang_id));
create policy jawatankuasa_ubah on public.jawatankuasa for update using (public.urus_bidang(school_id, bidang_id)) with check (public.urus_bidang(school_id, bidang_id));
create policy jawatankuasa_buang on public.jawatankuasa for delete using (public.admin_sekolah(school_id));

drop policy slot_tambah on public.slot;
drop policy slot_ubah on public.slot;
drop policy slot_buang on public.slot;
create policy slot_tambah on public.slot for insert with check (
  public.urus_bidang(school_id, (select j.bidang_id from public.jawatankuasa j where j.id = jawatankuasa_id)));
create policy slot_ubah on public.slot for update using (
  public.urus_bidang(school_id, (select j.bidang_id from public.jawatankuasa j where j.id = jawatankuasa_id)))
  with check (public.urus_bidang(school_id, (select j.bidang_id from public.jawatankuasa j where j.id = jawatankuasa_id)));
create policy slot_buang on public.slot for delete using (
  public.urus_bidang(school_id, (select j.bidang_id from public.jawatankuasa j where j.id = jawatankuasa_id)));

-- Arkib JK atau slot: tandakan diarkib + buang lantikan TAHUN SEMASA sahaja (sejarah kekal)
create or replace function public.arkib(p_jadual text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_bidang uuid; v_tahun int;
begin
  if p_jadual = 'jawatankuasa' then
    select school_id, bidang_id into v_school, v_bidang from public.jawatankuasa where id = p_id;
  elsif p_jadual = 'slot' then
    select s.school_id, j.bidang_id into v_school, v_bidang from public.slot s join public.jawatankuasa j on j.id = s.jawatankuasa_id where s.id = p_id;
  else raise exception 'Jadual tidak sah'; end if;
  if v_school is null or not public.urus_bidang(v_school, v_bidang) then raise exception 'Tiada kebenaran'; end if;
  select tahun_semasa into v_tahun from public.sekolah where id = v_school;
  if p_jadual = 'jawatankuasa' then
    delete from public.lantikan where tahun = v_tahun and slot_id in (select id from public.slot where jawatankuasa_id = p_id);
    update public.slot set diarkib = true where jawatankuasa_id = p_id;
    update public.jawatankuasa set diarkib = true where id = p_id;
  else
    delete from public.lantikan where tahun = v_tahun and slot_id = p_id;
    update public.slot set diarkib = true where id = p_id;
  end if;
end $$;

-- ───────────── Tugas luar & relief ─────────────
create table public.tugas_luar (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  guru_id uuid not null references public.guru(id) on delete cascade,
  tahun int not null,
  jenis text not null check (jenis in ('relief','jurulatih','pemeriksa','luar','lain')),
  keterangan text not null default '',
  nilai numeric not null default 0 check (nilai >= 0),  -- relief: masa seminggu; lain: mata
  dicipta timestamptz not null default now()
);
create index on public.tugas_luar(school_id, tahun);
alter table public.tugas_luar enable row level security;
create policy tugas_luar_baca on public.tugas_luar for select using (public.pengurus_sekolah(school_id) or guru_id = public.guru_saya(school_id));
create policy tugas_luar_tambah on public.tugas_luar for insert with check (
  public.admin_sekolah(school_id) and exists(select 1 from public.guru g where g.id = guru_id and g.school_id = tugas_luar.school_id));
create policy tugas_luar_ubah on public.tugas_luar for update using (public.admin_sekolah(school_id)) with check (public.admin_sekolah(school_id));
create policy tugas_luar_buang on public.tugas_luar for delete using (public.admin_sekolah(school_id));

-- ───────────── Kelulusan agihan ─────────────
create table public.kelulusan (
  school_id uuid not null references public.sekolah(id) on delete cascade,
  tahun int not null,
  status text not null default 'draf' check (status in ('draf','semakan','lulus','muktamad')),
  catatan text,
  dikemaskini timestamptz not null default now(),
  oleh uuid references auth.users(id) on delete set null,
  primary key (school_id, tahun)
);
alter table public.kelulusan enable row level security;
create policy kelulusan_baca on public.kelulusan for select using (public.ahli_sekolah(school_id));
-- tiada polisi tulis: hanya melalui fungsi tukar_status

create or replace function public.status_agihan(p_school uuid, p_tahun int)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select status from public.kelulusan where school_id = p_school and tahun = p_tahun), 'draf')
$$;

-- ───────────── Log audit ─────────────
create table public.log_audit (
  id bigserial primary key,
  school_id uuid not null references public.sekolah(id) on delete cascade,
  masa timestamptz not null default now(),
  pengguna text,
  tindakan text not null,
  butiran text
);
create index on public.log_audit(school_id, masa desc);
alter table public.log_audit enable row level security;
create policy log_baca on public.log_audit for select using (public.pengurus_sekolah(school_id));
-- tiada polisi tulis: hanya pencetus (security definer)

create or replace function public._log(p_school uuid, p_tindakan text, p_butiran text)
returns void language sql security definer set search_path = public as $$
  insert into public.log_audit(school_id, pengguna, tindakan, butiran)
  values (p_school, coalesce((select email from auth.users where id = auth.uid()), 'sistem'), p_tindakan, p_butiran)
$$;
revoke all on function public._log(uuid, text, text) from public, anon, authenticated;

create or replace function public.tukar_status(p_school uuid, p_tahun int, p_status text, p_catatan text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_peranan text := public.peranan_saya(p_school); v_lama text := public.status_agihan(p_school, p_tahun);
begin
  if v_peranan is null or v_peranan = 'guru' then raise exception 'Tiada kebenaran'; end if;
  if p_status not in ('draf','semakan','lulus','muktamad') then raise exception 'Status tidak sah'; end if;
  -- PK hanya boleh hantar draf untuk semakan
  if v_peranan = 'pk' and not (v_lama = 'draf' and p_status = 'semakan') then
    raise exception 'PK hanya boleh menghantar draf untuk semakan';
  end if;
  insert into public.kelulusan(school_id, tahun, status, catatan, oleh, dikemaskini)
  values (p_school, p_tahun, p_status, p_catatan, auth.uid(), now())
  on conflict (school_id, tahun) do update set status = excluded.status, catatan = excluded.catatan, oleh = excluded.oleh, dikemaskini = now();
  perform public._log(p_school, 'status', format('%s → %s%s', v_lama, p_status, coalesce(': ' || p_catatan, '')));
  return p_status;
end $$;

-- Kunci lantikan bila lulus/muktamad + log setiap perubahan lantikan
create or replace function public.jaga_lantikan()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record := coalesce(new, old); v_guru text; v_status text;
begin
  v_status := public.status_agihan(r.school_id, r.tahun);
  if v_status in ('lulus','muktamad') then
    raise exception 'Agihan % telah %. Buka semula sebagai draf untuk mengubah.', r.tahun, v_status;
  end if;
  select nama into v_guru from public.guru where id = r.guru_id;
  if tg_op = 'DELETE' then
    perform public._log(r.school_id, 'gugur', format('%s — %s, %s', v_guru, old.peranan_nama, old.jk_nama));
  elsif tg_op = 'INSERT' then
    perform public._log(r.school_id, 'lantik', format('%s — %s, %s', v_guru, new.peranan_nama, new.jk_nama));
  elsif new.guru_id is distinct from old.guru_id then
    perform public._log(r.school_id, 'tukar', format('%s → %s — %s, %s',
      (select nama from public.guru where id = old.guru_id), v_guru, new.peranan_nama, new.jk_nama));
  end if;
  return coalesce(new, old);
end $$;
-- selepas snapshot (nama pencetus "lantikan_snapshot" < "lantikan_zjaga" ikut abjad)
create trigger lantikan_zjaga before insert or update or delete on public.lantikan
  for each row execute function public.jaga_lantikan();

-- ───────────── Maklum balas guru ─────────────
create table public.maklum_balas (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  guru_id uuid not null references public.guru(id) on delete cascade,
  tahun int not null,
  mesej text not null check (length(mesej) between 3 and 2000),
  status text not null default 'baru' check (status in ('baru','selesai')),
  balasan text,
  dicipta timestamptz not null default now()
);
alter table public.maklum_balas enable row level security;
create policy mb_baca on public.maklum_balas for select using (public.pengurus_sekolah(school_id) or guru_id = public.guru_saya(school_id));
create policy mb_tambah on public.maklum_balas for insert with check (guru_id = public.guru_saya(school_id) and status = 'baru' and balasan is null);
create policy mb_ubah on public.maklum_balas for update using (public.pengurus_sekolah(school_id)) with check (public.pengurus_sekolah(school_id));

-- ───────────── Data indeks (guru) termasuk tugas luar ─────────────
drop function public.data_indeks(uuid, int);
create function public.data_indeks(p_school uuid, p_tahun int)
returns table(saya boolean, masa numeric, kelas_peperiksaan boolean, dikira boolean, faktor_gred numeric, skor numeric, relief numeric, luar numeric)
language sql stable security definer set search_path = public as $$
  select g.id = public.guru_saya(p_school),
         g.masa_seminggu, g.kelas_peperiksaan,
         (g.status = 'aktif' and not g.dikecualikan),
         coalesce(gr.faktor, 1),
         coalesce((
           select sum(t.faktor * p.berat * tp.faktor)
           from public.lantikan l
           join public.slot s on s.id = l.slot_id and not s.diarkib
           join public.jawatankuasa j on j.id = s.jawatankuasa_id
           join public.tahap t on t.id = j.tahap_id
           join public.tempoh tp on tp.id = j.tempoh_id
           join public.peranan_jk p on p.id = s.peranan_id
           where l.guru_id = g.id and l.tahun = p_tahun
         ), 0),
         coalesce((select sum(nilai) from public.tugas_luar x where x.guru_id = g.id and x.tahun = p_tahun and x.jenis = 'relief'), 0),
         coalesce((select sum(nilai) from public.tugas_luar x where x.guru_id = g.id and x.tahun = p_tahun and x.jenis <> 'relief'), 0)
  from public.guru g
  left join public.gred gr on gr.id = g.gred_id
  where g.school_id = p_school and g.status <> 'bertukar' and public.ahli_sekolah(p_school)
$$;

create or replace function public.jumlah_skor_slot(p_school uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(t.faktor * p.berat * tp.faktor), 0)
  from public.slot s
  join public.jawatankuasa j on j.id = s.jawatankuasa_id and not j.diarkib
  join public.tahap t on t.id = j.tahap_id
  join public.tempoh tp on tp.id = j.tempoh_id
  join public.peranan_jk p on p.id = s.peranan_id
  where s.school_id = p_school and not s.diarkib and public.ahli_sekolah(p_school)
$$;

create or replace function public.salin_tahun_lepas(p_school uuid, p_tahun int)
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  insert into public.lantikan(school_id, tahun, slot_id, guru_id, dilantik_oleh)
  select l.school_id, p_tahun, l.slot_id, l.guru_id, auth.uid()
  from public.lantikan l
  join public.guru g on g.id = l.guru_id
  join public.slot s on s.id = l.slot_id and not s.diarkib
  where l.school_id = p_school and l.tahun = p_tahun - 1 and g.status = 'aktif'
  on conflict (tahun, slot_id) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

grant execute on function public.arkib, public.tukar_status, public.status_agihan, public.urus_bidang, public.data_indeks to authenticated;
revoke execute on function public.arkib, public.tukar_status, public.data_indeks from anon;

-- tetapkan_peranan: terima 'gb'
create or replace function public.tetapkan_peranan(p_school uuid, p_emel text, p_peranan text, p_bidang uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  if p_peranan not in ('admin','gb','pk','guru') then raise exception 'Peranan tidak sah'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_emel));
  if v_uid is null then return 'belum_log_masuk'; end if;
  insert into public.ahli(user_id, school_id, peranan, bidang_id, guru_id)
  values (v_uid, p_school, p_peranan, p_bidang,
          (select id from public.guru where school_id = p_school and lower(emel) = lower(trim(p_emel)) limit 1))
  on conflict (user_id, school_id) do update set peranan = excluded.peranan, bidang_id = excluded.bidang_id;
  perform public._log(p_school, 'peranan', format('%s → %s', p_emel, p_peranan));
  return 'ok';
end $$;
