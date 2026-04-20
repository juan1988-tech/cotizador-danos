# Spec: Arquitectura de Alto Nivel — Sistema de Cotización de Seguros de Daños

## Metadata
- **ID**: SPEC-002
- **Fecha**: 2026-04-17
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Versión**: 1.0.0
- **Relacionado con**: SPEC-001 (Requerimientos Funcionales)

---

## Descripción

Este documento describe la arquitectura de alto nivel del sistema de cotización de seguros de daños (`cotizador-danos`). Cubre el paisaje de sistemas, los bounded contexts, las capas técnicas de backend y frontend, el modelo de datos, los contratos de comunicación y las decisiones de arquitectura (ADRs) vigentes. Es la fuente de verdad arquitectónica para todos los agentes ASSD del proyecto.

---

## Requerimiento de Negocio

Definir formalmente la arquitectura del sistema `cotizador-danos` para que:
1. Todos los agentes de desarrollo (backend, frontend, QA) operen con una visión unificada del sistema.
2. Las decisiones técnicas queden trazadas y justificadas en ADRs versionados.
3. Los contratos de comunicación entre sistemas sean explícitos y no ambiguos.
4. La arquitectura soporte el flujo multi-paso de cotización (datos generales → ubicaciones → coberturas → cálculo de prima) con integridad, trazabilidad y escalabilidad.

---

## 1. Paisaje de Sistemas (System Landscape)

El proyecto está compuesto por tres sistemas con responsabilidades distintas:

| Sistema | Tipo | Responsabilidad principal | Repositorio |
|---|---|---|---|
| `cotizador-danos-web` | SPA React 19 | Captura multi-paso, navegación por stepper, visualización de resultados | `cotizador-danos-web/` |
| `plataformas-danos-back` | API REST Node.js/Express | Orquestación de cotización, cálculo de primas, persistencia en PostgreSQL | `plataformas-danos-back/` |
| `Plataforma-core-ohs` | Servicio externo (mock de catálogos) | Provee catálogos de solo lectura: agentes, suscriptores, giros, CPs, tarifas y folios | externo |

### Diagrama de contexto

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Usuario (Agente de Seguros)                 │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTPS / Browser
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              cotizador-danos-web  (SPA React 19 + Vite)             │
│                                                                     │
│  features/quotes  ─  features/locations  ─  features/coverage      │
│                    ─  features/calculation                          │
│                                                                     │
│  Zustand (estado global)   │   React Router v6 (stepper)           │
│  TanStack Query + Axios    │   React Hook Form + Zod               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST JSON  /api/v1/...
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│         plataformas-danos-back  (Node.js + Express + TypeScript)    │
│                                                                     │
│  routes → controllers → services → models (TypeORM)                │
│                                                                     │
│  Módulos: quotes │ locations │ catalog │ calculation                │
│  Middleware: Helmet + CORS + validateRequest + errorHandler         │
└──────────┬───────────────────────────────────────┬─────────────────┘
           │ TypeORM / pg driver                   │ HTTP (fetch)
           ▼                                       ▼
┌──────────────────────┐              ┌────────────────────────────────┐
│  PostgreSQL 15+      │              │  Plataforma-core-ohs  (mock)   │
│                      │              │                                │
│  quotes              │              │  GET /agents                   │
│  locations           │              │  GET /subscribers              │
│  (JSONB + version)   │              │  GET /giros                    │
│                      │              │  GET /postal-codes             │
│                      │              │  GET /folios (reserva)         │
│                      │              │  GET /rates                    │
└──────────────────────┘              └────────────────────────────────┘
```

---

## 2. Bounded Contexts

| Bounded Context | Descripción | Módulos involucrados | Estado de cotización resultante |
|---|---|---|---|
| **Cotización (Quote)** | Ciclo de vida del folio: creación, datos generales, estado general | `quotes` (back + front) | `EN_EDICION` → `DATOS_GENERALES_COMPLETOS` |
| **Ubicaciones (Locations)** | Registro, validación y edición de ubicaciones de riesgo | `locations` (back + front) | `UBICACIONES_CONFIGURADAS` |
| **Cobertura (Coverage)** | Selección y persistencia de opciones de cobertura | `coverage` (back + front) | `COBERTURAS_SELECCIONADAS` |
| **Cálculo de Prima** | Cálculo de prima neta y comercial por ubicación y cobertura | `calculation` (back + front) | `CALCULADA` |
| **Catálogos (Core)** | Consulta de datos de referencia externos (solo lectura) | `CatalogController`, `ExternalCoreService` | — (sin estado propio) |

### Flujo de estados de cotización

```
[EN_EDICION]
     │ US-002 datos generales completos
     ▼
