# 🗃️ Migraciones de Base de Datos

Estas migraciones deben ejecutarse **en orden** en Supabase Dashboard → SQL Editor.

---

## 📋 Orden de Ejecución

### **1. migration-stock-y-pagos.sql**
**Ejecutar primero**

**Qué hace:**
- Agrega campos de pago a `pedidos`: `estado_pago`, `monto_pagado`, `fecha_pago`, `metodo_pago`
- Crea tabla `stock_movements` para auditoría de stock
- Crea funciones SQL: `deducir_stock()`, `restaurar_stock()`
- Actualiza pedidos existentes con estado "entregado" a "pagado"

**Resultado:** Sistema de stock automático + seguimiento de pagos funcionando

---

### **2. migration-multi-tenant.sql**
**Ejecutar segundo**

**Qué hace:**
- Crea tabla `distribuidoras` (tus clientes)
- Crea tabla `usuarios_app` con roles (super_admin, owner, empleado)
- Agrega columna `distribuidora_id` a todas las tablas
- Crea funciones helper: `get_user_distribuidora_id()`, `is_super_admin()`
- Crea RLS policies iniciales (luego se corrigen)
- Crea trigger `handle_new_user()` para auto-crear usuarios
- Migra datos existentes a "Distribuidora Demo"

**⚠️ IMPORTANTE:** Editar PARTE 6 con tu email antes de ejecutar:
```sql
-- Buscar estas líneas y descomentar:
insert into usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email)
select
  id,
  null,
  'super_admin',
  'TU NOMBRE',  -- <-- Cambiar
  email
from auth.users
where email = 'TU_EMAIL@ejemplo.com'  -- <-- CAMBIAR ESTO
on conflict (auth_user_id) do update set rol = 'super_admin';
```

**Resultado:** Estructura multi-tenant básica creada

---

### **3. migration-fix-recursion-v2.sql**
**Ejecutar tercero**

**Qué hace:**
- Deshabilita RLS en tabla `usuarios_app` (evita recursión infinita)
- Recrea funciones `get_user_distribuidora_id()` y `is_super_admin()` con `security definer`
- Recrea todas las RLS policies de las tablas de negocio

**Resultado:** Fix del error "infinite recursion detected"

---

### **4. migration-fix-trigger-sin-distribuidora.sql**
**Ejecutar cuarto**

**Qué hace:**
- Actualiza trigger `handle_new_user()` para que cree usuarios con:
  - `distribuidora_id = null` (sin asignar)
  - `activo = false` (inactivo hasta que admin asigne)

**Resultado:** Nuevos usuarios NO ven datos hasta que super_admin los asigne

---

### **5. migration-fix-distribuidoras-policy.sql**
**Ejecutar quinto (último)**

**Qué hace:**
- Actualiza policy de tabla `distribuidoras` para que:
  - Super admin ve todas las distribuidoras
  - Usuarios ven solo su propia distribuidora
  - Solo super admin puede modificar distribuidoras

**Resultado:** Usuarios ven el nombre de su distribuidora en el sidebar

---

## ✅ Verificación Post-Migración

Después de ejecutar todas las migraciones, verificá:

```sql
-- 1. Ver tu usuario super_admin
SELECT * FROM usuarios_app WHERE email = 'TU_EMAIL@ejemplo.com';
-- Debería tener: rol = 'super_admin', distribuidora_id = null

-- 2. Probar funciones helper
SELECT is_super_admin();  -- Debe devolver true
SELECT get_user_distribuidora_id();  -- Debe devolver null para super_admin

-- 3. Ver todas las distribuidoras
SELECT * FROM distribuidoras;
-- Debería ver al menos "Distribuidora Demo"
```

---

## 🚨 Troubleshooting

### Error: "infinite recursion detected"
- **Solución:** Ejecutar `migration-fix-recursion-v2.sql`

### Error: "Could not find the 'distribuidora_id' column"
- **Solución:** Ejecutar `migration-multi-tenant.sql` completo

### Usuarios nuevos ven datos de otra distribuidora
- **Solución:** Ejecutar `migration-fix-trigger-sin-distribuidora.sql`

### Usuarios no ven el nombre de su distribuidora en sidebar
- **Solución:** Ejecutar `migration-fix-distribuidoras-policy.sql`

---

## 📊 Estructura Final de Tablas

```
auth.users (Supabase Auth)
  └─ usuarios_app (roles, sin RLS)
      └─ distribuidoras (con RLS)
          ├─ clientes (con RLS)
          ├─ productos (con RLS)
          ├─ pedidos (con RLS)
          │   └─ pedido_items (con RLS)
          ├─ notas_credito (con RLS)
          └─ stock_movements (con RLS)
```

---

## 🔄 Migración Completa desde Cero

Si necesitás ejecutar todas las migraciones en una base de datos nueva:

```bash
# En Supabase SQL Editor, ejecutar en orden:
1. migration-stock-y-pagos.sql
2. migration-multi-tenant.sql (editar PARTE 6 primero!)
3. migration-fix-recursion-v2.sql
4. migration-fix-trigger-sin-distribuidora.sql
5. migration-fix-distribuidoras-policy.sql
```

Total: ~5 minutos de ejecución
