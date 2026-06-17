import { useState, useEffect } from 'react'
import { useDistribuidora } from '../context/DistribuidoraContext'
import { supabase } from '../lib/supabase'
import { Plus, Building2, Users, Pencil, Trash2, X, Loader2, Mail, Phone, MapPin, Power, PowerOff } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

const EMPTY_DIST = { nombre: '', owner_email: '', telefono: '', direccion: '' }
const EMPTY_USER = { email: '', nombre_completo: '', rol: 'empleado', password: '' }

export default function Admin() {
  const { isSuperAdmin } = useDistribuidora()
  const [distribuidoras, setDistribuidoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalDist, setModalDist] = useState(null)
  const [modalUser, setModalUser] = useState(null)
  const [formDist, setFormDist] = useState(EMPTY_DIST)
  const [formUser, setFormUser] = useState(EMPTY_USER)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [selectedDist, setSelectedDist] = useState(null)
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    if (isSuperAdmin) loadDistribuidoras()
  }, [isSuperAdmin])

  async function loadDistribuidoras() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('distribuidoras')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDistribuidoras(data)
    } catch (err) {
      toast.error('Error al cargar distribuidoras: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsuarios(distribuidoraId) {
    try {
      const { data, error } = await supabase
        .from('usuarios_app')
        .select('*')
        .or(distribuidoraId ? `distribuidora_id.eq.${distribuidoraId},distribuidora_id.is.null` : 'distribuidora_id.is.null')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsuarios(data)
    } catch (err) {
      toast.error('Error al cargar usuarios: ' + err.message)
    }
  }

  async function guardarDistribuidora() {
    if (!formDist.nombre.trim() || !formDist.owner_email.trim()) {
      toast.error('Nombre y email del dueño son requeridos')
      return
    }

    setSaving(true)
    try {
      if (modalDist.mode === 'new') {
        const { data, error } = await supabase
          .from('distribuidoras')
          .insert([{
            nombre: formDist.nombre,
            owner_email: formDist.owner_email,
            telefono: formDist.telefono,
            direccion: formDist.direccion
          }])
          .select()
          .single()

        if (error) throw error
        setDistribuidoras([data, ...distribuidoras])
        toast.success('Distribuidora creada')
      } else {
        const { data, error } = await supabase
          .from('distribuidoras')
          .update({
            nombre: formDist.nombre,
            owner_email: formDist.owner_email,
            telefono: formDist.telefono,
            direccion: formDist.direccion
          })
          .eq('id', formDist.id)
          .select()
          .single()

        if (error) throw error
        setDistribuidoras(distribuidoras.map(d => d.id === data.id ? data : d))
        toast.success('Distribuidora actualizada')
      }
      setModalDist(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(id, activo) {
    try {
      const { error } = await supabase
        .from('distribuidoras')
        .update({ activo: !activo })
        .eq('id', id)

      if (error) throw error
      setDistribuidoras(distribuidoras.map(d => d.id === id ? { ...d, activo: !activo } : d))
      toast.success(!activo ? 'Distribuidora activada' : 'Distribuidora desactivada')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function eliminarDistribuidora() {
    try {
      const { error } = await supabase
        .from('distribuidoras')
        .delete()
        .eq('id', deleteModal.id)

      if (error) throw error
      setDistribuidoras(distribuidoras.filter(d => d.id !== deleteModal.id))
      toast.success('Distribuidora eliminada')
      setDeleteModal(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function guardarUsuario() {
    if (!formUser.email.trim() || !formUser.nombre_completo.trim()) {
      toast.error('Email y nombre completo son requeridos')
      return
    }

    setSaving(true)
    try {
      if (modalUser.mode === 'new') {
        // NOTA: Por ahora, los usuarios deben registrarse vía /login (signUp)
        // El trigger handle_new_user() los crea automáticamente en usuarios_app
        // Luego el admin puede editar su distribuidora y rol aquí
        toast.error('Por ahora, los usuarios deben registrarse vía /login. Luego puedes editar su distribuidora y rol aquí.')
        setSaving(false)
        return
      } else {
        const { error } = await supabase
          .from('usuarios_app')
          .update({
            nombre_completo: formUser.nombre_completo,
            rol: formUser.rol,
            distribuidora_id: formUser.distribuidora_id
          })
          .eq('id', formUser.id)

        if (error) throw error
        toast.success('Usuario actualizado')
        loadUsuarios(selectedDist)
      }
      setModalUser(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) return <Navigate to="/" replace />

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{distribuidoras.length} distribuidoras registradas</p>
        </div>
        <button onClick={() => { setFormDist(EMPTY_DIST); setModalDist({ mode: 'new' }) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-colors">
          <Plus size={16} /> Nueva Distribuidora
        </button>
      </div>

      {distribuidoras.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin distribuidoras</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {distribuidoras.map(d => (
            <div key={d.id} className={`bg-white dark:bg-gray-800 border rounded-xl p-5 ${d.activo ? 'border-gray-200 dark:border-gray-700' : 'border-gray-300 dark:border-gray-600 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${d.activo ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Building2 size={20} className={d.activo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{d.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{d.owner_email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActivo(d.id, d.activo)} title={d.activo ? 'Desactivar' : 'Activar'}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    {d.activo ? <Power size={16} className="text-green-500" /> : <PowerOff size={16} className="text-gray-400" />}
                  </button>
                  <button onClick={() => { setFormDist(d); setModalDist({ mode: 'edit' }) }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Pencil size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <button onClick={() => setDeleteModal({ id: d.id, nombre: d.nombre })}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              {d.telefono && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Phone size={14} /> {d.telefono}
                </div>
              )}
              {d.direccion && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <MapPin size={14} /> {d.direccion}
                </div>
              )}

              <button onClick={() => { setSelectedDist(d.id); loadUsuarios(d.id) }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <Users size={14} /> Ver usuarios
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Distribuidora */}
      {modalDist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modalDist.mode === 'new' ? 'Nueva Distribuidora' : 'Editar Distribuidora'}</h2>
              <button onClick={() => setModalDist(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Nombre *">
                <input value={formDist.nombre} onChange={e => setFormDist(f => ({ ...f, nombre: e.target.value }))}
                  className={inp()} placeholder="Ej: Distribuidora Don Pedro" />
              </Field>
              <Field label="Email del dueño *">
                <input type="email" value={formDist.owner_email} onChange={e => setFormDist(f => ({ ...f, owner_email: e.target.value }))}
                  className={inp()} placeholder="dueño@ejemplo.com" />
              </Field>
              <Field label="Teléfono">
                <input value={formDist.telefono || ''} onChange={e => setFormDist(f => ({ ...f, telefono: e.target.value }))}
                  className={inp()} placeholder="0381-4521234" />
              </Field>
              <Field label="Dirección">
                <input value={formDist.direccion || ''} onChange={e => setFormDist(f => ({ ...f, direccion: e.target.value }))}
                  className={inp()} placeholder="Av. Belgrano 1250" />
              </Field>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setModalDist(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={guardarDistribuidora} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modalDist.mode === 'new' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Usuarios */}
      {selectedDist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <h2 className="font-bold text-gray-900 dark:text-white">Usuarios</h2>
              <div className="flex gap-2">
                <button onClick={() => { setFormUser(EMPTY_USER); setModalUser({ mode: 'new' }) }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg">
                  <Plus size={14} /> Nuevo Usuario
                </button>
                <button onClick={() => { setSelectedDist(null); setUsuarios([]) }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {usuarios.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin usuarios</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usuarios.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.nombre_completo}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">{u.rol}</span>
                      </div>
                      <button onClick={() => { setFormUser(u); setModalUser({ mode: 'edit' }) }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                        <Pencil size={14} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Usuario */}
      {modalUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modalUser.mode === 'new' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <button onClick={() => setModalUser(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalUser.mode === 'new' && (
                <>
                  <Field label="Email *">
                    <input type="email" value={formUser.email} onChange={e => setFormUser(f => ({ ...f, email: e.target.value }))}
                      className={inp()} placeholder="usuario@ejemplo.com" />
                  </Field>
                  <Field label="Contraseña *">
                    <input type="password" value={formUser.password} onChange={e => setFormUser(f => ({ ...f, password: e.target.value }))}
                      className={inp()} placeholder="Mínimo 6 caracteres" />
                  </Field>
                </>
              )}
              <Field label="Nombre completo *">
                <input value={formUser.nombre_completo} onChange={e => setFormUser(f => ({ ...f, nombre_completo: e.target.value }))}
                  className={inp()} placeholder="Juan Pérez" />
              </Field>
              {modalUser.mode === 'edit' && (
                <Field label="Distribuidora">
                  <select value={formUser.distribuidora_id || ''} onChange={e => setFormUser(f => ({ ...f, distribuidora_id: e.target.value || null }))} className={inp()}>
                    <option value="">Sin asignar</option>
                    {distribuidoras.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Rol">
                <select value={formUser.rol} onChange={e => setFormUser(f => ({ ...f, rol: e.target.value }))} className={inp()}>
                  <option value="empleado">Empleado</option>
                  <option value="owner">Dueño</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setModalUser(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={guardarUsuario} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modalUser.mode === 'new' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <ConfirmModal
          title="Eliminar distribuidora"
          message={`¿Estás seguro de eliminar "${deleteModal.nombre}"? Esto eliminará todos sus datos (clientes, productos, pedidos). Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          onConfirm={eliminarDistribuidora}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>{children}</div>
}

function inp() {
  return `w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`
}