[DATOS_GENERALES_COMPLETOS]
     │ US-003 layout configurado + US-004 ubicaciones registradas
     ▼
[UBICACIONES_CONFIGURADAS]
     │ US-006 coberturas seleccionadas
     ▼
[COBERTURAS_SELECCIONADAS]
     │ US-007 cálculo ejecutado exitosamente
     ▼
[CALCULADA]
```

---

## 3. Arquitectura del Backend (`plataformas-danos-back`)

### 3.1 Patrón arquitectónico

**MVC por capas** con separación explícita de responsabilidades:

```
HTTP Request
     │
     ▼
[ routes/ ]         → Define método HTTP + path + llama al controller
     │
     ▼
[ controllers/ ]    → Valida entrada (class-validator / Joi), delega al service, construye respuesta HTTP
     │
     ▼
[ services/ ]       → Lógica de negocio, cálculos, llamadas a core externo, orquestación
     │
     ▼
[ models/ ]         → Entidades TypeORM mapeadas a PostgreSQL; sin lógica de negocio compleja
     │
     ▼
[ PostgreSQL ]      → Persistencia relacional con JSONB para datos semi-estructurados
```

### 3.2 Estructura de carpetas (canónica)

```
plataformas-danos-back/
└── src/
    ├── controllers/
    │   ├── QuoteController.ts       ← CRUD folio, datos generales, coberturas
    │   ├── LocationController.ts    ← Layout, registro y edición de ubicaciones
    │   └── CatalogController.ts     ← Proxy de catálogos hacia core-ohs
    ├── models/
    │   ├── Quote.ts                 ← Entidad TypeORM: cotización (agregado raíz)
    │   ├── Location.ts              ← Entidad TypeORM: ubicación de riesgo
    │   └── Coverage.ts              ← Entidad TypeORM: opciones de cobertura
    ├── routes/
    │   ├── quoteRoutes.ts
    │   ├── locationRoutes.ts
    │   └── index.ts                 ← Router principal: monta todos los módulos bajo /api/v1
    ├── services/
    │   ├── PremiumService.ts        ← Lógica de cálculo de prima neta y comercial
    │   └── ExternalCoreService.ts  ← Cliente HTTP hacia Plataforma-core-ohs
    ├── middlewares/
    │   ├── errorHandler.ts          ← Handler global de errores: traduce excepciones a respuestas HTTP
    │   └── validateRequest.ts       ← Middleware de validación de esquema (class-validator / Joi)
    ├── config/
    │   └── database.ts              ← Configuración TypeORM + pool PostgreSQL
    └── utils/
        └── helpers.ts               ← Funciones utilitarias sin dependencias de framework
