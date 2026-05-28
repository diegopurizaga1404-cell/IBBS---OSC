-- ═══════════════════════════════════════════════════════════════════
--  IBBS – Migración 002: Nuevas columnas tickets_entidades y user_permissions
-- ═══════════════════════════════════════════════════════════════════

-- Tipo de registro (Customer Complaint / IBBS Issues)
ALTER TABLE public.tickets_entidades
    ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'Usuario';

-- Asignación de responsable
ALTER TABLE public.tickets_entidades
    ADD COLUMN IF NOT EXISTS asignado_a TEXT;

ALTER TABLE public.tickets_entidades
    ADD COLUMN IF NOT EXISTS asignado_ts TIMESTAMPTZ;

-- Nombre de usuario en permisos (para lookup de @oscteam.com)
ALTER TABLE public.user_permissions
    ADD COLUMN IF NOT EXISTS user_name TEXT;
