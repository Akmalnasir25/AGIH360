-- NeracaTugas 004: pilih sesi semasa daftar; elak log "lantik" palsu ketika upsert menukar penyandang.

drop function public.daftar_sekolah(text, text, text, text, text, text, text);
create function public.daftar_sekolah(
  p_kod text, p_nama text, p_jenis text,
  p_daerah text default null, p_negeri text default null, p_alamat text default null,
  p_nama_ketua text default null, p_tahun int default null
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
  perform public._isi_templat(v_id, p_jenis);
  return v_id;
end $$;
grant execute on function public.daftar_sekolah to authenticated;
revoke execute on function public.daftar_sekolah from anon;

-- INSERT yang akan bertembung (upsert menukar penyandang) tidak dilog; pencetus UPDATE melog "tukar".
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
    if not exists(select 1 from public.lantikan where tahun = new.tahun and slot_id = new.slot_id) then
      perform public._log(r.school_id, 'lantik', format('%s — %s, %s', v_guru, new.peranan_nama, new.jk_nama));
    end if;
  elsif new.guru_id is distinct from old.guru_id then
    perform public._log(r.school_id, 'tukar', format('%s → %s — %s, %s',
      (select nama from public.guru where id = old.guru_id), v_guru, new.peranan_nama, new.jk_nama));
  end if;
  return coalesce(new, old);
end $$;
