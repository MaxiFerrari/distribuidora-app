-- ============================================
-- TRIGGER: Auto-crear usuario_app cuando se registra en auth
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- DESPUÉS de migration-multi-tenant.sql
-- ============================================

-- Este trigger crea automáticamente un registro en usuarios_app
-- cuando un usuario se registra vía signUp()

create or replace function handle_new_user()
returns trigger as $$
begin
  -- Crear usuario_app como empleado de la distribuidora demo por defecto
  -- El super_admin puede luego cambiar la distribuidora y rol
  insert into public.usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email, activo)
  values (
    new.id,
    '00000000-0000-0000-0000-000000000001', -- Distribuidora Demo
    'empleado',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que se ejecuta después de insertar en auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ==========================================
-- NOTAS
-- ==========================================

-- Después de correr este trigger:
-- 1. Cualquier nuevo usuario que se registre vía signUp() se creará automáticamente en usuarios_app
-- 2. Se asignará a la "Distribuidora Demo" por defecto
-- 3. Tendrá rol "empleado" por defecto
-- 4. El super_admin puede luego editar el usuario para cambiarlo de distribuidora o rol

-- Si quieres que los nuevos usuarios NO tengan acceso hasta que el admin los asigne:
-- Cambia `activo: true` por `activo: false` en la línea del INSERT
