# 🔄 Modo Offline - Implementación en Progreso

## ✅ Completado

1. **Infraestructura Base**
   - ✅ IndexedDB wrapper (`src/lib/offline-db.js`)
   - ✅ Hook `useOnlineStatus` para detectar conexión
   - ✅ `OfflineContext` con sincronización automática
   - ✅ `OfflineProvider` integrado en App.jsx

2. **UI**
   - ✅ Banner de estado en Layout (sin conexión, sincronizando, pendientes)
   - ✅ Contador de pedidos pendientes

3. **Caché**
   - ✅ `AppContext` cachea clientes, productos, pedidos cuando hay internet
   - ✅ `AppContext` usa cache cuando NO hay internet

## ⏳ Pendiente

### **1. Modificar `addPedido` en AppContext (CRÍTICO)**

```javascript
// src/context/AppContext.jsx - línea ~232

async function addPedido(data) {
  // Si está OFFLINE, guardar en IndexedDB
  if (!online) {
    const offlinePedido = await createOfflinePedido({
      userId: user.id,
      distribuidoraId: distribuidora?.id,
      clienteId: data.clienteId,
      clienteNombre: data.clienteNombre,
      clienteTelefono: data.clienteTelefono,
      fecha: data.fecha,
      estado: data.estado,
      subtotal: data.subtotal,
      descuentoTotal: data.descuentoTotal,
      total: data.total,
      notas: data.notas,
      items: data.items
    })

    // Despachar localmente (mostrar en la UI con badge "pendiente")
    dispatch({ type: 'ADD_PEDIDO', payload: {
      id: offlinePedido.tempId,
      ...data,
      isPending: true // flag para mostrar badge
    }})

    return offlinePedido
  }

  // Si está ONLINE, flujo normal (ya existente)
  // ... resto del código original
}
```

### **2. Mostrar Badge "Pendiente Sincronizar" en Pedidos**

```jsx
// src/pages/Pedidos.jsx

{p.isPending && (
  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
    🟠 Pendiente sincronizar
  </span>
)}
```

### **3. Actualizar State Después de Sincronizar**

```javascript
// src/context/OfflineContext.jsx - después de sincronizar exitosamente

// Recargar datos de Supabase para mostrar pedidos sincronizados
// (llamar a loadData() del AppContext)
```

### **4. Testing Manual**

- [ ] Crear pedido CON internet → funciona normal
- [ ] Desconectar internet (Dev Tools → Network → Offline)
- [ ] Crear pedido SIN internet → se guarda con badge "pendiente"
- [ ] Reconectar internet → sincroniza automáticamente
- [ ] Verificar que pedido aparece en Supabase

---

## 📝 Notas de Implementación

### Estructura de Pedido Offline:

```javascript
{
  tempId: "offline_1734567890_abc123", // ID temporal
  userId: "uuid",
  distribuidoraId: "uuid",
  clienteId: "uuid",
  clienteNombre: "Don Pedro",
  clienteTelefono: "381-4521234",
  fecha: "2026-06-17T...",
  estado: "pendiente",
  subtotal: 10000,
  descuentoTotal: 500,
  total: 9500,
  notas: "Entregar mañana",
  items: [
    { productoId: "uuid", nombre: "Coca 2.25L", cantidad: 12, precioUnitario: 850, descuento: 42.5 }
  ],
  createdOffline: true,
  createdAt: 1734567890
}
```

### Sincronización:

1. Detecta que vuelve internet (evento `online`)
2. Obtiene todos los pedidos de `STORES.PEDIDOS_PENDIENTES`
3. Para cada pedido:
   - Crea en `pedidos` table
   - Crea en `pedido_items` table
   - Llama `deducir_stock` RPC
   - Si TODO ok → elimina de IndexedDB
   - Si falla → mantiene en IndexedDB, incrementa `attempts`
4. Muestra toast con resultado

---

## 🚀 Próximos Pasos (Orden de Prioridad)

1. **Modificar `addPedido`** para detectar offline y usar `createOfflinePedido`
2. **Agregar badge "pendiente"** en lista de pedidos
3. **Testing manual** con Network offline
4. **Refresh después de sincronizar** para mostrar IDs reales
5. **Manejo de conflictos** si stock ya no está disponible

---

## 💡 Mejoras Futuras (No Urgentes)

- [ ] Sincronizar edición de pedidos offline
- [ ] Sincronizar creación de clientes/productos offline
- [ ] Botón manual "Forzar sincronización"
- [ ] Indicador de "último sync" con timestamp
- [ ] Resolver conflictos de stock (si 2 vendedores venden lo mismo offline)
- [ ] Service Worker para cache de assets estáticos
- [ ] Notificación push cuando sincroniza exitosamente

---

## ⚠️ Limitaciones Actuales

- Solo pedidos se pueden crear offline (clientes/productos NO)
- No se puede editar/eliminar offline
- Si sincronización falla, quedan pedidos pendientes (manual cleanup)
- Stock no se deduce localmente (solo al sincronizar)

---

## 🧪 Testing Checklist

- [ ] Crear pedido online → funciona
- [ ] Desconectar internet
- [ ] Crear pedido offline → muestra badge "pendiente"
- [ ] Ver pedido offline en lista
- [ ] Banner muestra "1 pendiente"
- [ ] Reconectar internet
- [ ] Banner cambia a "Sincronizando"
- [ ] Toast de éxito "1 pedido sincronizado"
- [ ] Pedido ya no tiene badge pendiente
- [ ] Pedido aparece en Supabase con ID real
- [ ] Stock se dedujo correctamente

---

Tiempo estimado restante: **2-3 horas** para completar e integrar todo.
