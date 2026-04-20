# 📋 Plan de Trabajo - Cotizador de Seguros de Daños

## 🎯 Resumen Ejecutivo

**Proyecto**: Sistema de cotización de seguros de daños  
**Stack**: React + TypeScript + Tailwind / Node + Express + PostgreSQL  
**Metodología**: ASSD (obligatorio)  
**Fecha límite**: 21 de abril de 2026, 5:00 PM  

---

## 📅 Fase 1: Investigación y Especificación ASSD

### 🔍 Actividades principales

#### 1. Investigación de metodología ASSD

- Investigar la metodología ASDD
- Adaptar el plan de trabajo a una metodología ASDD (Agent Spec Driven Developtment)

#### 2. Análisis del dominio de negocio

- Identificar reglas de negocio críticas
- Entender los Specs obligatorios a generar para viabilizar el plan de ejecución del proyecto

### 3. Definición de estrategia IA

- Generar un documento de plan de trabajo para la planeación de la estrategia IA
- Definir el **backlog** el conjunto de herramientas de IA del repositorio de Sofka AI center
- Ajustar las herramientas del **backlog** a la realidad del proyecto

| **Herramienta**       | **Área**              |
|-----------------------|-----------------------|
| **Skills**            | Backend, Frontend, QA |
| **Instructions**      | Backend, Frontend, QA |
| **Agents**            | Backend, Frontend, QA |
| **MCPs**              | Backend, Frontend, QA |

- Definir la dinámica de agentes especializados, Orquestador y SPECS


#### 4. Generación de Specs ASSD (con apoyo de IA)

- **Spec de Requerimientos Funcionales**
  - Casos de uso detallados
  - User stories
  - Criterios de aceptación
  
- **Spec de Arquitectura**
  - Arquitectura de alto nivel
  - Componentes y capas
  - Decisiones técnicas (ADRs)
  
- **Spec de Modelo de Datos**
  - Diagrama entidad-relación
  - Diccionario de datos
  - Restricciones y validaciones
  
- **Spec de APIs**
  - Contratos de endpoints
  - Esquemas de request/response
  - Códigos de error
  
- **Spec de Reglas de Negocio**
  - Lógica de cálculo de primas
  - Validaciones de negocio
  - Flujos de estado
  
- **Spec de Pruebas**
  - Estrategia de testing
  - Casos de prueba
  - Cobertura esperada

### ✅ Entregables

- Specs ASDD documentos e ingresados a un kanban
- Mapa de flujo de usuario

---

## 📅 Fase 2: Diseño de Arquitectura (Semana 3-4)

### 🏗️ Arquitectura Backend

**Enfoque**: MVC Architecture

```javascript
plataformas-danos-back/
├── src/
│   ├── controllers/           # Lógica de control (Recibe req, llama al modelo, responde)
│   │   ├── QuoteController.ts
│   │   ├── LocationController.ts
│   │   └── CatalogController.ts
│   │
│   ├── models/                # Definición de datos y lógica de negocio (Entidades/Esquemas)
│   │   ├── Quote.ts
│   │   ├── Location.ts
│   │   ├── Coverage.ts
│   │   └── User.ts
│   │
│   ├── routes/                # Definición de endpoints
│   │   ├── quoteRoutes.ts
│   │   ├── locationRoutes.ts
│   │   └── index.ts           # Agregador de rutas
│   │
│   ├── services/              # (Opcional) Lógica pesada o cálculos (ej. calculo de prima)
│   │   ├── PremiumService.ts
│   │   └── ExternalCoreService.ts
│   │
│   ├── middlewares/           # Validaciones, Auth, Error Handler
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   │
│   ├── config/                # Configuración de BD y variables de entorno
│   │   └── database.ts
│   │
│   └── utils/                 # Funciones de ayuda y constantes
│       └── helpers.ts
│
├── tests/
├── .env
├── package.json
└── tsconfig.json
```

### 🎨 Arquitectura Frontend

**Enfoque**: Feature-based architecture + Atomic Design

```typescript
cotizador-danos-web/
├── src/
│   ├── features/                  # Módulos por funcionalidad
│   │   ├── quotes/
│   │   │   ├── components/
│   │   │   │   ├── QuoteForm.tsx
│   │   │   │   ├── QuoteHeader.tsx
│   │   │   │   └── QuoteProgress.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useQuote.ts
│   │   │   │   └── useQuoteState.ts
│   │   │   ├── services/
│   │   │   │   └── quoteApi.ts
│   │   │   ├── types/
│   │   │   │   └── quote.types.ts
│   │   │   └── utils/
│   │   │
│   │   ├── locations/
│   │   │   ├── components/
│   │   │   │   ├── LocationList.tsx
│   │   │   │   ├── LocationForm.tsx
│   │   │   │   └── LocationCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLocations.ts
│   │   │   └── services/
│   │   │       └── locationApi.ts
│   │   │
│   │   ├── coverage/
│   │   │   ├── components/
│   │   │   │   ├── CoverageOptions.tsx
│   │   │   │   └── CoverageSelector.tsx
│   │   │   └── hooks/
│   │   │
│   │   └── calculation/
│   │       ├── components/
│   │       │   ├── CalculationButton.tsx
│   │       │   ├── PremiumResults.tsx
│   │       │   └── LocationBreakdown.tsx
│   │       └── hooks/
│   │           └── useCalculation.ts
│   │
│   ├── shared/
│   │   ├── components/            # Atomic Design
│   │   │   ├── atoms/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Alert.tsx
│   │   │   ├── molecules/
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── Card.tsx
│   │   │   ├── organisms/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── templates/
│   │   │       └── PageLayout.tsx
│   │   ├── hooks/
│   │   │   ├── useApi.ts
│   │   │   └── useForm.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   └── queryClient.ts
│   │   ├── types/
│   │   │   └── common.types.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── formatters.ts
│   │
│   ├── layouts/
│   │   ├── MainLayout.tsx
│   │   └── QuoteLayout.tsx
│   │
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── store/                     # State Management
│   │   ├── quoteStore.ts
│   │   └── catalogStore.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

### 🗄️ Diseño de Base de Datos

#### Modelo de Datos Principal

```sql
-- ============================================================================
-- TABLA: quotes (cotizaciones_danos)
-- ============================================================================
CREATE TABLE quotes (
  numero_folio VARCHAR(50) PRIMARY KEY,
  estado_cotizacion VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
  
  -- Datos del Asegurado (JSONB para flexibilidad)
  datos_asegurado JSONB NOT NULL,
  -- Estructura: { nombre, rfc, email, telefono }
  
  -- Datos de Conducción
  datos_conduccion JSONB NOT NULL,
  -- Estructura: { codigoAgente, nombreAgente, suscriptor }
  
  clasificacion_riesgo VARCHAR(20),
  tipo_negocio VARCHAR(20),
  
  -- Configuración de Layout de Ubicaciones
  configuracion_layout JSONB,
  -- Estructura: { tipoLayout, numeroUbicaciones, distribucion }
  
  -- Opciones de Cobertura
  opciones_cobertura JSONB,
  -- Estructura: { coberturas[], deducibles[], limites[] }
  
  -- Resultados Financieros
  prima_neta DECIMAL(15,2),
  prima_comercial DECIMAL(15,2),
  primas_por_ubicacion JSONB,
  -- Estructura: [{ indice, primaNeta, primaComercial, componentes[] }]
  
  -- Control de Versión (Optimistic Locking)
  version INTEGER DEFAULT 1 NOT NULL,
  
  -- Metadatos
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_ultima_actualizacion TIMESTAMP DEFAULT NOW(),
  usuario_creacion VARCHAR(100),
  usuario_actualizacion VARCHAR(100),
  
  -- Constraints
  CONSTRAINT chk_estado CHECK (estado_cotizacion IN 
    ('BORRADOR', 'EN_PROCESO', 'CALCULADA', 'EMITIDA', 'CANCELADA')),
  CONSTRAINT chk_version CHECK (version > 0)
);

