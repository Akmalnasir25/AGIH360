import { createClient } from '@supabase/supabase-js'
import type { DataSekolah, StatusAgihan } from './types'
import type { Baris, NamaJadual, Stor } from './stor'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseAda = Boolean(url && key)
export const supabase = supabaseAda ? createClient(url!, key!) : null

function sb() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi')
  return supabase
}

function semak<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

const TAHUN_SEJARAH = 3

export class StorSupabase implements Stor {
  mod = 'live' as const
  private schoolId: string
  private tahunCache: number | null = null
  constructor(schoolId: string) { this.schoolId = schoolId }

  async muat(): Promise<DataSekolah> {
    const c = sb()
    const id = this.schoolId
    const sekolah = semak(await c.from('sekolah').select('*').eq('id', id).single()) as DataSekolah['sekolah']
    const tahun = sekolah.tahun_semasa
    this.tahunCache = tahun
    const [tetapan, tahap, peranan, tempoh, gred, bidang, guru, jawatankuasa, slot, lantikan, tugasLuar, kelulusan, log, maklumBalas] = await Promise.all([
      c.from('tetapan').select('*').eq('school_id', id).single(),
      c.from('tahap').select('id,nama,faktor,susunan').eq('school_id', id).order('susunan'),
      c.from('peranan_jk').select('id,nama,berat,susunan').eq('school_id', id).order('susunan'),
      c.from('tempoh').select('id,nama,faktor,susunan').eq('school_id', id).order('susunan'),
      c.from('gred').select('id,kod,peranan,faktor,susunan').eq('school_id', id).order('susunan'),
      c.from('bidang').select('id,nama,warna,susunan').eq('school_id', id).order('susunan'),
      c.from('guru').select('id,nama,emel,telefon,gred_id,masa_seminggu,kelas_peperiksaan,status,dikecualikan,tag,kepakaran').eq('school_id', id).order('nama'),
      c.from('jawatankuasa').select('id,bidang_id,kod,nama,tahap_id,tempoh_id,wajib,catatan,susunan,bidang_tugas').eq('school_id', id).eq('diarkib', false).order('susunan'),
      c.from('slot').select('id,jawatankuasa_id,peranan_id,label,susunan').eq('school_id', id).eq('diarkib', false).order('susunan'),
      c.from('lantikan').select('id,tahun,slot_id,guru_id,jk_nama,peranan_nama,bidang_nama').eq('school_id', id).gte('tahun', tahun - TAHUN_SEJARAH).lte('tahun', tahun),
      c.from('tugas_luar').select('id,guru_id,tahun,jenis,keterangan,nilai').eq('school_id', id).gte('tahun', tahun - TAHUN_SEJARAH),
      c.from('kelulusan').select('status,catatan,dikemaskini').eq('school_id', id).eq('tahun', tahun).maybeSingle(),
      c.from('log_audit').select('id,masa,pengguna,tindakan,butiran').eq('school_id', id).order('masa', { ascending: false }).limit(200),
      c.from('maklum_balas').select('id,guru_id,tahun,mesej,status,balasan,dicipta').eq('school_id', id).order('dicipta', { ascending: false }),
    ])
    const num = <T extends Record<string, unknown>>(rows: T[] | null, keys: string[]) =>
      (rows ?? []).map((r) => { const o: Record<string, unknown> = { ...r }; keys.forEach((k) => (o[k] = Number(o[k]))); return o as T })
    const jkAktif = new Set((semak(jawatankuasa) ?? []).map((j) => j.id))
    return {
      sekolah,
      tetapan: num([semak(tetapan)], ['w_mengajar', 'ambang_tinggi', 'ambang_rendah', 'faktor_peperiksaan'])[0],
      tahap: num(semak(tahap), ['faktor']),
      peranan: num(semak(peranan), ['berat']),
      tempoh: num(semak(tempoh), ['faktor']),
      gred: num(semak(gred), ['faktor']),
      bidang: semak(bidang) ?? [],
      guru: num(semak(guru), ['masa_seminggu']),
      jawatankuasa: semak(jawatankuasa) ?? [],
      slot: (semak(slot) ?? []).filter((s) => jkAktif.has(s.jawatankuasa_id)),
      lantikan: semak(lantikan) ?? [],
      tugasLuar: num(semak(tugasLuar), ['nilai']),
      kelulusan: semak(kelulusan) ?? { status: 'draf', catatan: null, dikemaskini: null },
      log: semak(log) ?? [],
      maklumBalas: semak(maklumBalas) ?? [],
    } as DataSekolah
  }

  private async tahun() {
    if (this.tahunCache) return this.tahunCache
    this.tahunCache = (semak(await sb().from('sekolah').select('tahun_semasa').eq('id', this.schoolId).single()) as { tahun_semasa: number }).tahun_semasa
    return this.tahunCache
  }

