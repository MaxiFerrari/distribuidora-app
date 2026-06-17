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
      // Obtener usuario_app
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios_app')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (usuarioError) throw usuarioError

      // Verificar si el usuario está activo
      if (!usuarioData.activo) {
        console.warn('Usuario inactivo. Contacta al administrador.')
      }

      setUsuarioApp(usuarioData)

      // Si tiene distribuidora_id, cargarla
      if (usuarioData.distribuidora_id) {
        const { data: distData, error: distError } = await supabase
          .from('distribuidoras')
          .select('*')
          .eq('id', usuarioData.distribuidora_id)
          .single()

        if (distError) {
          console.error('Error cargando distribuidora:', distError)
        } else {
          setDistribuidora(distData)
        }
      } else {
        setDistribuidora(null)
      }
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