-- Índices para optimización
CREATE INDEX idx_quotes_estado ON quotes(estado_cotizacion);
CREATE INDEX idx_quotes_fecha_creacion ON quotes(fecha_creacion DESC);
CREATE INDEX idx_quotes_datos_conduccion ON quotes USING GIN (datos_conduccion);


-- ============================================================================
-- TABLA: locations (ubicaciones)
-- ============================================================================
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  numero_folio VARCHAR(50) NOT NULL REFERENCES quotes(numero_folio) ON DELETE CASCADE,
  indice INTEGER NOT NULL,
  
  -- Datos de Identificación
  nombre_ubicacion VARCHAR(200) NOT NULL,
  
  -- Dirección
  direccion TEXT NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  colonia VARCHAR(100),
  ciudad VARCHAR(100),
  
  -- Características Constructivas
  tipo_constructivo VARCHAR(50),
  nivel VARCHAR(20),
  anio_construccion INTEGER,
  
  -- Información de Giro
  giro JSONB NOT NULL,
  -- Estructura: { claveGiro, descripcion, claveIncendio }
  
  -- Garantías/Coberturas
  garantias JSONB,
  -- Estructura: [{ clave, descripcion, sumaAsegurada, deducible }]
  
  -- Información Catastrófica
  zona_catastrofica VARCHAR(20),
  zona_tev VARCHAR(10),
  zona_fhm VARCHAR(10),
  
  -- Validación y Alertas
  alertas_bloqueantes JSONB,
  -- Estructura: [{ tipo, mensaje, severidad }]
  estado_validacion VARCHAR(20) DEFAULT 'PENDIENTE',
  
  -- Metadatos
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(numero_folio, indice),
  CONSTRAINT chk_estado_validacion CHECK (estado_validacion IN 
    ('PENDIENTE', 'VALIDA', 'INVALIDA', 'INCOMPLETA')),
  CONSTRAINT chk_anio_construccion CHECK (
    anio_construccion IS NULL OR 
    (anio_construccion >= 1900 AND anio_construccion <= EXTRACT(YEAR FROM NOW()))
  )
);

-- Índices
CREATE INDEX idx_locations_folio ON locations(numero_folio);
CREATE INDEX idx_locations_codigo_postal ON locations(codigo_postal);
CREATE INDEX idx_locations_estado_validacion ON locations(estado_validacion);
CREATE INDEX idx_locations_giro ON locations USING GIN (giro);


-- ============================================================================
-- TABLAS DE PARÁMETROS Y TARIFAS
-- ============================================================================

-- Parámetros Globales de Cálculo
CREATE TABLE parametros_calculo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  valor JSONB NOT NULL,
  fecha_vigencia_inicio DATE NOT NULL,
  fecha_vigencia_fin DATE,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tarifas de Incendio
CREATE TABLE tarifas_incendio (
  id SERIAL PRIMARY KEY,
  clave_giro VARCHAR(20) NOT NULL,
  clave_incendio VARCHAR(20) NOT NULL,
  descripcion VARCHAR(200),
  tasa_base DECIMAL(10,6) NOT NULL,
  factor_contenidos DECIMAL(10,6),
  metadatos JSONB,
  vigente BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(clave_incendio, vigente)
);

-- Tarifas CAT (Catastrófico)
CREATE TABLE tarifas_cat (
  id SERIAL PRIMARY KEY,
  zona_cat VARCHAR(10) NOT NULL,
  tipo_cobertura VARCHAR(50) NOT NULL,
  factor DECIMAL(10,6) NOT NULL,
  vigente BOOLEAN DEFAULT true,
  
  UNIQUE(zona_cat, tipo_cobertura, vigente)
);

-- Tarifas FHM (Fenómenos Hidrometeorológicos)
CREATE TABLE tarifa_fhm (
  id SERIAL PRIMARY KEY,
  grupo VARCHAR(20) NOT NULL,
  zona_fhm VARCHAR(10) NOT NULL,
  condicion VARCHAR(50),
  cuota DECIMAL(10,6) NOT NULL,
  vigente BOOLEAN DEFAULT true,
  
  UNIQUE(grupo, zona_fhm, condicion, vigente)
);

-- Factores Equipo Electrónico
CREATE TABLE factores_equipo_electronico (
  id SERIAL PRIMARY KEY,
  clase VARCHAR(50) NOT NULL,
  nivel_zona VARCHAR(10) NOT NULL,
  factor DECIMAL(10,6) NOT NULL,
  vigente BOOLEAN DEFAULT true,
  
  UNIQUE(clase, nivel_zona, vigente)
);

-- Catálogo de Códigos Postales y Zonas
CREATE TABLE catalogo_cp_zonas (
  codigo_postal VARCHAR(10) PRIMARY KEY,
  estado VARCHAR(100) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100),
  zona_cat VARCHAR(10),
  zona_tev VARCHAR(10),
  zona_fhm VARCHAR(10),
  nivel_tecnico VARCHAR(10),
  activo BOOLEAN DEFAULT true
);

-- Dimensión Zona TEV
CREATE TABLE dim_zona_tev (
  zona_tev VARCHAR(10) PRIMARY KEY,
  descripcion VARCHAR(200),
  factor_base DECIMAL(10,6)
);

-- Dimensión Zona FHM
CREATE TABLE dim_zona_fhm (
  zona_fhm VARCHAR(10) PRIMARY KEY,
  descripcion VARCHAR(200),
  nivel_riesgo VARCHAR(20)
);


-- ============================================================================
-- CATÁLOGOS DE REFERENCIA (para servicio core mock)
-- ============================================================================

-- Suscriptores
CREATE TABLE catalogos_suscriptores (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true
);

-- Agentes
CREATE TABLE catalogos_agentes (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true
);

-- Giros
CREATE TABLE catalogos_giros (
  id SERIAL PRIMARY KEY,
  clave_giro VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  clave_incendio VARCHAR(20) NOT NULL,
  categoria VARCHAR(50),
  activo BOOLEAN DEFAULT true
);

-- Clasificación de Riesgo
CREATE TABLE catalogos_clasificacion_riesgo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true
);

-- Garantías
CREATE TABLE catalogos_garantias (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50),
  tarifa_asociada VARCHAR(50),
  activo BOOLEAN DEFAULT true
);

-- Folios (generador secuencial)
CREATE TABLE folios (
  id SERIAL PRIMARY KEY,
  numero_folio VARCHAR(50) UNIQUE NOT NULL,
  tipo_documento VARCHAR(20) DEFAULT 'COTIZACION',
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  utilizado BOOLEAN DEFAULT false
);

-- Secuencia para generación de folios
CREATE SEQUENCE seq_folios START 1000;


-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Trigger para actualizar fecha_ultima_actualizacion
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quotes_update_timestamp
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_locations_update_timestamp
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Función para incrementar versión
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quotes_increment_version
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION increment_version();


-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista consolidada de cotizaciones con resumen
CREATE VIEW v_quotes_summary AS
SELECT 
  q.numero_folio,
  q.estado_cotizacion,
  q.datos_asegurado->>'nombre' as nombre_asegurado,
  q.datos_conduccion->>'codigoAgente' as codigo_agente,
  q.prima_neta,
  q.prima_comercial,
  q.version,
  q.fecha_creacion,
  q.fecha_ultima_actualizacion,
  COUNT(l.id) as total_ubicaciones,
  COUNT(CASE WHEN l.estado_validacion = 'VALIDA' THEN 1 END) as ubicaciones_validas,
  COUNT(CASE WHEN l.estado_validacion = 'INCOMPLETA' THEN 1 END) as ubicaciones_incompletas
