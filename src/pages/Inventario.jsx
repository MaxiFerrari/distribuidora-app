import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/helpers'
import { Plus, Pencil, Trash2, AlertTriangle, Package, X, Loader2 } from 'lucide-react'

const EMPTY = { nombre: '', precio: '', unidad: 'unid', stock: '', stockMinimo: '12' }

export default function Inventario() {
  const { state, addProducto, updateProducto, deleteProducto } = useApp()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const stockBajo = state.productos.filter(p => p.stock <= p.stockMinimo)

  function abrirNuevo() { setForm(EMPTY); setErrors({}); setApiError(''); setModal({ mode: 'new' }) }
  function abrirEditar(p) { setForm({ ...p, precio: String(p.precio), stock: String(p.stock), stockMinimo: String(p.stockMinimo) }); setErrors({}); setApiError(''); setModal({ mode: 'edit' }) }

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.precio || isNaN(form.precio) || Number(form.precio) < 0) e.precio = 'Precio inválido'
    if (!form.stock || isNaN(form.stock)) e.stock = 'Stock inválido'
    setErrors(e); return Object.keys(e).length === 0
  }

  async function guardar() {
    if (!validar()) return
    setSaving(true); setApiError('')
    try {
      const data = { ...form, precio: Number(form.precio), stock: Number(form.stock), stockMinimo: Number(form.stockMinimo) }
      modal.mode === 'new' ? await addProducto(data) : await updateProducto(data)
      setModal(null)
    } catch (err) { setApiError(err.message) }
    finally { setSaving(false) }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    try { await deleteProducto(id) } catch (err) { alert('Error: ' + err.message) }
  }

  if (state.loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-500" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{state.productos.length} productos</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-colors">
          <Plus size={16} /> Agregar Producto
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="mb-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-orange-500" /><p className="font-semibold text-orange-800 dark:text-orange-400 text-sm">Stock bajo</p></div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map(p => <span key={p.id} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-lg">{p.nombre}: {p.stock} {p.unidad}</span>)}
          </div>
        </div>
      )}

      {state.productos.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500"><Package size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin productos</p></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Mínimo</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {state.productos.map(p => {
              const bajo = p.stock <= p.stockMinimo
              return (
                <div key={p.id} className={`sm:grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${bajo ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20' : ''}`}>
                  <div className="col-span-5 flex items-center gap-3 mb-2 sm:mb-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${bajo ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{p.nombre}</p>
                  </div>
                  <div className="col-span-2 text-right text-sm text-gray-700 dark:text-gray-300 font-medium">{formatCurrency(p.precio)}</div>
                  <div className="col-span-2 text-center"><span className={`text-sm font-semibold ${bajo ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>{p.stock} {p.unidad}</span></div>
                  <div className="col-span-2 text-center text-sm text-gray-500 dark:text-gray-400">{p.stockMinimo} {p.unidad}</div>
                  <div className="col-span-1 flex gap-1 justify-end">
                    <button onClick={() => abrirEditar(p)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"><Pencil size={14} className="text-gray-500 dark:text-gray-400" /></button>
                    <button onClick={() => eliminar(p.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modal.mode === 'new' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={18} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {apiError && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{apiError}</p>}
              <F label="Nombre *" error={errors.nombre}><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={i(errors.nombre)} placeholder="Ej: Coca-Cola 2.25L" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Precio *" error={errors.precio}><input type="number" min="0" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} className={i(errors.precio)} placeholder="1850" /></F>
                <F label="Unidad"><select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} className={i()}><option>unid</option><option>kg</option><option>lt</option><option>caja</option><option>docena</option></select></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Stock actual *" error={errors.stock}><input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={i(errors.stock)} placeholder="48" /></F>
                <F label="Stock mínimo"><input type="number" min="0" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))} className={i()} placeholder="12" /></F>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={guardar} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{modal.mode === 'new' ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function F({ label, error, children }) {
  return <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>{children}{error && <p className="text-xs text-red-500 mt-1">{error}</p>}</div>
}
function i(error) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}`
}
