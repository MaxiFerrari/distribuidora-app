-- ============================================
-- SCHEMA UPDATE — Nuevas features
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Descuento general por cliente (feature 2)
alter table clientes add column if not exists descuento_general numeric default 0;

-- 2. Tabla notas de crédito / devoluciones (feature 11)
create table if not exists notas_credito (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pedido_id uuid references pedidos(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nombre text not null,
  fecha timestamptz default now(),
  motivo text not null,
  monto numeric not null default 0,
  notas text default '',
  created_at timestamptz default now()
);

alter table notas_credito enable row level security;

create policy "notas_credito_own" on notas_credito
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists notas_credito_user_id_idx on notas_credito(user_id);
create index if not exists notas_credito_cliente_id_idx on notas_credito(cliente_id);