FROM quotes q
LEFT JOIN locations l ON q.numero_folio = l.numero_folio
GROUP BY q.numero_folio;


-- ============================================================================
-- DATOS DE EJEMPLO (SEEDS)
-- ============================================================================

-- Insertar parámetros de cálculo de ejemplo
INSERT INTO parametros_calculo (codigo, descripcion, valor, fecha_vigencia_inicio) VALUES
('RECARGO_FRACCIONAMIENTO', 'Recargo por pago fraccionado', '{"mensual": 0.05, "trimestral": 0.03, "semestral": 0.015}'::jsonb, '2025-01-01'),
('DESCUENTO_ANTICIPO', 'Descuento por pago anticipado', '{"anual": 0.05}'::jsonb, '2025-01-01'),
('FACTOR_COMERCIAL', 'Factor para prima comercial', '{"factor": 1.15}'::jsonb, '2025-01-01');

-- Insertar suscriptores de ejemplo
INSERT INTO catalogos_suscriptores (codigo, nombre) VALUES
('SUB001', 'Suscriptor Principal'),
('SUB002', 'Suscriptor Secundario');

-- Insertar agentes de ejemplo
INSERT INTO catalogos_agentes (clave, nombre, email) VALUES
('AG001', 'Juan Pérez', 'juan.perez@example.com'),
('AG002', 'María García', 'maria.garcia@example.com');

-- Insertar giros de ejemplo
INSERT INTO catalogos_giros (clave_giro, descripcion, clave_incendio, categoria) VALUES
('G001', 'Oficinas Administrativas', 'INC-01', 'COMERCIAL'),
('G002', 'Almacén General', 'INC-02', 'INDUSTRIAL'),
('G003', 'Vivienda', 'INC-03', 'HABITACIONAL');

-- Insertar tarifas de incendio de ejemplo
INSERT INTO tarifas_incendio (clave_incendio, descripcion, tasa_base, factor_contenidos) VALUES
('INC-01', 'Riesgo Bajo - Oficinas', 0.0015, 1.2),
('INC-02', 'Riesgo Medio - Almacén', 0.0025, 1.5),
('INC-03', 'Riesgo Bajo - Habitacional', 0.0012, 1.1);
```

### 📊 Especificación de APIs

#### Endpoints Obligatorios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `PUT` | `/v1/quotes/{folio}/general-info` | Guardar datos generales |
| `GET` | `/v1/quotes/{folio}/locations/layout` | Consultar layout de ubicaciones |
| `PUT` | `/v1/quotes/{folio}/locations/layout` | Guardar layout de ubicaciones |
| `GET` | `/v1/quotes/{folio}/locations` | Listar ubicaciones |
| `PUT` | `/v1/quotes/{folio}/locations` | Crear/actualizar ubicaciones en lote |
| `PATCH` | `/v1/quotes/{folio}/locations/{indice}` | Editar ubicación específica |
| `GET` | `/v1/quotes/{folio}/locations/summary` | Resumen de ubicaciones |
| `GET` | `/v1/quotes/{folio}/state` | Estado de la cotización |
| `GET` | `/v1/quotes/{folio}/coverage-options` | Opciones de cobertura |
| `PUT` | `/v1/quotes/{folio}/coverage-options` | Guardar opciones de cobertura |
| `POST` | `/v1/quotes/{folio}/calculate` | Ejecutar cálculo de prima |

#### Ejemplo de Contrato API

```yaml
openapi: 3.0.0
info:
  title: Cotizador de Seguros de Daños API
  version: 1.0.0
  description: API para cotización de seguros de daños

paths:
  /v1/quotes/{folio}/general-info:
    put:
      summary: Actualizar datos generales de la cotización
      parameters:
        - name: folio
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GeneralInfoRequest'
      responses:
        '200':
          description: Datos actualizados exitosamente
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuoteResponse'
        '400':
          description: Datos inválidos
        '404':
          description: Folio no encontrado
        '409':
          description: Conflicto de versión (optimistic locking)

components:
  schemas:
    GeneralInfoRequest:
      type: object
      required:
        - datosAsegurado
        - datosConduccion
        - version
      properties:
        datosAsegurado:
          type: object
          properties:
            nombre:
              type: string
            rfc:
              type: string
            email:
              type: string
            telefono:
              type: string
        datosConduccion:
          type: object
          properties:
            codigoAgente:
              type: string
            suscriptor:
              type: string
        clasificacionRiesgo:
          type: string
        tipoNegocio:
          type: string
        version:
          type: integer
```

### 🎯 Decision Records (ADRs)

#### ADR-001: Uso de TypeScript en Backend y Frontend

**Contexto**: Necesitamos un lenguaje que garantice type-safety y mejore la mantenibilidad.

**Decisión**: Usar TypeScript en toda la aplicación.

**Consecuencias**:

- ✅ Type-safety en compile-time
- ✅ Mejor autocompletado y refactoring
- ✅ Documentación implícita en tipos
- ❌ Curva de aprendizaje inicial

#### ADR-002: Patrón Modelo-Vista-Controlador (MVC) para Backend

**Contexto**: Necesitamos una estructura que permita un desarrollo ágil, fácil de entender para el equipo y que acelere el tiempo de entrega (Time-to-Market).

**Decisión**: Implementar el patrón MVC, organizando el código en tres componentes principales: Modelos (datos y lógica), Vistas (respuestas JSON/DTO) y Controladores (flujo de peticiones).

**Consecuencias**:

- ✅ Desarrollo rápido
- ✅ Organización clara
- ❌ Acoplamiento

#### ADR-003: PostgreSQL como Base de Datos

**Contexto**: Requerimiento del stack técnico.

**Decisión**: Usar PostgreSQL con soporte JSONB para datos semi-estructurados.

**Consecuencias**:

- ✅ Soporte robusto de JSONB
- ✅ ACID completo
- ✅ Optimistic locking con versioning
- ✅ Extensibilidad

#### ADR-004: Gestión de Estado (React Query + Zustand)

**Contexto**: El cotizador requiere manejar datos asíncronos complejos (ubicaciones, cálculos de primas) y, al mismo tiempo, un estado global de la interfaz que persista entre los pasos del flujo (stepper).


**Decisión**: Usar Zustand como única fuente de verdad para el estado global, incluyendo tanto la lógica de la interfaz (pasos del stepper, modales) como los datos provenientes del servidor (folios, ubicaciones, cálculos).


**Consecuencias**:

- ✅ Arquitectura Simplificada
- ✅ Control Total
- ✅ Persistencia Directa
- ✅ Optimistic updates

### ✅ Entregables Fase 2

- Diagramas de arquitectura (C4 Model)
- Modelo de datos (ERD + SQL)
- Especificación de APIs
- Decision Records (ADRs)
- Documento de arquitectura técnica

---

## 📅 Fase 3: Setup de Proyecto e Infraestructura

### 🚀 Configuración Backend

#### 1. Inicializar Proyecto

```bash
# Crear directorio
mkdir plataformas-danos-back
cd plataformas-danos-back

# Inicializar npm
npm init -y

# Instalar dependencias principales
npm install express cors helmet morgan
npm install pg typeorm reflect-metadata
npm install dotenv joi
npm install class-validator class-transformer

# Instalar TypeScript y tipos
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/morgan
npm install -D ts-node nodemon

# Instalar herramientas de testing
npm install -D jest @types/jest ts-jest
npm install -D supertest @types/supertest

# Instalar linters y formatters
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
```

#### 2. Configuración TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### 3. Scripts en `package.json`

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:create": "npm run typeorm migration:create",
    "migration:run": "npm run typeorm migration:run -d src/infrastructure/database/data-source.ts",
    "migration:revert": "npm run typeorm migration:revert -d src/infrastructure/database/data-source.ts"
  }
}
```

