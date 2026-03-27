import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import ProfilePage from './pages/ProfilePage'
import AvailabilityPage from './pages/AvailabilityPage'
import BookingPage from './pages/BookingPage'
import CancelPage from './pages/CancelPage'
import AppointmentsListPage from './pages/AppointmentsListPage'
import ConsultoriosPage from './pages/ConsultoriosPage'
import { useAuth } from './hooks/useAuth'
import { ConsultorioProvider } from './contexts/ConsultorioContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <ConsultorioProvider>{children}</ConsultorioProvider>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/availability" element={<ProtectedRoute><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AppointmentsListPage /></ProtectedRoute>} />
        <Route path="/consultorios" element={<ProtectedRoute><ConsultoriosPage /></ProtectedRoute>} />
        <Route path="/book/:id" element={<BookingPage />} />
        <Route path="/cancel/:token" element={<CancelPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
