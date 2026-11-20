-- Seksyen Buku Pengurusan boleh diletakkan dalam bab bidang (cth. Hala Tuju PPKI dalam Bab Pendidikan Khas).
-- null = Bahagian A (Pengenalan & Maklumat Sekolah)
alter table public.buku_seksyen add column if not exists bidang_id uuid references public.bidang(id) on delete set null;