#### 4. Archivo de Entorno (`.env.example`)

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cotizador_danos
DB_USER=admin
DB_PASSWORD=admin123
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Core Service (Mock)
CORE_SERVICE_URL=http://localhost:3001
CORE_SERVICE_TIMEOUT=5000

# Application Settings
OPTIMISTIC_LOCK_MAX_RETRIES=3
CALCULATION_TIMEOUT=10000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined
```

### 🎨 Configuración Frontend

#### 1. Crear Proyecto con Vite

```bash
# Crear proyecto React + TypeScript
npm create vite@latest cotizador-danos-web -- --template react-ts
cd cotizador-danos-web

# Instalar dependencias principales
npm install react-router-dom
npm install axios @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
npm install zustand

# Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Instalar UI utilities
npm install clsx tailwind-merge
npm install lucide-react

# Instalar testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event happy-dom
npm install -D @playwright/test
```

#### 2. Configuración Tailwind (`tailwind.config.js`)

Dado que Tailwind es un marco de trabajo para crear interfaces de usuario a medida, ha sido diseñado desde cero teniendo en cuenta la personalización.

Por defecto, Tailwind buscará un tailwind.config.jsarchivo opcional en la raíz de tu proyecto donde podrás definir cualquier personalización.

```javascript
// Example `tailwind.config.js` file
const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    colors: {
      gray: colors.coolGray,
      blue: colors.lightBlue,
      red: colors.rose,
      pink: colors.fuchsia,
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  variants: {
    extend: {
      borderColor: ['focus-visible'],
      opacity: ['disabled'],
    }
  }
}
```

#### 3. Configuración Vite (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/tests/setup.ts',
  },
})
```

#### 4. Scripts en `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

### 🐳 Docker Compose

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: cotizador-postgres
    environment:
      POSTGRES_DB: cotizador_danos
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d cotizador_danos"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cotizador-network

  # Backend API
  backend:
    build:
      context: ./plataformas-danos-back
      dockerfile: Dockerfile
    container_name: cotizador-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cotizador_danos
      DB_USER: admin
      DB_PASSWORD: admin123
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./plataformas-danos-back:/app
      - /app/node_modules
    networks:
      - cotizador-network
    command: npm run dev

  # Frontend SPA
  frontend:
    build:
      context: ./cotizador-danos-web
      dockerfile: Dockerfile
    container_name: cotizador-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend
    volumes:
      - ./cotizador-danos-web:/app
      - /app/node_modules
    networks:
      - cotizador-network
    command: npm run dev

  # PgAdmin (opcional, para gestión de BD)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cotizador-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@cotizador.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - cotizador-network

volumes:
  postgres_data:

networks:
  cotizador-network:
    driver: bridge
```

#### Dockerfile Backend

```dockerfile
# plataformas-danos-back/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Dockerfile Frontend

```dockerfile
# cotizador-danos-web/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

### 🔧 Scripts de Utilidad

#### `scripts/setup.sh`

```bash
#!/bin/bash

echo "🚀 Configurando entorno de desarrollo..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar Docker
echo -e "${BLUE}Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi
echo -e "${GREEN}✓ Docker instalado${NC}"

# 2. Verificar Node.js
echo -e "${BLUE}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# 3. Crear archivos .env
echo -e "${BLUE}Creando archivos de entorno...${NC}"
if [ ! -f plataformas-danos-back/.env ]; then
    cp plataformas-danos-back/.env.example plataformas-danos-back/.env
    echo -e "${GREEN}✓ Backend .env creado${NC}"
fi

if [ ! -f cotizador-danos-web/.env ]; then
    cp cotizador-danos-web/.env.example cotizador-danos-web/.env
    echo -e "${GREEN}✓ Frontend .env creado${NC}"
fi

# 4. Instalar dependencias
echo -e "${BLUE}Instalando dependencias...${NC}"
cd plataformas-danos-back && npm install
cd ../cotizador-danos-web && npm install
cd ..

echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# 5. Levantar Docker
echo -e "${BLUE}Iniciando servicios Docker...${NC}"
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo "Esperando a PostgreSQL..."
sleep 5

echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"

# 6. Ejecutar migraciones
echo -e "${BLUE}Ejecutando migraciones...${NC}"
cd plataformas-danos-back
npm run migration:run
echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"

echo ""
echo -e "${GREEN}🎉 Setup completado exitosamente!${NC}"
echo ""
echo "Para iniciar el desarrollo:"
echo "  Backend:  cd plataformas-danos-back && npm run dev"
echo "  Frontend: cd cotizador-danos-web && npm run dev"
echo ""
echo "O ejecutar todo con Docker:"
echo "  docker-compose up"
```

#### `scripts/run-tests.sh`

```bash
#!/bin/bash

echo "🧪 Ejecutando suite de pruebas..."

# Backend tests
echo "📦 Pruebas Backend..."
cd plataformas-danos-back
npm run test -- --coverage
BACKEND_EXIT=$?

# Frontend tests
echo "🎨 Pruebas Frontend..."
cd ../cotizador-danos-web
npm run test:coverage
FRONTEND_EXIT=$?

# Summary
echo ""
echo "======================================"
echo "Resumen de Pruebas"
echo "======================================"
if [ $BACKEND_EXIT -eq 0 ]; then
    echo "✅ Backend: PASSED"
else
    echo "❌ Backend: FAILED"
fi

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ Frontend: PASSED"
else
    echo "❌ Frontend: FAILED"
fi

exit $(( $BACKEND_EXIT + $FRONTEND_EXIT ))
```

### 📋 Configuración de GitLab CI/CD

#### `.gitlab-ci.yml`

```yaml
stages:
  - install
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  POSTGRES_DB: cotizador_danos_test
  POSTGRES_USER: test_user
  POSTGRES_PASSWORD: test_password

# ============================================================================
# BACKEND PIPELINE
# ============================================================================

backend:install:
  stage: install
  image: node:${NODE_VERSION}-alpine
  script:
    - cd plataformas-danos-back
    - npm ci
  cache:
    key: backend-${CI_COMMIT_REF_SLUG}
    paths:
      - plataformas-danos-back/node_modules/
  artifacts:
    paths:
      - plataformas-danos-back/node_modules/
    expire_in: 1 day

backend:lint:
  stage: lint
  image: node:${NODE_VERSION}-alpine
  dependencies:
    - backend:install
  script:
    - cd plataformas-danos-back
    - npm run lint
  only:
    changes:
      - plataformas-danos-back/**/*

backend:test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  services:
    - postgres:15-alpine
  variables:
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
  dependencies:
    - backend:install
  script:
    - cd plataformas-danos-back
    - npm run test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: plataformas-danos-back/coverage/cobertura-coverage.xml
    paths:
      - plataformas-danos-back/coverage/
    expire_in: 1 week
  only:
    changes:
      - plataformas-danos-back/**/*

backend:build:
  stage: build
  image: node:${NODE_VERSION}-alpine
  dependencies:
    - backend:install
  script:
    - cd plataformas-danos-back
    - npm run build
  artifacts:
    paths:
      - plataformas-danos-back/dist/
    expire_in: 1 day
  only:
    - main
    - develop

# ============================================================================
# FRONTEND PIPELINE
# ============================================================================

frontend:install:
  stage: install
  image: node:${NODE_VERSION}-alpine
  script:
    - cd cotizador-danos-web
    - npm ci
  cache:
    key: frontend-${CI_COMMIT_REF_SLUG}
    paths:
      - cotizador-danos-web/node_modules/
  artifacts:
    paths:
      - cotizador-danos-web/node_modules/
    expire_in: 1 day

