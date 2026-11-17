import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { StorSupabase } from '../lib/supabase'
import { StorDemo } from '../lib/demo'
import { binaKonteks, type Konteks } from '../lib/indeks'
import type { Stor } from '../lib/stor'
import type { DataSekolah, JenisSekolah, Peranan } from '../lib/types'

export interface Keahlian { school_id: string; peranan: Peranan; bidang_id: string | null; guru_id: string | null; nama: string; kod: string }

interface NilaiAplikasi {
  sesi: Session | null
  sedia: boolean
  keahlian: Keahlian[]
  /** true selepas keahlian pengguna log masuk selesai dimuat (elak lencongan pramatang) */
  keahlianSedia: boolean
  muatKeahlian: () => Promise<void>
  // sekolah aktif
  stor: Stor | null
  data: DataSekolah | null
  k: Konteks | null
  peranan: Peranan
  guruSaya: string | null
  bidangSaya: string | null
  memuat: boolean
  ralat: string | null
  pilihSekolah: (schoolId: string) => void
  mulaDemo: (jenis?: JenisSekolah) => void
  keluarDemo: () => void
  tukarPerananDemo: (p: Peranan) => void
  muatSemula: () => Promise<void>
  /** Jalankan perubahan kemudian muat semula data */
  ubah: (fn: (s: Stor) => Promise<unknown>) => Promise<void>
  keluar: () => Promise<void>
  /** Mod simulasi: perubahan lantikan dalam salinan memori, boleh dibanding & diterapkan */
  simulasi: { dataAsal: DataSekolah } | null
  mulaSimulasi: () => void
  terapkanSimulasi: () => Promise<number>
  buangSimulasi: () => void
  tutupRalat: () => void
}

const Ctx = createContext<NilaiAplikasi | null>(null)
const KUNCI_SEKOLAH = 'nt.sekolah'

