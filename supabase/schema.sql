-- ══════════════════════════════════════════════════════════
--  IBBS – Gestión de Incidencias  |  Supabase Schema
--  Run this once in your Supabase project:
--    Dashboard → SQL Editor → paste & run

--comentarios
-- ══════════════════════════════════════════════════════════










-- ── 1. tickets_entidades (Tab 1 / Tab 2 / Tab 6) ──────────
CREATE TABLE IF NOT EXISTS tickets_entidades (
  id            TEXT        PRIMARY KEY,           -- "ENT-<timestamp>"
  tipo_tab      TEXT        DEFAULT 'entidad',
  nombre        TEXT,
  dni           TEXT,
  cel           TEXT,
  email         TEXT,
  fecha_inc     TEXT,                              -- "YYYY-MM-DD" from <input type="date">
  hora_inc      TEXT,                              -- "HH:MM"     from <input type="time">
  descripcion   TEXT,
  region        TEXT,
  provincia     TEXT,
  localidad     TEXT,
  tipo          TEXT,                              -- 'Hospital' | 'Institución Educativa' | 'Comisaria' | 'CAD Type A' | 'CAD Type B' | 'Plaza'
  institucion   TEXT,
  generado_cc   BOOLEAN     DEFAULT FALSE,
  resuelto      TEXT        DEFAULT 'pendiente',   -- 'pendiente' | 'confirmado'
  finalizado    BOOLEAN     DEFAULT FALSE,
  cc_number     TEXT,
  tt_number     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tickets_entidades ENABLE ROW LEVEL SECURITY;

-- Allow full access via the anon (publishable) key
CREATE POLICY "anon_all_entidades" ON tickets_entidades
  FOR ALL TO anon
  USING (TRUE)
  WITH CHECK (TRUE);


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
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tickets_soc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_soc" ON tickets_soc
  FOR ALL TO anon
  USING (TRUE)
  WITH CHECK (TRUE);


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