frontend:lint:
  stage: lint
  image: node:${NODE_VERSION}-alpine
  dependencies:
    - frontend:install
  script:
    - cd cotizador-danos-web
    - npm run lint
  only:
    changes:
      - cotizador-danos-web/**/*

frontend:test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  dependencies:
    - frontend:install
  script:
    - cd cotizador-danos-web
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: cotizador-danos-web/coverage/cobertura-coverage.xml
    paths:
      - cotizador-danos-web/coverage/
    expire_in: 1 week
  only:
    changes:
      - cotizador-danos-web/**/*

frontend:build:
  stage: build
  image: node:${NODE_VERSION}-alpine
  dependencies:
    - frontend:install
  script:
    - cd cotizador-danos-web
    - npm run build
  artifacts:
    paths:
      - cotizador-danos-web/dist/
    expire_in: 1 day
  only:
    - main
    - develop
```

### ✅ Entregables Fase 3
- Repositorio GitLab configurado
- Docker compose funcional
- Scripts de desarrollo (`setup.sh`, `run-tests.sh`)
- CI/CD pipeline básico
- Documentación de setup en README

---

## 📅 Fase 4: Desarrollo Backend

### 🎯 Sprint 1: Dominio y Entidades

#### Entidades Principales

**Quote.ts** - Entidad Agregado Raíz
```typescript
// src/domain/entities/Quote.ts
import { Location } from './Location';
import { Coverage } from './Coverage';
import { Folio } from '../value-objects/Folio';
import { QuoteState } from '../enums/QuoteState';

export class Quote {
  private numeroFolio: Folio;
  private estadoCotizacion: QuoteState;
  private datosAsegurado: DatosAsegurado;
  private datosConduccion: DatosConduccion;
  private clasificacionRiesgo?: string;
  private tipoNegocio?: string;
  private configuracionLayout?: LayoutConfig;
  private opcionesCobertura?: Coverage[];
  private ubicaciones: Location[];
  private primaNeta?: number;
  private primaComercial?: number;
  private primasPorUbicacion?: LocationPremium[];
  private version: number;
  private fechaCreacion: Date;
  private fechaUltimaActualizacion: Date;

  constructor(folio: Folio) {
    this.numeroFolio = folio;
    this.estadoCotizacion = QuoteState.BORRADOR;
    this.ubicaciones = [];
    this.version = 1;
    this.fechaCreacion = new Date();
    this.fechaUltimaActualizacion = new Date();
  }

  // Business logic methods
  updateGeneralInfo(info: GeneralInfoUpdate): void {
    this.datosAsegurado = info.datosAsegurado;
    this.datosConduccion = info.datosConduccion;
    this.clasificacionRiesgo = info.clasificacionRiesgo;
    this.tipoNegocio = info.tipoNegocio;
    this.touch();
  }

  addLocation(location: Location): void {
    location.setIndice(this.ubicaciones.length);
    this.ubicaciones.push(location);
    this.touch();
  }

  updateLocation(indice: number, updates: Partial<Location>): void {
    const location = this.findLocation(indice);
    if (!location) {
      throw new Error(`Location with index ${indice} not found`);
    }
    Object.assign(location, updates);
    this.touch();
  }

  canCalculate(): boolean {
    return this.ubicaciones.some(loc => loc.isValid());
  }

  setPremiumResults(results: PremiumCalculationResult): void {
    this.primaNeta = results.primaNeta;
    this.primaComercial = results.primaComercial;
    this.primasPorUbicacion = results.primasPorUbicacion;
    this.estadoCotizacion = QuoteState.CALCULADA;
    this.touch();
  }

  private touch(): void {
    this.fechaUltimaActualizacion = new Date();
    this.version++;
  }

  private findLocation(indice: number): Location | undefined {
    return this.ubicaciones.find(loc => loc.getIndice() === indice);
  }

  // Getters
  getFolio(): string {
    return this.numeroFolio.getValue();
  }

  getVersion(): number {
    return this.version;
  }

  getLocations(): Location[] {
    return [...this.ubicaciones];
  }
}
```

**Location.ts**

```typescript
// src/domain/entities/Location.ts
import { ZipCode } from '../value-objects/ZipCode';
import { ClaveIncendio } from '../value-objects/ClaveIncendio';
import { ValidationState } from '../enums/ValidationState';

export class Location {
  private indice: number;
  private nombreUbicacion: string;
  private direccion: string;
  private codigoPostal: ZipCode;
  private estado: string;
  private municipio: string;
  private colonia?: string;
  private ciudad?: string;
  private tipoConstructivo?: string;
  private nivel?: string;
  private anioConstruccion?: number;
  private giro: GiroInfo;
  private garantias: Guarantee[];
  private zonaCatastrofica?: string;
  private alertasBloqueantes: Alert[];
  private estadoValidacion: ValidationState;

  constructor(data: LocationData) {
    this.nombreUbicacion = data.nombreUbicacion;
    this.direccion = data.direccion;
    this.codigoPostal = new ZipCode(data.codigoPostal);
    this.estado = data.estado;
    this.municipio = data.municipio;
    this.giro = data.giro;
    this.garantias = data.garantias || [];
    this.alertasBloqueantes = [];
    this.estadoValidacion = ValidationState.PENDIENTE;
  }

  validate(): void {
    this.alertasBloqueantes = [];

    if (!this.isCompleteAddress()) {
      this.addAlert('INCOMPLETE_ADDRESS', 'Dirección incompleta', 'WARNING');
    }

    if (!this.giro.claveIncendio) {
      this.addAlert('MISSING_FIRE_KEY', 'Clave de incendio faltante', 'ERROR');
    }

    if (this.garantias.length === 0) {
      this.addAlert('NO_GUARANTEES', 'No hay garantías configuradas', 'ERROR');
    }

    this.estadoValidacion = this.hasBlockingAlerts() 
      ? ValidationState.INCOMPLETA 
      : ValidationState.VALIDA;
  }

  isValid(): boolean {
    return this.estadoValidacion === ValidationState.VALIDA;
  }

  isCalculable(): boolean {
    return this.codigoPostal.isValid() 
      && this.giro.claveIncendio !== undefined
      && this.garantias.length > 0;
  }

  private isCompleteAddress(): boolean {
    return !!(this.direccion && this.codigoPostal && this.estado && this.municipio);
  }

  private hasBlockingAlerts(): boolean {
    return this.alertasBloqueantes.some(alert => alert.severidad === 'ERROR');
  }

  private addAlert(tipo: string, mensaje: string, severidad: 'ERROR' | 'WARNING'): void {
    this.alertasBloqueantes.push({ tipo, mensaje, severidad });
  }

  setIndice(indice: number): void {
    this.indice = indice;
  }

  getIndice(): number {
    return this.indice;
  }

