-- AGIH360 010: Pulih JK diarkib, keluarkan pengguna/jemputan, lindungi bidang yang masih berisi JK.

-- ───────────── Bidang: tidak boleh dibuang jika masih ada JK (termasuk diarkib) ─────────────
-- (FK jawatankuasa.bidang_id ON DELETE CASCADE akan memadam JK & sejarah lantikan secara senyap)
create or replace function public.halang_buang_bidang()
returns trigger language plpgsql as $$
begin
  if exists(select 1 from public.jawatankuasa where bidang_id = old.id) then
    raise exception 'Bidang "%" masih mempunyai jawatankuasa. Pindahkan atau buang JK dahulu.', old.nama;
  end if;
  return old;
end $$;
drop trigger if exists bidang_halang_buang on public.bidang;
create trigger bidang_halang_buang before delete on public.bidang for each row execute function public.halang_buang_bidang();

-- ───────────── Senarai JK diarkib & pulih ─────────────
create or replace function public.senarai_jk_arkib(p_school uuid)
returns table(id uuid, nama text, bidang_id uuid, bil_slot int)
language sql stable security definer set search_path = public as $$
  select j.id, j.nama, j.bidang_id, (select count(*)::int from public.slot s where s.jawatankuasa_id = j.id)
  from public.jawatankuasa j
  where j.school_id = p_school and j.diarkib and public.pengurus_sekolah(p_school)
  order by j.nama
$$;

create or replace function public.pulih_jk(p_jk uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_bidang uuid; v_nama text;
begin
  select school_id, bidang_id, nama into v_school, v_bidang, v_nama from public.jawatankuasa where id = p_jk;
  if v_school is null or not public.urus_bidang(v_school, v_bidang) then raise exception 'Tiada kebenaran'; end if;
  update public.jawatankuasa set diarkib = false where id = p_jk;
  update public.slot set diarkib = false where jawatankuasa_id = p_jk;
  perform public._log(v_school, 'arkib', format('Jawatankuasa dipulihkan: %s', v_nama));
end $$;

-- ───────────── Keluarkan pengguna / batal jemputan ─────────────
create or replace function public.buang_ahli(p_school uuid, p_emel text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_emel text := lower(trim(p_emel)); v_n int;
begin
  if not public.admin_sekolah(p_school) then raise exception 'Hanya pentadbir'; end if;
  select id into v_uid from auth.users where lower(email) = v_emel;
  if v_uid = (select auth.uid()) then raise exception 'Anda tidak boleh mengeluarkan akaun sendiri'; end if;
  delete from public.jemputan where school_id = p_school and emel = v_emel;
  get diagnostics v_n = row_count;
  if v_uid is not null then
    if (select peranan from public.ahli where user_id = v_uid and school_id = p_school) in ('admin','gb')
       and (select count(*) from public.ahli where school_id = p_school and peranan in ('admin','gb')) <= 1 then
      raise exception 'Tidak boleh mengeluarkan pentadbir terakhir sekolah';
    end if;
    delete from public.ahli where user_id = v_uid and school_id = p_school;
    get diagnostics v_n = row_count;
  end if;
  perform public._log(p_school, 'peranan', format('%s dikeluarkan', v_emel));
  return case when v_n > 0 then 'ok' else 'tiada' end;
end $$;

revoke execute on function public.senarai_jk_arkib(uuid), public.pulih_jk(uuid), public.buang_ahli(uuid, text) from public, anon;
grant execute on function public.senarai_jk_arkib(uuid), public.pulih_jk(uuid), public.buang_ahli(uuid, text) to authenticated;
