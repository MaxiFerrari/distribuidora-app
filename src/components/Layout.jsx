import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, ClipboardList, Package, Menu, X, LogOut, Sun, Moon, Search, BarChart2, ChevronLeft, ChevronRight, Settings, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useDistribuidora } from '../context/DistribuidoraContext'
import BusquedaGlobal from './BusquedaGlobal'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/pedidos/nuevo', label: 'Nuevo Pedido', icon: ShoppingCart, highlight: true },
  { to: '/pedidos', label: 'Historial', icon: ClipboardList, end: true },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
]

function NavItem({ to, label, icon: Icon, end, highlight, onClick, collapsed }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
        } ${
          isActive
            ? 'bg-blue-600 text-white'
            : highlight
            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const { user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const { distribuidora, isSuperAdmin } = useDistribuidora()

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', next)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
        {/* Header */}
        <div className={`border-b border-gray-200 dark:border-gray-700 flex items-center ${collapsed ? 'p-3 flex-col gap-2' : 'p-4 justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingCart size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                  {isSuperAdmin ? 'Panel Admin' : (distribuidora?.nombre || 'Sin asignar')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[140px] mt-0.5">{user?.email}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
          )}
          {/* Toggle collapse button */}
          <button onClick={toggleCollapse} title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className={`shrink-0 flex items-center justify-center p-1.5 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${collapsed ? 'w-full' : ''}`}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Search button */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <button onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Search size={14} />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="text-xs bg-white dark:bg-gray-600 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 text-gray-400">⌘K</kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="px-2 pt-3">
            <button onClick={() => setSearchOpen(true)} title="Buscar (Ctrl+K)"
              className="w-full flex items-center justify-center py-2 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Search size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 p-2 space-y-1`}>
          {NAV.map(props => <NavItem key={props.to} {...props} collapsed={collapsed} />)}
          {isSuperAdmin && (
            <>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              <NavItem to="/admin" label="Admin Panel" icon={Settings} collapsed={collapsed} />
            </>
          )}
        </nav>

        {/* Footer */}
        <div className={`border-t border-gray-200 dark:border-gray-700 space-y-1 ${collapsed ? 'p-2' : 'p-3'}`}>
          <NavLink to="/feedback" title="Enviar Feedback"
            className={({ isActive }) => `w-full flex items-center py-2 text-sm rounded-lg transition-colors ${collapsed ? 'justify-center px-2' : 'gap-2 px-3'} ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}>
            <MessageSquare size={15} />
            {!collapsed && '💙 Dar Feedback'}
          </NavLink>
          <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}
            className={`w-full flex items-center py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${collapsed ? 'justify-center px-2' : 'gap-2 px-3'}`}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {!collapsed && (dark ? 'Modo claro' : 'Modo oscuro')}
          </button>
          <button onClick={signOut} title="Cerrar sesión"
            className={`w-full flex items-center py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors ${collapsed ? 'justify-center px-2' : 'gap-2 px-3'}`}>
            <LogOut size={15} />
            {!collapsed && 'Cerrar sesión'}
          </button>
          {!collapsed && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-1">
              Un producto de <span className="font-semibold text-gray-500 dark:text-gray-500">BotHub</span>
            </p>
          )}
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
              {NAV.map(props => <NavItem key={props.to} {...props} onClick={() => setOpen(false)} collapsed={false} />)}
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
