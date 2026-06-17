-- ============================================
-- FIX: Trigger no debe asignar distribuidora automáticamente
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- Reemplazar la función handle_new_user para que NO asigne distribuidora
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Crear usuario_app SIN distribuidora asignada
  -- El super_admin debe asignar manualmente la distribuidora después
  insert into public.usuarios_app (auth_user_id, distribuidora_id, rol, nombre_completo, email, activo)
  values (
    new.id,
    null,  -- SIN distribuidora (era el problema: antes ponía '00000000-0000-0000-0000-000000000001')
    'empleado',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    false  -- INACTIVO hasta que el admin lo asigne (opcional: cambiar a true si querés)
  );
  return new;
end;
$$ language plpgsql security definer;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Después de ejecutar esto:
-- 1. Los nuevos usuarios se crearán con distribuidora_id = null
-- 2. NO verán ningún dato hasta que el super_admin los asigne
-- 3. Aparecerán en "Todos los Usuarios" con tag "Sin asignar"
