-- NeracaTugas: skema asas multi-sekolah
-- Setiap jadual membawa school_id. RLS: pengguna hanya nampak baris sekolah yang dia ahli.

create extension if not exists pgcrypto;

-- ───────────────────────── Sekolah & keahlian ─────────────────────────
create table public.sekolah (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique check (kod ~ '^[A-Z]{3}[0-9]{4}$'),
  nama text not null,
  jenis text not null check (jenis in ('SK','SMK')),
  alamat text,
  daerah text,
  negeri text,
  logo_url text,
  nama_ketua text,          -- Guru Besar / Pengetua (untuk surat)
  jawatan_ketua text,       -- 'Guru Besar' / 'Pengetua'
  tahun_semasa int not null default extract(year from now())::int,
  dicipta timestamptz not null default now()
);

create table public.ahli (
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.sekolah(id) on delete cascade,
  peranan text not null check (peranan in ('admin','pk','guru')),
  bidang_id uuid,           -- untuk PK: bidang yang boleh dilantik
  guru_id uuid,             -- pautan ke rekod guru (jika ada)
  dicipta timestamptz not null default now(),
  primary key (user_id, school_id)
);

-- ───────────────────────── Tetapan pemberat ─────────────────────────
create table public.tetapan (
  school_id uuid primary key references public.sekolah(id) on delete cascade,
  w_mengajar numeric not null default 0.6 check (w_mengajar between 0 and 1),
  ambang_tinggi numeric not null default 1.3,
  ambang_rendah numeric not null default 0.7,
  faktor_peperiksaan numeric not null default 1.2,
  minit_semasa int not null default 30,
  had_jawatan int not null default 8,
  guna_faktor_gred boolean not null default true
);

create table public.tahap (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  nama text not null,
  faktor numeric not null check (faktor >= 0),
  susunan int not null default 0
);

create table public.peranan_jk (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  nama text not null,
  berat numeric not null check (berat >= 0),
  susunan int not null default 0
);

create table public.tempoh (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  nama text not null,
  faktor numeric not null check (faktor >= 0),
  susunan int not null default 0
);

create table public.gred (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  kod text not null,
  peranan text,             -- cth 'Pemikir Strategik'
  faktor numeric not null default 1 check (faktor > 0),
  susunan int not null default 0
);

create table public.bidang (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  nama text not null,
  warna text not null default 'slate',
  susunan int not null default 0
);

alter table public.ahli
  add constraint ahli_bidang_fk foreign key (bidang_id) references public.bidang(id) on delete set null;

-- ───────────────────────── Guru ─────────────────────────
create table public.guru (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  nama text not null,
  emel text,
  telefon text,
  gred_id uuid references public.gred(id) on delete set null,
  masa_seminggu numeric not null default 0 check (masa_seminggu >= 0), -- bilangan masa (waktu) PdP
  kelas_peperiksaan boolean not null default false,
  status text not null default 'aktif' check (status in ('aktif','cuti','bertukar')),
  dikecualikan boolean not null default false,  -- GB/PK/GKMP: tidak dikira dalam median
  tag text,                                      -- cth 'Guru Besar', 'PK HEM', 'GKMP'
  kepakaran text,
  dicipta timestamptz not null default now()
);
create index on public.guru(school_id);
create unique index guru_emel_unik on public.guru(school_id, lower(emel)) where emel is not null and emel <> '';

alter table public.ahli
  add constraint ahli_guru_fk foreign key (guru_id) references public.guru(id) on delete set null;

-- ───────────────────────── Jawatankuasa & slot ─────────────────────────
create table public.jawatankuasa (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  bidang_id uuid not null references public.bidang(id) on delete cascade,
  nama text not null,
  tahap_id uuid not null references public.tahap(id),
  tempoh_id uuid not null references public.tempoh(id),
  wajib boolean not null default false,
  catatan text,
  susunan int not null default 0
);
create index on public.jawatankuasa(school_id);

create table public.slot (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  jawatankuasa_id uuid not null references public.jawatankuasa(id) on delete cascade,
  peranan_id uuid not null references public.peranan_jk(id),
  label text,               -- pilihan: cth 'AJK (Tahun 1)'
  susunan int not null default 0
);
create index on public.slot(jawatankuasa_id);

create table public.lantikan (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.sekolah(id) on delete cascade,
  tahun int not null,
  slot_id uuid not null references public.slot(id) on delete cascade,
  guru_id uuid not null references public.guru(id) on delete cascade,
  dilantik_oleh uuid references auth.users(id) on delete set null,
  dicipta timestamptz not null default now(),
  unique (tahun, slot_id)
);
create index on public.lantikan(school_id, tahun);
create index on public.lantikan(guru_id);

-- ───────────────────────── Fungsi bantuan RLS ─────────────────────────
create or replace function public.peranan_saya(p_school uuid)
returns text language sql stable security definer set search_path = public as $$
  select peranan from public.ahli where user_id = auth.uid() and school_id = p_school
$$;

create or replace function public.ahli_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = auth.uid() and school_id = p_school)
$$;

create or replace function public.pengurus_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = auth.uid() and school_id = p_school and peranan in ('admin','pk'))
$$;

create or replace function public.admin_sekolah(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ahli where user_id = auth.uid() and school_id = p_school and peranan = 'admin')
$$;