```

### 3.3 Módulos del backend

| Módulo | Archivos clave | Responsabilidad |
|---|---|---|
| `quotes` | `QuoteController`, `quoteRoutes`, `Quote.ts` | CRUD del folio: creación, datos generales, coberturas, estado |
| `locations` | `LocationController`, `locationRoutes`, `Location.ts` | Layout, registro individual y masivo de ubicaciones |
| `calculation` | `PremiumService` | Cálculo de prima neta y comercial por ubicación |
| `catalog` | `CatalogController`, `ExternalCoreService` | Proxy read-only hacia `Plataforma-core-ohs` |

### 3.4 Reglas de responsabilidad por capa

| Capa | Puede hacer | No puede hacer |
|---|---|---|
| `routes/` | Definir path + método + llamar controller | Lógica de negocio, acceso a DB |
| `controllers/` | Validar entrada, delegar a service, construir respuesta | Cálculos de negocio, acceso directo a DB |
| `services/` | Lógica de negocio, orquestación, llamadas externas | Acceder directamente a request/response HTTP |
| `models/` | Definir entidades TypeORM, relaciones | Contener lógica de presentación o HTTP |
| `middlewares/` | Validar esquema, manejar errores globalmente | Lógica de negocio específica de dominio |

---

## 4. Arquitectura del Frontend (`cotizador-danos-web`)

### 4.1 Patrón arquitectónico

**Feature-based + Atomic Design**: cada funcionalidad es un módulo autónomo con sus propios componentes, hooks, servicios y tipos. Los elementos reutilizables residen en `shared/`.

```
cotizador-danos-web/
└── src/
    ├── features/               ← Módulos autónomos por bounded context
    │   ├── quotes/             (components/ hooks/ services/ types/)
    │   ├── locations/          (components/ hooks/ services/)
    │   ├── coverage/           (components/ hooks/)
    │   └── calculation/        (components/ hooks/)
    ├── shared/
    │   ├── components/
    │   │   ├── atoms/          ← Button, Input, Select, Alert, Badge
    │   │   ├── molecules/      ← FormField, Card, StepIndicator
    │   │   ├── organisms/      ← Navbar, Sidebar, StepperHeader
    │   │   └── templates/      ← PageLayout, QuoteLayout
    │   ├── hooks/              ← useApi, useForm (genéricos)
    │   └── apiClient.ts        ← Instancia Axios configurada + interceptores
    ├── layouts/
    │   ├── MainLayout.tsx
    │   └── QuoteLayout.tsx     ← Layout con stepper de 4 pasos
    ├── routes/
    │   ├── AppRoutes.tsx        ← Árbol de rutas React Router v6
    │   └── ProtectedRoute.tsx
    └── store/
        ├── quoteStore.ts       ← Zustand: estado global de la cotización activa
        └── catalogStore.ts     ← Zustand: catálogos cacheados
