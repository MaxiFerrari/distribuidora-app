import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, ClipboardList, Package, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/pedidos/nuevo', label: 'Nuevo Pedido', icon: ShoppingCart, highlight: true },
  { to: '/pedidos', label: 'Historial', icon: ClipboardList },
  { to: '/inventario', label: 'Inventario', icon: Package },
]

function NavItem({ to, label, icon: Icon, end, highlight, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Distribuidora</p>
              <p className="text-xs text-gray-500 truncate max-w-[100px]">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(props => <NavItem key={props.to} {...props} />)}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Distribuidora</span>
        </div>
        <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-gray-100">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <nav className="flex-1 p-3 space-y-1">
              {NAV.map(props => <NavItem key={props.to} {...props} onClick={() => setOpen(false)} />)}
            </nav>
            <div className="p-3 border-t border-gray-200">
              <p className="text-xs text-gray-400 px-3 mb-2 truncate">{user?.email}</p>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
