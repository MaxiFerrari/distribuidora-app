# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aplicación web MVP para gestionar pedidos, clientes e inventario en distribuidoras de bebidas y alimentos de Tucumán. Incluye autenticación, gestión de clientes/productos/pedidos, exportación PDF, escáner de códigos de barras, estadísticas, notas de crédito, modo oscuro, PWA, y **sistema multi-tenant** que permite administrar múltiples distribuidoras con datos aislados.

## Commands

**Development:**
```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Build for production (output: dist/)
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Tech Stack

- **Frontend:** React 19 + Vite 8
- **Routing:** React Router v7
- **Backend:** Supabase (Auth + PostgreSQL)
- **Styling:** Tailwind CSS v3
- **Charts:** Recharts
- **Icons:** lucide-react
- **PDF:** jsPDF + html2canvas
- **Barcode:** @zxing/browser
- **PWA:** vite-plugin-pwa (Workbox)

## Architecture

### Context Providers (4-layer hierarchy)

The app uses a nested context structure in [App.jsx](src/App.jsx):

```
ThemeProvider (outermost)
  └─ AuthProvider
      └─ DistribuidoraProvider
          └─ AppProvider (only mounted when authenticated)
```

- **ThemeProvider** ([ThemeContext.jsx](src/context/ThemeContext.jsx)): Manages dark mode, persists to localStorage
- **AuthProvider** ([AuthContext.jsx](src/context/AuthContext.jsx)): Supabase auth session, provides `user`, `signIn`, `signUp`, `signOut`
- **DistribuidoraProvider** ([DistribuidoraContext.jsx](src/context/DistribuidoraContext.jsx)): Multi-tenant context, provides `distribuidora`, `usuarioApp`, `isSuperAdmin`, `isOwner`, `isEmpleado`
- **AppProvider** ([AppContext.jsx](src/context/AppContext.jsx)): Core business data (clientes, productos, pedidos, notasCredito) with CRUD operations. Uses `useReducer` for state. All data fetched from Supabase on mount and kept in sync via dispatch actions.

### Data Flow

1. **Authentication:** Login → `AuthContext.signIn()` → Supabase Auth → `user` state updates
2. **Data Loading:** `user` changes → `AppContext.loadData()` → fetches all tables from Supabase → normalizes to camelCase → stores in reducer state
3. **CRUD Operations:** UI calls `AppContext` methods (e.g., `addPedido`) → inserts to Supabase → dispatches action to update local state
4. **Normalization:** Supabase returns snake_case; normalization functions (`normalizeCliente`, `normalizePedido`, etc.) convert to camelCase for React consumption

### Key Data Structures

**Pedido (Order):**
```js
{
  id, clienteId, clienteNombre, clienteTelefono, fecha, estado,
  estadoPago, montoPagado, fechaPago, metodoPago,
  subtotal, descuentoTotal, total, notas,
  items: [{ id, productoId, nombre, cantidad, precioUnitario, descuento }]
}
```

**Cliente (Customer):**
```js
{ id, nombre, telefono, direccion, zona, notas, descuentoGeneral }
```

**Producto (Product):**
```js
{ id, nombre, precio, unidad, stock, stockMinimo }
```

**Nota de Crédito (Credit Note):**
```js
{ id, pedidoId, clienteId, clienteNombre, fecha, motivo, monto, notas }
```

### Business Logic

**Automatic Discounts** ([helpers.js](src/utils/helpers.js)):
- 12–23 units: 5%
- 24+ units: 10%
- Applied per line item, calculated by `calcDescuento(cantidad)`

**Automatic Stock Management** ([AppContext.jsx](src/context/AppContext.jsx)):
- Creating an order: automatically deducts stock from products (via `deducir_stock` SQL function)
- Editing an order: calculates delta and adjusts stock (restore old quantities, deduct new ones)
- Canceling an order: restores all stock to products
- Deleting an order: restores stock before deletion
- Stock validation: prevents creating/editing orders if insufficient stock available
- Stock movements are audited in `stock_movements` table with reason tracking

**Payment Tracking** ([AppContext.jsx](src/context/AppContext.jsx)):
- Orders have separate delivery status (`estado`: pendiente/entregado/cancelado) and payment status (`estadoPago`: pendiente/parcial/pagado)
- `registrarPago()` function records payments with amount, method, and date
- Supports partial payments: tracks `montoPagado` vs `total`
- Payment methods: efectivo, transferencia, tarjeta, otro
- Account balance calculation: `Total - Paid - Credit Notes`

**PDF Export** ([pdfExport.js](src/utils/pdfExport.js)):
- Uses html2canvas to capture a hidden DOM element, then jsPDF to convert to downloadable PDF
- Triggered from [DetallePedido.jsx](src/pages/DetallePedido.jsx) and [ClienteDetalle.jsx](src/pages/ClienteDetalle.jsx)

### Routing & Protection

All routes except `/login` and `/reset-password` are wrapped in `ProtectedRoutes` which redirects unauthenticated users to `/login`. First-time users (empty data) are redirected to `/onboarding` via `OnboardingGate`.

Main routes:
- `/` → Dashboard
- `/clientes` → Customer list
- `/clientes/:id` → Customer detail + account statement
- `/pedidos` → Order list
- `/pedidos/nuevo` → New order form
- `/pedidos/:id` → Order detail
- `/pedidos/:id/editar` → Edit order
- `/inventario` → Product inventory
- `/estadisticas` → Sales charts
- `/admin` → Admin panel (only visible to super_admin)

### Supabase Schema

Defined in [supabase.js](src/lib/supabase.js). Tables:

**Multi-Tenant Tables:**

- `distribuidoras` (your clients - each with custom name)
- `usuarios_app` (app users with roles: super_admin, owner, empleado)

**Business Data Tables:**

- `clientes` (customers) → has `distribuidora_id`
- `productos` (products) → has `distribuidora_id`
- `pedidos` (orders) → has many `pedido_items`, has `distribuidora_id`
  - Payment fields: `estado_pago`, `monto_pagado`, `fecha_pago`, `metodo_pago`
- `pedido_items` (order line items)
- `notas_credito` (credit notes) → has `distribuidora_id`
- `stock_movements` (stock audit trail) → has `distribuidora_id`

All tables have RLS enabled and are scoped by `distribuidora_id` (via `get_user_distribuidora_id()` function).

**SQL Functions** (see [migration-stock-y-pagos.sql](migration-stock-y-pagos.sql)):
- `deducir_stock(user_id, producto_id, cantidad, pedido_id, razon)` - deducts stock and logs movement
- `restaurar_stock(user_id, producto_id, cantidad, pedido_id, razon)` - restores stock and logs movement

### PWA Configuration

Configured in [vite.config.js](vite.config.js):
- Auto-updates on new service worker
- Caches static assets and Supabase API responses (NetworkFirst strategy)
- Manifest: name "Distribuidora — Gestor de Pedidos", standalone mode, portrait orientation

### Utilities

- **[helpers.js](src/utils/helpers.js):** Currency/date formatting (es-AR locale), discount calculation, date filters (today/this week)
- **[pdfExport.js](src/utils/pdfExport.js):** PDF generation for orders and account statements

### Styling Patterns

- Tailwind CSS with dark mode support (`.dark:` prefix)
- Responsive design (mobile-first, `sm:`, `md:`, `lg:` breakpoints)
- Shared UI components in [Layout.jsx](src/components/Layout.jsx) (sidebar, navbar)
- Icons from lucide-react

## Development Practices

- **State Management:** Use `AppContext` for all data mutations. Never mutate state directly.
- **Error Handling:** Supabase errors are thrown; catch in UI and display user-friendly messages.
- **Dark Mode:** All new UI must support both light and dark themes.
- **Currency:** Always use `formatCurrency()` from helpers for displaying prices (ARS locale).
- **Dates:** Use `formatDate()` or `formatDateTime()` for consistent es-AR formatting.
- **Discounts:** Apply `calcDescuento()` for volume-based discounts. Client-specific `descuentoGeneral` is applied separately.
- **PDF Generation:** Reuse the hidden DOM pattern in `pdfExport.js` for new PDF features.

## Testing New Features

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Use demo account or sign up (Supabase auth emails sent to inbox)
4. Test CRUD flows (clientes, productos, pedidos)
5. Verify dark mode toggle works
6. Test PWA install prompt (production build only)
7. Export PDFs and verify formatting

## Common Gotchas

- **Snake vs Camel Case:** Supabase uses snake_case, React uses camelCase. Always normalize via helper functions before storing in state.
- **Pedido Items:** When creating/updating orders, must insert/update both `pedidos` and `pedido_items` tables. See `addPedido` and `updatePedidoFull` in AppContext.
- **Stock Management:** Stock is automatically deducted when creating/editing orders. Never manually decrement stock - use the built-in functions. If an order creation fails mid-process, the SQL functions ensure rollback.
- **Payment vs Delivery Status:** `estado` tracks delivery (pendiente/entregado/cancelado), `estadoPago` tracks payment (pendiente/parcial/pagado). They are independent - an order can be "entregado" but "pendiente" de pago.
- **Stock Validation:** `addPedido` and `updatePedidoFull` throw errors if insufficient stock. Catch these in the UI and display user-friendly messages.
- **Auth-Scoped Data:** All Supabase queries automatically filter by `user_id` via RLS. Don't manually filter.
- **Onboarding Flow:** First-time users see `/onboarding` regardless of route. Skip via `localStorage.setItem('onboarding-done', 'true')`.
- **Dark Mode Persistence:** Theme stored in localStorage as `theme: 'light' | 'dark' | 'system'`. Always check ThemeContext before hardcoding colors.

## Recent Changes (2026-06-17)

**Stock Management System:**

- Automatic stock deduction on order creation
- Stock adjustment on order edits (calculates delta)
- Stock restoration on order cancellation/deletion
- Real-time stock validation in order forms
- Inventory page now shows: Total Stock | Reserved (pending orders) | Available
- Audit trail in `stock_movements` table

**Payment Tracking System:**

- New fields in `pedidos`: `estado_pago`, `monto_pagado`, `fecha_pago`, `metodo_pago`
- Payment registration UI in DetallePedido with modal form
- Separate payment status badges (pendiente/parcial/pagado)
- Corrected "saldo pendiente" calculation: Total - Paid - Credit Notes
- Dashboard KPI "Por Cobrar" shows total outstanding payments
- ClienteDetalle shows: Total facturado | Pagado | Saldo pendiente | Notas crédito

**Multi-Tenant System:**

- New tables: `distribuidoras`, `usuarios_app` with roles (super_admin, owner, empleado)
- All business tables now have `distribuidora_id` column
- RLS policies updated to filter by distribuidora instead of user
- Employees of same distribuidora share all data
- Admin panel at `/admin` (only super_admin can access)
- Distribuidora name shows in sidebar instead of generic "Distribuidora"
- Context: `DistribuidoraProvider` provides `distribuidora`, `usuarioApp`, role flags

**Migrations Required:**

1. Run [migration-stock-y-pagos.sql](migration-stock-y-pagos.sql) first
2. Run [migration-multi-tenant.sql](migration-multi-tenant.sql) - **IMPORTANT:** Edit PARTE 6 to set your super_admin email
3. Run [migration-auto-create-usuario-app.sql](migration-auto-create-usuario-app.sql) (optional, for auto-creating users)

See [MULTI-TENANT-SETUP.md](MULTI-TENANT-SETUP.md) for detailed setup instructions.
