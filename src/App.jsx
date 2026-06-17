import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import NuevoPedido from './pages/NuevoPedido'
import Pedidos from './pages/Pedidos'
import DetallePedido from './pages/DetallePedido'
import EditarPedido from './pages/EditarPedido'
import Inventario from './pages/Inventario'
import Estadisticas from './pages/Estadisticas'
import Onboarding from './pages/Onboarding'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

function OnboardingGate({ children }) {
  const { state } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (state.loading) return
    const done = localStorage.getItem('onboarding-done')
    const vacio = state.clientes.length === 0 && state.productos.length === 0 && state.pedidos.length === 0
    if (!done && vacio) navigate('/onboarding')
  }, [state.loading])

  return children
}

function ProtectedRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OnboardingGate><Dashboard /></OnboardingGate>} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="pedidos/nuevo" element={<NuevoPedido />} />
          <Route path="pedidos/:id" element={<DetallePedido />} />
          <Route path="pedidos/:id/editar" element={<EditarPedido />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
            success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
