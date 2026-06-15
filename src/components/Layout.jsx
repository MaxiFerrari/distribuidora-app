import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, ClipboardList, Package, Menu, X, LogOut, Sun, Moon, Search, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import BusquedaGlobal from './BusquedaGlobal'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/pedidos/nuevo', label: 'Nuevo Pedido', icon: ShoppingCart, highlight: true },
  { to: '/pedidos', label: 'Historial', icon: ClipboardList },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
]

function NavItem({ to, label, icon: Icon, end, highlight, onClick }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
        }`
      }
    >
      <Icon size={18} />{label}
    </NavLink>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { dark, toggle } = useTheme()

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Distribuidora</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="px-3 pt-3">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Search size={14} />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="text-xs bg-white dark:bg-gray-600 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 text-gray-400">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(props => <NavItem key={props.to} {...props} />)}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button onClick={toggle} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">Distribuidora</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <Search size={18} />
          </button>
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <nav className="flex-1 p-3 space-y-1">
              {NAV.map(props => <NavItem key={props.to} {...props} onClick={() => setOpen(false)} />)}
            </nav>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <p className="text-xs text-gray-400 px-3 mb-1 truncate">{user?.email}</p>
              <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition-colors">
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>

      {searchOpen && <BusquedaGlobal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
