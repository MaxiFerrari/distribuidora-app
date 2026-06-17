import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDateTime } from '../utils/helpers'
import { exportToCSV, preparePedidosForCSV } from '../utils/csvExport'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { Search, Plus, ClipboardList, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADOS = ['todos', 'pendiente', 'entregado', 'cancelado']
const BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  entregado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function Pedidos() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const [clienteFiltro, setClienteFiltro] = useState('')

  const filtrados = state.pedidos.filter(p => {
    const matchBusq = p.clienteNombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = estado === 'todos' || p.estado === estado
    const matchCliente = !clienteFiltro || p.clienteId === clienteFiltro
    return matchBusq && matchEstado && matchCliente
  })

  const totalFiltrado = filtrados.reduce((s, p) => s + p.total, 0)
  const { paginatedItems, ...pagination } = usePagination(filtrados, 50)

  function exportarCSV() {
    try {
      const data = preparePedidosForCSV(filtrados)
      exportToCSV(data, `pedidos-${new Date().toISOString().slice(0,10)}.csv`)
      toast.success(`${filtrados.length} pedidos exportados a CSV`)
    } catch (err) {
      toast.error('Error al exportar: ' + err.message)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Pedidos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filtrados.length} pedido{filtrados.length !== 1 ? 's' : ''} · {formatCurrency(totalFiltrado)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => navigate('/pedidos/nuevo')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-colors">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los clientes</option>
          {state.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setEstado(e)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${estado === e ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {e}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin pedidos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map(p => (
            <div key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 cursor-pointer hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.clienteNombre}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${BADGE[p.estado]}`}>{p.estado}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(p.fecha)} · {p.items.length} producto{p.items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.total)}</p>
                {p.descuentoTotal > 0 && <p className="text-xs text-green-600 dark:text-green-400">-{formatCurrency(p.descuentoTotal)} desc.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtrados.length > 50 && <Pagination {...pagination} totalItems={filtrados.length} onNext={pagination.nextPage} onPrev={pagination.prevPage} />}
    </div>
  )
}
