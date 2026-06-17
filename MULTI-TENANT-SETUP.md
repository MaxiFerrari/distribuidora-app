# 🏢 Setup Multi-Tenant - Instrucciones

Este documento explica cómo configurar el sistema multi-tenant en tu app de distribuidora.

---

## 📋 Paso 1: Ejecutar Migración en Supabase

1. Ir a **Supabase Dashboard** → https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** (menú izquierdo)
4. Copiar TODO el contenido de `migration-multi-tenant.sql`
5. Pegar en el editor
6. **IMPORTANTE:** Buscar la sección "PARTE 6" y descomentar estas líneas (reemplazar con TU email):

```sql
insert into usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email)
select
  id,
  null,  -- super_admin no pertenece a ninguna distribuidora
  'super_admin',
  'Admin Principal',  -- <-- Cambiar tu nombre
  email
from auth.users
where email = 'TU_EMAIL@ejemplo.com'  -- <-- PONER TU EMAIL AQUÍ
on conflict (auth_user_id) do update set rol = 'super_admin';
```

7. Ejecutar (botón "Run" o Ctrl+Enter)
8. Verificar que salió exitoso (sin errores rojos)

---

## 📋 Paso 2: Verificar que Eres Super Admin

1. En Supabase Dashboard → **Table Editor**
2. Abrir tabla `usuarios_app`
3. Buscar tu email
4. Verificar que la columna `rol` = `'super_admin'`
5. Verificar que `distribuidora_id` = `null` (los super_admin no tienen distribuidora)

---

## 📋 Paso 3: Probar la App

### 3.1 Iniciar Dev Server

```bash
npm run dev
```

### 3.2 Login

- Ir a `http://localhost:5173/login`
- Ingresar con tu email (el que configuraste como super_admin)

### 3.3 Verificar Panel de Admin

- Una vez logueado, deberías ver **"Admin Panel"** en el menú izquierdo (con icono de Settings)
- Click en "Admin Panel"
- Deberías ver la interfaz para:
  - Listar distribuidoras
  - Crear nueva distribuidora
  - Editar/eliminar distribuidoras
  - Gestionar usuarios de cada distribuidora

---

## 📋 Paso 4: Crear tu Primera Distribuidora

1. En **Admin Panel** → Click "Nueva Distribuidora"
2. Llenar:
   - **Nombre:** Ej: "Distribuidora Don Pedro"
   - **Email del dueño:** email del cliente que será owner
   - **Teléfono:** (opcional)
   - **Dirección:** (opcional)
3. Click "Crear"

---

## 📋 Paso 5: Crear Usuarios para la Distribuidora

1. En la tarjeta de la distribuidora → Click "Ver usuarios"
2. Click "Nuevo Usuario"
3. Llenar:
   - **Email:** email del empleado/owner
   - **Contraseña:** mínimo 6 caracteres
   - **Nombre completo:** Ej: "Juan Pérez"
   - **Rol:**
     - **owner** → puede hacer todo en su distribuidora
     - **empleado** → puede hacer todo en su distribuidora (por ahora igual a owner, en el futuro se pueden agregar permisos diferentes)
4. Click "Crear"

---

## 📋 Paso 6: Probar con Usuario de Distribuidora

1. **Cerrar sesión** (botón en sidebar)
2. **Login** con el email del usuario que acabas de crear
3. Verificar:
   - El nombre de la distribuidora aparece en el sidebar (en vez de "Distribuidora")
   - NO aparece el link "Admin Panel" (solo super_admin lo ve)
   - Los datos (clientes, productos, pedidos) son los de ESA distribuidora
4. Crear un cliente/producto/pedido → verificar que funciona

---

## 📋 Paso 7: Crear Empleados Adicionales

Como **owner** o **super_admin**:

1. Login con super_admin
2. Admin Panel → Ver usuarios de una distribuidora
3. Agregar más empleados
4. Todos los empleados de la MISMA distribuidora verán los MISMOS datos

---

## 🔍 Cómo Funciona

### **Super Admin (TÚ)**
- Rol: `super_admin`
- Puede:
  - Ver TODAS las distribuidoras
  - Crear/editar/eliminar distribuidoras
  - Crear/editar usuarios de cualquier distribuidora
  - Activar/desactivar distribuidoras
- NO puede:
  - Ver los datos operativos de las distribuidoras (clientes, productos, pedidos)
  - Para verlos, necesitas crear un usuario "owner" o "empleado" e ingresar con ese usuario

### **Owner (Dueño de Distribuidora)**
- Rol: `owner`
- Puede:
  - Ver/crear/editar/eliminar clientes, productos, pedidos de SU distribuidora
  - Crear empleados para su distribuidora (pendiente implementar)
- NO puede:
  - Ver datos de otras distribuidoras
  - Acceder al Admin Panel