export function PembekalAplikasi({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<Session | null>(null)
  const [sedia, setSedia] = useState(!supabase)
  const [keahlian, setKeahlian] = useState<Keahlian[]>([])
  const [keahlianUntuk, setKeahlianUntuk] = useState<string | null>(null)  // user id yang keahliannya telah dimuat
  const [stor, setStor] = useState<Stor | null>(null)
  const [data, setData] = useState<DataSekolah | null>(null)
  const [peranan, setPeranan] = useState<Peranan>('guru')
  const [guruSaya, setGuruSaya] = useState<string | null>(null)
  const [bidangSaya, setBidangSaya] = useState<string | null>(null)
  const [memuat, setMemuat] = useState(false)
  const [ralat, setRalat] = useState<string | null>(null)
  const [simulasi, setSimulasi] = useState<{ asal: Stor; dataAsal: DataSekolah } | null>(null)

  // ── Sesi Supabase
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSesi(data.session); setSedia(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesi(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const muatKeahlian = useCallback(async () => {
    if (!supabase || !sesi) { setKeahlian([]); setKeahlianUntuk(null); return }
    await supabase.rpc('tuntut_akaun')  // padankan e-mel DELIMa dengan rekod guru
    const { data: rows } = await supabase
      .from('ahli')
      .select('school_id,peranan,bidang_id,guru_id,sekolah(nama,kod)')
      .eq('user_id', sesi.user.id)
    const k = (rows ?? []).map((r) => {
      const s = r.sekolah as unknown as { nama: string; kod: string }
      return { school_id: r.school_id, peranan: r.peranan as Peranan, bidang_id: r.bidang_id, guru_id: r.guru_id, nama: s?.nama ?? '', kod: s?.kod ?? '' }
    })
    setKeahlian(k)
    setKeahlianUntuk(sesi.user.id)
  }, [sesi])
  const keahlianSedia = !!sesi && keahlianUntuk === sesi.user.id

  useEffect(() => { void muatKeahlian() }, [muatKeahlian])

  // Auto-pilih sekolah selepas keahlian dimuat
  useEffect(() => {
    if (stor?.mod === 'demo' || !keahlian.length) return
    const simpan = localStorageGet(KUNCI_SEKOLAH)
    const pilih = keahlian.find((x) => x.school_id === simpan) ?? keahlian[0]
    if (!stor) pilihSekolahDalam(pilih)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keahlian])

  const muatData = useCallback(async (s: Stor) => {
    setMemuat(true); setRalat(null)
    try { setData(await s.muat()) } catch (e) { setRalat((e as Error).message) } finally { setMemuat(false) }
  }, [])

  function pilihSekolahDalam(kh: Keahlian) {
    const s = new StorSupabase(kh.school_id)
    setStor(s); setPeranan(kh.peranan); setGuruSaya(kh.guru_id); setBidangSaya(kh.bidang_id)
    localStorageSet(KUNCI_SEKOLAH, kh.school_id)
    void muatData(s)
  }

  const pilihSekolah = (id: string) => {
    const kh = keahlian.find((x) => x.school_id === id)
    if (kh) pilihSekolahDalam(kh)
  }

  const mulaDemo = (jenis: JenisSekolah = 'SK') => {
    const s = new StorDemo(jenis)
    setStor(s); setPeranan('admin'); setBidangSaya(null)
    void s.muat().then((d) => { setData(d); setGuruSaya(d.guru[5]?.id ?? null) })
  }
  const keluarDemo = () => { setStor(null); setData(null); setSimulasi(null) }
  const tukarPerananDemo = (p: Peranan) => {
    setPeranan(p)
    // PK demo dihadkan kepada bidang Kurikulum supaya sekatan bidang kelihatan
    setBidangSaya(p === 'pk' ? data?.bidang.find((b) => /kurikulum/i.test(b.nama))?.id ?? null : null)
  }

  const mulaSimulasi = () => {
    if (!stor || !data || simulasi) return
    setSimulasi({ asal: stor, dataAsal: data })
    setStor(new StorDemo(data))
  }
  const buangSimulasi = () => {
    if (!simulasi) return
    setStor(simulasi.asal); setData(simulasi.dataAsal); setSimulasi(null)
  }
  const terapkanSimulasi = async () => {
    if (!simulasi || !data) return 0
    const tahun = data.sekolah.tahun_semasa
    const peta = (d: DataSekolah) => new Map(d.lantikan.filter((l) => l.tahun === tahun).map((l) => [l.slot_id, l.guru_id]))
    const lama = peta(simulasi.dataAsal), baru = peta(data)
    const gugur = [...lama.keys()].filter((sid) => !baru.has(sid))
    const lantik = [...baru.entries()].filter(([sid, gid]) => lama.get(sid) !== gid).map(([slotId, guruId]) => ({ slotId, guruId }))
    const asal = simulasi.asal
    await asal.batalBanyak(gugur)
    await asal.lantikBanyak(lantik)
    setStor(asal); setSimulasi(null)
    setData(await asal.muat())
    return gugur.length + lantik.length
  }

  const muatSemula = useCallback(async () => { if (stor) await muatData(stor) }, [stor, muatData])

  const ubah = useCallback(async (fn: (s: Stor) => Promise<unknown>) => {
    if (!stor) return
    try { await fn(stor); setData(await stor.muat()) } catch (e) { setRalat((e as Error).message); throw e }
  }, [stor])

  const keluar = async () => {
    setStor(null); setData(null); setKeahlian([]); setSimulasi(null)
    if (supabase) await supabase.auth.signOut()
  }

  const k = useMemo(() => (data ? binaKonteks(data) : null), [data])

  return (
    <Ctx.Provider value={{
      sesi, sedia, keahlian, keahlianSedia, muatKeahlian, stor, data, k, peranan, guruSaya, bidangSaya, memuat, ralat,
      pilihSekolah, mulaDemo, keluarDemo, tukarPerananDemo, muatSemula, ubah, keluar,
      simulasi: simulasi ? { dataAsal: simulasi.dataAsal } : null, mulaSimulasi, terapkanSimulasi, buangSimulasi,
      tutupRalat: () => setRalat(null),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAplikasi() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAplikasi di luar PembekalAplikasi')
  return c
}

function localStorageGet(k: string) { try { return localStorage.getItem(k) } catch { return null } }
function localStorageSet(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* abaikan */ } }
