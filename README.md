# Gestor de Pedidos — Distribuidoras Tucumán

Aplicación web MVP para gestionar pedidos, clientes e inventario en distribuidoras de bebidas y alimentos de Tucumán.

## Features

- **Dashboard** con ventas del día/semana, pedidos pendientes y alertas de stock bajo
- **Clientes** — CRUD completo con búsqueda por nombre, zona y teléfono
- **Nuevo Pedido** — selector de cliente, productos del inventario o manuales, descuento automático por volumen (12+ unid = 5%, 24+ = 10%), cálculo de totales en tiempo real
- **Historial de Pedidos** — filtros por estado y cliente, cambio de estado (pendiente/entregado/cancelado)
- **Inventario** — lista de productos con stock, alertas de stock mínimo
- **Exportar PDF** — genera comprobante del pedido listo para imprimir o enviar por WhatsApp
- **Persistencia local** — los datos se guardan en `localStorage` (sin backend requerido para el MVP)

## Stack

- React 18 + Vite
- Tailwind CSS v3
- React Router v6
- jsPDF (exportación PDF)
- lucide-react (iconos)

## Instalación

```bash
cd distribuidora-app
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`

## Build para producción

```bash
npm run build
```

Los archivos quedan en `dist/` listos para subir a Railway, Render o Vercel.

## Datos de demo

Al iniciar por primera vez carga datos de ejemplo:
- 3 clientes (Almacén Don Pedro, Kiosco La Esquina, Minimarket Central)
- 6 productos (gaseosas, agua, cerveza)
- 2 pedidos de ejemplo

Para resetear los datos: abrir DevTools → Application → Local Storage → eliminar la clave `distribuidora-data`.

## Descuentos automáticos

| Cantidad | Descuento |
|----------|-----------|
| 1–11 unidades | 0% |
| 12–23 unidades | 5% |
| 24+ unidades | 10% |

## Próximos pasos (post-MVP)

- Autenticación multi-usuario (Firebase Auth)
- Sincronización en la nube (Firestore)
- Estadísticas de ventas por período
- Gestión de precios por cliente
- Integración WhatsApp Business API
