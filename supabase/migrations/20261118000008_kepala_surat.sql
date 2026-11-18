-- AGIH360 008: Kepala surat sekolah untuk cetakan (surat lantikan & senarai AJK).
-- Imej disimpan sebagai data URL (dimampatkan di pelayar). Had saiz supaya baris sekolah kekal ringan.

alter table public.sekolah add column if not exists kepala_surat text;

alter table public.sekolah drop constraint if exists sekolah_kepala_surat_saiz;
alter table public.sekolah add constraint sekolah_kepala_surat_saiz check (kepala_surat is null or length(kepala_surat) <= 1500000);

alter table public.sekolah drop constraint if exists sekolah_logo_saiz;
alter table public.sekolah add constraint sekolah_logo_saiz check (logo_url is null or length(logo_url) <= 600000);
