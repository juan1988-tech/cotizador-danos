-- =============================================================================
-- Migration: Initial schema for cotizador-danos
-- =============================================================================

-- Sequence for folio generation
CREATE SEQUENCE IF NOT EXISTS seq_folios START 1000;

-- ── quotes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  numero_folio              VARCHAR(50)   PRIMARY KEY,
  estado_cotizacion         VARCHAR(30)   NOT NULL DEFAULT 'EN_EDICION',
  datos_asegurado           JSONB,
  configuracion_layout      JSONB,
  opciones_cobertura        JSONB,
  primas_por_ubicacion      JSONB,
  version                   INTEGER       NOT NULL DEFAULT 1,
  fecha_creacion            TIMESTAMP     NOT NULL DEFAULT NOW(),
  fecha_ultima_actualizacion TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_estado CHECK (estado_cotizacion IN (
    'EN_EDICION','DATOS_GENERALES_COMPLETOS','UBICACIONES_CONFIGURADAS',
    'COBERTURAS_SELECCIONADAS','CALCULADA'
  )),
  CONSTRAINT chk_version CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_quotes_estado ON quotes(estado_cotizacion);
CREATE INDEX IF NOT EXISTS idx_quotes_fecha ON quotes(fecha_creacion DESC);

-- ── locations ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                  SERIAL        PRIMARY KEY,
  numero_folio        VARCHAR(50)   NOT NULL REFERENCES quotes(numero_folio) ON DELETE CASCADE,
  indice_ubicacion    INTEGER       NOT NULL,
  descripcion         VARCHAR(200),
  codigo_postal       VARCHAR(10),
  giro_id             VARCHAR(50),
  garantias           JSONB         NOT NULL DEFAULT '[]',
  estado_validacion   VARCHAR(20)   NOT NULL DEFAULT 'INCOMPLETA',
  alertas_bloqueantes JSONB         NOT NULL DEFAULT '[]',
  version             INTEGER       NOT NULL DEFAULT 1,
  fecha_creacion      TIMESTAMP     NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (numero_folio, indice_ubicacion),
  CONSTRAINT chk_estado_validacion CHECK (estado_validacion IN ('COMPLETA', 'INCOMPLETA'))
);

CREATE INDEX IF NOT EXISTS idx_locations_folio ON locations(numero_folio);
CREATE INDEX IF NOT EXISTS idx_locations_cp    ON locations(codigo_postal);

-- ── catalog tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogos_agentes (
  id      SERIAL       PRIMARY KEY,
  clave   VARCHAR(20)  UNIQUE NOT NULL,
  nombre  VARCHAR(200) NOT NULL,
  email   VARCHAR(100),
  activo  BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalogos_suscriptores (
  id      SERIAL       PRIMARY KEY,
  codigo  VARCHAR(20)  UNIQUE NOT NULL,
  nombre  VARCHAR(200) NOT NULL,
  activo  BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalogos_giros (
  id             SERIAL       PRIMARY KEY,
  clave_giro     VARCHAR(20)  UNIQUE NOT NULL,
  descripcion    VARCHAR(200) NOT NULL,
  clave_incendio VARCHAR(20),
  activo         BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalogo_cp_zonas (
  codigo_postal  VARCHAR(10)  PRIMARY KEY,
  municipio      VARCHAR(100) NOT NULL,
  estado         VARCHAR(100) NOT NULL,
  ciudad         VARCHAR(100),
  activo         BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tarifas_incendio (
  id             SERIAL        PRIMARY KEY,
  clave_incendio VARCHAR(20)   NOT NULL,
  descripcion    VARCHAR(200),
  tasa_base      DECIMAL(10,6) NOT NULL,
  vigente        BOOLEAN       NOT NULL DEFAULT true,
  UNIQUE (clave_incendio, vigente)
);

-- ── Auto-update timestamp trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotes_ts ON quotes;
CREATE TRIGGER trg_quotes_ts
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ── Seed data ─────────────────────────────────────────────────────────────────
INSERT INTO catalogos_agentes (clave, nombre, email) VALUES
  ('AGT-001', 'Juan Pérez',    'juan.perez@example.com'),
  ('AGT-002', 'María García',  'maria.garcia@example.com')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO catalogos_suscriptores (codigo, nombre) VALUES
  ('SUB-042', 'Suscriptor Principal'),
  ('SUB-099', 'Suscriptor Secundario')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO catalogos_giros (clave_giro, descripcion, clave_incendio) VALUES
  ('GIR-015', 'Comercio al por menor de abarrotes', 'INC-01'),
  ('GIR-099', 'Almacenamiento general',             'INC-02'),
  ('GIR-030', 'Oficinas administrativas',           'INC-03')
ON CONFLICT (clave_giro) DO NOTHING;

INSERT INTO catalogo_cp_zonas (codigo_postal, municipio, estado) VALUES
  ('06600', 'Cuauhtémoc',  'Ciudad de México'),
  ('44100', 'Guadalajara', 'Jalisco'),
  ('64000', 'Monterrey',   'Nuevo León')
ON CONFLICT (codigo_postal) DO NOTHING;

INSERT INTO tarifas_incendio (clave_incendio, descripcion, tasa_base) VALUES
  ('INC-01', 'Comercio bajo riesgo', 0.001500),
  ('INC-02', 'Almacenamiento',       0.002500),
  ('INC-03', 'Oficinas',             0.001200)
ON CONFLICT (clave_incendio, vigente) DO NOTHING;
