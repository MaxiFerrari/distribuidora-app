import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { calcDescuento, calcTotales, formatCurrency, genId } from '../utils/helpers'
import { exportPedidoPDF } from '../utils/pdfExport'
import { Plus, Trash2, Search, ChevronDown, FileText, Save, Loader2 } from 'lucide-react'

export default function NuevoPedido() {
  const { state, addPedido } = useApp()
  const navigate = useNavigate()

  const [clienteId, setClienteId] = useState('')
  const [busqCliente, setBusqCliente] = useState('')
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [items, setItems] = useState([])
  const [notas, setNotas] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const clienteSeleccionado = state.clientes.find(c => c.id === clienteId)
  const clientesFiltrados = state.clientes.filter(c => c.nombre.toLowerCase().includes(busqCliente.toLowerCase()))

  function seleccionarCliente(c) { setClienteId(c.id); setBusqCliente(c.nombre); setMostrarClientes(false); setErrors(e => ({ ...e, cliente: null })) }

  function agregarItem() {
    setItems(prev => [...prev, { id: genId(), productoId: '', nombre: '', cantidad: 1, precioUnitario: 0, descuento: 0 }])
  }

  function actualizarItem(id, campo, valor) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [campo]: valor }
      if (campo === 'productoId' && valor && valor !== '__custom') {
        const prod = state.productos.find(p => p.id === valor)
        if (prod) { updated.nombre = prod.nombre; updated.precioUnitario = prod.precio; updated.descuento = calcDescuento(updated.cantidad) }
      }
      if (campo === 'cantidad') updated.descuento = calcDescuento(Number(valor))
      return updated
    }))
  }

  function eliminarItem(id) { setItems(prev => prev.filter(i => i.id !== id)) }

  const totales = calcTotales(items)

  function validar() {
    const e = {}
    if (!clienteId) e.cliente = 'Seleccioná un cliente'
    if (items.length === 0) e.items = 'Agregá al menos un producto'
    if (items.some(i => !i.nombre.trim() || i.cantidad < 1 || i.precioUnitario <= 0)) e.items = 'Completá todos los productos'
    setErrors(e); return Object.keys(e).length === 0
  }

  async function guardar(exportar = false) {
    if (!validar()) return
    setSaving(true); setApiError('')
    try {
      const pedidoData = {
        clienteId, clienteNombre: clienteSeleccionado.nombre, clienteTelefono: clienteSeleccionado.telefono,
        fecha: new Date().toISOString(), estado: 'pendiente',
        items: items.map(i => ({ productoId: i.productoId !== '__custom' ? i.productoId : null, nombre: i.nombre, cantidad: Number(i.cantidad), precioUnitario: Number(i.precioUnitario), descuento: Number(i.descuento) })),
        ...totales, notas,
      }
      const pedido = await addPedido(pedidoData)
      if (exportar) exportPedidoPDF(pedido)
      navigate(`/pedidos/${pedido.id}`)
    } catch (err) { setApiError('Error al guardar: ' + err.message); setSaving(false) }
  }

  const inp = (err) => `w-full px-2.5 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Pedido</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Completá los datos del pedido</p>
      </div>

      {apiError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">{apiError}</div>}

      <div className="space-y-5">
        {/* Cliente */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Cliente</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busqCliente} onChange={e => { setBusqCliente(e.target.value); setMostrarClientes(true); setClienteId('') }} onFocus={() => setMostrarClientes(true)}
              placeholder="Buscar cliente..."
              className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cliente ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`} />
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {mostrarClientes && clientesFiltrados.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {clientesFiltrados.map(c => (
                  <button key={c.id} onMouseDown={() => seleccionarCliente(c)} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm border-b border-gray-50 dark:border-gray-600 last:border-0 transition-colors">
                    <p className="font-medium text-gray-900 dark:text-white">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.zona} · {c.telefono}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.cliente && <p className="text-xs text-red-500 mt-1">{errors.cliente}</p>}
          {clienteSeleccionado && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
              ✓ {clienteSeleccionado.nombre} · {clienteSeleccionado.telefono} · {clienteSeleccionado.direccion}
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Productos</h2>
            <button onClick={agregarItem} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={15} /> Agregar
            </button>
          </div>

          {errors.items && <p className="text-xs text-red-500 mb-3">{errors.items}</p>}

          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm">Hacé clic en "Agregar" para añadir productos</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-1">
                <div className="col-span-5">Producto</div><div className="col-span-2 text-center">Cant.</div>
                <div className="col-span-2 text-right">Precio</div><div className="col-span-1 text-center">Desc.</div><div className="col-span-2 text-right">Total</div>
              </div>
              {items.map(item => {
                const subtotalItem = item.cantidad * item.precioUnitario * (1 - item.descuento / 100)
                return (
                  <div key={item.id} className="grid sm:grid-cols-12 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="sm:col-span-5">
                      <select value={item.productoId} onChange={e => actualizarItem(item.id, 'productoId', e.target.value)} className={inp()}>
                        <option value="">-- Seleccionar --</option>
                        {state.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        <option value="__custom">+ Producto manual</option>
                      </select>
                      {item.productoId === '__custom' && (
                        <input value={item.nombre} onChange={e => actualizarItem(item.id, 'nombre', e.target.value)} placeholder="Nombre del producto" className={inp() + ' mt-1'} />
                      )}
                    </div>
                    <div className="sm:col-span-2"><input type="number" min="1" value={item.cantidad} onChange={e => actualizarItem(item.id, 'cantidad', e.target.value)} className={inp() + ' text-center'} /></div>
                    <div className="sm:col-span-2"><input type="number" min="0" value={item.precioUnitario} onChange={e => actualizarItem(item.id, 'precioUnitario', e.target.value)} className={inp() + ' text-right'} /></div>
                    <div className="sm:col-span-1 flex items-center justify-center">
                      {item.descuento > 0 ? <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">-{item.descuento}%</span> : <span className="text-xs text-gray-400">—</span>}
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{formatCurrency(subtotalItem)}</span>
                      <button onClick={() => eliminarItem(item.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {items.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Descuento automático: 12+ unidades = 5% · 24+ unidades = 10%</p>}
        </div>

        {/* Totales */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Subtotal</span><span>{formatCurrency(totales.subtotal)}</span></div>
              {totales.descuentoTotal > 0 && <div className="flex justify-between text-green-600 dark:text-green-400"><span>Descuento</span><span>- {formatCurrency(totales.descuentoTotal)}</span></div>}
              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-700 pt-2"><span>TOTAL</span><span>{formatCurrency(totales.total)}</span></div>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Notas (opcional)</h2>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: Entregar por la tarde, llamar antes..." rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/pedidos')} className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
          <button onClick={() => guardar(false)} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Pedido
          </button>
          <button onClick={() => guardar(true)} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl shadow transition-colors">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>
    </div>
  )
}
