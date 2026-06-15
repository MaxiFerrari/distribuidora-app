import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/helpers'
import { ArrowLeft, Phone, MapPin, FileText, Tag, TrendingUp, Receipt } from 'lucide-react'

const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  entregado: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()

  const cliente = state.clientes.find(c => c.id === id)
  if (!cliente) return <div className="p-6 text-gray-500 dark:text-gray-400">Cliente no encontrado</div>

  const pedidos = state.pedidos.filter(p => p.clienteId === id).sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
  const notasCredito = state.notasCredito.filter(n => n.clienteId === id)

  const totalVentas = pedidos.filter(p => p.estado === 'entregado').reduce((s,p) => s + p.total, 0)
  const totalNotas = notasCredito.reduce((s,n) => s + n.monto, 0)
  const saldoPendiente = pedidos.filter(p => p.estado === 'pendiente').reduce((s,p) => s + p.total, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clientes')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
          <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cliente.nombre}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.zona}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          {cliente.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Phone size={14} className="text-gray-400 shrink-0" />{cliente.telefono}
            </div>
          )}
          {cliente.direccion && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <MapPin size={14} className="text-gray-400 shrink-0" />{cliente.direccion}
            </div>
          )}
          {cliente.descuentoGeneral > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Tag size={14} className="shrink-0" />Descuento general: {cliente.descuentoGeneral}%
            </div>
          )}
          {cliente.notas && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 sm:col-span-2">
              <FileText size={14} className="shrink-0 text-gray-400" />{cliente.notas}
            </div>
          )}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalVentas)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total facturado</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(saldoPendiente)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pendiente</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalNotas)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notas crédito</p>
        </div>
      </div>

      {/* Pedidos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Historial de pedidos ({pedidos.length})</h2>
        </div>
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Sin pedidos aún</p>
        ) : (
          <div className="space-y-2">
            {pedidos.map(p => (
              <button key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(p.fecha)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.items.length} producto{p.items.length !== 1 ? 's' : ''}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize ${ESTADO_BADGE[p.estado] || ''}`}>{p.estado}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{formatCurrency(p.total)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notas de crédito */}
      {notasCredito.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Notas de crédito ({notasCredito.length})</h2>
          </div>
          <div className="space-y-2">
            {notasCredito.map(n => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.motivo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(n.fecha)}</p>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">- {formatCurrency(n.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
