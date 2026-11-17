// NeracaTugas — Edge Function: e-mel notifikasi lantikan kepada guru (Brevo).
// POST { school_id, cuba: boolean }
//  cuba = true  → dry-run: kira penerima sahaja, tiada e-mel dihantar
//  cuba = false → hantar (perlu BREVO_API_KEY & EMEL_PENGHANTAR dalam secrets)
// Hanya admin / GB sekolah tersebut dibenarkan.
// STATUS: belum diuji pada pelayan (edge runtime tidak dijalankan secara tempatan).
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { school_id, cuba = true } = await req.json()
    const url = Deno.env.get('SUPABASE_URL')!
    const pengguna = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: u } = await pengguna.auth.getUser()
    if (!u.user) return json({ ralat: 'Tidak log masuk' }, 401)
    const { data: peranan } = await pengguna.rpc('peranan_saya', { p_school: school_id })
    if (peranan !== 'admin' && peranan !== 'gb') return json({ ralat: 'Hanya admin / GB' }, 403)

    // Baca melalui klien pengguna (RLS admin/GB membenarkan semua guru sekolah ini)
    const { data: sek } = await pengguna.from('sekolah').select('nama,tahun_semasa').eq('id', school_id).single()
    const { data: guru } = await pengguna.from('guru').select('id,nama,emel,status').eq('school_id', school_id).eq('status', 'aktif')
    const { data: lant } = await pengguna.from('lantikan').select('guru_id,jk_nama,peranan_nama').eq('school_id', school_id).eq('tahun', sek!.tahun_semasa)
    const ikut = new Map<string, { jk: string; p: string }[]>()
    for (const l of lant ?? []) { const a = ikut.get(l.guru_id) ?? []; a.push({ jk: l.jk_nama, p: l.peranan_nama }); ikut.set(l.guru_id, a) }
    const penerima = (guru ?? []).filter((g) => ikut.has(g.id) && g.emel)
    const tanpa = (guru ?? []).filter((g) => ikut.has(g.id) && !g.emel).map((g) => g.nama)

    const kunci = Deno.env.get('BREVO_API_KEY')
    const dari = Deno.env.get('EMEL_PENGHANTAR')
    const brevo_sedia = Boolean(kunci && dari)
    if (cuba) return json({ akan_dihantar: penerima.length, tanpa_emel: tanpa, brevo_sedia })
    if (!brevo_sedia) return json({ ralat: 'Brevo belum dikonfigurasi', akan_dihantar: penerima.length, tanpa_emel: tanpa, brevo_sedia }, 400)

    const laman = Deno.env.get('URL_LAMAN') ?? 'https://neracatugas.akmalsys.com'
    let dihantar = 0, gagal = 0
    for (const g of penerima) {
      const senarai = ikut.get(g.id)!.map((x, i) => `<tr><td style="padding:4px 8px;border:1px solid #ddd">${i + 1}</td><td style="padding:4px 8px;border:1px solid #ddd">${esc(x.jk)}</td><td style="padding:4px 8px;border:1px solid #ddd">${esc(x.p)}</td></tr>`).join('')
      const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1F3A">
        <p>Salam sejahtera ${esc(g.nama)},</p>
        <p>Berikut ialah senarai tugas anda bagi sesi <b>${sek!.tahun_semasa}</b> di <b>${esc(sek!.nama)}</b>:</p>
        <table style="border-collapse:collapse">${senarai}</table>
        <p>Surat lantikan rasmi boleh dimuat turun di <a href="${laman}/app/tugas-saya">NeracaTugas → Tugas Saya</a> (log masuk dengan DELIMa).</p>
        <p>Terima kasih atas komitmen anda.</p></div>`
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': kunci!, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { email: dari, name: sek!.nama }, to: [{ email: g.emel, name: g.nama }], subject: `Lantikan Tugas Sesi ${sek!.tahun_semasa} — ${sek!.nama}`, htmlContent: html }),
      })
      if (r.ok) dihantar++; else gagal++
    }
    return json({ akan_dihantar: penerima.length, tanpa_emel: tanpa, brevo_sedia, dihantar, gagal })
  } catch (e) {
    return json({ ralat: (e as Error).message }, 500)
  }
})
