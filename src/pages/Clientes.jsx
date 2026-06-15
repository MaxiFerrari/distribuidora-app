import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Plus, Search, Phone, MapPin, Pencil, Trash2, X, User, Loader2 } from 'lucide-react'

const ZONAS = ['Belgrano', 'Barrio Obrero', 'Centro', 'Norte', 'Sur', 'Otra']
const EMPTY = { nombre: '', telefono: '', direccion: '', zona: 'Centro', notas: '' }

export default function Clientes() {
  const { state, addCliente, updateCliente, deleteCliente } = useApp()
  const [searchParams] = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (searchParams.get('nuevo')) abrirNuevo()
  }, [])

  const filtrados = state.clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  )

  function abrirNuevo() {
    setForm(EMPTY)
    setErrors({})
    setApiError('')
    setModal({ mode: 'new' })
  }

  function abrirEditar(cliente) {
    setForm({ ...cliente })
    setErrors({})
    setApiError('')
    setModal({ mode: 'edit' })
  }

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.telefono.trim()) e.telefono = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function guardar() {
    if (!validar()) return
    setSaving(true)
    setApiError('')
    try {
      if (modal.mode === 'new') {
        await addCliente(form)
      } else {
        await updateCliente(form)
      }
      setModal(null)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await deleteCliente(id)
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  if (state.loading) return <Loading />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{state.clientes.length} registrados</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-colors">
          <Plus size={16} /> Agregar Cliente
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, zona o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin clientes</p>
          <p className="text-sm">Agregá el primer cliente para empezar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtrados.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold">{c.nombre[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.nombre}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.zona}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => abrirEditar(c)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil size={15} className="text-gray-500" />
                  </button>
                  <button onClick={() => eliminar(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={13} className="shrink-0" /><span>{c.telefono}</span>
                </div>
                {c.direccion && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={13} className="shrink-0" /><span className="truncate">{c.direccion}</span>
                  </div>
                )}
                {c.notas && <p className="text-xs text-gray-400 italic mt-1">{c.notas}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.mode === 'new' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {apiError && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{apiError}</p>}
              <Field label="Nombre / Razón social *" error={errors.nombre}>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls(errors.nombre)} placeholder="Ej: Almacén Don Pedro" />
              </Field>
              <Field label="Teléfono *" error={errors.telefono}>
                <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className={inputCls(errors.telefono)} placeholder="Ej: 0381-4521234" />
              </Field>
              <Field label="Dirección">
                <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} className={inputCls()} placeholder="Ej: Av. Belgrano 1250" />
              </Field>
              <Field label="Zona">
                <select value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} className={inputCls()}>
                  {ZONAS.map(z => <option key={z}>{z}</option>)}
                </select>
              </Field>
              <Field label="Notas">
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className={inputCls() + ' resize-none'} rows={2} placeholder="Ej: Paga los viernes..." />
              </Field>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={guardar} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modal.mode === 'new' ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-gray-200'}`
}
