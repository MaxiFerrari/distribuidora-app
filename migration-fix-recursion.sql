-- ============================================
-- FIX: Recursión infinita en RLS policies
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- Eliminar las funciones problemáticas (CASCADE elimina las policies que las usan)
drop function if exists get_user_distribuidora_id() cascade;
drop function if exists is_super_admin() cascade;

-- Recrear con SECURITY DEFINER para evitar recursión
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

-- Recrear las policies de usuarios_app sin recursión
drop policy if exists "usuarios_app_access" on usuarios_app;

-- Policy más simple: usuarios ven su propio registro + super_admin ve todo
create policy "usuarios_app_select" on usuarios_app
  for select using (
    auth_user_id = auth.uid()
    or
    exists (
      select 1 from usuarios_app ua
      where ua.auth_user_id = auth.uid() and ua.rol = 'super_admin'
    )
  );

create policy "usuarios_app_insert" on usuarios_app
  for insert with check (
    exists (
      select 1 from usuarios_app ua
      where ua.auth_user_id = auth.uid() and ua.rol = 'super_admin'
    )
  );

create policy "usuarios_app_update" on usuarios_app
  for update using (
    exists (
      select 1 from usuarios_app ua
      where ua.auth_user_id = auth.uid() and ua.rol = 'super_admin'
    )
  );

create policy "usuarios_app_delete" on usuarios_app
  for delete using (
    exists (
      select 1 from usuarios_app ua
      where ua.auth_user_id = auth.uid() and ua.rol = 'super_admin'
    )
  );

-- Recrear las policies de las demás tablas que fueron eliminadas con CASCADE

-- CLIENTES
create policy "clientes_by_distribuidora" on clientes
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PRODUCTOS
create policy "productos_by_distribuidora" on productos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDOS
create policy "pedidos_by_distribuidora" on pedidos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDO_ITEMS
create policy "pedido_items_by_pedido" on pedido_items
  for all using (
    exists (
      select 1 from pedidos
      where pedidos.id = pedido_items.pedido_id
      and (pedidos.distribuidora_id = get_user_distribuidora_id() or is_super_admin())
    )
  );

-- NOTAS_CREDITO
create policy "notas_credito_by_distribuidora" on notas_credito
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- STOCK_MOVEMENTS
create policy "stock_movements_by_distribuidora" on stock_movements
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- DISTRIBUIDORAS (solo super_admin)
drop policy if exists "distribuidoras_super_admin" on distribuidoras;

create policy "distribuidoras_super_admin" on distribuidoras
  for all using (is_super_admin());
