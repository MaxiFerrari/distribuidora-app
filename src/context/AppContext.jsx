import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useDistribuidora } from './DistribuidoraContext'

const AppContext = createContext(null)

const INITIAL_STATE = {
  clientes: [], pedidos: [], productos: [], notasCredito: [], loading: true, error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR':   return { ...state, error: action.payload, loading: false }
    case 'SET_DATA':    return { ...state, ...action.payload, loading: false, error: null }

    case 'ADD_CLIENTE':    return { ...state, clientes: [...state.clientes, action.payload] }
    case 'UPDATE_CLIENTE': return { ...state, clientes: state.clientes.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CLIENTE': return { ...state, clientes: state.clientes.filter(c => c.id !== action.payload) }

    case 'ADD_PRODUCTO':    return { ...state, productos: [...state.productos, action.payload] }
    case 'UPDATE_PRODUCTO': return { ...state, productos: state.productos.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PRODUCTO': return { ...state, productos: state.productos.filter(p => p.id !== action.payload) }

    case 'ADD_PEDIDO':    return { ...state, pedidos: [action.payload, ...state.pedidos] }
    case 'UPDATE_PEDIDO': return { ...state, pedidos: state.pedidos.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PEDIDO': return { ...state, pedidos: state.pedidos.filter(p => p.id !== action.payload) }

    case 'ADD_NOTA':    return { ...state, notasCredito: [action.payload, ...state.notasCredito] }
    case 'DELETE_NOTA': return { ...state, notasCredito: state.notasCredito.filter(n => n.id !== action.payload) }

    default: return state
  }
}

function normalizePedido(row, items = []) {
  return {
    id: row.id, clienteId: row.cliente_id, clienteNombre: row.cliente_nombre,
    clienteTelefono: row.cliente_telefono, fecha: row.fecha, estado: row.estado,
    estadoPago: row.estado_pago || 'pendiente',
    montoPagado: Number(row.monto_pagado || 0),
    fechaPago: row.fecha_pago,
    metodoPago: row.metodo_pago,
    subtotal: Number(row.subtotal), descuentoTotal: Number(row.descuento_total),
    total: Number(row.total), notas: row.notas,
    items: items.map(i => ({
      id: i.id, productoId: i.producto_id, nombre: i.nombre,
      cantidad: i.cantidad, precioUnitario: Number(i.precio_unitario), descuento: Number(i.descuento),
    })),
  }
}

function normalizeCliente(row) {
  return {
    id: row.id, nombre: row.nombre, telefono: row.telefono,
    direccion: row.direccion, zona: row.zona, notas: row.notas,
    descuentoGeneral: Number(row.descuento_general || 0),
  }
}

function normalizeProducto(row) {
  return { id: row.id, nombre: row.nombre, precio: Number(row.precio), unidad: row.unidad, stock: row.stock, stockMinimo: row.stock_minimo }
}

function normalizeNota(row) {
  return {
    id: row.id, pedidoId: row.pedido_id, clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre, fecha: row.fecha, motivo: row.motivo,
    monto: Number(row.monto), notas: row.notas,
  }
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const { distribuidora } = useDistribuidora()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const loadData = useCallback(async () => {
    if (!user) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [{ data: clientes }, { data: productos }, { data: pedidosRaw }, { data: itemsRaw }, { data: notasRaw }] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('pedido_items').select('*'),
        supabase.from('notas_credito').select('*').order('created_at', { ascending: false }),
      ])
      const pedidos = (pedidosRaw || []).map(p => normalizePedido(p, (itemsRaw || []).filter(i => i.pedido_id === p.id)))
      dispatch({ type: 'SET_DATA', payload: {
        clientes: (clientes || []).map(normalizeCliente),
        productos: (productos || []).map(normalizeProducto),
        pedidos,
        notasCredito: (notasRaw || []).map(normalizeNota),
      }})
    } catch (err) { dispatch({ type: 'SET_ERROR', payload: err.message }) }
  }, [user])

  useEffect(() => {
    if (user) { loadData() }
    else { dispatch({ type: 'SET_DATA', payload: { clientes: [], pedidos: [], productos: [], notasCredito: [] } }) }
  }, [user, loadData])

  // CLIENTES
  async function addCliente(data) {
    const { data: row, error } = await supabase.from('clientes')
      .insert({
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        zona: data.zona,
        notas: data.notas,
        descuento_general: data.descuentoGeneral || 0,
        user_id: user.id,
        distribuidora_id: distribuidora?.id
      })
      .select().single()
    if (error) throw error
    dispatch({ type: 'ADD_CLIENTE', payload: normalizeCliente(row) }); return row
  }

  async function updateCliente(data) {
    const { data: row, error } = await supabase.from('clientes')
      .update({ nombre: data.nombre, telefono: data.telefono, direccion: data.direccion, zona: data.zona, notas: data.notas, descuento_general: data.descuentoGeneral || 0 })
      .eq('id', data.id).select().single()
    if (error) throw error
    dispatch({ type: 'UPDATE_CLIENTE', payload: normalizeCliente(row) })
  }

  async function deleteCliente(id) {
    // Calcular deuda
    const pedidosCliente = state.pedidos.filter(p => p.clienteId === id && p.estado !== 'cancelado')
    const totalVentas = pedidosCliente.reduce((s,p) => s + p.total, 0)
    const totalPagado = pedidosCliente.reduce((s,p) => s + (p.montoPagado || 0), 0)
    const notas = state.notasCredito.filter(n => n.clienteId === id).reduce((s,n) => s + n.monto, 0)
    const deuda = totalVentas - totalPagado - notas

    if (deuda > 0) {
      const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
      throw new Error(`No se puede eliminar: el cliente tiene una deuda de ${formatCurrency(deuda)}`)
    }

    // Validar que no tenga pedidos pendientes
    const tienePedidosPendientes = state.pedidos.some(p => p.clienteId === id && p.estado === 'pendiente')
    if (tienePedidosPendientes) {
      throw new Error('No se puede eliminar: el cliente tiene pedidos pendientes')
    }

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_CLIENTE', payload: id })
  }

  // PRODUCTOS
  async function addProducto(data) {
    const { data: row, error } = await supabase.from('productos')
      .insert({ nombre: data.nombre, precio: data.precio, unidad: data.unidad, stock: data.stock, stock_minimo: data.stockMinimo, user_id: user.id, distribuidora_id: distribuidora?.id })
      .select().single()
    if (error) throw error
    dispatch({ type: 'ADD_PRODUCTO', payload: normalizeProducto(row) })
  }

  async function updateProducto(data) {
    const { data: row, error } = await supabase.from('productos')
      .update({ nombre: data.nombre, precio: data.precio, unidad: data.unidad, stock: data.stock, stock_minimo: data.stockMinimo })
      .eq('id', data.id).select().single()
    if (error) throw error
    dispatch({ type: 'UPDATE_PRODUCTO', payload: normalizeProducto(row) })
  }

  async function deleteProducto(id) {
    // Validar que no esté en pedidos pendientes
    const enUso = state.pedidos.some(p =>
      p.estado === 'pendiente' &&
      p.items.some(i => i.productoId === id)
    )

    if (enUso) {
      throw new Error('No se puede eliminar: el producto está en pedidos pendientes')
    }

    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_PRODUCTO', payload: id })
  }

  // PEDIDOS
  async function addPedido(data) {
    // 1. Validar stock disponible antes de crear el pedido
    for (const item of data.items) {
      if (item.productoId) {
        const producto = state.productos.find(p => p.id === item.productoId)
        if (producto && producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${producto.stock}, solicitado: ${item.cantidad}`)
        }
      }
    }

    // 2. Crear el pedido
    const { data: pedidoRow, error: pedidoError } = await supabase.from('pedidos')
      .insert({
        user_id: user.id, cliente_id: data.clienteId, cliente_nombre: data.clienteNombre,
        cliente_telefono: data.clienteTelefono || '', fecha: data.fecha, estado: data.estado,
        estado_pago: 'pendiente', monto_pagado: 0,
        subtotal: data.subtotal, descuento_total: data.descuentoTotal, total: data.total, notas: data.notas || '',
        distribuidora_id: distribuidora?.id
      }).select().single()
    if (pedidoError) throw pedidoError

    // 3. Insertar items
    const itemsPayload = data.items.map(i => ({
      pedido_id: pedidoRow.id, producto_id: i.productoId || null,
      nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precioUnitario, descuento: i.descuento,
    }))
    const { data: itemsRows, error: itemsError } = await supabase.from('pedido_items').insert(itemsPayload).select()
    if (itemsError) throw itemsError

    // 4. Deducir stock automáticamente para productos con productoId
    for (const item of data.items) {
      if (item.productoId) {
        const { data: success, error: stockError } = await supabase.rpc('deducir_stock', {
          p_user_id: user.id,
          p_producto_id: item.productoId,
          p_cantidad: item.cantidad,
          p_pedido_id: pedidoRow.id,
          p_razon: 'venta'
        })

        if (stockError || !success) {
          // Rollback: eliminar el pedido creado si falla la deducción de stock
          await supabase.from('pedidos').delete().eq('id', pedidoRow.id)
          throw new Error(`Error al deducir stock de ${item.nombre}: Stock insuficiente o producto no encontrado`)
        }

        // Actualizar estado local del producto
        const producto = state.productos.find(p => p.id === item.productoId)
        if (producto) {
          dispatch({ type: 'UPDATE_PRODUCTO', payload: { ...producto, stock: producto.stock - item.cantidad } })
        }
      }
    }

    const pedido = normalizePedido(pedidoRow, itemsRows)
    dispatch({ type: 'ADD_PEDIDO', payload: pedido })
    return pedido
  }

  async function updatePedido(data) {
    const existing = state.pedidos.find(p => p.id === data.id)

    // Si se cambia a "cancelado", restaurar el stock
    if (data.estado === 'cancelado' && existing?.estado !== 'cancelado') {
      for (const item of existing.items || []) {
        if (item.productoId) {
          await supabase.rpc('restaurar_stock', {
            p_user_id: user.id,
            p_producto_id: item.productoId,
            p_cantidad: item.cantidad,
            p_pedido_id: data.id,
            p_razon: 'cancelacion'
          })

          // Actualizar estado local
          const producto = state.productos.find(p => p.id === item.productoId)
          if (producto) {
            dispatch({ type: 'UPDATE_PRODUCTO', payload: { ...producto, stock: producto.stock + item.cantidad } })
          }
        }
      }
    }

    const { data: row, error } = await supabase.from('pedidos')
      .update({ estado: data.estado, notas: data.notas })
      .eq('id', data.id).select().single()
    if (error) throw error
    dispatch({ type: 'UPDATE_PEDIDO', payload: normalizePedido(row, existing?.items || []) })
  }

  async function updatePedidoFull(data) {
    // Actualiza pedido completo incluyendo items

    // 1. Obtener items anteriores para calcular el delta de stock
    const { data: itemsAnteriores } = await supabase.from('pedido_items')
      .select('*').eq('pedido_id', data.id)

    // 2. Validar stock disponible para los nuevos items
    for (const item of data.items) {
      if (item.productoId) {
        const producto = state.productos.find(p => p.id === item.productoId)
        const itemAnterior = itemsAnteriores?.find(i => i.producto_id === item.productoId)
        const cantidadAnterior = itemAnterior?.cantidad || 0
        const delta = item.cantidad - cantidadAnterior

        if (producto && delta > 0 && producto.stock < delta) {
          throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${producto.stock}, necesitas ${delta} adicionales`)
        }
      }
    }

    // 3. Actualizar el pedido
    const { data: row, error } = await supabase.from('pedidos')
      .update({ cliente_id: data.clienteId, cliente_nombre: data.clienteNombre, cliente_telefono: data.clienteTelefono || '',
        estado: data.estado, subtotal: data.subtotal, descuento_total: data.descuentoTotal, total: data.total, notas: data.notas || '' })
      .eq('id', data.id).select().single()
    if (error) throw error

    // 4. Restaurar stock de items anteriores
    for (const itemAnterior of itemsAnteriores || []) {
      if (itemAnterior.producto_id) {
        const { data: restored, error: restoreError } = await supabase.rpc('restaurar_stock', {
          p_user_id: user.id,
          p_producto_id: itemAnterior.producto_id,
          p_cantidad: itemAnterior.cantidad,
          p_pedido_id: data.id,
          p_razon: 'edicion'
        })

        if (restoreError || !restored) {
          throw new Error(`Error al restaurar stock de ${itemAnterior.nombre}`)
        }

        // Actualizar estado local
        const producto = state.productos.find(p => p.id === itemAnterior.producto_id)
        if (producto) {
          dispatch({ type: 'UPDATE_PRODUCTO', payload: { ...producto, stock: producto.stock + itemAnterior.cantidad } })
        }
      }
    }

    // 5. Eliminar items anteriores y crear nuevos
    await supabase.from('pedido_items').delete().eq('pedido_id', data.id)
    const itemsPayload = data.items.map(i => ({
      pedido_id: data.id, producto_id: i.productoId || null,
      nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precioUnitario, descuento: i.descuento,
    }))
    const { data: itemsRows } = await supabase.from('pedido_items').insert(itemsPayload).select()

    // 6. Deducir stock de los nuevos items
    for (const item of data.items) {
      if (item.productoId) {
        const { data: deducted, error: deductError } = await supabase.rpc('deducir_stock', {
          p_user_id: user.id,
          p_producto_id: item.productoId,
          p_cantidad: item.cantidad,
          p_pedido_id: data.id,
          p_razon: 'edicion'
        })

        if (deductError || !deducted) {
          throw new Error(`Error al deducir stock de ${item.nombre}: Stock insuficiente`)
        }

        // Actualizar estado local
        const producto = state.productos.find(p => p.id === item.productoId)
        if (producto) {
          dispatch({ type: 'UPDATE_PRODUCTO', payload: { ...producto, stock: producto.stock - item.cantidad } })
        }
      }
    }

    dispatch({ type: 'UPDATE_PEDIDO', payload: normalizePedido(row, itemsRows || []) })
  }

  async function deletePedido(id) {
    // Restaurar stock antes de eliminar el pedido (solo si no está cancelado)
    const pedido = state.pedidos.find(p => p.id === id)
    if (pedido && pedido.estado !== 'cancelado') {
      for (const item of pedido.items || []) {
        if (item.productoId) {
          await supabase.rpc('restaurar_stock', {
            p_user_id: user.id,
            p_producto_id: item.productoId,
            p_cantidad: item.cantidad,
            p_pedido_id: id,
            p_razon: 'cancelacion'
          })

          // Actualizar estado local
          const producto = state.productos.find(p => p.id === item.productoId)
          if (producto) {
            dispatch({ type: 'UPDATE_PRODUCTO', payload: { ...producto, stock: producto.stock + item.cantidad } })
          }
        }
      }
    }

    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_PEDIDO', payload: id })
  }

  // PAGOS
  async function registrarPago(pedidoId, monto, metodoPago) {
    const pedido = state.pedidos.find(p => p.id === pedidoId)
    if (!pedido) throw new Error('Pedido no encontrado')

    const montoPagado = (pedido.montoPagado || 0) + monto
    const estadoPago = montoPagado >= pedido.total ? 'pagado' : montoPagado > 0 ? 'parcial' : 'pendiente'
    const fechaPago = estadoPago === 'pagado' ? new Date().toISOString() : pedido.fechaPago

    const { data: row, error } = await supabase.from('pedidos')
      .update({
        estado_pago: estadoPago,
        monto_pagado: montoPagado,
        fecha_pago: fechaPago,
        metodo_pago: metodoPago
      })
      .eq('id', pedidoId).select().single()
    if (error) throw error

    dispatch({ type: 'UPDATE_PEDIDO', payload: normalizePedido(row, pedido.items) })
  }

  // NOTAS DE CRÉDITO
  async function addNotaCredito(data) {
    const { data: row, error } = await supabase.from('notas_credito')
      .insert({ user_id: user.id, pedido_id: data.pedidoId || null, cliente_id: data.clienteId || null,
        cliente_nombre: data.clienteNombre, fecha: new Date().toISOString(),
        motivo: data.motivo, monto: data.monto, notas: data.notas || '',
        distribuidora_id: distribuidora?.id })
      .select().single()
    if (error) throw error
    dispatch({ type: 'ADD_NOTA', payload: normalizeNota(row) }); return row
  }

  async function deleteNotaCredito(id) {
    const { error } = await supabase.from('notas_credito').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_NOTA', payload: id })
  }

  return (
    <AppContext.Provider value={{
      state,
      addCliente, updateCliente, deleteCliente,
      addProducto, updateProducto, deleteProducto,
      addPedido, updatePedido, updatePedidoFull, deletePedido, registrarPago,
      addNotaCredito, deleteNotaCredito,
      reload: loadData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
