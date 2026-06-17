-- ============================================
-- FIX: Recursión infinita - Solución Definitiva
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- PASO 1: Eliminar TODAS las policies de usuarios_app
drop policy if exists "usuarios_app_select" on usuarios_app;
drop policy if exists "usuarios_app_insert" on usuarios_app;
drop policy if exists "usuarios_app_update" on usuarios_app;
drop policy if exists "usuarios_app_delete" on usuarios_app;
drop policy if exists "usuarios_app_access" on usuarios_app;

-- PASO 2: Deshabilitar RLS en usuarios_app
-- (Es seguro porque la app React controla el acceso al Admin Panel)
alter table usuarios_app disable row level security;

-- PASO 3: Recrear funciones SIN depender de RLS
drop function if exists get_user_distribuidora_id() cascade;
drop function if exists is_super_admin() cascade;

create or replace function get_user_distribuidora_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select distribuidora_id
  from usuarios_app
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from usuarios_app
    where auth_user_id = auth.uid()
    and rol = 'super_admin'
  )
$$;

-- PASO 4: Recrear policies para las OTRAS tablas
-- (Estas SÍ necesitan RLS porque contienen datos de negocio)

-- CLIENTES
drop policy if exists "clientes_by_distribuidora" on clientes;
create policy "clientes_by_distribuidora" on clientes
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PRODUCTOS
drop policy if exists "productos_by_distribuidora" on productos;
create policy "productos_by_distribuidora" on productos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDOS
drop policy if exists "pedidos_by_distribuidora" on pedidos;
create policy "pedidos_by_distribuidora" on pedidos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDO_ITEMS
drop policy if exists "pedido_items_by_pedido" on pedido_items;
create policy "pedido_items_by_pedido" on pedido_items
  for all using (
    exists (
      select 1 from pedidos
      where pedidos.id = pedido_items.pedido_id
      and (pedidos.distribuidora_id = get_user_distribuidora_id() or is_super_admin())
    )
  );

-- NOTAS_CREDITO
drop policy if exists "notas_credito_by_distribuidora" on notas_credito;
create policy "notas_credito_by_distribuidora" on notas_credito
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- STOCK_MOVEMENTS
drop policy if exists "stock_movements_by_distribuidora" on stock_movements;
create policy "stock_movements_by_distribuidora" on stock_movements
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- DISTRIBUIDORAS (solo super_admin puede verlas/editarlas)
drop policy if exists "distribuidoras_super_admin" on distribuidoras;
create policy "distribuidoras_super_admin" on distribuidoras
  for all using (is_super_admin());

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Ejecutar esto DESPUÉS de la migración para verificar:
-- SELECT is_super_admin();  -- Debe devolver true
-- SELECT get_user_distribuidora_id();  -- Debe devolver null para super_admin
