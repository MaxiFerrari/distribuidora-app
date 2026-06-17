# MVP Completo - Plan de Implementación

## ✅ COMPLETADO (3/17)

### 1. Sistema de Notificaciones
- ✅ Instalado `react-hot-toast`
- ✅ Configurado `<Toaster />` en App.jsx
- ✅ Variables CSS para dark mode en index.css
- ✅ Creado `csvExport.js` con funciones helper

### 2. Validación de Stock RPC
- ✅ `addPedido`: Ahora valida respuesta de `deducir_stock()` y hace rollback si falla

---

## 🚧 EN PROGRESO - Instrucciones detalladas

### 3. Validar RPC en updatePedidoFull ⏳
**Archivo:** `src/context/AppContext.jsx` líneas 232-248

**Cambiar:**
```js
await supabase.rpc('restaurar_stock', { ... })
// y
await supabase.rpc('deducir_stock', { ... })
```

**Por:**
```js
const { data: restored, error: restoreError } = await supabase.rpc('restaurar_stock', { ... })
if (restoreError || !restored) {
  throw new Error(`Error al restaurar stock de ${itemAnterior.nombre}`)
}

const { data: deducted, error: deductError } = await supabase.rpc('deducir_stock', { ... })
if (deductError || !deducted) {
  // Rollback: re-deducir los items anteriores
  throw new Error(`Error al deducir stock de ${item.nombre}`)
}
```

---

### 4. Prevenir eliminación de productos en uso ⏳
**Archivo:** `src/context/AppContext.jsx` línea 145

**Agregar validación en `deleteProducto`:**
```js
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
```

---

### 5. Prevenir eliminación de clientes con deuda ⏳
**Archivo:** `src/context/AppContext.jsx` línea 126

**Agregar validación en `deleteCliente`:**
```js
async function deleteCliente(id) {
  // Calcular deuda
  const pedidosCliente = state.pedidos.filter(p => p.clienteId === id && p.estado !== 'cancelado')
  const totalVentas = pedidosCliente.reduce((s,p) => s + p.total, 0)
  const totalPagado = pedidosCliente.reduce((s,p) => s + (p.montoPagado || 0), 0)
  const notas = state.notasCredito.filter(n => n.clienteId === id).reduce((s,n) => s + n.monto, 0)
  const deuda = totalVentas - totalPagado - notas

  if (deuda > 0) {
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
```

---

### 6. Validar monto de pago ⏳
**Archivo:** `src/pages/DetallePedido.jsx` línea 72

**Cambiar `guardarPago`:**
```js
async function guardarPago() {
  const monto = Number(pagoForm.monto)

  if (!monto || monto <= 0) {
    alert('El monto debe ser mayor a 0')
    return
  }

  if (monto > saldoPendiente) {
    alert(`El monto no puede exceder el saldo pendiente (${formatCurrency(saldoPendiente)})`)
    return
  }

  setSavingPago(true)
  try {
    await registrarPago(pedido.id, monto, pagoForm.metodoPago)
    setModalPago(false)
    setPagoForm({ monto: '', metodoPago: 'efectivo' })
    toast.success('Pago registrado correctamente')
  } catch (err) {
    toast.error('Error: ' + err.message)
  } finally {
    setSavingPago(false)
  }
}
```

---

### 7. Validación de teléfono ⏳
**Archivo:** `src/pages/Clientes.jsx` línea 31

**Cambiar función `validar`:**
```js
function validar() {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'Requerido'

  if (!form.telefono.trim()) {
    e.telefono = 'Requerido'
  } else {
    // Validar formato argentino: debe tener al menos 10 dígitos
    const digits = form.telefono.replace(/\D/g, '')
    if (digits.length < 10) {
      e.telefono = 'Debe tener al menos 10 dígitos'
    }
  }

  setErrors(e)
  return Object.keys(e).length === 0
}
```

---

### 8-10. Reemplazar confirm() con modales ⏳

#### Crear componente ConfirmModal:
**Archivo:** `src/components/ConfirmModal.jsx` (NUEVO)

```jsx
import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title, message, confirmText = 'Eliminar', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### Usar en Clientes.jsx:
```jsx
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'

// Agregar estado
const [deleteModal, setDeleteModal] = useState(null)

// Cambiar función eliminar:
function eliminar(e, id) {
  e.stopPropagation()
  const cliente = state.clientes.find(c => c.id === id)
  setDeleteModal({ id, nombre: cliente.nombre })
}

async function confirmarEliminar() {
  try {
    await deleteCliente(deleteModal.id)
    toast.success('Cliente eliminado')
    setDeleteModal(null)
  } catch (err) {
    toast.error(err.message)
  }
}