  async lantik(slotId: string, guruId: string) { await this.lantikBanyak([{ slotId, guruId }]) }
  async lantikBanyak(pasangan: { slotId: string; guruId: string }[]) {
    if (!pasangan.length) return
    const tahun = await this.tahun()
    semak(await sb().from('lantikan').upsert(
      pasangan.map((p) => ({ school_id: this.schoolId, tahun, slot_id: p.slotId, guru_id: p.guruId })),
      { onConflict: 'tahun,slot_id' },
    ))
  }
  async batal(slotId: string) { await this.batalBanyak([slotId]) }
  async batalBanyak(slotIds: string[]) {
    if (!slotIds.length) return
    const tahun = await this.tahun()
    semak(await sb().from('lantikan').delete().in('slot_id', slotIds).eq('tahun', tahun).select('id'))
  }
  async tambahAhli(jkId: string, perananId: string, guruIds: string[]) {
    if (!guruIds.length) return
    const c = sb()
    const ada = (semak(await c.from('slot').select('susunan').eq('jawatankuasa_id', jkId).order('susunan', { ascending: false }).limit(1)) ?? []) as { susunan: number }[]
    let n = ada[0]?.susunan ?? 0
    const baru = (semak(await c.from('slot').insert(
      guruIds.map(() => ({ school_id: this.schoolId, jawatankuasa_id: jkId, peranan_id: perananId, label: null, susunan: ++n })),
    ).select('id,susunan').order('susunan')) ?? []) as { id: string; susunan: number }[]
    await this.lantikBanyak(baru.map((s, i) => ({ slotId: s.id, guruId: guruIds[i] })))
  }
  async simpan(j: NamaJadual, baris: Baris) {
    // Rekod sedia ada → UPDATE (bukan upsert: upsert turut tertakluk polisi INSERT RLS)
    if (baris.id) {
      const { id, ...rest } = baris
      // RLS yang menyekat UPDATE tidak memulangkan ralat — hanya 0 baris. Semak supaya tidak "berjaya" senyap.
      const r = semak(await sb().from(j).update(rest).eq('id', id).eq('school_id', this.schoolId).select('id')) as unknown[] | null
      if (!r?.length) throw new Error('Tiada kebenaran untuk mengubah rekod ini, atau rekod tidak wujud.')
      return id
    }
    const r = semak(await sb().from(j).insert({ ...baris, school_id: this.schoolId }).select('id').single())
    return (r as { id: string }).id
  }
  async simpanBanyak(j: NamaJadual, baris: Baris[]) {
    if (!baris.length) return
    const baru = baris.filter((b) => !b.id).map((b) => { const r: Baris = { ...b, school_id: this.schoolId }; delete r.id; return r })
    const lama = baris.filter((b) => b.id)
    if (baru.length) semak(await sb().from(j).insert(baru))
    for (const b of lama) await this.simpan(j, b)
  }
  async buang(j: NamaJadual, id: string) {
    if (j === 'jawatankuasa' || j === 'slot') return this.arkib(j, id)
    const r = semak(await sb().from(j).delete().eq('id', id).select('id')) as unknown[] | null
    if (!r?.length) throw new Error('Tiada kebenaran untuk membuang rekod ini, atau rekod tidak wujud.')
  }
  async arkib(j: 'jawatankuasa' | 'slot', id: string) {
    semak(await sb().rpc('arkib', { p_jadual: j, p_id: id }))
  }
  async simpanTetapan(t: Partial<DataSekolah['tetapan']>) {
    const r = semak(await sb().from('tetapan').update(t).eq('school_id', this.schoolId).select('school_id')) as unknown[] | null
    if (!r?.length) throw new Error('Tiada kebenaran untuk mengubah tetapan.')
  }
  async simpanSekolah(s: Partial<DataSekolah['sekolah']>) {
    const { id: _id, kod: _kod, ...rest } = s
    void _id; void _kod
    const r = semak(await sb().from('sekolah').update(rest).eq('id', this.schoolId).select('id')) as unknown[] | null
    if (!r?.length) throw new Error('Tiada kebenaran untuk mengubah maklumat sekolah.')
    this.tahunCache = null
  }
  async salinTahunLepas() {
    const tahun = await this.tahun()
    return semak(await sb().rpc('salin_tahun_lepas', { p_school: this.schoolId, p_tahun: tahun })) as number
  }
  async tukarStatus(status: StatusAgihan, catatan?: string) {
    const tahun = await this.tahun()
    semak(await sb().rpc('tukar_status', { p_school: this.schoolId, p_tahun: tahun, p_status: status, p_catatan: catatan ?? null }))
  }
}
