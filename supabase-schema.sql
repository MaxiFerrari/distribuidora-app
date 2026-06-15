-- ============================================
-- SCHEMA: Gestor de Pedidos - Distribuidoras
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- TABLAS

create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  telefono text not null default '',
  direccion text default '',
  zona text default '',
  notas text default '',
  created_at timestamptz default now()
);

create table if not exists productos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  precio numeric not null default 0,
  unidad text default 'unid',
  stock integer default 0,
  stock_minimo integer default 12,
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nombre text not null,
  cliente_telefono text default '',
  fecha timestamptz default now(),
  estado text default 'pendiente',
  subtotal numeric default 0,
  descuento_total numeric default 0,
  total numeric default 0,
  notas text default '',
  created_at timestamptz default now()
);

create table if not exists pedido_items (
  id uuid default gen_random_uuid() primary key,
  pedido_id uuid references pedidos(id) on delete cascade not null,
  producto_id uuid,
  nombre text not null,
  cantidad integer not null,
  precio_unitario numeric not null,
  descuento numeric default 0
);

-- ROW LEVEL SECURITY

alter table clientes enable row level security;
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

-- POLICIES: cada usuario solo ve y modifica sus propios datos

create policy "clientes_own" on clientes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "productos_own" on productos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pedidos_own" on pedidos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pedido_items_own" on pedido_items
  for all using (
    pedido_id in (select id from pedidos where user_id = auth.uid())
  );

-- ÍNDICES para performance en búsquedas frecuentes

create index if not exists clientes_user_id_idx on clientes(user_id);
create index if not exists productos_user_id_idx on productos(user_id);
create index if not exists pedidos_user_id_idx on pedidos(user_id);
create index if not exists pedidos_cliente_id_idx on pedidos(cliente_id);
create index if not exists pedido_items_pedido_id_idx on pedido_items(pedido_id);
