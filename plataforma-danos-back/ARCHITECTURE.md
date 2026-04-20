# Documento de Arquitectura Técnica
## Sistema Cotizador de Seguros de Daños — `plataformas-danos-back`

> **Versión**: 1.0.0  
> **Fecha**: Abril 2026  
> **Metodología**: ASSD (Agent Spec Software Development)  
> **Lineamiento**: CoE DevArq Sofka

---

## Índice

1. [Contexto del Sistema](#1-contexto-del-sistema)
2. [Diagrama de Contenedores (C4 — Nivel 2)](#2-diagrama-de-contenedores-c4--nivel-2)
3. [Diagrama de Componentes del Backend (C4 — Nivel 3)](#3-diagrama-de-componentes-del-backend-c4--nivel-3)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Estructura de Carpetas](#5-estructura-de-carpetas)
6. [Modelo de Datos](#6-modelo-de-datos)
7. [Contratos de API (Endpoints)](#7-contratos-de-api-endpoints)
8. [Flujos de Datos](#8-flujos-de-datos)
9. [Manejo de Errores](#9-manejo-de-errores)
10. [Observabilidad](#10-observabilidad)
11. [Estrategia de Testing](#11-estrategia-de-testing)
12. [Principios y Restricciones de Diseño](#12-principios-y-restricciones-de-diseño)
13. [Decisiones de Arquitectura (ADRs)](#13-decisiones-de-arquitectura-adrs)

---

## 1. Contexto del Sistema

El **Cotizador de Seguros de Daños** es un sistema multi-paso que permite a agentes de seguros generar cotizaciones de pólizas de daños para clientes. El flujo completo abarca cuatro etapas secuenciales:

```
Datos Generales → Configuración de Ubicaciones → Selección de Coberturas → Cálculo de Prima
```

### Sistemas involucrados

| Sistema | Tipo | Rol |
|---|---|---|
| `cotizador-danos-web` | SPA React 19 + Vite | Interfaz de usuario multi-paso |
| `plataformas-danos-back` | API REST Node.js + Express | Orquestación, lógica de negocio y persistencia |
| `Plataforma-core-ohs` | Servicio externo (mock/BD local) | Catálogos de referencia: agentes, suscriptores, giros, CPs, tarifas |
| PostgreSQL 15 | Base de datos relacional | Persistencia de cotizaciones y ubicaciones |

### Actores

| Actor | Descripción |
|---|---|
| **Agente de seguros** | Usuario principal que crea y gestiona cotizaciones |
| **Sistema Core (OHS)** | Proveedor de catálogos y tarifas (solo lectura) |

---

## 2. Diagrama de Contenedores (C4 — Nivel 2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SISTEMA: Cotizador de Daños                                            │
│                                                                         │
│  ┌─────────────────────┐    REST/JSON     ┌────────────────────────┐   │
│  │  cotizador-danos-web│ ─────────────── ▶│ plataformas-danos-back │   │
│  │  React 19 + Vite    │                  │ Node.js + Express      │   │
│  │  Tailwind + Zustand │ ◀ ─────────────  │ TypeScript (strict)    │   │
│  └─────────────────────┘   HTTP :3000     └──────────┬─────────────┘   │
│                                                       │                 │
│                             ┌─────────────────────────┤                 │
│                             │                         │                 │
│                    ┌────────▼──────┐       ┌──────────▼──────────┐     │
│                    │  PostgreSQL   │       │  Plataforma-core-ohs│     │
│                    │  (port 5432)  │       │  (catálogos / mock) │     │
│                    │  cotizador_   │       │  tabla catalogos_*  │     │
│                    │  danos        │       └─────────────────────┘     │
│                    └───────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Nota**: `Plataforma-core-ohs` está actualmente implementado como tablas de catálogo dentro de la misma base de datos PostgreSQL (`catalogos_agentes`, `catalogos_suscriptores`, `catalogos_giros`, `catalogo_cp_zonas`). En producción, puede reemplazarse por un servicio HTTP externo sin cambiar la interfaz del `ExternalCoreService`.

---

## 3. Diagrama de Componentes del Backend (C4 — Nivel 3)

```
plataformas-danos-back / src/
│
├── index.ts          ← Entry point: Express app, middlewares globales, health checks
│
├── routes/
│   ├── index.ts      ← Agrega todos los routers bajo /api/v1
│   ├── quoteRoutes   ← Endpoints de cotización y coberturas
│   ├── locationRoutes← Endpoints de layout y ubicaciones
│   └── catalogRoutes ← Endpoints de catálogos
│
├── controllers/
│   ├── QuoteController     ← Recibe req/res, delega a servicios, devuelve HTTP
│   ├── LocationController  ← Ídem para ubicaciones
│   └── CatalogController   ← Proxy hacia ExternalCoreService
│
├── services/
│   ├── PremiumService      ← Lógica de cálculo de prima neta y comercial
│   └── ExternalCoreService ← Consultas a catálogos (agentes, suscriptores, giros, CPs)
│
├── models/
│   ├── Quote.ts      ← Tipos: Quote, DatosAsegurado, OpcionCobertura, ResultadoCalculo
│   ├── Location.ts   ← Tipos: UbicacionResumen, Garantia, LocationInput
│   ├── Coverage.ts   ← Constantes: DEFAULT_COVERAGE_OPTIONS
│   └── User.ts       ← Tipo de usuario (futuro)
│
├── middlewares/
│   ├── errorHandler.ts     ← Captura AppError y errores inesperados — respuesta Problem-like
│   └── validateRequest.ts  ← requireFields(), validateGeneralData(), validateLayout()
│
├── config/
│   └── database.ts   ← Pool de conexiones pg (max: 20, idleTimeout: 30s)
│
└── utils/
    ├── errors.ts     ← Jerarquía de AppError: QuoteNotFoundError, VersionConflictError, etc.
    └── helpers.ts    ← isValidRFC(), isValidISODate(), isGeneralDataComplete(), advanceEstado()
```

### Flujo de llamada (por capa)

```
HTTP Request
    │
    ▼
middlewares globales (CORS → express.json → morgan)
    │
    ▼
routes/index.ts  →  [quoteRoutes | locationRoutes | catalogRoutes]
    │
    ▼
middlewares de validación (requireFields, validateGeneralData)
    │
    ▼
Controller (extrae parámetros de req, llama al service)
    │
    ▼
Service (lógica de negocio, consultas a DB/core)
    │
    ▼
pool.query() → PostgreSQL
    │
    ▼
Controller (construye respuesta HTTP)
    │
    ▼
errorHandler (si cualquier capa lanza AppError)
```

---

## 4. Stack Tecnológico

### Backend

| Categoría | Tecnología | Versión / Notas |
|---|---|---|
| Lenguaje | TypeScript | Strict mode — sin `any` |
| Runtime | Node.js | LTS |
| Framework | Express.js | Middleware chain |
| Base de datos | PostgreSQL | v15+ |
| Driver BD | `pg` (node-postgres) | Sin ORM — queries parametrizadas |
| HTTP logging | Morgan | Formato `combined` |
| CORS | `cors` | Habilitado globalmente |
| Variables de entorno | `dotenv` | `.env` en raíz |
| Testing | Jest + ts-jest + Supertest | |
| Linting | ESLint + Prettier | |
| Build | `tsc` | `tsconfig.json` en modo strict |

### Restricciones tecnológicas

- **Sin ORM**: acceso directo a PostgreSQL con `pg`. Todas las queries son parametrizadas (prevención SQL injection).
- **Sin frameworks alternativos**: no NestJS, Fastify ni Koa.
- **Tipos explícitos**: prohibido `any`. Todas las entidades públicas tienen tipos TypeScript declarados.

---

## 5. Estructura de Carpetas

```
plataformas-danos-back/
├── src/
│   ├── index.ts                        ← Bootstrap Express
│   ├── config/
│   │   └── database.ts                 ← Pool de conexiones PostgreSQL
│   ├── controllers/
│   │   ├── QuoteController.ts          ← CRUD cotización + coberturas + cálculo
│   │   ├── LocationController.ts       ← Layout + CRUD ubicaciones
│   │   └── CatalogController.ts        ← Proxy a ExternalCoreService
│   ├── middlewares/
│   │   ├── errorHandler.ts             ← Error handler global (último middleware)
│   │   └── validateRequest.ts          ← Validaciones de request por ruta
│   ├── models/
│   │   ├── Quote.ts                    ← Tipos de dominio: cotización
│   │   ├── Location.ts                 ← Tipos de dominio: ubicación
│   │   ├── Coverage.ts                 ← Catálogo de coberturas por defecto
│   │   └── User.ts                     ← Tipo usuario (extensión futura)
│   ├── routes/
│   │   ├── index.ts                    ← Agrega routers bajo /api/v1
│   │   ├── quoteRoutes.ts              ← Rutas de cotización
│   │   ├── locationRoutes.ts           ← Rutas de ubicación
│   │   └── catalogRoutes.ts            ← Rutas de catálogos
│   ├── services/
│   │   ├── PremiumService.ts           ← Cálculo de prima neta y comercial
│   │   └── ExternalCoreService.ts      ← Consultas a tablas de catálogo
│   └── utils/
│       ├── errors.ts                   ← Jerarquía de errores de dominio
│       └── helpers.ts                  ← Validadores y utilidades de estado
├── tests/
│   ├── controllers/                    ← Tests de integración por controller
│   ├── models/                         ← Tests de lógica de modelos
│   ├── services/                       ← Tests unitarios de servicios
│   └── utils/                          ← Tests de helpers y errores
├── database/
│   └── schema.sql                      ← Migración inicial: DDL de todas las tablas
├── .env                                ← Variables de entorno (no en Git)
├── jest.config.cjs                     ← Configuración Jest + ts-jest
├── package.json
├── tsconfig.json
└── readme.md
```

---

## 6. Modelo de Datos

### Esquema relacional (PostgreSQL)

#### Tabla `quotes`

| Columna | Tipo | Descripción |
|---|---|---|
| `numero_folio` | `VARCHAR(50) PK` | Identificador único del folio |
| `estado_cotizacion` | `VARCHAR(30)` | Estado en el flujo multi-paso |
| `datos_asegurado` | `JSONB` | Datos generales del asegurado |
| `configuracion_layout` | `JSONB` | Número y tipo de ubicaciones |
| `opciones_cobertura` | `JSONB` | Coberturas seleccionadas |
| `primas_por_ubicacion` | `JSONB` | Resultado del cálculo de primas |
| `version` | `INTEGER` | Optimistic locking (≥ 1) |
| `fecha_creacion` | `TIMESTAMP` | Auto-gestionado por BD |
| `fecha_ultima_actualizacion` | `TIMESTAMP` | Auto-gestionado por trigger |

**Estados válidos** (`estado_cotizacion`):

```
EN_EDICION → DATOS_GENERALES_COMPLETOS → UBICACIONES_CONFIGURADAS
          → COBERTURAS_SELECCIONADAS → CALCULADA
```

#### Tabla `locations`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `SERIAL PK` | Identificador interno |
| `numero_folio` | `VARCHAR(50) FK` | Referencia a `quotes` |
| `indice_ubicacion` | `INTEGER` | Número de la ubicación (1-based) |
| `descripcion` | `VARCHAR(200)` | Descripción libre |
| `codigo_postal` | `VARCHAR(10)` | CP requerido para validación |
| `giro_id` | `VARCHAR(50)` | Giro económico requerido |
| `garantias` | `JSONB []` | Lista de garantías con suma asegurada |
| `estado_validacion` | `VARCHAR(20)` | `COMPLETA` / `INCOMPLETA` |
| `alertas_bloqueantes` | `JSONB []` | Mensajes de validación pendientes |
| `version` | `INTEGER` | Optimistic locking |

**Restricción**: `UNIQUE (numero_folio, indice_ubicacion)`.  
**Regla de validación**: una ubicación es `COMPLETA` si tiene `codigo_postal`, `giro_id` y al menos una garantía con `sumaAsegurada > 0`.

#### Tablas de catálogos

| Tabla | Propósito |
|---|---|
| `catalogos_agentes` | Agentes: `clave`, `nombre`, `email` |
| `catalogos_suscriptores` | Suscriptores: `codigo`, `nombre` |
| `catalogos_giros` | Giros económicos: `clave_giro`, `descripcion`, `clave_incendio` |
| `catalogo_cp_zonas` | Códigos postales: `codigo_postal`, `municipio`, `estado`, `ciudad` |

### Tipos TypeScript de dominio

```typescript
// Quote domain
type EstadoCotizacion = 'EN_EDICION' | 'DATOS_GENERALES_COMPLETOS'
                       | 'UBICACIONES_CONFIGURADAS' | 'COBERTURAS_SELECCIONADAS' | 'CALCULADA';

interface DatosAsegurado {
  nombreAsegurado: string; rfcAsegurado: string;
  agenteId: string; suscriptorId: string;
  tipoNegocio: string; giroId: string;
  vigenciaInicio: string; vigenciaFin: string;
}

interface OpcionCobertura {
  codigoCobertura: string; descripcion: string;
  seleccionada: boolean; obligatoria: boolean;
}

interface ResultadoCalculo {
  primaNetaTotal: number; primaComercialTotal: number;
  primasPorUbicacion: PrimaUbicacion[];
  ubicacionesExcluidas: number[];
}

// Location domain
interface UbicacionResumen {
  indiceUbicacion: number; descripcion: string | null;
  codigoPostal: string | null; giroId: string | null;
  estadoValidacion: 'COMPLETA' | 'INCOMPLETA';
  alertasBloqueantes: string[]; garantias: Garantia[];
  version: number;
}
```

---

## 7. Contratos de API (Endpoints)

### Base URL: `/api/v1`

#### Cotizaciones — `/quotes`

| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/quotes` | Crea un nuevo folio (genera número de folio) | `201`, `500` |
| `GET` | `/quotes/:folio` | Obtiene el estado completo de la cotización | `200`, `404` |
| `PATCH` | `/quotes/:folio/general-data` | Actualiza datos generales del asegurado | `200`, `400`, `404`, `409`, `422` |
| `GET` | `/quotes/:folio/coverage-options` | Obtiene opciones de cobertura disponibles | `200`, `404` |
| `PUT` | `/quotes/:folio/coverage-options` | Guarda selección de coberturas | `200`, `400`, `404`, `409` |
| `POST` | `/quotes/:folio/calculate` | Ejecuta cálculo de prima | `200`, `400`, `404`, `409`, `422` |

#### Ubicaciones — `/quotes/:folio`

| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/quotes/:folio/layout` | Configura número y tipo de ubicaciones | `200`, `400`, `404`, `409` |
| `GET` | `/quotes/:folio/locations` | Lista todas las ubicaciones del folio | `200`, `404` |
| `PUT` | `/quotes/:folio/locations` | Reemplaza el conjunto completo de ubicaciones | `200`, `400`, `404`, `409` |
| `PATCH` | `/quotes/:folio/locations/:index` | Actualiza una ubicación por índice | `200`, `400`, `404`, `409` |

#### Catálogos — `/catalogs`

| Método | Ruta | Descripción | Parámetros |
|---|---|---|---|
| `GET` | `/catalogs/agents` | Lista agentes activos | `?q=` (búsqueda) |
| `GET` | `/catalogs/subscribers` | Lista suscriptores activos | `?q=` (búsqueda) |
| `GET` | `/catalogs/giros` | Lista giros económicos activos | `?q=` (búsqueda) |
| `GET` | `/catalogs/postal-codes/:cp` | Información de un código postal | — |

#### Health Checks

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health/liveness` | Indica si el proceso está vivo |
| `GET` | `/health/readiness` | Indica si el servicio está listo para recibir tráfico |

### Formato de respuesta

**Éxito:**
```json
{ "data": { ... } }
```

**Error de dominio (`AppError`):**
```json
{
  "error": "VersionConflict",
  "message": "La versión enviada no coincide con la versión actual del registro.",
  "details": { "expectedVersion": 3, "currentVersion": 4 }
}
```

**Error inesperado (500):**
```json
{
  "error": "InternalServerError",
  "message": "Ha ocurrido un error inesperado. Intente nuevamente."
}
```

> **Optimistic Locking**: todo endpoint de escritura recibe el campo `version` en el body. Si la versión no coincide con la actual en BD, se retorna `409 Conflict`.

---

## 8. Flujos de Datos

### Flujo 1: Creación de cotización

```
POST /api/v1/quotes
   │
   ├── QuoteController.createQuote()
   │     └── pool.query("SELECT nextval('seq_folios')") → genera numero_folio
   │     └── pool.query("INSERT INTO quotes ...") → estado EN_EDICION
   │
   └── 201 { data: { numeroFolio, estadoCotizacion, version: 1, ... } }
```

### Flujo 2: Datos generales y avance de estado

```
PATCH /api/v1/quotes/:folio/general-data
   │
   ├── validateRequest (requireFields + validateGeneralData)
   │     └── valida RFC (regex), vigenciaInicio (ISO, no pasada), vigenciaFin
   │
   ├── QuoteController.patchGeneralData()
   │     ├── Verifica version → 409 si no coincide
   │     ├── ExternalCoreService.validateAgent(agenteId) → 422 si no existe
   │     ├── ExternalCoreService.validateSubscriber(suscriptorId) → 422 si no existe
   │     ├── isGeneralDataComplete() → si completo, avanza estado
   │     └── pool.query("UPDATE quotes SET ... WHERE version=$x") → Optimistic Lock
   │
   └── 200 { data: Quote actualizado }
```

### Flujo 3: Cálculo de prima

```
POST /api/v1/quotes/:folio/calculate
   │
   ├── QuoteController.calculatePremium()
   │     ├── Verifica version y estado mínimo (COBERTURAS_SELECCIONADAS)
   │     ├── Lee ubicaciones del folio → [UbicacionResumen[]]
   │     ├── Verifica que haya al menos una ubicación COMPLETA → 422 NoValidLocations
   │     ├── Verifica que haya al menos una cobertura seleccionada → 422 NoCoverageSelected
   │     │
   │     └── PremiumService.calculate(locations, coverageOptions)
   │           ├── Para cada ubicación COMPLETA:
   │           │     ├── COB-001 (Incendio): getIncendioRate(giroId) × sumaIncendio
   │           │     ├── COB-002 (Cat. Natural): 0.3% × sumaCatNatural
   │           │     └── COB-003 (Interrupción): 0.2% × sumaInterrupcion
   │           ├── primaNeta = Σ desgloses
   │           └── primaComercial = primaNeta × 1.2 (FACTOR_COMERCIAL)
   │
   └── 200 { data: { primaNetaTotal, primaComercialTotal, primasPorUbicacion, ubicacionesExcluidas } }
```

---

## 9. Manejo de Errores

### Jerarquía de errores

```
Error (JS nativo)
 └── AppError (base — statusCode, errorCode, message, details?)
       ├── QuoteNotFoundError         (404)
       ├── LocationNotFoundError      (404)
       ├── VersionConflictError       (409)
       ├── ValidationError            (400)
       ├── MissingRequiredFieldError  (400)
       ├── ExternalValidationError    (422)
       ├── NoValidLocationsError      (422)
       ├── NoCoverageSelectedError    (422)
       ├── ObligatoryCoberturaCantBeDeselectedError (422)
       └── CatalogServiceUnavailableError (503)
```

### Regla de oro del error handler

- `AppError` → responde con `statusCode` + body estructurado (nunca expone stack trace).
- Cualquier otro `Error` → `500 InternalServerError` con mensaje genérico.
- **PII y datos de BD nunca se exponen** en mensajes de error al cliente.

---

## 10. Observabilidad

### Health Checks

| Endpoint | Propósito |
|---|---|
| `GET /health/liveness` | Confirma que el proceso Node.js está en ejecución |
| `GET /health/readiness` | Confirma que el servicio puede procesar peticiones |

### Logging

- `morgan('combined')`: log estructurado de cada request HTTP (método, URL, status, tiempo de respuesta, IP).
- Los errores inesperados se loguean mediante el error handler global.
- **Prohibido** registrar PII, contraseñas o datos financieros en logs.

### Métricas (roadmap)

Pendiente de implementación: endpoint `/metrics` con patrón RED (Rate, Errors, Duration) usando OpenTelemetry o Prometheus client.

---

## 11. Estrategia de Testing

### Pirámide de testing

```
        ┌───┐
        │E2E│  ~10%  (Playwright — roadmap)
       ┌┴───┴┐
       │Integ│  ~20%  (Supertest — tests/controllers/)
      ┌┴─────┴┐
      │ Unit  │  ~70%  (Jest — tests/services/, tests/utils/, tests/models/)
      └───────┘
```

### Cobertura objetivo: ≥ 80% en lógica de negocio (quality gate en CI)

### Archivos de test

| Directorio | Tipo | Herramienta |
|---|---|---|
| `tests/services/` | Unitario | Jest + mocks de `pool` |
| `tests/utils/` | Unitario | Jest |
| `tests/models/` | Unitario | Jest |
| `tests/controllers/` | Integración | Jest + Supertest |

### Principios

- Tests deterministas: sin dependencia de BD de producción, sin `sleep`, sin orden de ejecución.
- Patrón de nombre: `given_<contexto>_when_<acción>_then_<resultado>`.
- TDD para lógica crítica (`PremiumService`, `computeValidation`).

---

## 12. Principios y Restricciones de Diseño

### SOLID aplicado

| Principio | Implementación |
|---|---|
| **SRP** | Cada controller solo orquesta; la lógica de negocio vive exclusivamente en services |
| **OCP** | Nuevos bounded contexts → nuevos controllers/services/routes sin modificar los existentes |
| **LSP** | `AppError` y sus subclases son intercambiables en el error handler |
| **ISP** | Interfaces de modelos separadas por dominio (`Quote`, `Location`, `Coverage`) |
| **DIP** | Services dependen de `pool` (abstracción pg), no de implementaciones concretas de BD |

### Optimistic Locking

- Toda escritura debe incluir `version` en el body.
- El `UPDATE` incluye `WHERE version = $current` — si afecta 0 filas → `VersionConflictError (409)`.
- `version` nunca se modifica manualmente: es responsabilidad del trigger de BD o de la lógica del `UPDATE`.

### Queries parametrizadas (seguridad)

- **Prohibida** la concatenación de strings en queries SQL.
- Todos los valores dinámicos se pasan como parámetros positionales (`$1`, `$2`, ...) al `pool.query()`.

### Anti-patrones prohibidos

| Anti-patrón | Razón |
|---|---|
| Controller con lógica de negocio | Rompe SRP; dificulta el testing unitario |
| Service accediendo a `req`/`res` | Acopla la capa de negocio al protocolo HTTP |
| `any` en TypeScript | Anula las garantías del type system |
| Concatenación en queries SQL | SQL Injection (OWASP A03) |
| Errores internos expuestos al cliente | Information Disclosure (OWASP A05) |
| N+1 queries en bucles | Degrada el rendimiento bajo carga |

---

## 13. Decisiones de Arquitectura (ADRs)

### ADR-001: Sin ORM — acceso directo con `pg`

**Contexto**: el proyecto utiliza columnas `JSONB` extensamente y requiere control preciso de las queries.  
**Decisión**: usar `node-postgres (pg)` directamente sin ORM.  
**Consecuencia**: mayor control y performance; mayor responsabilidad en la escritura y parametrización de queries.

### ADR-002: Optimistic Locking en `quotes` y `locations`

**Contexto**: múltiples pestañas del agente pueden editar la misma cotización simultáneamente.  
**Decisión**: columna `version INTEGER` + check en cada `UPDATE`. Conflicto retorna `409 Conflict`.  
**Consecuencia**: el cliente debe re-obtener el recurso y reintentar con la versión actualizada.

### ADR-003: JSONB para datos semi-estructurados

**Contexto**: `datos_asegurado`, `opciones_cobertura`, `primas_por_ubicacion` y `garantias` varían en estructura por tipo de póliza.  
**Decisión**: almacenar como `JSONB` en PostgreSQL con índices GIN en columnas consultadas frecuentemente.  
**Consecuencia**: flexibilidad de esquema sin migraciones frecuentes; consultas con operadores `@>`, `->>`.

### ADR-004: Estado de cotización como máquina de estados unidireccional

**Contexto**: el flujo multi-paso solo puede avanzar, nunca retroceder automáticamente.  
**Decisión**: función `advanceEstado()` compara el orden numérico de los estados (`ESTADO_ORDER`) y solo avanza si el candidato tiene mayor orden que el estado actual.  
**Consecuencia**: editar datos generales después de calcular no regresa el estado a `EN_EDICION`; se preserva el progreso del usuario.

### ADR-005: `Plataforma-core-ohs` como tablas de catálogo locales

**Contexto**: el servicio externo no está disponible en el entorno de desarrollo.  
**Decisión**: `ExternalCoreService` consulta tablas `catalogos_*` en la misma BD PostgreSQL.  
**Consecuencia**: el cambio a un servicio HTTP externo solo requiere modificar `ExternalCoreService` sin impacto en controllers ni routes.

---

*Documento generado y mantenido bajo lineamientos CoE DevArq Sofka — LIN-DEV-009 (Documentación Técnica).*