create or replace function public.guru_saya(p_school uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select guru_id from public.ahli where user_id = auth.uid() and school_id = p_school
$$;

-- PK hanya boleh melantik dalam bidangnya; admin semua
create or replace function public.boleh_lantik_slot(p_slot uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.slot s
    join public.jawatankuasa j on j.id = s.jawatankuasa_id
    join public.ahli a on a.school_id = s.school_id and a.user_id = auth.uid()
    where s.id = p_slot
      and (a.peranan = 'admin' or (a.peranan = 'pk' and (a.bidang_id is null or a.bidang_id = j.bidang_id)))
  )
$$;

-- ───────────────────────── RLS ─────────────────────────
alter table public.sekolah enable row level security;
alter table public.ahli enable row level security;
alter table public.tetapan enable row level security;
alter table public.tahap enable row level security;
alter table public.peranan_jk enable row level security;
alter table public.tempoh enable row level security;
alter table public.gred enable row level security;
alter table public.bidang enable row level security;
alter table public.guru enable row level security;
alter table public.jawatankuasa enable row level security;
alter table public.slot enable row level security;
alter table public.lantikan enable row level security;

-- sekolah
create policy sekolah_baca on public.sekolah for select using (public.ahli_sekolah(id));
create policy sekolah_ubah on public.sekolah for update using (public.admin_sekolah(id)) with check (public.admin_sekolah(id));

-- ahli: nampak keahlian sendiri; admin nampak & urus semua ahli sekolahnya
create policy ahli_baca on public.ahli for select using (user_id = auth.uid() or public.admin_sekolah(school_id));
create policy ahli_ubah on public.ahli for update using (public.admin_sekolah(school_id)) with check (public.admin_sekolah(school_id));
create policy ahli_buang on public.ahli for delete using (public.admin_sekolah(school_id) and user_id <> auth.uid());

-- jadual konfigurasi: semua ahli boleh baca, admin sahaja ubah
do $$
declare t text;
begin
  foreach t in array array['tetapan','tahap','peranan_jk','tempoh','gred','bidang','jawatankuasa','slot'] loop
    execute format('create policy %1$s_baca on public.%1$s for select using (public.ahli_sekolah(school_id))', t);
    execute format('create policy %1$s_tambah on public.%1$s for insert with check (public.admin_sekolah(school_id))', t);
    execute format('create policy %1$s_ubah on public.%1$s for update using (public.admin_sekolah(school_id)) with check (public.admin_sekolah(school_id))', t);
    execute format('create policy %1$s_buang on public.%1$s for delete using (public.admin_sekolah(school_id))', t);
  end loop;
end $$;

-- guru: admin/PK nampak semua guru sekolah; guru biasa hanya rekod sendiri
create policy guru_baca on public.guru for select using (
  public.pengurus_sekolah(school_id) or id = public.guru_saya(school_id)
);
create policy guru_tambah on public.guru for insert with check (public.admin_sekolah(school_id));
create policy guru_ubah on public.guru for update using (public.admin_sekolah(school_id)) with check (public.admin_sekolah(school_id));
create policy guru_buang on public.guru for delete using (public.admin_sekolah(school_id));

-- lantikan: admin/PK nampak semua; guru hanya lantikan sendiri
create policy lantikan_baca on public.lantikan for select using (
  public.pengurus_sekolah(school_id) or guru_id = public.guru_saya(school_id)
);
create policy lantikan_tambah on public.lantikan for insert with check (
  public.boleh_lantik_slot(slot_id)
  and exists(select 1 from public.guru g where g.id = guru_id and g.school_id = lantikan.school_id)
  and exists(select 1 from public.slot s where s.id = slot_id and s.school_id = lantikan.school_id)
);
create policy lantikan_ubah on public.lantikan for update using (public.boleh_lantik_slot(slot_id))
  with check (
    public.boleh_lantik_slot(slot_id)
    and exists(select 1 from public.guru g where g.id = guru_id and g.school_id = lantikan.school_id)
  );
create policy lantikan_buang on public.lantikan for delete using (public.boleh_lantik_slot(slot_id));

-- Integriti: rujukan silang mesti dalam sekolah yang sama
create or replace function public.semak_sekolah_sama()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'jawatankuasa' then
    if (select school_id from public.bidang where id = new.bidang_id) <> new.school_id
       or (select school_id from public.tahap where id = new.tahap_id) <> new.school_id
       or (select school_id from public.tempoh where id = new.tempoh_id) <> new.school_id then
      raise exception 'Rujukan merentas sekolah tidak dibenarkan';
    end if;
  elsif tg_table_name = 'slot' then
    if (select school_id from public.jawatankuasa where id = new.jawatankuasa_id) <> new.school_id
       or (select school_id from public.peranan_jk where id = new.peranan_id) <> new.school_id then
      raise exception 'Rujukan merentas sekolah tidak dibenarkan';
    end if;
  elsif tg_table_name = 'guru' then
    if new.gred_id is not null and (select school_id from public.gred where id = new.gred_id) <> new.school_id then
      raise exception 'Rujukan merentas sekolah tidak dibenarkan';
    end if;
  end if;
  return new;
end $$;

create trigger jk_sekolah_sama before insert or update on public.jawatankuasa for each row execute function public.semak_sekolah_sama();
create trigger slot_sekolah_sama before insert or update on public.slot for each row execute function public.semak_sekolah_sama();
create trigger guru_sekolah_sama before insert or update on public.guru for each row execute function public.semak_sekolah_sama();
