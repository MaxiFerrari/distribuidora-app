-- ============================================
-- MIGRACIÓN: Stock Automático + Seguimiento de Pagos
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- ==========================================
-- PARTE 1: SEGUIMIENTO DE PAGOS
-- ==========================================

-- Agregar campos de pago a la tabla pedidos
alter table pedidos add column if not exists estado_pago text default 'pendiente'
  check (estado_pago in ('pendiente', 'parcial', 'pagado'));

alter table pedidos add column if not exists monto_pagado numeric default 0;

alter table pedidos add column if not exists fecha_pago timestamptz;

alter table pedidos add column if not exists metodo_pago text
  check (metodo_pago is null or metodo_pago in ('efectivo', 'transferencia', 'tarjeta', 'otro'));

-- Actualizar pedidos existentes: si estado='entregado', asumir que está pagado
update pedidos
set estado_pago = 'pagado',
    monto_pagado = total,
    fecha_pago = created_at
where estado = 'entregado' and estado_pago = 'pendiente';

-- ==========================================
-- PARTE 2: AUDITORÍA DE STOCK
-- ==========================================

-- Tabla para registrar todos los movimientos de stock
create table if not exists stock_movements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  producto_id uuid references productos(id) on delete cascade not null,
  tipo text not null check (tipo in ('venta', 'devolucion', 'cancelacion', 'ajuste_manual', 'edicion')),
  cantidad integer not null, -- positivo para entradas, negativo para salidas
  stock_anterior integer not null,
  stock_nuevo integer not null,
  pedido_id uuid references pedidos(id) on delete set null,
  razon text default '',
  created_at timestamptz default now()
);

-- RLS para stock_movements
alter table stock_movements enable row level security;

-- Eliminar política existente si existe y recrearla
drop policy if exists "stock_movements_own" on stock_movements;

create policy "stock_movements_own" on stock_movements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices para performance
create index if not exists stock_movements_user_id_idx on stock_movements(user_id);
create index if not exists stock_movements_producto_id_idx on stock_movements(producto_id);
create index if not exists stock_movements_pedido_id_idx on stock_movements(pedido_id);
create index if not exists stock_movements_created_at_idx on stock_movements(created_at desc);

-- ==========================================
-- PARTE 3: FUNCIÓN AUXILIAR PARA DEDUCIR STOCK
-- ==========================================

-- Función para deducir stock de un producto y registrar el movimiento
-- Retorna true si tuvo éxito, false si no hay stock suficiente
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
begin
  -- Obtener stock actual del producto
  select stock into v_stock_actual
  from productos
  where id = p_producto_id and user_id = p_user_id;

  -- Si no existe el producto, retornar false
  if v_stock_actual is null then
    return false;
  end if;

  -- Si no hay stock suficiente, retornar false
  if v_stock_actual < p_cantidad then
    return false;
  end if;

  -- Determinar tipo de movimiento
  v_tipo := case
    when p_razon = 'cancelacion' then 'cancelacion'
    when p_razon = 'devolucion' then 'devolucion'
    when p_razon = 'edicion' then 'edicion'
    else 'venta'
  end;

  -- Deducir el stock
  update productos
  set stock = stock - p_cantidad
  where id = p_producto_id and user_id = p_user_id;

  -- Registrar el movimiento (negativo porque es salida)
  insert into stock_movements (user_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, pedido_id, razon)
  values (p_user_id, p_producto_id, v_tipo, -p_cantidad, v_stock_actual, v_stock_actual - p_cantidad, p_pedido_id, p_razon);

  return true;
end;
$$ language plpgsql;

-- ==========================================
-- PARTE 4: FUNCIÓN AUXILIAR PARA RESTAURAR STOCK
-- ==========================================

-- Función para restaurar stock (devoluciones, cancelaciones)
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
begin
  -- Obtener stock actual del producto
  select stock into v_stock_actual
  from productos
  where id = p_producto_id and user_id = p_user_id;

  -- Si no existe el producto, retornar false
  if v_stock_actual is null then
    return false;
  end if;

  -- Determinar tipo de movimiento
  v_tipo := case
    when p_razon = 'cancelacion' then 'cancelacion'
    when p_razon = 'edicion' then 'edicion'
    else 'devolucion'
  end;

  -- Restaurar el stock
  update productos
  set stock = stock + p_cantidad
  where id = p_producto_id and user_id = p_user_id;

  -- Registrar el movimiento (positivo porque es entrada)
  insert into stock_movements (user_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, pedido_id, razon)
  values (p_user_id, p_producto_id, v_tipo, p_cantidad, v_stock_actual, v_stock_actual + p_cantidad, p_pedido_id, p_razon);

  return true;
end;
$$ language plpgsql;

-- ==========================================
-- NOTAS DE IMPLEMENTACIÓN
-- ==========================================

-- IMPORTANTE: Después de correr esta migración:
-- 1. Los pedidos existentes con estado='entregado' quedarán marcados como pagados
-- 2. Los pedidos con estado='pendiente' o 'cancelado' quedarán como estado_pago='pendiente'
-- 3. El stock actual NO se modificará (se asume que está correcto)
-- 4. Los futuros pedidos deducirán stock automáticamente vía AppContext
-- 5. Las funciones deducir_stock() y restaurar_stock() están disponibles para usar desde JavaScript

-- Para llamar las funciones desde JavaScript (Supabase client):
-- await supabase.rpc('deducir_stock', { p_user_id: user.id, p_producto_id: '...', p_cantidad: 10, p_pedido_id: '...', p_razon: 'venta' })
-- await supabase.rpc('restaurar_stock', { p_user_id: user.id, p_producto_id: '...', p_cantidad: 10, p_pedido_id: '...', p_razon: 'cancelacion' })
