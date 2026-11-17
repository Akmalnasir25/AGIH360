# NeracaTugas

Sistem agihan & pemberatan tugas guru untuk SK dan SMK — Indeks Beban, auto-agih, aliran kelulusan, Buku Pengurusan dan surat lantikan.

## Stack
Vite + React + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS) · docx / exceljs untuk eksport.

## Mula (tempatan)
```bash
npm install
npx supabase start -x studio,imgproxy,vector,logflare,edge-runtime,realtime,storage-api   # port 564xx
cp .env.example .env.local   # isi URL & anon key (tempatan: http://127.0.0.1:56421)
npm run dev                  # http://localhost:5181
```
Mod demo (tanpa pelayan): buka laman utama → "Cuba demo SK/SMK".

## Ujian
```bash
npx vitest run              # enjin indeks, auto-agih, amaran, eksport
node scripts/uji-rls.mjs    # pengasingan data antara sekolah (Supabase TEMPATAN sahaja)
```

## Struktur
- `src/lib/indeks.ts` — formula Indeks Beban (satu-satunya sumber formula)
- `src/lib/stor.ts` — antara muka data; `demo.ts` (memori/simulasi) & `supabase.ts` (live)
- `src/lib/autoagih.ts`, `amaran.ts`, `sejarah.ts`, `kuasa.ts`, `eksport.ts`
- `supabase/migrations/` — skema, RLS, templat JK SK/SMK, kelulusan, log audit
- `supabase/functions/hantar-notifikasi/` — e-mel lantikan via Brevo (belum diaktifkan)

## Peranan
`admin` · `gb` (Guru Besar/Pengetua — lulus/muktamad) · `pk` (urus JK & lantik dalam bidangnya) · `guru` (Tugas Saya sahaja)
