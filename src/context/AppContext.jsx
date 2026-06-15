import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

const INITIAL_STATE = {
  clientes: [],
  pedidos: [],
  productos: [],
  loading: true,
  error: null,
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

    default: return state
  }
}

// Convierte snake_case de Supabase a camelCase para la app
function normalizePedido(row, items = []) {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre,
    clienteTelefono: row.cliente_telefono,
    fecha: row.fecha,
    estado: row.estado,
    subtotal: Number(row.subtotal),
    descuentoTotal: Number(row.descuento_total),
    total: Number(row.total),
    notas: row.notas,
    items: items.map(i => ({
      id: i.id,
      productoId: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: Number(i.precio_unitario),
      descuento: Number(i.descuento),
    })),
  }
}

function normalizeCliente(row) {
  return { id: row.id, nombre: row.nombre, telefono: row.telefono, direccion: row.direccion, zona: row.zona, notas: row.notas }
}

function normalizeProducto(row) {
  return { id: row.id, nombre: row.nombre, precio: Number(row.precio), unidad: row.unidad, stock: row.stock, stockMinimo: row.stock_minimo }
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const loadData = useCallback(async () => {
    if (!user) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [{ data: clientes }, { data: productos }, { data: pedidosRaw }, { data: itemsRaw }] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('pedido_items').select('*'),
      ])

      const pedidos = (pedidosRaw || []).map(p => {
        const items = (itemsRaw || []).filter(i => i.pedido_id === p.id)
        return normalizePedido(p, items)
      })

      dispatch({
        type: 'SET_DATA',
        payload: {
          clientes: (clientes || []).map(normalizeCliente),
          productos: (productos || []).map(normalizeProducto),
          pedidos,
        },
      })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      dispatch({ type: 'SET_DATA', payload: { clientes: [], pedidos: [], productos: [] } })
    }
  }, [user, loadData])

  // CLIENTES
  async function addCliente(data) {
    const { data: row, error } = await supabase.from('clientes')
      .insert({ ...data, user_id: user.id })
      .select().single()
    if (error) throw error
    dispatch({ type: 'ADD_CLIENTE', payload: normalizeCliente(row) })
    return row
  }

  async function updateCliente(data) {
    const { data: row, error } = await supabase.from('clientes')
      .update({ nombre: data.nombre, telefono: data.telefono, direccion: data.direccion, zona: data.zona, notas: data.notas })
      .eq('id', data.id).select().single()
    if (error) throw error
    dispatch({ type: 'UPDATE_CLIENTE', payload: normalizeCliente(row) })
  }

  async function deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_CLIENTE', payload: id })
  }

  // PRODUCTOS
  async function addProducto(data) {
    const { data: row, error } = await supabase.from('productos')
      .insert({ nombre: data.nombre, precio: data.precio, unidad: data.unidad, stock: data.stock, stock_minimo: data.stockMinimo, user_id: user.id })
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
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_PRODUCTO', payload: id })
  }

  // PEDIDOS
  async function addPedido(data) {
    const { data: pedidoRow, error: pedidoError } = await supabase.from('pedidos')
      .insert({
        user_id: user.id,
        cliente_id: data.clienteId,
        cliente_nombre: data.clienteNombre,
        cliente_telefono: data.clienteTelefono || '',
        fecha: data.fecha,
        estado: data.estado,
        subtotal: data.subtotal,
        descuento_total: data.descuentoTotal,
        total: data.total,
        notas: data.notas || '',
      })
      .select().single()
    if (pedidoError) throw pedidoError

    const itemsPayload = data.items.map(i => ({
      pedido_id: pedidoRow.id,
      producto_id: i.productoId || null,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precioUnitario,
      descuento: i.descuento,
    }))

    const { data: itemsRows, error: itemsError } = await supabase.from('pedido_items').insert(itemsPayload).select()
    if (itemsError) throw itemsError

    const pedido = normalizePedido(pedidoRow, itemsRows)
    dispatch({ type: 'ADD_PEDIDO', payload: pedido })
    return pedido
  }

  async function updatePedido(data) {
    const { data: row, error } = await supabase.from('pedidos')
      .update({ estado: data.estado, notas: data.notas })
      .eq('id', data.id).select().single()
    if (error) throw error
    // Mantener items del estado local
    const existing = state.pedidos.find(p => p.id === data.id)
    dispatch({ type: 'UPDATE_PEDIDO', payload: normalizePedido(row, existing?.items || []) })
  }

  async function deletePedido(id) {
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_PEDIDO', payload: id })
  }

  return (
    <AppContext.Provider value={{
      state,
      addCliente, updateCliente, deleteCliente,
      addProducto, updateProducto, deleteProducto,
      addPedido, updatePedido, deletePedido,
      reload: loadData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
