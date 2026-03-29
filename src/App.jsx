import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useStore } from './store/useStore'
import BottomNav   from './components/layout/BottomNav'
import Login         from './screens/Login'
import Home          from './screens/Home'
import Registro      from './screens/Registro'
import NuevaOperacion from './screens/NuevaOperacion'
import Deudas        from './screens/Deudas'
import Analisis      from './screens/Analisis'
import Ajustes        from './screens/Ajustes'

function AppShell({ children }) {
  return (
    <div className="max-w-md mx-auto relative h-screen bg-gray-50 overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

function PrivateRoute({ children }) {
  const user = useStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <AppShell><Home /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/registro" element={
          <PrivateRoute>
            <AppShell><Registro /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/nueva" element={
          <PrivateRoute>
            <AppShell><NuevaOperacion /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/deudas" element={
          <PrivateRoute>
            <AppShell><Deudas /></AppShell>
          </PrivateRoute>
        } />
        <Route path="/analisis" element={
          <PrivateRoute>
            <AppShell><Analisis /></AppShell>
          </PrivateRoute>
        } />

        <Route path="/ajustes" element={
           <PrivateRoute><AppShell><Ajustes /></AppShell></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