### **Empleado**
- Rol: `empleado`
- Puede:
  - Ver/crear/editar/eliminar clientes, productos, pedidos de SU distribuidora (igual que owner por ahora)
- NO puede:
  - Ver datos de otras distribuidoras
  - Acceder al Admin Panel

### **Aislamiento de Datos**

Cada distribuidora es **completamente independiente**:

```
Distribuidora A:
  - 50 clientes
  - 100 productos
  - 200 pedidos
  - Empleados: Juan, María, Pedro

Distribuidora B:
  - 30 clientes
  - 80 productos
  - 150 pedidos
  - Empleados: Ana, Luis

❌ Juan (de Distribuidora A) NO puede ver los datos de Distribuidora B
✅ Juan y María (ambos de Distribuidora A) ven los MISMOS datos
```

---

## 🛠️ Troubleshooting

### Problema: No veo "Admin Panel" después de login

**Solución:**
1. Verificar que ejecutaste la PARTE 6 de la migración (crear super_admin)
2. Verificar en Supabase → Table Editor → `usuarios_app` que tu email tiene `rol = 'super_admin'`
3. Hacer logout y volver a login

### Problema: Error al crear usuario "auth.admin.createUser"

**Solución:**
- Supabase Admin API requiere un Service Role Key
- En Admin.jsx, la creación de usuarios usa `supabase.auth.admin.createUser()`
- Esto requiere que el cliente de Supabase esté configurado con Service Role Key
- **Solución temporal:** Crear usuarios manualmente en Supabase Dashboard → Authentication → Add user

### Problema: Los datos antiguos no aparecen

**Solución:**
- La migración asigna todos los datos existentes a la "Distribuidora Demo" (ID fijo)
- Si tus datos estaban bajo otro `user_id`, necesitas:
  1. Ir a Supabase → Table Editor → `distribuidoras`
  2. Verificar que existe "Distribuidora Demo"
  3. Verificar que tus clientes/productos/pedidos tienen `distribuidora_id` = ID de "Distribuidora Demo"

### Problema: Error "Could not find the 'distribuidora_id' column"

**Solución:**
- Verificar que ejecutaste TODA la migración `migration-multi-tenant.sql`
- La PARTE 2 agrega las columnas `distribuidora_id` a todas las tablas
- Si falta, volver a ejecutar la migración (es idempotente)

---

## 📊 Estructura de Datos

```
auth.users (Supabase Auth)
  ├─ id (UUID)
  ├─ email
  └─ password (hasheado)

distribuidoras
  ├─ id (UUID)
  ├─ nombre ("Don Pedro", "La Esquina", etc.)
  ├─ owner_email
  ├─ telefono
  ├─ direccion
  └─ activo (boolean)

usuarios_app
  ├─ id (UUID)
  ├─ auth_user_id → auth.users.id
  ├─ distribuidora_id → distribuidoras.id (null para super_admin)
  ├─ rol ('super_admin' | 'owner' | 'empleado')
  ├─ nombre_completo
  └─ email

clientes, productos, pedidos, notas_credito, stock_movements
  ├─ ... (campos originales)
  ├─ user_id → auth.users.id (legacy, se mantiene por compatibilidad)
  └─ distribuidora_id → distribuidoras.id (NUEVO - filtro principal)
```

---

## 🚀 Próximos Pasos (Opcional)

1. **Owners pueden crear sus propios empleados:**
   - Agregar ruta `/configuracion/usuarios` para owners
   - Permitir que owners creen empleados de su distribuidora
   - Por ahora solo super_admin puede crear usuarios

2. **Permisos diferenciados:**
   - Empleados pueden ver pero no eliminar
   - Empleados no pueden editar precios
   - etc.

3. **Auditoría detallada:**
   - Mostrar "Creado por: Juan Pérez" en cada pedido/cliente
   - Usar columna `created_by` (ya existe en la migración)

4. **Dashboard para owners:**
   - Ver actividad de sus empleados
   - Estadísticas por empleado

---

## ✅ Checklist de Implementación

- [ ] Ejecutar `migration-stock-y-pagos.sql` (si no lo hiciste)
- [ ] Ejecutar `migration-multi-tenant.sql`
- [ ] Descomentar y configurar PARTE 6 con tu email
- [ ] Verificar que eres super_admin en tabla `usuarios_app`
- [ ] Login y verificar que ves "Admin Panel"
- [ ] Crear una distribuidora de prueba
- [ ] Crear un usuario owner para esa distribuidora
- [ ] Login con ese owner y verificar que ve el nombre de la distribuidora
- [ ] Crear un producto/cliente como owner
- [ ] Crear un segundo empleado para la misma distribuidora
- [ ] Login con el empleado y verificar que ve los mismos datos que el owner
- [ ] Crear otra distribuidora
- [ ] Verificar que los datos están aislados (Distribuidora A no ve datos de B)

---

¡Listo! Ahora tienes un sistema multi-tenant funcionando. 🎉
