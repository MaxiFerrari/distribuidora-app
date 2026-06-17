-- ============================================
-- FIX: Permitir que usuarios vean su propia distribuidora
-- Fecha: 2026-06-17
-- Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- Eliminar la policy existente
drop policy if exists "distribuidoras_super_admin" on distribuidoras;

-- Nueva policy: super_admin ve todas + usuarios ven solo la suya
create policy "distribuidoras_access" on distribuidoras
  for select using (
    -- Super admin ve todas
    is_super_admin()
    or
    -- Usuarios ven solo su distribuidora
    id = get_user_distribuidora_id()
  );

-- Solo super_admin puede modificar distribuidoras
create policy "distribuidoras_modify" on distribuidoras
  for all using (is_super_admin())
  with check (is_super_admin());
