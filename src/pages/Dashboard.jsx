import { useApp } from '../context/AppContext'
import { formatCurrency, formatDateTime, isToday, isThisWeek } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, Package, Users, ShoppingCart, AlertTriangle, Clock } from 'lucide-react'

const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export default function Dashboard() {
  const { state } = useApp()
  const navigate = useNavigate()

  const pedidosHoy = state.pedidos.filter(p => isToday(p.fecha))
  const pedidosSemana = state.pedidos.filter(p => isThisWeek(p.fecha))
  const ventasHoy = pedidosHoy.reduce((s, p) => s + p.total, 0)
  const ventasSemana = pedidosSemana.reduce((s, p) => s + p.total, 0)
  const pedidosPendientes = state.pedidos.filter(p => p.estado === 'pendiente')
  const productosStockBajo = state.productos.filter(p => p.stock <= p.stockMinimo)

  const recientes = state.pedidos.slice(0, 6)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/pedidos/nuevo')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-colors"
        >
          <Plus size={18} />
          Nuevo Pedido
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} color="blue" label="Ventas Hoy" value={formatCurrency(ventasHoy)} sub={`${pedidosHoy.length} pedido${pedidosHoy.length !== 1 ? 's' : ''}`} />
        <StatCard icon={ShoppingCart} color="green" label="Esta Semana" value={formatCurrency(ventasSemana)} sub={`${pedidosSemana.length} pedidos`} />
        <StatCard icon={Clock} color="yellow" label="Pendientes" value={pedidosPendientes.length} sub="por entregar" onClick={() => navigate('/pedidos')} />
        <StatCard icon={Users} color="purple" label="Clientes" value={state.clientes.length} sub="registrados" onClick={() => navigate('/clientes')} />
      </div>

      {/* Alertas stock */}
      {productosStockBajo.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-orange-800 text-sm">Stock bajo en {productosStockBajo.length} producto{productosStockBajo.length !== 1 ? 's' : ''}</p>
            <p className="text-orange-700 text-sm mt-0.5">{productosStockBajo.map(p => p.nombre).join(', ')}</p>
          </div>
          <button onClick={() => navigate('/inventario')} className="ml-auto text-orange-600 text-sm font-medium hover:underline shrink-0">Ver inventario</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Pedidos Recientes</h2>
              <button onClick={() => navigate('/pedidos')} className="text-blue-600 text-sm hover:underline">Ver todos</button>
            </div>
            {recientes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
                <p>Sin pedidos aún</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recientes.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pedidos/${p.id}`)}
                    className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.clienteNombre}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(p.fecha)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[p.estado]}`}>
                      {p.estado}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clientes recientes */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Clientes</h2>
              <button onClick={() => navigate('/clientes')} className="text-blue-600 text-sm hover:underline">Ver todos</button>
            </div>
            <div className="divide-y divide-gray-50">
              {state.clientes.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate('/clientes')}
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-blue-700 font-bold text-xs">{c.nombre[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.nombre}</p>
                      <p className="text-xs text-gray-500">{c.zona}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => navigate('/clientes?nuevo=1')}
                className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 font-medium py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={16} /> Agregar cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value, sub, onClick }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
