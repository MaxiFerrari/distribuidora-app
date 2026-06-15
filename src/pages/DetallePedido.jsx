import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDateTime } from '../utils/helpers'
import { exportPedidoPDF } from '../utils/pdfExport'
import { ArrowLeft, FileText, Check, Trash2, Phone, Loader2 } from 'lucide-react'

const BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  entregado: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  cancelado: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

export default function DetallePedido() {
  const { id } = useParams()
  const { state, updatePedido, deletePedido } = useApp()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const pedido = state.pedidos.find(p => p.id === id)
  if (!pedido) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 dark:text-gray-400">Pedido no encontrado</p>
      <button onClick={() => navigate('/pedidos')} className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm">Volver</button>
    </div>
  )

  async function cambiarEstado(nuevoEstado) {
    setSaving(true)
    try { await updatePedido({ ...pedido, estado: nuevoEstado }) } finally { setSaving(false) }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este pedido?')) return
    await deletePedido(pedido.id)
    navigate('/pedidos')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(pedido.fecha)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium border capitalize ${BADGE[pedido.estado]}`}>{pedido.estado}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Cliente</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
            <span className="text-blue-700 dark:text-blue-400 font-bold">{pedido.clienteNombre[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{pedido.clienteNombre}</p>
            {pedido.clienteTelefono && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={12} />{pedido.clienteTelefono}</p>
            )}
          </div>
        </div>
        {pedido.notas && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">📝 {pedido.notas}</p>}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Productos ({pedido.items.length})</h2>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {pedido.items.map((item, i) => {
            const subtotalItem = item.cantidad * item.precioUnitario * (1 - item.descuento / 100)
            return (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.cantidad} × {formatCurrency(item.precioUnitario)}
                    {item.descuento > 0 && <span className="text-green-600 dark:text-green-400 ml-1">(-{item.descuento}%)</span>}
                  </p>
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{formatCurrency(subtotalItem)}</span>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/40 space-y-1.5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>Subtotal</span><span>{formatCurrency(pedido.subtotal)}</span></div>
          {pedido.descuentoTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400"><span>Descuento</span><span>- {formatCurrency(pedido.descuentoTotal)}</span></div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-600">
            <span>TOTAL</span><span>{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => exportPedidoPDF(pedido)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <FileText size={16} className="text-blue-600 dark:text-blue-400" /> Exportar PDF
        </button>
        {pedido.estado === 'pendiente' && (
          <button onClick={() => cambiarEstado('entregado')} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Marcar Entregado
          </button>
        )}
        {pedido.estado === 'entregado' && (
          <button onClick={() => cambiarEstado('pendiente')} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Marcar Pendiente
          </button>
        )}
        {pedido.estado !== 'cancelado' && (
          <button onClick={() => cambiarEstado('cancelado')} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar pedido
          </button>
        )}
        <button onClick={eliminar} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 size={16} /> Eliminar
        </button>
      </div>
    </div>
  )
}
