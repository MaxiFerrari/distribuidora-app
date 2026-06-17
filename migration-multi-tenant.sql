-- ============================================
-- MIGRACIÓN: Sistema Multi-Tenant con Roles
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- DESPUÉS de migration-stock-y-pagos.sql
-- ============================================

-- ==========================================
-- PARTE 1: NUEVAS TABLAS
-- ==========================================

-- Tabla de Distribuidoras (tus clientes)
create table if not exists distribuidoras (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  owner_email text not null,
  telefono text,
  direccion text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Tabla de Usuarios de la App (con roles)
create table if not exists usuarios_app (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  distribuidora_id uuid references distribuidoras(id) on delete cascade,
  rol text not null check (rol in ('super_admin', 'owner', 'empleado')),
  nombre_completo text not null,
  email text not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Índices
create index if not exists usuarios_app_auth_user_id_idx on usuarios_app(auth_user_id);
create index if not exists usuarios_app_distribuidora_id_idx on usuarios_app(distribuidora_id);

-- ==========================================
-- PARTE 2: AGREGAR COLUMNAS A TABLAS EXISTENTES
-- ==========================================

-- Agregar distribuidora_id a todas las tablas
alter table clientes add column if not exists distribuidora_id uuid references distribuidoras(id) on delete cascade;
alter table productos add column if not exists distribuidora_id uuid references distribuidoras(id) on delete cascade;
alter table pedidos add column if not exists distribuidora_id uuid references distribuidoras(id) on delete cascade;
alter table notas_credito add column if not exists distribuidora_id uuid references distribuidoras(id) on delete cascade;
alter table stock_movements add column if not exists distribuidora_id uuid references distribuidoras(id) on delete cascade;

-- Índices para performance
create index if not exists clientes_distribuidora_id_idx on clientes(distribuidora_id);
create index if not exists productos_distribuidora_id_idx on productos(distribuidora_id);
create index if not exists pedidos_distribuidora_id_idx on pedidos(distribuidora_id);

-- ==========================================
-- PARTE 3: MIGRAR DATOS EXISTENTES
-- ==========================================

-- Crear una distribuidora default para usuarios existentes
insert into distribuidoras (id, nombre, owner_email, activo)
values ('00000000-0000-0000-0000-000000000001', 'Distribuidora Demo', 'demo@distribuidora.com', true)
on conflict do nothing;

-- Asignar todos los datos existentes a la distribuidora default
update clientes set distribuidora_id = '00000000-0000-0000-0000-000000000001' where distribuidora_id is null;
update productos set distribuidora_id = '00000000-0000-0000-0000-000000000001' where distribuidora_id is null;
update pedidos set distribuidora_id = '00000000-0000-0000-0000-000000000001' where distribuidora_id is null;
update notas_credito set distribuidora_id = '00000000-0000-0000-0000-000000000001' where distribuidora_id is null;
update stock_movements set distribuidora_id = '00000000-0000-0000-0000-000000000001' where distribuidora_id is null;

-- Crear usuarios_app para usuarios auth existentes (como owners de la distribuidora demo)
insert into usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email)
select
  au.id,
  '00000000-0000-0000-0000-000000000001',
  'owner',
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email
from auth.users au
where not exists (select 1 from usuarios_app ua where ua.auth_user_id = au.id);

-- ==========================================
-- PARTE 4: RLS POLICIES ACTUALIZADAS
-- ==========================================

-- Helper function: obtener distribuidora_id del usuario actual
create or replace function get_user_distribuidora_id()
returns uuid as $$
  select distribuidora_id from usuarios_app where auth_user_id = auth.uid()
$$ language sql stable;

-- Helper function: verificar si usuario es super_admin
create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from usuarios_app
    where auth_user_id = auth.uid() and rol = 'super_admin'
  )
$$ language sql stable;

-- CLIENTES
drop policy if exists "clientes_own" on clientes;
drop policy if exists "clientes_by_distribuidora" on clientes;

create policy "clientes_by_distribuidora" on clientes
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PRODUCTOS
drop policy if exists "productos_own" on productos;
drop policy if exists "productos_by_distribuidora" on productos;

create policy "productos_by_distribuidora" on productos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDOS
drop policy if exists "pedidos_own" on pedidos;
drop policy if exists "pedidos_by_distribuidora" on pedidos;

create policy "pedidos_by_distribuidora" on pedidos
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- PEDIDO_ITEMS
drop policy if exists "pedido_items_own" on pedido_items;
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
drop policy if exists "notas_credito_own" on notas_credito;
drop policy if exists "notas_credito_by_distribuidora" on notas_credito;

create policy "notas_credito_by_distribuidora" on notas_credito
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- STOCK_MOVEMENTS
drop policy if exists "stock_movements_own" on stock_movements;
drop policy if exists "stock_movements_by_distribuidora" on stock_movements;