```

### 4.2 Módulos del frontend

| Feature | Componentes clave | Hook principal | Servicio API |
|---|---|---|---|
| `quotes` | `QuoteForm`, `QuoteHeader`, `QuoteProgress` | `useQuote`, `useQuoteState` | `quoteApi.ts` |
| `locations` | `LocationList`, `LocationForm`, `LocationCard` | `useLocations` | `locationApi.ts` |
| `coverage` | `CoverageOptions`, `CoverageSelector` | `useCoverage` | (via `quoteApi.ts`) |
| `calculation` | `CalculationButton`, `PremiumResults`, `LocationBreakdown` | `useCalculation` | (via `quoteApi.ts`) |

### 4.3 Atomic Design — niveles y ejemplos

| Nivel | Criterio | Ejemplos |
|---|---|---|
| **Atoms** | Elemento UI mínimo, sin lógica de negocio | `Button`, `Input`, `Select`, `Alert`, `Badge`, `Spinner` |
| **Molecules** | Composición de 2+ átomos con propósito único | `FormField`, `Card`, `StepIndicator` |
| **Organisms** | Sección compleja con lógica propia | `Navbar`, `Sidebar`, `LocationFormGroup` |
| **Templates** | Estructura de página sin datos reales | `PageLayout`, `QuoteLayout` |

### 4.4 Gestión de estado

| Capa | Herramienta | Uso |
|---|---|---|
| Estado servidor (caché) | TanStack React Query | Fetching, invalidación y re-fetching de datos del backend |
| Estado global UI | Zustand | Folio activo, paso del stepper, catálogos cargados |
| Estado de formulario | React Hook Form + Zod | Validación y control de formularios multi-campo |
| Estado URL | React Router v6 params | `folio` como parámetro de ruta en pasos del flujo |

---

## 5. Modelo de Datos (PostgreSQL)

### 5.1 Tablas principales

| Tabla | Descripción | Tipo de datos |
|---|---|---|
| `quotes` | Agregado raíz de la cotización | Relacional + JSONB |
| `locations` | Ubicaciones de riesgo (1..50 por cotización) | Relacional + JSONB |

### 5.2 Columnas JSONB (datos semi-estructurados)

| Tabla | Columna JSONB | Contenido |
|---|---|---|
| `quotes` | `datos_asegurado` | Datos generales del asegurado y contrato |
| `quotes` | `opciones_cobertura` | Arreglo de coberturas seleccionadas / no seleccionadas |
| `quotes` | `primas_por_ubicacion` | Resultado del cálculo: desglose por ubicación |
| `quotes` | `parametros_calculo` | Valores globales para conversión a prima comercial |
| `locations` | `garantias` | Arreglo de garantías con `tipoGarantia` y `sumaAsegurada` |

### 5.3 Optimistic Locking

- Columna `version INTEGER` en tablas `quotes` y `locations`.
- Gestionado por **trigger de BD** — nunca modificar manualmente.
- Conflicto de escritura concurrente retorna **HTTP 409 Conflict**.
- Respuesta de error: `{ "error": "Conflict", "details": { "expectedVersion": N, "currentVersion": M } }`.

### 5.4 Timestamps automáticos

| Columna | Descripción | Gestión |
|---|---|---|
| `fecha_creacion` | Momento de creación del registro | Trigger de BD (`INSERT`) |
| `fecha_ultima_actualizacion` | Momento de la última modificación | Trigger de BD (`UPDATE`) |

### 5.5 Índices recomendados

| Tabla | Columna | Tipo | Justificación |
|---|---|---|---|
| `quotes` | `numero_folio` | UNIQUE B-Tree | Búsqueda por folio (PK de negocio) |
| `quotes` | `datos_asegurado` | GIN | Consultas JSONB con `@>` |
| `quotes` | `opciones_cobertura` | GIN | Filtros sobre coberturas |
| `locations` | `quote_id` | B-Tree | Foreign key hacia `quotes` |
| `locations` | `garantias` | GIN | Consultas sobre garantías |

---

## 6. Contratos de Comunicación

### 6.1 Convenciones REST

| Convención | Valor |
|---|---|
| Prefijo de ruta | `/api/v1/` |
| Formato | JSON (`Content-Type: application/json`) |
| Autenticación | Por definir (SPEC pendiente) |
| Códigos de éxito | `200 OK`, `201 Created`, `204 No Content` |
| Códigos de error | `400`, `404`, `409`, `422`, `500` |
| Estructura de error | `{ "error": "string", "details": {} }` |

### 6.2 Endpoints por módulo (resumen)

| Módulo | Método | Path | Acción |
|---|---|---|---|
| quotes | `POST` | `/api/v1/quotes` | Crear cotización / reservar folio |
| quotes | `PATCH` | `/api/v1/quotes/:folio/general-data` | Guardar datos generales |
| quotes | `GET` | `/api/v1/quotes/:folio` | Consultar estado de cotización |
| quotes | `GET` | `/api/v1/quotes/:folio/coverage-options` | Listar opciones de cobertura |
| quotes | `PUT` | `/api/v1/quotes/:folio/coverage-options` | Guardar coberturas seleccionadas |
| locations | `POST` | `/api/v1/quotes/:folio/layout` | Configurar layout de ubicaciones |
| locations | `GET` | `/api/v1/quotes/:folio/locations` | Listar ubicaciones con estado de validación |
| locations | `PUT` | `/api/v1/quotes/:folio/locations` | Actualización masiva de ubicaciones |
| locations | `PATCH` | `/api/v1/quotes/:folio/locations/:index` | Editar ubicación individual |
| calculation | `POST` | `/api/v1/quotes/:folio/calculate` | Ejecutar cálculo de prima |
| catalog | `GET` | `/api/v1/catalogs/agents` | Obtener agentes (proxy core-ohs) |
| catalog | `GET` | `/api/v1/catalogs/subscribers` | Obtener suscriptores (proxy core-ohs) |
| catalog | `GET` | `/api/v1/catalogs/giros` | Obtener giros (proxy core-ohs) |
| catalog | `GET` | `/api/v1/catalogs/postal-codes/:cp` | Validar código postal (proxy core-ohs) |

### 6.3 Comunicación con `Plataforma-core-ohs`

- **Solo lectura** — el backend nunca escribe en core-ohs.
- Implementado como cliente HTTP en `ExternalCoreService.ts`.
- El backend actúa como **proxy / anti-corruption layer**: transforma la respuesta de core-ohs al contrato de la API pública antes de responderle al frontend.
- Si core-ohs no está disponible, retornar `503 Service Unavailable` con mensaje descriptivo.

---

## 7. Decisiones de Arquitectura (ADRs)

> Los ADRs siguientes son vigentes para este proyecto. Cualquier discrepancia con archivos de contexto que referencien Spring WebFlux / Java debe ignorarse — corresponden a plantillas de otros proyectos no actualizadas.

### ADR-001: Patrón MVC por capas para el backend

| Atributo | Valor |
|---|---|
| **ID** | ADR-001 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: El proyecto requiere una arquitectura de backend predecible, testeable y alineada con el equipo de desarrollo.

**Decisión**: Adoptar patrón MVC con capas explícitas: `routes → controllers → services → models`. La dirección de dependencia es siempre hacia adentro (routes depende de controllers, controllers de services, services de models).

**Consecuencias**:
- Facilita testing unitario por capa (mock de services en controllers, mock de models en services).
- Evita lógica de negocio en controllers o routes.
- Limita la complejidad a proyectos de tamaño medio-alto sin requerir Clean Architecture completa.

---

### ADR-002: PostgreSQL como única base de datos + JSONB para flexibilidad

| Atributo | Valor |
|---|---|
| **ID** | ADR-002 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: Los datos del asegurado, garantías y coberturas tienen estructura variable o cambiante. Usar columnas relacionales para todos ellos generaría migraciones frecuentes.

**Decisión**: PostgreSQL 15+ con columnas `JSONB` para datos semi-estructurados (`datos_asegurado`, `opciones_cobertura`, `primas_por_ubicacion`, `garantias`). Las entidades de ciclo de vida estable usan columnas relacionales.

**Consecuencias**:
- Flexibilidad en campos semi-estructurados sin migraciones.
- Consultas JSONB eficientes con índices GIN y operadores `@>`, `->`, `->>`.
- Obliga a validar la estructura JSONB en la capa de servicio (no en DB).

---

### ADR-003: Optimistic Locking vía columna `version` gestionada por trigger

| Atributo | Valor |
|---|---|
| **ID** | ADR-003 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: La cotización puede ser editada concurrentemente (p.ej. dos tabs del mismo navegador). Se necesita un mecanismo de detección de conflictos sin bloqueos pesimistas.

**Decisión**: Columna `version INTEGER` en `quotes` y `locations`. El trigger de BD incrementa `version` en cada `UPDATE`. Las operaciones de escritura deben incluir la versión esperada y el backend retorna `409 Conflict` si hay discrepancia.

**Consecuencias**:
- Sin bloqueos de fila (no row-level locking).
- El frontend debe manejar `409` relanzando la operación con la versión actualizada o notificando al usuario.

---

### ADR-004: API REST versionada por ruta (`/api/v1/`)

| Atributo | Valor |
|---|---|
| **ID** | ADR-004 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: La SPA y el backend evolucionarán en paralelo. Se necesita soporte de versiones para no romper contratos.

**Decisión**: Versionar todos los endpoints bajo `/api/v1/...`. Versiones futuras usarán `/api/v2/...`.

**Consecuencias**:
- Los consumidores pueden migrar gradualmente.
- Obliga a mantener versiones anteriores activas durante un período de transición.

---

### ADR-005: Feature-based + Atomic Design en el frontend

| Atributo | Valor |
|---|---|
| **ID** | ADR-005 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: El flujo multi-paso del cotizador tiene módulos funcionalmente independientes. Una estructura plana de `components/` generaría acoplamiento.

**Decisión**: Arquitectura feature-based: cada bounded context tiene su propio módulo en `src/features/<nombre>/`. Componentes reutilizables siguen Atomic Design en `src/shared/components/`.

**Consecuencias**:
- Cada feature puede desarrollarse en paralelo con mínimo conflicto de archivos.
- Evita que hooks y servicios de un módulo sean importados por otro (bajo acoplamiento entre features).

---

### ADR-006: `Plataforma-core-ohs` como servicio externo de solo lectura

| Atributo | Valor |
|---|---|
| **ID** | ADR-006 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: Los catálogos (agentes, giros, tarifas, CPs, folios) son datos de referencia mantenidos por un sistema externo.

**Decisión**: El backend actúa como proxy/anti-corruption layer. El frontend nunca llama directamente a core-ohs — toda la integración pasa por `ExternalCoreService.ts` en el backend.

**Consecuencias**:
- El frontend no tiene dependencias directas de core-ohs.
- El backend puede cachear, transformar y manejar errores de core-ohs de forma centralizada.
- Facilita el mocking en tests: se mockea `ExternalCoreService` en lugar de la red.

---

### ADR-007: TypeScript strict mode en backend y frontend

| Atributo | Valor |
|---|---|
| **ID** | ADR-007 |
| **Estado** | Activa |
| **Fecha** | 2026-04-17 |

**Contexto**: La cotización involucra cálculos financieros y flujos de estado. Un error de tipo en tiempo de ejecución puede generar valores incorrectos de prima.

**Decisión**: TypeScript con `strict: true` en ambos proyectos. Prohibición de `any` explícito. Todos los tipos de request/response deben definirse como interfaces o DTOs.

**Consecuencias**:
- Detección temprana de errores en tiempo de compilación.
- DTOs explícitos actúan como documentación viva del contrato entre capas.

---

## 8. Seguridad

| Área | Mecanismo | Referencia OWASP |
|---|---|---|
| Headers HTTP | `helmet` (X-Frame-Options, CSP, HSTS, etc.) | A05: Security Misconfiguration |
| CORS | Lista blanca de orígenes permitidos | A05 |
| Validación de entrada | `class-validator` + `Joi` en todos los endpoints | A03: Injection |
| Errores de infraestructura | `errorHandler` global: nunca exponer stack traces | A09: Security Logging |
| Variables sensibles | Variables de entorno — nunca en código fuente | A02: Cryptographic Failures |
| Optimistic locking | Versión verificada en escrituras — previene race conditions | A04: Insecure Design |

---

## 9. Estrategia de Testing (por capa)

| Capa | Framework | Tipo de test | Cobertura esperada |
|---|---|---|---|
| Backend — services | Jest + ts-jest | Unitario (mocks de models) | Happy path + errores de negocio |
| Backend — controllers | Jest + Supertest | Integración (app real, DB mockeada) | Todos los endpoints |
| Backend — E2E | Supertest + PostgreSQL test | Integración end-to-end | Flujos críticos del cotizador |
| Frontend — componentes | Vitest + Testing Library | Unitario | Render + interacciones |
| Frontend — hooks | Vitest + Testing Library | Unitario | Estados y efectos |
| Frontend — E2E | Playwright | E2E | Flujo completo multi-paso |

---

## Dependencias

### Backend
| Paquete | Versión objetivo | Uso |
|---|---|---|
| `express` | ^4.x | Framework HTTP |
| `typeorm` | ^0.3.x | ORM |
| `pg` | ^8.x | Driver PostgreSQL |
| `class-validator` | ^0.14.x | Validación de DTOs |
| `helmet` | ^7.x | Seguridad HTTP |
| `morgan` | ^1.x | Logging de requests |

### Frontend
| Paquete | Versión objetivo | Uso |
|---|---|---|
| `react` | ^19.x | Framework UI |
| `react-router-dom` | ^6.x | Routing |
| `zustand` | ^4.x | Estado global |
| `@tanstack/react-query` | ^5.x | Estado servidor / caché |
| `react-hook-form` | ^7.x | Formularios |
| `zod` | ^3.x | Validación de esquemas |
| `axios` | ^1.x | Cliente HTTP |

---

## Notas de Implementación

1. **Prioridad de lectura de esta spec**: esta spec debe ser leída por todos los agentes ASSD (backend-developer, frontend-developer, test-engineer) antes de implementar cualquier feature.
2. **ADRs vs. archivos de contexto legacy**: los archivos `architecture_decision_records.context.md` y `project_architecture_standards.context.md` contienen referencias a Spring WebFlux / Java que corresponden a plantillas de otros proyectos. Los ADRs vigentes para este proyecto son únicamente los documentados en esta spec (ADR-001 a ADR-007).
3. **El `numeroFolio` es la PK de negocio** del sistema — usar siempre como identificador en URLs y referencias entre sistemas.
4. **No escribir nunca en `Plataforma-core-ohs`** — es un sistema de solo lectura para este proyecto.
5. **El cálculo de prima es el paso final** y puede ejecutarse múltiples veces (idempotente con mismos datos). Modificar coberturas o ubicaciones después de un cálculo debe invalidar el resultado previo.
6. **Specs derivadas de esta arquitectura**: los detalles de endpoints, modelos de datos y componentes de cada bounded context deben documentarse en specs individuales referenciando SPEC-002.
