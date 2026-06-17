import { createContext, useContext, useEffect, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { offlineDB, STORES } from '../lib/offline-db'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const OfflineContext = createContext(null)

export function OfflineProvider({ children }) {
  const online = useOnlineStatus()
  const { user } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Inicializar IndexedDB
  useEffect(() => {
    offlineDB.init().catch(err => {
      console.error('Error inicializando IndexedDB:', err)
    })
  }, [])

  // Contar pedidos pendientes de sincronización
  useEffect(() => {
    async function countPending() {
      try {
        const pendientes = await offlineDB.getAll(STORES.PEDIDOS_PENDIENTES)
        setPendingCount(pendientes.length)
      } catch (err) {
        console.error('Error contando pedidos pendientes:', err)
      }
    }

    countPending()
    // Actualizar cada 5 segundos
    const interval = setInterval(countPending, 5000)
    return () => clearInterval(interval)
  }, [syncing])

  // Sincronizar cuando vuelve la conexión
  useEffect(() => {
    if (online && user && !syncing) {
      syncPendingData()
    }
  }, [online, user])

  async function syncPendingData() {
    if (syncing) return

    setSyncing(true)

    try {
      // Obtener pedidos pendientes
      const pedidosPendientes = await offlineDB.getAll(STORES.PEDIDOS_PENDIENTES)

      if (pedidosPendientes.length === 0) {
        setSyncing(false)
        return
      }

      console.log(`🔄 Sincronizando ${pedidosPendientes.length} pedidos pendientes...`)

      let sincronizados = 0
      let fallidos = 0

      for (const pedido of pedidosPendientes) {
        try {
          // Remover campos temporales
          const { tempId, createdOffline, ...pedidoData } = pedido

          // Crear pedido en Supabase
          const { data: pedidoRow, error: pedidoError } = await supabase
            .from('pedidos')
            .insert([{
              user_id: pedidoData.userId,
              distribuidora_id: pedidoData.distribuidoraId,
              cliente_id: pedidoData.clienteId,
              cliente_nombre: pedidoData.clienteNombre,
              cliente_telefono: pedidoData.clienteTelefono || '',
              fecha: pedidoData.fecha,
              estado: pedidoData.estado,
              estado_pago: 'pendiente',
              monto_pagado: 0,
              subtotal: pedidoData.subtotal,
              descuento_total: pedidoData.descuentoTotal,
              total: pedidoData.total,
              notas: pedidoData.notas || ''
            }])
            .select()
            .single()

          if (pedidoError) throw pedidoError

          // Crear items del pedido
          const itemsPayload = pedidoData.items.map(i => ({
            pedido_id: pedidoRow.id,
            producto_id: i.productoId || null,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio_unitario: i.precioUnitario,
            descuento: i.descuento
          }))

          const { error: itemsError } = await supabase
            .from('pedido_items')
            .insert(itemsPayload)

          if (itemsError) throw itemsError

          // Deducir stock
          for (const item of pedidoData.items) {
            if (item.productoId) {
              await supabase.rpc('deducir_stock', {
                p_user_id: pedidoData.userId,
                p_producto_id: item.productoId,
                p_cantidad: item.cantidad,
                p_pedido_id: pedidoRow.id,
                p_razon: 'venta'
              })
            }
          }

          // Eliminar de pendientes
          await offlineDB.delete(STORES.PEDIDOS_PENDIENTES, tempId)

          sincronizados++
          console.log(`✅ Pedido ${tempId} sincronizado`)
        } catch (err) {
          console.error(`❌ Error sincronizando pedido ${pedido.tempId}:`, err)
          fallidos++
        }
      }

      if (sincronizados > 0) {
        toast.success(`✅ ${sincronizados} pedido(s) sincronizado(s)`)
      }

      if (fallidos > 0) {
        toast.error(`❌ ${fallidos} pedido(s) no se pudieron sincronizar`)
      }
    } catch (err) {
      console.error('Error en sincronización:', err)
      toast.error('Error al sincronizar datos offline')
    } finally {
      setSyncing(false)
    }
  }

  // Cachear datos cuando hay conexión
  async function cacheData(clientes, productos, pedidos) {
    try {
      if (clientes?.length > 0) {
        await offlineDB.saveMany(STORES.CLIENTES, clientes)
      }
      if (productos?.length > 0) {
        await offlineDB.saveMany(STORES.PRODUCTOS, productos)
      }
      if (pedidos?.length > 0) {
        await offlineDB.saveMany(STORES.PEDIDOS, pedidos)
      }
      console.log('📦 Datos cacheados para uso offline')
    } catch (err) {
      console.error('Error cacheando datos:', err)
    }
  }

  // Obtener datos cacheados
  async function getCachedData() {
    try {
      const [clientes, productos, pedidos] = await Promise.all([
        offlineDB.getAll(STORES.CLIENTES),
        offlineDB.getAll(STORES.PRODUCTOS),
        offlineDB.getAll(STORES.PEDIDOS)
      ])
      return { clientes, productos, pedidos }
    } catch (err) {
      console.error('Error obteniendo datos cacheados:', err)
      return { clientes: [], productos: [], pedidos: [] }
    }
  }

  // Crear pedido offline
  async function createOfflinePedido(pedidoData) {
    try {
      const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const offlinePedido = {
        tempId,
        ...pedidoData,
        createdOffline: true,
        createdAt: Date.now()
      }

      await offlineDB.save(STORES.PEDIDOS_PENDIENTES, offlinePedido)

      console.log('💾 Pedido guardado offline:', tempId)
      toast.success('📦 Pedido guardado. Se sincronizará cuando vuelva internet', { duration: 5000 })

      return offlinePedido
    } catch (err) {
      console.error('Error guardando pedido offline:', err)
      throw err
    }
  }

  return (
    <OfflineContext.Provider value={{
      online,
      syncing,
      pendingCount,
      cacheData,
      getCachedData,
      createOfflinePedido,
      syncPendingData
    }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  return useContext(OfflineContext)
}
