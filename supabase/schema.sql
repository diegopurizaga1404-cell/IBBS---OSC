-- ══════════════════════════════════════════════════════════
--  IBBS – Gestión de Incidencias  |  Supabase Schema
--  Run this once in your Supabase project:
--    Dashboard → SQL Editor → paste & run

--comentarios
-- ══════════════════════════════════════════════════════════










-- ── 1. tickets_entidades (Tab 1 / Tab 2 / Tab 6) ──────────
CREATE TABLE IF NOT EXISTS tickets_entidades (
  id                    TEXT        PRIMARY KEY,           -- "ENT-<timestamp+idx>"
  tipo_tab              TEXT        DEFAULT 'entidades',
  nombre                TEXT,
  dni                   TEXT,
  cel                   TEXT,
  email                 TEXT,
  fecha_inc             TEXT,                              -- "YYYY-MM-DD"
  hora_inc              TEXT,                              -- "HH:MM"
  descripcion           TEXT,
  soc_detalles          TEXT,
  region                TEXT,
  provincia             TEXT,
  localidad             TEXT,
  tipo                  TEXT,                              -- 'Hospital' | 'Institución Educativa' | 'Comisaria' | 'CAD Type A' | 'CAD Type B' | 'Plaza'
  institucion           TEXT,
  estado                TEXT        DEFAULT 'Abierto',     -- 'Abierto' | 'En Proceso' | 'Cerrado'
  causa_incidencia      TEXT,
  generado_cc           BOOLEAN     DEFAULT FALSE,
  resuelto              TEXT        DEFAULT 'pendiente',   -- 'pendiente' | 'confirmado'
  finalizado            BOOLEAN     DEFAULT FALSE,
  cc_number             TEXT,
  tt_number             TEXT,
  wo_number             TEXT,
  mensaje_predeterminado TEXT,
  resuelto_remoto_soc   BOOLEAN,
  equipo_registro       TEXT,
  equipo_resolutor      TEXT,                              -- 'OSC' | 'O&M'
  cerrado_por           TEXT,
  fecha_cierre          TEXT,
  actividades           JSONB,                             -- audit trail array
  om_hora_contacto      TIMESTAMPTZ,
  om_dia_visita         TIMESTAMPTZ,
  causa_ts              TIMESTAMPTZ,
  cc_ts                 TIMESTAMPTZ,
  tt_ts                 TIMESTAMPTZ,
  wo_ts                 TIMESTAMPTZ,
  om_hora_ts            TIMESTAMPTZ,
  om_visita_ts          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  created_by            TEXT
);

ALTER TABLE tickets_entidades ENABLE ROW LEVEL SECURITY;

-- Allow full access via the anon (publishable) key
CREATE POLICY "anon_all_entidades" ON tickets_entidades
  FOR ALL TO anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- Migrations for existing databases (safe to re-run)
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS soc_detalles          TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS estado                TEXT        DEFAULT 'Abierto';
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS causa_incidencia      TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS wo_number             TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS mensaje_predeterminado TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS resuelto_remoto_soc   BOOLEAN;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS equipo_registro       TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS equipo_resolutor      TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS cerrado_por           TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS fecha_cierre          TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS actividades           JSONB;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS om_hora_contacto      TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS om_dia_visita         TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS causa_ts              TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS cc_ts                 TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS tt_ts                 TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS wo_ts                 TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS om_hora_ts            TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS om_visita_ts          TIMESTAMPTZ;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS created_by            TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS tipo_registro         TEXT        DEFAULT 'Usuario';
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS asignado_a            TEXT;
ALTER TABLE tickets_entidades ADD COLUMN IF NOT EXISTS asignado_ts           TIMESTAMPTZ;

-- Add user_name to user_permissions for Asignar lookup
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS user_name TEXT;


-- ── 2. tickets_soc (Tab 3 / Tab 4) ───────────────────────
CREATE TABLE IF NOT EXISTS tickets_soc (
  id              TEXT        PRIMARY KEY,         -- "SOC-<timestamp>"
  tipo_tab        TEXT        DEFAULT 'soc',
  region          TEXT,
  tipo_nodo       TEXT,                            -- AX | TX
  codigo          TEXT,
  nombre_nodo     TEXT,
  fecha_inc       TEXT,
  hora_inc        TEXT,
  fecha_rep       TEXT,
  hora_rep        TEXT,
  detectado_por   TEXT,                            -- 'tecnico' | 'soc'
  hay_grabacion   TEXT,                            -- 'si' | 'no'
  tipos_incidente TEXT[],                          -- array of incident type strings
  descripcion     TEXT,
  resuelto        TEXT        DEFAULT 'pendiente',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      TEXT
);

ALTER TABLE tickets_soc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_soc" ON tickets_soc
  FOR ALL TO anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- Migration for existing databases
ALTER TABLE tickets_soc ADD COLUMN IF NOT EXISTS created_by TEXT;


-- ── 3. enlaces (Tab 5) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS enlaces (
  id          TEXT        PRIMARY KEY,             -- "ENL-<timestamp>"
  titulo      TEXT        NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE enlaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_enlaces" ON enlaces
  FOR ALL TO anon
  USING (TRUE)
  WITH CHECK (TRUE);