  getAlerts(): Alert[] {
    return [...this.alertasBloqueantes];
  }
}
```

**Value Objects**

```typescript
// src/domain/value-objects/Folio.ts
export class Folio {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid folio: ${value}`);
    }
    this.value = value;
  }

  private isValid(value: string): boolean {
    return /^[A-Z0-9]{8,20}$/.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Folio): boolean {
    return this.value === other.value;
  }
}

// src/domain/value-objects/ZipCode.ts
export class ZipCode {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  isValid(): boolean {
    return /^\d{5}$/.test(this.value);
  }

  getValue(): string {
    return this.value;
  }
}
```

**Prompts de IA para Sprint 1**:

```
"Genera las interfaces TypeScript para DatosAsegurado, DatosConduccion, 
GiroInfo y Guarantee siguiendo las especificaciones del dominio"

"Crea unit tests para la entidad Quote cubriendo los métodos 
updateGeneralInfo, addLocation y setPremiumResults"

"Implementa validaciones para Location usando class-validator decorators"
```

### 🎯 Sprint 2: Casos de Uso Básicos (2 semanas)

#### Casos de Uso

**CreateQuoteUseCase.ts**

```typescript
// src/application/use-cases/quotes/CreateQuoteUseCase.ts
import { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository';
import { IFolioGenerator } from '../../../domain/services/IFolioGenerator';
import { Quote } from '../../../domain/entities/Quote';
import { Folio } from '../../../domain/value-objects/Folio';

export class CreateQuoteUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private folioGenerator: IFolioGenerator
  ) {}

  async execute(): Promise<CreateQuoteResponse> {
    // 1. Generar folio único (idempotente)
    const folioValue = await this.folioGenerator.generate();
    const folio = new Folio(folioValue);

    // 2. Verificar si ya existe (idempotencia)
    const existing = await this.quoteRepository.findByFolio(folio.getValue());
    if (existing) {
      return {
        numeroFolio: existing.getFolio(),
        alreadyExists: true
      };
    }

    // 3. Crear nueva cotización
    const quote = new Quote(folio);

    // 4. Persistir
    await this.quoteRepository.save(quote);

    return {
      numeroFolio: quote.getFolio(),
      alreadyExists: false
    };
  }
}
```

**UpdateGeneralInfoUseCase.ts**

```typescript
// src/application/use-cases/quotes/UpdateGeneralInfoUseCase.ts
export class UpdateGeneralInfoUseCase {
  constructor(private quoteRepository: IQuoteRepository) {}

  async execute(request: UpdateGeneralInfoRequest): Promise<void> {
    // 1. Buscar cotización
    const quote = await this.quoteRepository.findByFolio(request.numeroFolio);
    if (!quote) {
      throw new NotFoundError(`Quote ${request.numeroFolio} not found`);
    }

    // 2. Verificar versión (optimistic locking)
    if (quote.getVersion() !== request.version) {
      throw new OptimisticLockError(
        `Version mismatch. Expected ${request.version}, got ${quote.getVersion()}`
      );
    }

    // 3. Actualizar datos
    quote.updateGeneralInfo({
      datosAsegurado: request.datosAsegurado,
      datosConduccion: request.datosConduccion,
      clasificacionRiesgo: request.clasificacionRiesgo,
      tipoNegocio: request.tipoNegocio
    });

    // 4. Guardar (auto-incrementa versión)
    await this.quoteRepository.save(quote);
  }
}
```

**Prompts de IA para Sprint 2**:
```

"Genera el caso de uso ManageLocationsLayoutUseCase que permita 
configurar el layout de ubicaciones con validaciones de negocio"

"Crea DTOs para CreateQuoteResponse, UpdateGeneralInfoRequest 
y UpdateGeneralInfoResponse con validaciones Joi"

"Implementa el repositorio IQuoteRepository con métodos: 
findByFolio, save, update, y manejo de transacciones"
```

### 🎯 Sprint 3: Gestión de Ubicaciones (1.5 semanas)

**AddLocationUseCase.ts**
```typescript
// src/application/use-cases/locations/AddLocationUseCase.ts
export class AddLocationUseCase {
  constructor(
    private quoteRepository: IQuoteRepository,
    private zipCodeValidator: IZipCodeValidator
  ) {}

  async execute(request: AddLocationRequest): Promise<LocationResponse> {
    // 1. Obtener cotización
    const quote = await this.quoteRepository.findByFolio(request.numeroFolio);
    if (!quote) {
      throw new NotFoundError(`Quote ${request.numeroFolio} not found`);
    }

    // 2. Validar código postal
    const zipCodeInfo = await this.zipCodeValidator.validate(request.codigoPostal);
    if (!zipCodeInfo.valid) {
      throw new ValidationError('Invalid zip code');
    }

    // 3. Crear ubicación
    const location = new Location({
      nombreUbicacion: request.nombreUbicacion,
      direccion: request.direccion,
      codigoPostal: request.codigoPostal,
      estado: zipCodeInfo.estado,
      municipio: zipCodeInfo.municipio,
      colonia: request.colonia,
      giro: request.giro,
      garantias: request.garantias || []
    });

    // 4. Asignar zonas catastróficas
    location.setZonaCatastrofica(zipCodeInfo.zonaCat);
    location.setZonaTev(zipCodeInfo.zonaTev);
    location.setZonaFhm(zipCodeInfo.zonaFhm);

    // 5. Validar ubicación
    location.validate();

    // 6. Agregar a cotización
    quote.addLocation(location);

    // 7. Guardar
    await this.quoteRepository.save(quote);

    return this.toLocationResponse(location);
  }
}
```

**Prompts de IA para Sprint 3**:
```
"Genera el servicio ZipCodeValidator que consulte la tabla 
catalogo_cp_zonas y devuelva información completa del código postal"

"Crea tests de integración para AddLocationUseCase usando 
supertest y una base de datos de prueba"

"Implementa el endpoint PATCH /locations/{indice} con 
validación de versionado optimista"
```

### 🎯 Sprint 4: Servicio de Cálculo (2 semanas)

**PremiumCalculationService.ts**
```typescript
// src/domain/services/PremiumCalculationService.ts
export class PremiumCalculationService {
  constructor(
    private tarifasRepository: ITarifasRepository,
    private parametrosRepository: IParametrosRepository
  ) {}

  async calculate(quote: Quote): Promise<PremiumCalculationResult> {
    const results: LocationPremiumResult[] = [];
    
    // Calcular por ubicación
    for (const location of quote.getLocations()) {
      if (!location.isCalculable()) {
        results.push({
          indice: location.getIndice(),
          incompleta: true,
          alertas: location.getAlerts()
        });
        continue;
      }

      const locationPremium = await this.calculateLocation(location);
      results.push(locationPremium);
    }

    // Consolidar totales
    const primaNeta = results
      .filter(r => !r.incompleta)
      .reduce((sum, r) => sum + r.primaNeta, 0);

    // Aplicar factor comercial
    const parametros = await this.parametrosRepository.getCalculationParams();
    const primaComercial = primaNeta * parametros.factorComercial;

    return {
      primaNeta,
      primaComercial,
      primasPorUbicacion: results
    };
  }

  private async calculateLocation(location: Location): Promise<LocationPremiumResult> {
    const componentes: ComponentePrima[] = [];

    // 1. Incendio Edificios
    if (this.hasGuarantee(location, 'INCENDIO_EDIFICIOS')) {
      const incendioEdif = await this.calculateIncendioEdificios(location);
      componentes.push(incendioEdif);
    }

    // 2. Incendio Contenidos
    if (this.hasGuarantee(location, 'INCENDIO_CONTENIDOS')) {
      const incendioCont = await this.calculateIncendioContenidos(location);
      componentes.push(incendioCont);
    }

    // 3. CAT TEV
    const catTev = await this.calculateCatTev(location);
    componentes.push(catTev);

    // 4. CAT FHM
    const catFhm = await this.calculateCatFhm(location);
    componentes.push(catFhm);

    // ... más componentes

    const primaNeta = componentes.reduce((sum, c) => sum + c.prima, 0);

    return {
      indice: location.getIndice(),
      primaNeta,
      componentes,
      incompleta: false
    };
  }

  private async calculateIncendioEdificios(location: Location): Promise<ComponentePrima> {
    // Obtener tarifa
    const tarifa = await this.tarifasRepository.getTarifaIncendio(
      location.getGiro().claveIncendio
    );

    // Obtener suma asegurada
    const garantia = location.getGuarantee('INCENDIO_EDIFICIOS');
    const sumaAsegurada = garantia.sumaAsegurada;

    // Calcular prima base
    const primaBase = sumaAsegurada * tarifa.tasaBase;

    // Aplicar factores adicionales
    const factorConstructivo = this.getFactorConstructivo(location.getTipoConstructivo());
    const prima = primaBase * factorConstructivo;

    return {
      componente: 'INCENDIO_EDIFICIOS',
      sumaAsegurada,
      tasa: tarifa.tasaBase,
      factores: { constructivo: factorConstructivo },
      prima
    };
  }

  // ... más métodos de cálculo
}
```

**Prompts de IA para Sprint 4**:
```
"Genera el método calculateCatTev que consulte tarifas_cat 
y aplique el factor según la zona catastrófica"

"Crea tests unitarios para PremiumCalculationService con 
mocks de repositorios y casos edge de ubicaciones incompletas"

"Implementa la lógica de cálculo para Equipo Electrónico usando 
factores_equipo_electronico basado en clase y nivel de zona"
```

### 🎯 Sprint 5: Endpoints REST (1.5 semanas)

**QuoteController.ts**

```typescript
// src/infrastructure/http/controllers/QuoteController.ts
export class QuoteController {
  constructor(
    private createQuoteUseCase: CreateQuoteUseCase,
    private updateGeneralInfoUseCase: UpdateGeneralInfoUseCase,
    private getQuoteStateUseCase: GetQuoteStateUseCase,
    private calculatePremiumUseCase: CalculatePremiumUseCase
  ) {}

  async createQuote(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createQuoteUseCase.execute();
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateGeneralInfo(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;
      await this.updateGeneralInfoUseCase.execute({
        numeroFolio: folio,
        ...req.body
      });
      res.status(200).json({ message: 'General info updated successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async calculatePremium(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;
      const result = await this.calculatePremiumUseCase.execute(folio);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: Error, res: Response): void {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof OptimisticLockError) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

**Routes Configuration**
```typescript
// src/infrastructure/http/routes/index.ts
import { Router } from 'express';
import { quoteRoutes } from './quoteRoutes';
import { locationRoutes } from './locationRoutes';

export const createRouter = (dependencies: Dependencies): Router => {
  const router = Router();

  router.use('/v1/quotes', quoteRoutes(dependencies));
  router.use('/v1/quotes/:folio/locations', locationRoutes(dependencies));

  return router;
};

// src/infrastructure/http/routes/quoteRoutes.ts
export const quoteRoutes = (deps: Dependencies): Router => {
  const router = Router();
  const controller = new QuoteController(
    deps.createQuoteUseCase,
    deps.updateGeneralInfoUseCase,
    deps.getQuoteStateUseCase,
    deps.calculatePremiumUseCase
  );

  router.post('/', controller.createQuote.bind(controller));
  router.put('/:folio/general-info', 
    validateRequest(UpdateGeneralInfoSchema),
    controller.updateGeneralInfo.bind(controller)
  );
  router.get('/:folio/state', controller.getQuoteState.bind(controller));
  router.post('/:folio/calculate', controller.calculatePremium.bind(controller));

  return router;
};
```

**Prompts de IA para Sprint 5**:
```
"Genera middleware de validación usando Joi para todos 
los endpoints con manejo de errores consistente"

"Crea la configuración de Swagger/OpenAPI para documentar 
todos los endpoints con ejemplos de request/response"

"Implementa rate limiting y logging middleware usando 
express-rate-limit y winston"
```

### 📊 Mock de Servicios de Referencia

```typescript
// src/infrastructure/external-services/MockCoreService.ts
export class MockCoreService implements ICoreService {
  async getSubscribers(): Promise<Subscriber[]> {
    return [
      { codigo: 'SUB001', nombre: 'Suscriptor Principal' },
      { codigo: 'SUB002', nombre: 'Suscriptor Secundario' }
    ];
  }