// En el JSX, después del modal actual:
{deleteModal && (
  <ConfirmModal
    title="Eliminar cliente"
    message={`¿Estás seguro de eliminar a ${deleteModal.nombre}? Esta acción no se puede deshacer.`}
    confirmText="Eliminar"
    onConfirm={confirmarEliminar}
    onCancel={() => setDeleteModal(null)}
  />
)}
```

**Repetir el mismo patrón en:**
- Inventario.jsx (eliminar producto)
- DetallePedido.jsx (eliminar pedido)

---

### 11-13. Exportar a CSV ⏳

#### En Clientes.jsx:
```jsx
import { exportToCSV, prepareClientesForCSV } from '../utils/csvExport'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

function exportarCSV() {
  try {
    const data = prepareClientesForCSV(state.clientes)
    exportToCSV(data, `clientes-${new Date().toISOString().slice(0,10)}.csv`)
    toast.success('Clientes exportados a CSV')
  } catch (err) {
    toast.error('Error al exportar: ' + err.message)
  }
}

// Agregar botón junto a "Agregar Cliente":
<button onClick={exportarCSV} className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors">
  <Download size={16} /> Exportar CSV
</button>
```

**Repetir en:**
- Inventario.jsx con `prepareProductosForCSV`
- Pedidos.jsx con `preparePedidosForCSV`

---

### 14-17. Paginación ⏳

#### Crear hook usePagination:
**Archivo:** `src/hooks/usePagination.js` (NUEVO)

```js
import { useState, useMemo } from 'react'

export function usePagination(items, itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  }, [items, currentPage, itemsPerPage])

  function nextPage() {
    setCurrentPage(p => Math.min(p + 1, totalPages))
  }

  function prevPage() {
    setCurrentPage(p => Math.max(p - 1, 1))
  }

  function goToPage(page) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}
```

#### Componente Pagination:
**Archivo:** `src/components/Pagination.jsx` (NUEVO)

```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onNext, onPrev, hasNext, hasPrev }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
```

#### Usar en Pedidos.jsx:
```jsx
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

// En el componente:
const { paginatedItems, ...pagination } = usePagination(filtrados, 50)

// Reemplazar {filtrados.map(...)} por {paginatedItems.map(...)}

// Al final de la lista, agregar:
<Pagination {...pagination} />
```

**Repetir en:**
- Clientes.jsx
- Inventario.jsx

---

## 📊 RESUMEN DE ESFUERZO

| Tarea | Tiempo estimado | Prioridad |
|-------|----------------|-----------|
| ✅ Toast notifications | ~30 min | ALTA |
| ✅ CSV helper | ~20 min | ALTA |
| ✅ Validar RPC addPedido | ~15 min | CRÍTICA |
| ⏳ Validar RPC updatePedidoFull | ~20 min | CRÍTICA |
| ⏳ Prevenir eliminar producto | ~10 min | CRÍTICA |
| ⏳ Prevenir eliminar cliente | ~15 min | CRÍTICA |
| ⏳ Validar monto pago | ~10 min | CRÍTICA |
| ⏳ Validar teléfono | ~10 min | ALTA |
| ⏳ Modal de confirmación | ~30 min | ALTA |
| ⏳ Exportar CSV (3 páginas) | ~20 min | ALTA |
| ⏳ Paginación (3 páginas) | ~40 min | MEDIA |

**Total restante:** ~3 horas

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Crítico primero:**
   - Validar RPC updatePedidoFull
   - Prevenir eliminaciones
   - Validar monto pago

2. **Mejorar UX:**
   - Validar teléfono
   - Modal de confirmación
   - Usar toast en todas las operaciones

3. **Funcionalidad:**
   - Exportar CSV
   - Paginación

---

## 📝 NOTAS IMPORTANTES

- Importar `toast` de `react-hot-toast` en TODOS los archivos que modifiques
- Reemplazar TODOS los `alert()` y `setApiError()` por `toast.error()` y `toast.success()`
- Agregar `import { formatCurrency } from '../utils/helpers'` donde sea necesario
- Crear la carpeta `src/hooks/` y `src/components/` si no existen

---

## ✅ TESTING ANTES DE PRODUCCIÓN

Probar:
1. Crear pedido sin stock → debe fallar con toast
2. Editar pedido cambiando cantidades → debe ajustar stock
3. Intentar borrar producto en pedido pendiente → debe mostrar error
4. Intentar borrar cliente con deuda → debe mostrar error
5. Registrar pago mayor al saldo → debe rechazar
6. Ingresar teléfono con menos de 10 dígitos → debe rechazar
7. Exportar CSV de clientes, productos, pedidos → debe descargar
8. Navegar paginación en Pedidos/Clientes/Inventario → debe funcionar

---

**Estado actual:** 3 de 17 tareas completadas (17.6%)
**Tiempo invertido:** ~1 hora
**Tiempo restante estimado:** ~3 horas
