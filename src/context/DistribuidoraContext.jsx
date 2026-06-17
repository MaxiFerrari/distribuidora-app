import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const DistribuidoraContext = createContext(null)

export function DistribuidoraProvider({ children }) {
  const { user } = useAuth()
  const [distribuidora, setDistribuidora] = useState(null)
  const [usuarioApp, setUsuarioApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setDistribuidora(null)
      setUsuarioApp(null)
      setLoading(false)
      return
    }

    loadDistribuidoraData()
  }, [user])

  async function loadDistribuidoraData() {
    try {
      // Obtener usuario_app con su distribuidora
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios_app')
        .select(`
          *,
          distribuidora:distribuidoras(*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (usuarioError) throw usuarioError

      setUsuarioApp(usuarioData)
      setDistribuidora(usuarioData.distribuidora)
    } catch (error) {
      console.error('Error cargando distribuidora:', error)
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = usuarioApp?.rol === 'super_admin'
  const isOwner = usuarioApp?.rol === 'owner'
  const isEmpleado = usuarioApp?.rol === 'empleado'

  return (
    <DistribuidoraContext.Provider value={{
      distribuidora,
      usuarioApp,
      loading,
      isSuperAdmin,
      isOwner,
      isEmpleado,
      reload: loadDistribuidoraData
    }}>
      {children}
    </DistribuidoraContext.Provider>
  )
}

export function useDistribuidora() {
  return useContext(DistribuidoraContext)
}
