import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PembekalAplikasi, useAplikasi } from './context/Aplikasi'
import { Kerangka } from './components/Kerangka'
import Utama from './pages/Utama'
import { DaftarSekolah, LogMasuk } from './pages/Masuk'
import PapanPemuka from './pages/PapanPemuka'
import Jawatankuasa from './pages/Jawatankuasa'
import Analisis from './pages/Analisis'
import Guru from './pages/Guru'
import Surat from './pages/Surat'
import Eksport from './pages/Eksport'
import Tetapan from './pages/Tetapan'
import TugasSaya from './pages/TugasSaya'
import Amaran from './pages/Amaran'
import TugasLuar from './pages/TugasLuar'
import Kelulusan from './pages/Kelulusan'
import { boleh, type Tindakan } from './lib/kuasa'

function Dilindungi() {
  const { sedia, sesi, stor, data, keahlian, keahlianSedia, memuat, ralat } = useAplikasi()
  // Demo & simulasi (termasuk simulasi daripada demo) tidak memerlukan sesi
  if (stor && stor.mod !== 'live') return data ? <Kerangka /> : <Memuat />
  if (!sedia) return <Memuat />
  if (!sesi) return <Navigate to="/log-masuk" replace />
  if (!keahlianSedia) return <Memuat />
  if (!keahlian.length && !stor) return <Navigate to="/daftar" replace />
  if (ralat && !data) return <div className="p-10 text-rose-600">{ralat}</div>
  if (!data || memuat && !data) return <Memuat />
  return <Kerangka />
}

function Hanya({ t, children }: { t: Tindakan; children: React.ReactNode }) {
  const { peranan } = useAplikasi()
  return boleh(peranan, t) ? <>{children}</> : <Navigate to="/app/tugas-saya" replace />
}

function Memuat() {
  return <div className="min-h-screen flex items-center justify-center text-navy-400"><Loader2 className="animate-spin" /></div>
}

export default function App() {
  return (
    <PembekalAplikasi>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Utama />} />
          <Route path="/log-masuk" element={<LogMasuk />} />
          <Route path="/daftar" element={<DaftarSekolah />} />
          <Route path="/app" element={<Dilindungi />}>
            <Route index element={<Hanya t="lihat_pengurusan"><PapanPemuka /></Hanya>} />
            <Route path="jawatankuasa" element={<Hanya t="lihat_pengurusan"><Jawatankuasa /></Hanya>} />
            <Route path="amaran" element={<Hanya t="lihat_pengurusan"><Amaran /></Hanya>} />
            <Route path="analisis" element={<Hanya t="lihat_pengurusan"><Analisis /></Hanya>} />
            <Route path="guru" element={<Hanya t="urus_guru"><Guru /></Hanya>} />
            <Route path="tugas-luar" element={<Hanya t="tugas_luar"><TugasLuar /></Hanya>} />
            <Route path="kelulusan" element={<Hanya t="log"><Kelulusan /></Hanya>} />
            <Route path="eksport" element={<Hanya t="eksport"><Eksport /></Hanya>} />
            <Route path="surat" element={<Hanya t="surat"><Surat /></Hanya>} />
            <Route path="tetapan" element={<Hanya t="urus_tetapan"><Tetapan /></Hanya>} />
            <Route path="tugas-saya" element={<TugasSaya />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PembekalAplikasi>
  )
}
