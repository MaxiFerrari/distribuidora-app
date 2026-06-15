import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/helpers'
import { Search, Users, ShoppingCart, Package, X } from 'lucide-react'

export default function BusquedaGlobal({ onClose }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.toLowerCase().trim()

  const clientes = q ? state.clientes.filter(c =>
    c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || c.zona.toLowerCase().includes(q)
  ).slice(0, 4) : []

  const pedidos = q ? state.pedidos.filter(p =>
    p.clienteNombre.toLowerCase().includes(q) || p.id.includes(q)
  ).slice(0, 4) : []

  const productos = q ? state.productos.filter(p =>
    p.nombre.toLowerCase().includes(q)
  ).slice(0, 4) : []

  const total = clientes.length + pedidos.length + productos.length

  function go(path) { navigate(path); onClose() }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar clientes, pedidos, productos..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none" />
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {!q && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Escribí para buscar en toda la app
            </div>
          )}

          {q && total === 0 && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Sin resultados para "{query}"
            </div>
          )}

          {clientes.length > 0 && (
            <Section label="Clientes" icon={Users}>
              {clientes.map(c => (
                <Result key={c.id} onClick={() => go('/clientes')}>
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-700 dark:text-blue-400 text-xs font-bold">{c.nombre[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.zona} · {c.telefono}</p>
                  </div>
                </Result>
              ))}
            </Section>
          )}

          {pedidos.length > 0 && (
            <Section label="Pedidos" icon={ShoppingCart}>
              {pedidos.map(p => (
                <Result key={p.id} onClick={() => go(`/pedidos/${p.id}`)}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${p.estado === 'entregado' ? 'bg-green-400' : p.estado === 'cancelado' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.clienteNombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{p.estado} · {new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{formatCurrency(p.total)}</span>
                </Result>
              ))}
            </Section>
          )}

          {productos.length > 0 && (
            <Section label="Productos" icon={Package}>
              {productos.map(p => (
                <Result key={p.id} onClick={() => go('/inventario')}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${p.stock <= p.stockMinimo ? 'bg-orange-400' : 'bg-green-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock} {p.unidad}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{formatCurrency(p.precio)}</span>
                </Result>
              ))}
            </Section>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-400">Esc para cerrar</p>
          {total > 0 && <p className="text-xs text-gray-400">{total} resultado{total !== 1 ? 's' : ''}</p>}
        </div>
      </div>
    </div>
  )
}

function Section({ label, icon: Icon, children }) {
  return (
    <div>
      <div className="px-4 py-2 flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase">{label}</span>
      </div>
      {children}
    </div>
  )
}

function Result({ onClick, children }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
      {children}
    </button>
  )
}