create policy "stock_movements_by_distribuidora" on stock_movements
  for all using (
    distribuidora_id = get_user_distribuidora_id() or is_super_admin()
  );

-- RLS para DISTRIBUIDORAS (solo super_admin puede ver todas)
alter table distribuidoras enable row level security;

drop policy if exists "distribuidoras_super_admin" on distribuidoras;

create policy "distribuidoras_super_admin" on distribuidoras
  for all using (is_super_admin());

-- RLS para USUARIOS_APP (super_admin ve todos, users ven solo su distribuidora)
alter table usuarios_app enable row level security;

drop policy if exists "usuarios_app_access" on usuarios_app;

create policy "usuarios_app_access" on usuarios_app
  for all using (
    is_super_admin() or
    distribuidora_id = get_user_distribuidora_id() or
    auth_user_id = auth.uid()
  );

-- ==========================================
-- PARTE 5: ACTUALIZAR FUNCIONES RPC
-- ==========================================

-- Actualizar función deducir_stock para incluir distribuidora_id
create or replace function deducir_stock(
  p_user_id uuid,
  p_producto_id uuid,
  p_cantidad integer,
  p_pedido_id uuid default null,
  p_razon text default 'venta'
) returns boolean as $$
declare
  v_stock_actual integer;
  v_tipo text;
  v_distribuidora_id uuid;
begin
  -- Obtener stock actual y distribuidora_id del producto
  select stock, distribuidora_id into v_stock_actual, v_distribuidora_id
  from productos
  where id = p_producto_id and user_id = p_user_id;

  if v_stock_actual is null then
    return false;
  end if;

  if v_stock_actual < p_cantidad then
    return false;
  end if;

  v_tipo := case
    when p_razon = 'cancelacion' then 'cancelacion'
    when p_razon = 'devolucion' then 'devolucion'
    when p_razon = 'edicion' then 'edicion'
    else 'venta'
  end;

  update productos
  set stock = stock - p_cantidad
  where id = p_producto_id and user_id = p_user_id;

  insert into stock_movements (user_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, pedido_id, razon, distribuidora_id)
  values (p_user_id, p_producto_id, v_tipo, -p_cantidad, v_stock_actual, v_stock_actual - p_cantidad, p_pedido_id, p_razon, v_distribuidora_id);

  return true;
end;
$$ language plpgsql;

-- Actualizar función restaurar_stock
create or replace function restaurar_stock(
  p_user_id uuid,
  p_producto_id uuid,
  p_cantidad integer,
  p_pedido_id uuid default null,
  p_razon text default 'devolucion'
) returns boolean as $$
declare
  v_stock_actual integer;
  v_tipo text;
  v_distribuidora_id uuid;
begin
  select stock, distribuidora_id into v_stock_actual, v_distribuidora_id
  from productos
  where id = p_producto_id and user_id = p_user_id;

  if v_stock_actual is null then
    return false;
  end if;

  v_tipo := case
    when p_razon = 'cancelacion' then 'cancelacion'
    when p_razon = 'edicion' then 'edicion'
    else 'devolucion'
  end;

  update productos
  set stock = stock + p_cantidad
  where id = p_producto_id and user_id = p_user_id;

  insert into stock_movements (user_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, pedido_id, razon, distribuidora_id)
  values (p_user_id, p_producto_id, v_tipo, p_cantidad, v_stock_actual, v_stock_actual + p_cantidad, p_pedido_id, p_razon, v_distribuidora_id);

  return true;
end;
$$ language plpgsql;

-- ==========================================
-- PARTE 6: CREAR TU USUARIO SUPER ADMIN
-- ==========================================

-- IMPORTANTE: Reemplazar 'TU_EMAIL@ejemplo.com' con tu email real
-- Este script buscará tu usuario en auth.users y lo marcará como super_admin

-- Ejemplo (descomenta y ajusta):
-- insert into usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email)
-- select
--   id,
--   null,  -- super_admin no pertenece a ninguna distribuidora
--   'super_admin',
--   'Admin Principal',
--   email
-- from auth.users
-- where email = 'TU_EMAIL@ejemplo.com'
-- on conflict (auth_user_id) do update set rol = 'super_admin';

-- ==========================================
-- NOTAS FINALES
-- ==========================================

-- Después de correr esta migración:
-- 1. Todos los datos existentes quedarán bajo "Distribuidora Demo"
-- 2. Los usuarios existentes quedarán como "owner" de esa distribuidora
-- 3. Debes crear tu usuario super_admin manualmente (ver PARTE 6)
-- 4. Las políticas RLS ahora filtran por distribuidora_id en vez de user_id
-- 5. Empleados de la misma distribuidora comparten todos los datos