  async getAgent(clave: string): Promise<Agent> {
    // Simular consulta con datos en memoria
    const agents = {
      'AG001': { clave: 'AG001', nombre: 'Juan Pérez', email: 'juan@example.com' },
      'AG002': { clave: 'AG002', nombre: 'María García', email: 'maria@example.com' }
    };
    return agents[clave] || null;
  }

  async validateZipCode(zipCode: string): Promise<ZipCodeInfo> {
    // Consultar tabla catalogo_cp_zonas
    return this.zipCodeRepository.findByCode(zipCode);
  }

  async generateFolio(): Promise<string> {
    // Generar folio secuencial
    const sequence = await this.getNextSequence();
    return `COT-${new Date().getFullYear()}-${String(sequence).padStart(6, '0')}`;
  }
}
```

### ✅ Entregables Fase 4
- Backend funcional con todos los endpoints obligatorios
- Colección Postman/Bruno con ejemplos
- Documentación de APIs (Swagger)
- Pruebas unitarias de casos de uso
- Servicio mock de referencia

---

## 📅 Fase 5: Desarrollo Frontend 

### 🎯 Sprint 1: Infraestructura Frontend

#### API Client Configuration

```typescript
// src/shared/services/apiClient.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 409) {
      // Optimistic lock error
      throw new OptimisticLockError(error.response.data.error);
    }
    if (error.response?.status === 404) {
      throw new NotFoundError(error.response.data.error);
    }
    throw error;
  }
);

