import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
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
import { Loader2 } from 'lucide-react'

function ProtectedRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="pedidos/nuevo" element={<NuevoPedido />} />
          <Route path="pedidos/:id" element={<DetallePedido />} />
          <Route path="pedidos/:id/editar" element={<EditarPedido />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="estadisticas" element={<Estadisticas />} />
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
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
