-- Kepala surat format KPM: nombor faks & e-mel rasmi sekolah
alter table public.sekolah add column if not exists faks text;
alter table public.sekolah add column if not exists emel text;
alter table public.sekolah add constraint sekolah_faks_pjg check (faks is null or length(faks) <= 40) not valid;
alter table public.sekolah add constraint sekolah_emel_pjg check (emel is null or length(emel) <= 120) not valid;