// src/shared/services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
    mutations: {
      retry: 0,
    }
  }
});
```

#### Routing Configuration

```typescript
// src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuoteLayout } from '../layouts/QuoteLayout';
import { QuoteListPage } from '../features/quotes/pages/QuoteListPage';
import { GeneralInfoPage } from '../features/quotes/pages/GeneralInfoPage';
import { LocationsPage } from '../features/locations/pages/LocationsPage';
import { TechnicalInfoPage } from '../features/quotes/pages/TechnicalInfoPage';
import { TermsPage } from '../features/quotes/pages/TermsPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cotizador" replace />} />
        <Route path="/cotizador" element={<QuoteListPage />} />
        
        <Route path="/quotes/:folio" element={<QuoteLayout />}>
          <Route index element={<Navigate to="general-info" replace />} />
          <Route path="general-info" element={<GeneralInfoPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="technical-info" element={<TechnicalInfoPage />} />
          <Route path="terms-and-conditions" element={<TermsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

#### UI Components Base

```typescript
// src/shared/components/atoms/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className,
  children,
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-lg transition-colors';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};
```

**Prompts de IA para Sprint 1**:
```

"Genera componentes atómicos de Input, Select, Alert usando 
Tailwind siguiendo el sistema de diseño especificado"

"Crea hooks personalizados useApi y useForm para manejo 
de peticiones y formularios con validación Zod"

"Implementa el layout QuoteLayout con barra lateral de 
navegación y progreso de secciones"
```

### 🎯 Sprint 2-5: Módulos Funcionales

*(Continuaría con implementación detallada de cada módulo...)*

### ✅ Entregables Fase 5
- SPA funcional y responsive
- Integración completa con backend
- Componentes reutilizables
- Experiencia de usuario fluida

---

## 📅 Fase 6: Integración y Testing (Semana 15-17)

### 🧪 Estrategia de Pruebas

#### Coverage Target: 80%

**Backend Unit Tests**
```typescript
// tests/unit/use-cases/CalculatePremiumUseCase.test.ts
describe('CalculatePremiumUseCase', () => {
  let useCase: CalculatePremiumUseCase;
  let mockQuoteRepo: jest.Mocked<IQuoteRepository>;
  let mockPremiumService: jest.Mocked<PremiumCalculationService>;

  beforeEach(() => {
    mockQuoteRepo = createMockQuoteRepository();
    mockPremiumService = createMockPremiumService();
    useCase = new CalculatePremiumUseCase(mockQuoteRepo, mockPremiumService);
  });

  it('should calculate premium for valid locations', async () => {
    // Arrange
    const quote = createQuoteWithValidLocations();
    mockQuoteRepo.findByFolio.mockResolvedValue(quote);
    mockPremiumService.calculate.mockResolvedValue({
      primaNeta: 10000,
      primaComercial: 11500,
      primasPorUbicacion: [...]
    });

    // Act
    const result = await useCase.execute('COT-2025-000001');

    // Assert
    expect(result.primaNeta).toBe(10000);
    expect(result.primaComercial).toBe(11500);
    expect(mockQuoteRepo.save).toHaveBeenCalled();
  });

  it('should handle incomplete locations with alerts', async () => {
    // Arrange
    const quote = createQuoteWithIncompleteLocation();
    
    // Act
    const result = await useCase.execute('COT-2025-000001');

    // Assert
    expect(result.primasPorUbicacion).toHaveLength(2);
    expect(result.primasPorUbicacion[1].incompleta).toBe(true);
    expect(result.primasPorUbicacion[1].alertas).toHaveLength(1);
  });
});
```

**Frontend Component Tests**

```typescript
// tests/unit/components/LocationForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationForm } from '@/features/locations/components/LocationForm';

describe('LocationForm', () => {
  it('should validate zip code on blur', async () => {
    const mockValidate = jest.fn().mockResolvedValue({ valid: true });
    
    render(<LocationForm onSubmit={jest.fn()} validateZipCode={mockValidate} />);
    
    const zipInput = screen.getByLabelText('Código Postal');
    fireEvent.change(zipInput, { target: { value: '06700' } });
    fireEvent.blur(zipInput);

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith('06700');
    });
  });

  it('should show error for invalid zip code', async () => {
    const mockValidate = jest.fn().mockResolvedValue({ 
      valid: false, 
      error: 'Código postal no válido' 
    });
    
    render(<LocationForm onSubmit={jest.fn()} validateZipCode={mockValidate} />);
    
    const zipInput = screen.getByLabelText('Código Postal');
    fireEvent.change(zipInput, { target: { value: 'INVALID' } });
    fireEvent.blur(zipInput);

    await waitFor(() => {
      expect(screen.getByText('Código postal no válido')).toBeInTheDocument();
    });
  });
});
```

### 🤖 Pruebas Automatizadas (3 Flujos Críticos)

#### Flujo 1: Cotización Completa Exitosa

**Justificación**: Valida el happy path end-to-end, asegurando que todos los componentes funcionan correctamente en conjunto.

```typescript
// tests/e2e/complete-quote-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Quote Flow', () => {
  test('should create, configure and calculate a complete quote', async ({ page }) => {
    // 1. Crear folio
    await page.goto('/cotizador');
    await page.click('button:has-text("Nueva Cotización")');
    
    const folio = await page.textContent('[data-testid="folio-number"]');
    expect(folio).toMatch(/COT-2025-\d{6}/);

    // 2. Capturar datos generales
    await page.fill('input[name="datosAsegurado.nombre"]', 'Empresa Test SA');
    await page.fill('input[name="datosAsegurado.rfc"]', 'ETE123456ABC');
    await page.selectOption('select[name="datosConduccion.codigoAgente"]', 'AG001');
    await page.click('button:has-text("Guardar y Continuar")');

    // 3. Configurar layout
    await page.selectOption('select[name="tipoLayout"]', 'MULTIPLE');
    await page.fill('input[name="numeroUbicaciones"]', '2');
    await page.click('button:has-text("Confirmar Layout")');

    // 4. Registrar ubicación 1 (completa)
    await page.click('button:has-text("Agregar Ubicación")');
    await page.fill('input[name="nombreUbicacion"]', 'Oficina Principal');
    await page.fill('input[name="direccion"]', 'Av. Reforma 100');
    await page.fill('input[name="codigoPostal"]', '06700');
    await page.blur('input[name="codigoPostal"]'); // Trigger validation
    await page.waitForSelector('[data-testid="zip-validated"]');
    await page.selectOption('select[name="giro"]', 'G001');
    await page.click('input[name="garantias"][value="INCENDIO_EDIFICIOS"]');
    await page.fill('input[name="sumaAsegurada"]', '5000000');
    await page.click('button:has-text("Guardar Ubicación")');

    // 5. Registrar ubicación 2 (completa)
    await page.click('button:has-text("Agregar Ubicación")');
    // ... similar a ubicación 1

    // 6. Configurar coberturas
    await page.click('a:has-text("Información Técnica")');
    await page.click('input[name="coberturas"][value="CAT_TEV"]');
    await page.click('input[name="coberturas"][value="CAT_FHM"]');
    await page.click('button:has-text("Guardar Coberturas")');

    // 7. Ejecutar cálculo
    await page.click('button:has-text("Calcular Prima")');
    await page.waitForSelector('[data-testid="calculation-result"]');

    // 8. Verificar resultados
    const primaNeta = await page.textContent('[data-testid="prima-neta"]');
    const primaComercial = await page.textContent('[data-testid="prima-comercial"]');
    
    expect(parseFloat(primaNeta)).toBeGreaterThan(0);
    expect(parseFloat(primaComercial)).toBeGreaterThan(parseFloat(primaNeta));

    // 9. Verificar desglose por ubicación
    const ubicaciones = await page.locator('[data-testid="location-breakdown"]').count();
    expect(ubicaciones).toBe(2);

    // 10. Verificar estado final
    const estado = await page.textContent('[data-testid="quote-status"]');
    expect(estado).toBe('CALCULADA');
  });
});
```

#### Flujo 2: Manejo de Ubicaciones Incompletas

**Justificación**: Valida una regla de negocio crítica - el sistema debe permitir cálculo parcial y mostrar alertas sin bloquear completamente.

```typescript
// tests/integration/incomplete-locations.test.ts
describe('Incomplete Locations Handling', () => {
  it('should calculate valid locations and show alerts for incomplete ones', async () => {
    // Setup: Crear cotización con 2 ubicaciones (1 válida, 1 incompleta)
    const quote = await createQuote();
    
    // Ubicación 1: Completa
    await addLocation(quote.numeroFolio, {
      nombreUbicacion: 'Ubicación Completa',
      codigoPostal: '06700',
      giro: { claveGiro: 'G001', claveIncendio: 'INC-01' },
      garantias: [{ clave: 'INCENDIO_EDIFICIOS', sumaAsegurada: 1000000 }]
    });

    // Ubicación 2: Incompleta (sin giro.claveIncendio)
    await addLocation(quote.numeroFolio, {
      nombreUbicacion: 'Ubicación Incompleta',
      codigoPostal: '06700',
      giro: { claveGiro: 'G002' }, // Falta claveIncendio
      garantias: []
    });

    // Act: Ejecutar cálculo
    const response = await request(app)
      .post(`/v1/quotes/${quote.numeroFolio}/calculate`)
      .expect(200);

    // Assert
    expect(response.body.primaNeta).toBeGreaterThan(0);
    expect(response.body.primasPorUbicacion).toHaveLength(2);
    
    // Ubicación 1: Calculada
    expect(response.body.primasPorUbicacion[0]).toMatchObject({
      indice: 0,
      incompleta: false,
      primaNeta: expect.any(Number)
    });

    // Ubicación 2: Incompleta con alertas
    expect(response.body.primasPorUbicacion[1]).toMatchObject({
      indice: 1,
      incompleta: true,
      alertas: expect.arrayContaining([
        expect.objectContaining({
          tipo: 'MISSING_FIRE_KEY',
          severidad: 'ERROR'
        })
      ])
    });

    // El cálculo debe haber guardado resultados
    const updatedQuote = await getQuote(quote.numeroFolio);
    expect(updatedQuote.estadoCotizacion).toBe('CALCULADA');
    expect(updatedQuote.primaNeta).toB