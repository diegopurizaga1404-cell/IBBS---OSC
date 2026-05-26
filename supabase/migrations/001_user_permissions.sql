-- ═══════════════════════════════════════════════════════════════════
--  IBBS – Migración 001: Sistema de Permisos Granular de Usuario
--  Ejecutar en: Supabase Studio → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID,                      -- auth.users.id (nullable para usuarios sin Auth aún)
    user_email      TEXT NOT NULL UNIQUE,      -- clave de búsqueda principal

    -- ── Visibilidad del menú lateral ─────────────────────────────────
    perm_dashboard              BOOLEAN DEFAULT TRUE,
    perm_entidades_crear        BOOLEAN DEFAULT TRUE,
    perm_entidades_tickets      BOOLEAN DEFAULT TRUE,
    perm_soc_crear              BOOLEAN DEFAULT FALSE,
    perm_soc_registros          BOOLEAN DEFAULT FALSE,
    perm_biblioteca             BOOLEAN DEFAULT TRUE,

    -- ── Edición de bloques en detalle de ticket (Entidades – tab6) ───
    edit_clasificacion          BOOLEAN DEFAULT TRUE,
    edit_notas_tecnicas         BOOLEAN DEFAULT TRUE,
    edit_tickets_seguimiento    BOOLEAN DEFAULT TRUE,
    edit_datos_om               BOOLEAN DEFAULT TRUE,

    -- ── Edición en tickets SOC (tab4) ────────────────────────────────
    edit_descripcion_soc        BOOLEAN DEFAULT TRUE,

    -- ── Meta ─────────────────────────────────────────────────────────
    role_preset     TEXT DEFAULT 'editor',     -- 'admin' | 'editor' | 'viewer' | 'tecnico'
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_permissions_updated_at ON public.user_permissions;
CREATE TRIGGER set_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Admins pueden leer y escribir todo
CREATE POLICY "Admins can manage all permissions"
    ON public.user_permissions
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Cada usuario puede leer sus propios permisos
CREATE POLICY "Users can read own permissions"
    ON public.user_permissions
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR (auth.jwt() -> 'user_metadata' ->> 'email') = user_email
    );

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_user_permissions_email ON public.user_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
