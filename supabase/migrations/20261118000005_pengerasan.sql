-- NeracaTugas 005: pengerasan keselamatan (hasil Supabase advisors)
-- 1) Tiada fungsi boleh dipanggil oleh anon (pengguna tidak log masuk)
-- 2) search_path tetap untuk semua fungsi
-- 3) auth.uid() dalam polisi dibungkus (select …) supaya dinilai sekali

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

-- Fungsi pencetus & dalaman: tiada siapa perlu memanggil terus
revoke execute on function public.jaga_lantikan() from authenticated;
revoke execute on function public.snapshot_lantikan() from authenticated;
revoke execute on function public.semak_sekolah_sama() from authenticated;
revoke execute on function public._templat(text) from authenticated;

-- Pembantu RLS & RPC: perlu untuk pengguna log masuk
grant execute on function
  public.peranan_saya(uuid), public.ahli_sekolah(uuid), public.pengurus_sekolah(uuid), public.admin_sekolah(uuid),
  public.guru_saya(uuid), public.boleh_lantik_slot(uuid), public.urus_bidang(uuid, uuid), public.status_agihan(uuid, int),
  public.daftar_sekolah(text, text, text, text, text, text, text, int), public.tuntut_akaun(), public.data_indeks(uuid, int),
  public.jumlah_skor_slot(uuid), public.salin_tahun_lepas(uuid, int), public.tetapkan_peranan(uuid, text, text, uuid),
  public.senarai_ahli(uuid), public.arkib(text, uuid), public.tukar_status(uuid, int, text, text)
to authenticated;

alter function public.semak_sekolah_sama() set search_path = public;
alter function public._templat(text) set search_path = public;

-- Polisi ahli: (select auth.uid()) dinilai sekali setiap pertanyaan
drop policy ahli_baca on public.ahli;
drop policy ahli_buang on public.ahli;
create policy ahli_baca on public.ahli for select using (user_id = (select auth.uid()) or public.admin_sekolah(school_id));
create policy ahli_buang on public.ahli for delete using (public.admin_sekolah(school_id) and user_id <> (select auth.uid()));

-- PK (dan GB/admin) boleh urus tugas luar & relief — permintaan pengguna 2026-11-18
drop policy tugas_luar_tambah on public.tugas_luar;
drop policy tugas_luar_ubah on public.tugas_luar;
drop policy tugas_luar_buang on public.tugas_luar;
create policy tugas_luar_tambah on public.tugas_luar for insert with check (
  public.pengurus_sekolah(school_id) and exists(select 1 from public.guru g where g.id = guru_id and g.school_id = tugas_luar.school_id));
create policy tugas_luar_ubah on public.tugas_luar for update using (public.pengurus_sekolah(school_id)) with check (public.pengurus_sekolah(school_id));
create policy tugas_luar_buang on public.tugas_luar for delete using (public.pengurus_sekolah(school_id));
