# Spec: Estrategia de Pruebas — Sistema de Cotización de Seguros de Daños

## Metadata
- **ID**: SPEC-006
- **Fecha**: 2026-04-17
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Versión**: 1.0.0
- **Relacionado con**: SPEC-001 (Requerimientos Funcionales), SPEC-002 (Arquitectura), SPEC-003 (Modelo de Datos), SPEC-004 (Contratos de API), SPEC-005 (Reglas de Negocio)

---

## Descripción

Este documento define la estrategia de pruebas completa del sistema `cotizador-danos`. Establece la pirámide de testing, las herramientas por capa, el catálogo exhaustivo de casos de prueba por módulo y las métricas de cobertura esperadas para los proyectos `plataformas-danos-back` (backend) y `cotizador-danos-web` (frontend). Es la fuente de verdad para el agente `test-engineer` y los ingenieros de calidad.

---

## Requerimiento de Negocio

Definir formalmente la estrategia de pruebas del sistema para que:
1. El agente `test-engineer` implemente tests sin ambigüedad ni redundancia.
2. El equipo de QA disponga de criterios verificables para cada historia de usuario (SPEC-001).
3. Las reglas de negocio (SPEC-005) sean verificadas con pruebas de borde específicas.
4. Los contratos de API (SPEC-004) sean validados mediante tests de integración con cobertura explícita de happy paths, error paths y edge cases.
5. Las métricas de cobertura sean medibles con las herramientas del stack aprobado.

**Requerimientos de alto nivel cubiertos:**
- Estrategia de testing (pirámide, tipos de prueba, ambientes)
- Casos de prueba por módulo y capa
- Cobertura esperada con umbrales mínimos verificables en CI

---

## Casos de Uso

### UC-01: Ejecutar suite de pruebas unitarias de backend
- **Actor**: Agente `test-engineer` / pipeline de CI
- **Precondición**: Código backend implementado; variables de entorno de test configuradas.
- **Flujo principal**:
  1. El runner ejecuta `jest --coverage` en `plataformas-danos-back`.
  2. Jest invoca cada `*.spec.ts` en `src/**/__tests__/` o `tests/`.
  3. El reporte de cobertura se genera en `coverage/lcov-report/`.
  4. Si algún umbral de cobertura no se alcanza, el pipeline falla.
- **Postcondición**: Reporte de cobertura disponible; umbrales validados.

### UC-02: Ejecutar tests de integración de endpoints
- **Actor**: Agente `test-engineer` / pipeline de CI
- **Precondición**: Base de datos PostgreSQL de test levantada; semillas de datos aplicadas.
- **Flujo principal**:
  1. Jest + Supertest levantan la aplicación Express en modo test.
  2. Cada test de integración llama un endpoint real con base de datos de test.
  3. Se verifica el código HTTP, el cuerpo de respuesta y los efectos en BD.
  4. Al finalizar, la BD de test se trunca para el siguiente test.
- **Postcondición**: Todos los contratos de SPEC-004 verificados end-to-end en el backend.

### UC-03: Ejecutar suite de pruebas unitarias de frontend
- **Actor**: Agente `test-engineer` / pipeline de CI
- **Precondición**: Dependencias de frontend instaladas; mocks de servicios API configurados.
- **Flujo principal**:
  1. Vitest ejecuta `vitest run --coverage` en `cotizador-danos-web`.
  2. Testing Library renderiza componentes en JSDOM con props de prueba.
  3. MSW intercepta las llamadas Axios en los hooks bajo prueba.
  4. Se verifican renders, interacciones de usuario y cambios de estado Zustand.
- **Postcondición**: Reporte de cobertura de componentes y hooks disponible.

### UC-04: Ejecutar pruebas E2E con Playwright
- **Actor**: Agente `test-engineer` / pipeline de CI (en ambiente staging)
- **Precondición**: Backend y frontend desplegados en ambiente de staging; datos de prueba sembrados.
- **Flujo principal**:
  1. Playwright abre el navegador y navega a la SPA.
  2. Ejecuta cada flujo crítico de extremo a extremo (happy paths + error paths principales).
  3. Captura screenshots en pasos críticos y toma video en caso de fallo.
  4. Verifica elementos de UI, mensajes de error y estados del stepper.
- **Postcondición**: Todos los flujos críticos validados desde la perspectiva del usuario final.

---

## 1. Estrategia de Testing

### 1.1 Pirámide de Testing

```
                    ┌─────────────┐
                    │    E2E      │  Playwright  (5 flujos críticos)
                    │  Playwright │  ~10 tests
                   /└─────────────┘\
                  /                  \
                 /  ┌─────────────┐   \
                │   │ Integración │    │  Jest + Supertest  (endpoints REST)
                │   │  Supertest  │    │  ~45 tests
                │  /└─────────────┘\   │
                │ /                  \  │
               /  ┌─────────────────┐  \
              │   │   Unitarias      │   │  Jest (backend) + Vitest (frontend)
              │   │  Jest + Vitest   │   │  ~120 tests
               \  └─────────────────┘  /
                \________________________/
```

| Nivel | Herramienta | Proyecto | Cantidad estimada | Ejecución |
|---|---|---|---|---|
| **Unitario backend** | Jest + ts-jest | `plataformas-danos-back` | ~70 tests | En cada commit |
| **Unitario frontend** | Vitest + Testing Library | `cotizador-danos-web` | ~50 tests | En cada commit |
| **Integración** | Jest + Supertest | `plataformas-danos-back` | ~45 tests | En cada PR |
| **E2E** | Playwright | Ambos proyectos | ~10 tests | En merge a `main` |

### 1.2 Ambientes de Ejecución

| Ambiente | Propósito | BD | URL base | Ejecución |
|---|---|---|---|---|
| `test` (local) | Unitarios e integración del backend | PostgreSQL en Docker | `http://localhost:3001` | `npm test` |
| `test` (CI) | Pipeline de PR | PostgreSQL en GitHub Actions service | — | CI automático |
| `staging` | E2E con backend y frontend desplegados | PostgreSQL staging | Variable de entorno | Pipeline en merge |

### 1.3 Convenciones de Nomenclatura

- **Unitarios backend**: `describe('QuoteService')` → `it('should_[behavior]_when_[condition]')`
- **Integración**: `describe('POST /api/v1/quotes/:folio')` → `it('returns_201_when_folio_is_new')`
- **Frontend**: `describe('<GeneralDataForm />')` → `it('renders_rfc_error_when_format_is_invalid')`
- **E2E**: `test('Agent can complete full quote flow from folio to calculation')`

### 1.4 Configuración de Cobertura (Jest / Vitest)

```json
// jest.config.ts (backend)
{
  "coverageThresholds": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 90,
      "statements": 90
    }
  }
}
```

```ts
// vitest.config.ts (frontend)
{
  coverage: {
    thresholds: {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  }
}
```

---

## 2. Plan de Pruebas Unitarias — Backend

### 2.1 Módulo `quotes` — `QuoteService`

| ID | Tipo | Nombre del test | Comportamiento verificado | CA relacionado |
|---|---|---|---|---|
| UT-QS-001 | Happy | `should create quote with EN_EDICION state when folio is new` | Retorna entidad con `estadoCotizacion = EN_EDICION` | CA-001.4 |
| UT-QS-002 | Happy | `should return existing quote when folio already exists (idempotent)` | No duplica el registro; retorna el existente | CA-001.3 |
| UT-QS-003 | Happy | `should transition to DATOS_GENERALES_COMPLETOS when all required fields are present` | Máquina de estados avanza correctamente | CA-002.6 |
| UT-QS-004 | Error | `should remain in EN_EDICION when any required field is missing` | Estado no avanza si algún campo obligatorio falta | SPEC-005 §1.1 |
| UT-QS-005 | Error | `should revert to EN_EDICION when required field is cleared after state was DATOS_GENERALES_COMPLETOS` | Retroceso de estado al borrar campo obligatorio | SPEC-005 §1.3 |
| UT-QS-006 | Error | `should throw VersionConflict when version does not match current record` | Control de concurrencia optimista | SPEC-005 §2.1 |
| UT-QS-007 | Happy | `should transition to CALCULADA after successful calculation` | Estado final correcto post-cálculo | CA-007.8 |
| UT-QS-008 | Edge | `should clear primas_por_ubicacion when coverage options are modified after CALCULADA` | Invalidación de cálculo previo | SPEC-005 §1.3 |
| UT-QS-009 | Edge | `should clear primas_por_ubicacion when a location is edited after CALCULADA` | Invalidación de cálculo previo | SPEC-005 §1.3 |

### 2.2 Módulo `quotes` — Validadores de `datosAsegurado`

| ID | Tipo | Nombre del test | Comportamiento verificado | CA relacionado |
|---|---|---|---|---|
| UT-QV-001 | Happy | `should accept valid RFC for persona moral (12 chars)` | RFC de 12 chars pasa validación | CA-002.4 |
| UT-QV-002 | Happy | `should accept valid RFC for persona fisica (13 chars)` | RFC de 13 chars pasa validación | CA-002.4 |
| UT-QV-003 | Error | `should reject RFC with invalid format` | Falla validación RFC malformado | CA-002.4 |
| UT-QV-004 | Error | `should reject vigenciaFin equal to vigenciaInicio` | Fechas iguales rechazadas | CA-002.2 |
| UT-QV-005 | Error | `should reject vigenciaFin before vigenciaInicio` | Fecha fin anterior a inicio rechazada | CA-002.2 |
| UT-QV-006 | Edge | `should reject vigenciaInicio in the past` | Fecha inicio en el pasado rechazada | SPEC-005 §2.1 |
| UT-QV-007 | Error | `should reject nombreAsegurado with only whitespace` | Nombre vacío/espacios rechazado | SPEC-005 §2.1 |

### 2.3 Módulo `locations` — `LocationService`

| ID | Tipo | Nombre del test | Comportamiento verificado | CA relacionado |
|---|---|---|---|---|
| UT-LS-001 | Happy | `should create N empty locations when layout is configured` | Layout genera N ubicaciones vacías con `INCOMPLETA` | CA-003.5 |
| UT-LS-002 | Happy | `should add locations at the end when numeroUbicaciones increases` | Ajuste de layout hacia arriba | CA-003.6 / SPEC-005 §2.2 |
| UT-LS-003 | Happy | `should remove trailing locations when numeroUbicaciones decreases` | Ajuste de layout hacia abajo | CA-003.6 / SPEC-005 §2.2 |
| UT-LS-004 | Error | `should reject numeroUbicaciones below 1` | Mínimo de ubicaciones | CA-003.4 |
| UT-LS-005 | Error | `should reject numeroUbicaciones above 50` | Máximo de ubicaciones | CA-003.4 |
| UT-LS-006 | Happy | `should set estado_validacion COMPLETA when all three criteria are met` | Clasificación de estado COMPLETA | SPEC-005 §2.4 |
| UT-LS-007 | Edge | `should set estado_validacion INCOMPLETA with alert when codigoPostal is missing` | Alerta CP | SPEC-005 §2.4 |
| UT-LS-008 | Edge | `should set estado_validacion INCOMPLETA with alert when giro has no claveIncendio` | Alerta giro sin tarifa | SPEC-005 §2.4 |
| UT-LS-009 | Edge | `should set estado_validacion INCOMPLETA with alert when no tarifable garantia exists` | Alerta sin garantías tarifables | SPEC-005 §2.4 |
| UT-LS-010 | Error | `should reject sumaAsegurada equal to 0` | Suma asegurada cero rechazada | CA-004.5 |
| UT-LS-011 | Error | `should reject sumaAsegurada negative` | Suma asegurada negativa rechazada | CA-004.5 |

### 2.4 Módulo `calculation` — `PremiumService`

| ID | Tipo | Nombre del test | Comportamiento verificado | CA relacionado |
|---|---|---|---|---|
| UT-PS-001 | Happy | `should calculate primaNetaTotal as sum of all complete locations` | Suma de primas por ubicación | CA-007.4 |
| UT-PS-002 | Happy | `should exclude INCOMPLETA locations from calculation and list them in ubicacionesExcluidas` | Exclusión de incompletas | CA-007.6 |
| UT-PS-003 | Error | `should throw NoValidLocationsForCalculation when all locations are INCOMPLETA` | Sin ubicaciones válidas | CA-007.3 |
| UT-PS-004 | Error | `should throw NoCoverageSelected when no coverage has seleccionada = true` | Sin coberturas seleccionadas | CA-007.2 |
| UT-PS-005 | Happy | `should produce same result on repeated calculation with same inputs (idempotency)` | Idempotencia del cálculo | CA-007.10 |
| UT-PS-006 | Error | `should throw InvalidQuoteStateTransition when state is EN_EDICION` | Llamada en estado inválido | SPEC-005 §1.4 |

### 2.5 Módulo `catalog` — `ExternalCoreService`

| ID | Tipo | Nombre del test | Comportamiento verificado | CA relacionado |
|---|---|---|---|---|
| UT-CS-001 | Happy | `should return catalog data when Plataforma-core-ohs responds 200` | Proxy correcto al servicio externo | CA-009.1 |
| UT-CS-002 | Error | `should throw ServiceUnavailableError when Plataforma-core-ohs times out` | Manejo de timeout externo | CA-009.4 |
| UT-CS-003 | Error | `should throw ServiceUnavailableError when Plataforma-core-ohs returns 5xx` | Manejo de error 5xx externo | CA-009.4 |
| UT-CS-004 | Happy | `should validate agenteId against external catalog` | Validación externa de agente | CA-002.3 |
| UT-CS-005 | Error | `should throw ExternalValidationError when agenteId not found in catalog` | ID no encontrado en catálogo | CA-002.3 |

---

## 3. Plan de Pruebas de Integración — Backend (Supertest)

### 3.1 `POST /api/v1/quotes/:folio` — Crear cotización

| ID | Tipo | Escenario | Request | Respuesta esperada |
|---|---|---|---|---|
| IT-QC-001 | Happy | Folio nuevo válido | `POST /quotes/COT-2026-001` | `201 { data: { numeroFolio, estadoCotizacion: 'EN_EDICION', ... } }` |
| IT-QC-002 | Happy | Folio ya existente (idempotente) | `POST /quotes/COT-2026-001` (2da vez) | `200` con la cotización existente sin nuevo registro |
| IT-QC-003 | Error | Folio con formato inválido (más de 20 chars) | `POST /quotes/FOLIO-EXTREMADAMENTE-LARGO-001` | `400 ValidationError` |

### 3.2 `GET /api/v1/quotes/:folio` — Consultar estado

| ID | Tipo | Escenario | Request | Respuesta esperada |
|---|---|---|---|---|
| IT-QG-001 | Happy | Folio existente | `GET /quotes/COT-2026-001` | `200 { data: { numeroFolio, estadoCotizacion, version, fechaCreacion, ... } }` |
| IT-QG-002 | Error | Folio inexistente | `GET /quotes/FOLIO-NO-EXISTE` | `404 QuoteNotFound` |

### 3.3 `PATCH /api/v1/quotes/:folio/general-data` — Datos generales

| ID | Tipo | Escenario | Request body | Respuesta esperada |
|---|---|---|---|---|
| IT-GD-001 | Happy | Todos los campos obligatorios completos y válidos | Body con 8 campos válidos + version | `200`; `estadoCotizacion = DATOS_GENERALES_COMPLETOS` |
| IT-GD-002 | Happy | Solo campos parciales (no todos obligatorios) | Body con 3 campos + version | `200`; `estadoCotizacion = EN_EDICION` |
| IT-GD-003 | Error | RFC inválido | `rfcAsegurado: "INVALIDO"` | `400 ValidationError` con detalle del campo |
| IT-GD-004 | Error | `vigenciaFin` anterior a `vigenciaInicio` | Fechas invertidas | `400 ValidationError` |
| IT-GD-005 | Error | `agenteId` no existe en catálogo externo | `agenteId: "AGENTE-FANTASMA"` | `422 ExternalValidationError` |
| IT-GD-006 | Error | `version` incorrecto | `version: 99` | `409 VersionConflict` |
| IT-GD-007 | Error | `version` ausente en body | Sin campo `version` | `400 MissingRequiredField` |

### 3.4 `POST /api/v1/quotes/:folio/layout` — Configurar layout

| ID | Tipo | Escenario | Request body | Respuesta esperada |
|---|---|---|---|---|
| IT-LO-001 | Happy | Layout uniforme con 5 ubicaciones | `{ numeroUbicaciones: 5, tipoLayout: 'UNIFORME', version }` | `200`; 5 registros `locations` creados; `UBICACIONES_CONFIGURADAS` |
| IT-LO-002 | Happy | Reducir de 5 a 3 ubicaciones | `{ numeroUbicaciones: 3, tipoLayout: 'UNIFORME', version }` | `200`; 2 ubicaciones eliminadas del final |
| IT-LO-003 | Happy | Ampliar de 3 a 7 ubicaciones | `{ numeroUbicaciones: 7, tipoLayout: 'UNIFORME', version }` | `200`; 4 ubicaciones vacías añadidas |
| IT-LO-004 | Error | `numeroUbicaciones = 0` | `{ numeroUbicaciones: 0, ... }` | `400 ValidationError` |
| IT-LO-005 | Error | `numeroUbicaciones = 51` | `{ numeroUbicaciones: 51, ... }` | `400 ValidationError` |
| IT-LO-006 | Error | `tipoLayout` inválido | `{ tipoLayout: 'MIXTO', ... }` | `400 ValidationError` |

### 3.5 `PATCH /api/v1/quotes/:folio/locations/:index` — Editar ubicación

| ID | Tipo | Escenario | Request body | Respuesta esperada |
|---|---|---|---|---|
| IT-LC-001 | Happy | Ubicación con los 3 criterios cumplidos | CP válido + giro con `claveIncendio` + garantía tarifable | `200`; `estadoValidacion = COMPLETA` |
| IT-LC-002 | Edge | Sin `codigoPostal` | CP omitido | `200`; `estadoValidacion = INCOMPLETA`; alerta CP |
| IT-LC-003 | Edge | Giro sin `claveIncendio` | `giroId` sin tarifa de incendio | `200`; `estadoValidacion = INCOMPLETA`; alerta giro |
| IT-LC-004 | Edge | Sin garantías tarifables | `garantias: []` | `200`; `estadoValidacion = INCOMPLETA`; alerta garantías |
| IT-LC-005 | Error | `sumaAsegurada = 0` | `{ sumaAsegurada: 0 }` | `400 ValidationError` |
| IT-LC-006 | Error | `sumaAsegurada` negativa | `{ sumaAsegurada: -1000 }` | `400 ValidationError` |
| IT-LC-007 | Error | Índice de ubicación inexistente | `PATCH /locations/99` | `404 LocationNotFound` |
| IT-LC-008 | Edge | Edición de ubicación cuando cotización está en `CALCULADA` | Cuerpo válido | `200`; `primas_por_ubicacion` limpiado; `estadoCotizacion = COBERTURAS_SELECCIONADAS` |

### 3.6 `PUT /api/v1/quotes/:folio/coverage-options` — Actualizar coberturas

| ID | Tipo | Escenario | Request body | Respuesta esperada |
|---|---|---|---|---|
| IT-CO-001 | Happy | Al menos una cobertura seleccionada | `{ opcionesCobertura: [{ ..., seleccionada: true }], version }` | `200`; `estadoCotizacion = COBERTURAS_SELECCIONADAS` |
| IT-CO-002 | Error | Intentar deseleccionar cobertura obligatoria | `{ codigoCobertura: 'INC', obligatoria: true, seleccionada: false }` | `422 ObligatoryCoberturaCantBeDeselected` |
| IT-CO-003 | Error | Estado de cotización es `EN_EDICION` | Llamada prematura | `422 InvalidQuoteStateTransition` |
| IT-CO-004 | Edge | Modificación de coberturas cuando cotización está `CALCULADA` | Body válido | `200`; `primas_por_ubicacion` limpiado |

### 3.7 `POST /api/v1/quotes/:folio/calculate` — Calcular prima

| ID | Tipo | Escenario | Request body | Respuesta esperada |
|---|---|---|---|---|
| IT-CA-001 | Happy | Al menos una ubicación COMPLETA y una cobertura seleccionada | `{ version }` | `200`; `{ primaNetaTotal, primaComercialTotal, primasPorUbicacion[], ubicacionesExcluidas[] }` |
| IT-CA-002 | Happy | Mezcla de ubicaciones COMPLETA e INCOMPLETA | Setup mixto | `200`; solo se calculan las COMPLETA; INCOMPLETA listadas en `ubicacionesExcluidas` |
| IT-CA-003 | Error | Todas las ubicaciones INCOMPLETA | Setup sin COMPLETA | `422 NoValidLocationsForCalculation` |
| IT-CA-004 | Error | Sin coberturas seleccionadas | `seleccionada: false` en todas | `422 NoCoverageSelected` |
| IT-CA-005 | Error | Estado `EN_EDICION` | Llamada prematura | `422 InvalidQuoteStateTransition` |
| IT-CA-006 | Edge | Cálculo repetido con mismos datos (idempotencia) | 2 llamadas consecutivas | Mismo resultado en ambas; `version` incrementa solo 1 vez por cálculo |

### 3.8 `GET /api/v1/catalogs/*` — Catálogos

| ID | Tipo | Escenario | Request | Respuesta esperada |
|---|---|---|---|---|
| IT-CAT-001 | Happy | Obtener lista de agentes | `GET /catalogs/agents` | `200 { data: [...] }` |
| IT-CAT-002 | Happy | Búsqueda de código postal válido | `GET /catalogs/postal-codes?q=06600` | `200 { data: [...] }` |
| IT-CAT-003 | Error | Búsqueda con menos de 3 caracteres | `GET /catalogs/postal-codes?q=06` | `400 ValidationError` |
| IT-CAT-004 | Error | Servicio externo no disponible (mock) | Mock de `Plataforma-core-ohs` retorna timeout | `503 { error: 'ServiceUnavailable', message: '...' }` |

---

## 4. Plan de Pruebas Unitarias — Frontend

### 4.1 Hooks — `useQuote`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-HQ-001 | Happy | `returns quote data with estadoCotizacion on successful fetch` | Hook expone `data.estadoCotizacion` |
| FE-HQ-002 | Error | `returns isError true when GET /quotes/:folio returns 404` | Estado de error en hook |
| FE-HQ-003 | Happy | `calls PATCH general-data and invalidates cache on success` | Mutación e invalidación de cache TanStack Query |
| FE-HQ-004 | Error | `exposes field-level errors from 400 ValidationError response` | Mapeo de errores de API a errores de campo |
| FE-HQ-005 | Edge | `exposes VersionConflict error when response is 409` | Manejo de conflicto de versión |

### 4.2 Hooks — `useLocations`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-HL-001 | Happy | `returns locations list with estadoValidacion per location` | Datos de ubicaciones accesibles |
| FE-HL-002 | Happy | `calls PATCH location and updates list on success` | Mutación de ubicación individual |
| FE-HL-003 | Edge | `shows INCOMPLETA alert when location has no tarifable garantia` | Alerta visible en hook state |

### 4.3 Componente `<GeneralDataForm />`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-GD-001 | Happy | `renders all required fields` | 8 campos obligatorios presentes en el DOM |
| FE-GD-002 | Error | `displays RFC validation error when format is invalid` | Mensaje de error RFC visible |
| FE-GD-003 | Error | `displays date range error when vigenciaFin is before vigenciaInicio` | Error de rango de fechas visible |
| FE-GD-004 | Happy | `calls onSubmit with sanitized values on valid form` | Handler llamado con datos correctos |
| FE-GD-005 | Edge | `disables submit button while mutation is loading` | Botón deshabilitado durante carga |
| FE-GD-006 | Error | `shows server-side 422 error inline on agenteId field` | Error externo mapeado a campo |

### 4.4 Componente `<LocationCard />`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-LC-001 | Happy | `renders COMPLETA badge when estadoValidacion is COMPLETA` | Badge verde visible |
| FE-LC-002 | Edge | `renders INCOMPLETA badge with alerts when location is incomplete` | Badge naranja y lista de alertas visible |
| FE-LC-003 | Error | `shows sumaAsegurada error when value is 0` | Validación Zod client-side |

### 4.5 Componente `<CoverageSelector />`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-CS-001 | Happy | `renders all coverage options with seleccionada checkbox state` | Lista de coberturas renderizada correctamente |
| FE-CS-002 | Edge | `renders obligatoria coverage as disabled checkbox` | Cobertura obligatoria no editable |
| FE-CS-003 | Happy | `calls onCoverageChange when a selectable coverage is toggled` | Handler invocado al cambiar selección |

### 4.6 Componente `<CalculationResult />`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-CR-001 | Happy | `renders primaNetaTotal and primaComercialTotal` | Totales numéricos visibles |
| FE-CR-002 | Happy | `renders desglose per location` | Desglose por ubicación expandible |
| FE-CR-003 | Edge | `renders ubicacionesExcluidas section when list is non-empty` | Sección de excluidas visible |

### 4.7 Store Zustand — `useQuoteStore`

| ID | Tipo | Nombre del test | Comportamiento verificado |
|---|---|---|---|
| FE-ZS-001 | Happy | `setCurrentFolio updates folio in store` | Folio actualizable en store |
| FE-ZS-002 | Happy | `setEstadoCotizacion updates stepper active step` | Paso activo del stepper sincronizado con estado |
| FE-ZS-003 | Edge | `clearCalculationResult removes primas from store when called` | Limpieza de resultado en store |

---

## 5. Plan de Pruebas E2E — Playwright

### 5.1 Flujos críticos

| ID | Flujo | Pasos clave | Resultado esperado |
|---|---|---|---|
| E2E-001 | **Flujo completo happy path** | Crear folio → Datos generales válidos → Layout 3 ubicaciones → Completar ubicaciones → Seleccionar coberturas → Calcular → Ver resultado | Resultado de cálculo mostrado; `estadoCotizacion = CALCULADA` |
| E2E-002 | **Validación de datos generales** | Ingresar RFC inválido → Ingresar fecha de fin anterior al inicio → Intentar guardar | Mensajes de error inline visibles; formulario no envía |
| E2E-003 | **Stepper bloqueado por estado** | Intentar navegar a paso 3 (Coberturas) sin completar pasos 1 y 2 | Pasos deshabilitados; no accesibles hasta cumplir condiciones |
| E2E-004 | **Invalidación de cálculo al editar** | Completar flujo hasta `CALCULADA` → Editar una ubicación → Verificar resultado invalidado | `primas_por_ubicacion` borradas; estado regresa a `COBERTURAS_SELECCIONADAS` |
| E2E-005 | **Catálogo de postal codes** | Buscar código postal con menos de 3 caracteres → Buscar con 5 caracteres | Primero no dispara búsqueda; segundo muestra resultados filtrados |

---

## 6. Cobertura Esperada

### 6.1 Umbrales mínimos de cobertura de código

| Proyecto | Nivel | Branches | Functions | Lines | Statements |
|---|---|---|---|---|---|
| `plataformas-danos-back` | Global | 80% | 85% | 90% | 90% |
| `plataformas-danos-back` | `services/` | 85% | 90% | 95% | 95% |
| `plataformas-danos-back` | `controllers/` | 80% | 85% | 90% | 90% |
| `cotizador-danos-web` | Global | 75% | 80% | 85% | 85% |
| `cotizador-danos-web` | `hooks/` | 80% | 85% | 90% | 90% |
| `cotizador-danos-web` | `components/` | 70% | 75% | 80% | 80% |

### 6.2 Cobertura funcional por Historia de Usuario (SPEC-001)

| Historia de Usuario | Tests unitarios | Tests de integración | Tests E2E | Cobertura objetivo |
|---|---|---|---|---|
| US-001 Inicio de cotización (folio) | UT-QS-001, UT-QS-002 | IT-QC-001, IT-QC-002, IT-QC-003 | E2E-001 | 100% CA cubiertos |
| US-002 Captura de datos generales | UT-QS-003 a UT-QS-005, UT-QV-001 a UT-QV-007 | IT-GD-001 a IT-GD-007 | E2E-001, E2E-002 | 100% CA cubiertos |
| US-003 Configuración de layout | UT-LS-001 a UT-LS-005 | IT-LO-001 a IT-LO-006 | E2E-001 | 100% CA cubiertos |
| US-004 Captura de ubicaciones | UT-LS-006 a UT-LS-011 | IT-LC-001 a IT-LC-008 | E2E-001, E2E-004 | 100% CA cubiertos |
| US-005 Consulta resumen de ubicaciones | — | IT-LC-001 (GET implícito) | E2E-001 | Cubierto vía integración |
| US-006 Selección de coberturas | — | IT-CO-001 a IT-CO-004 | E2E-001, E2E-003 | 100% CA cubiertos |
| US-007 Cálculo de prima | UT-PS-001 a UT-PS-006 | IT-CA-001 a IT-CA-006 | E2E-001, E2E-004 | 100% CA cubiertos |
| US-008 Consulta de estado | — | IT-QG-001, IT-QG-002 | E2E-001 | Cubierto vía integración |
| US-009 Consulta de catálogos | UT-CS-001 a UT-CS-005 | IT-CAT-001 a IT-CAT-004 | E2E-005 | 100% CA cubiertos |

### 6.3 Cobertura de Reglas de Negocio Críticas (SPEC-005)

| Regla | Tests que la cubren |
|---|---|
| Máquina de estados — transiciones permitidas | UT-QS-003, UT-QS-004, IT-GD-001, IT-LO-001, IT-CO-001, IT-CA-001 |
| Retroceso de estado al borrar campo obligatorio | UT-QS-005, IT-GD-002 |
| Invalidación de cálculo al editar coberturas/ubicaciones | UT-QS-008, UT-QS-009, IT-LC-008, IT-CO-004 |
| Optimistic locking (`VersionConflict`) | UT-QS-006, IT-GD-006, FE-HQ-005 |
| Criterios de clasificación COMPLETA/INCOMPLETA | UT-LS-006 a UT-LS-009, IT-LC-001 a IT-LC-004 |
| Cobertura obligatoria no deseleccionable | IT-CO-002 |
| Cálculo excluye ubicaciones INCOMPLETA | UT-PS-002, IT-CA-002 |
| Idempotencia del cálculo | UT-PS-005, IT-CA-006 |

---

## 7. Datos de Prueba

### 7.1 Fixtures base

> **Prohibición absoluta**: nunca usar datos reales de producción. Todos los datos son sintéticos.

| Fixture | Tipo | Valor de ejemplo | Propósito |
|---|---|---|---|
| `folio_valido` | string | `COT-TEST-001` | Folio nuevo para pruebas de creación |
| `folio_existente` | string | `COT-TEST-EXIST-001` | Folio pre-sembrado para pruebas de idempotencia |
| `rfc_moral_valido` | string | `SOFK900101ABC` | RFC persona moral (12 chars) correcto |
| `rfc_fisico_valido` | string | `JUAM800101AB3` | RFC persona física (13 chars) correcto |
| `rfc_invalido` | string | `RFC-INVALIDO-99` | RFC con formato incorrecto |
| `agente_id_valido` | string | `AGT-TEST-01` | ID existente en mock de `Plataforma-core-ohs` |
| `agente_id_invalido` | string | `AGT-FANTASMA` | ID inexistente en catálogo |
| `giro_con_clave_incendio` | string | `GIRO-INC-001` | Giro con `claveIncendio` definida |
| `giro_sin_clave_incendio` | string | `GIRO-NOFIRE-001` | Giro sin `claveIncendio` |
| `cp_valido` | string | `06600` | CP existente en catálogo |
| `cp_invalido` | string | `99999` | CP no encontrado en catálogo |
| `vigencia_inicio` | string | `2026-05-01` | Fecha de inicio válida (futura) |
| `vigencia_fin` | string | `2027-05-01` | Fecha de fin válida (mayor a inicio) |
| `version_actual` | number | `1` | Versión correcta de cotización nueva |
| `version_obsoleta` | number | `99` | Versión desactualizada para pruebas de conflicto |

### 7.2 Semillas de base de datos (`test/seeds/`)

| Seed | Descripción | Se usa en |
|---|---|---|
| `seed_quote_en_edicion` | Cotización en estado `EN_EDICION` con folio conocido | Tests de datos generales |
| `seed_quote_con_layout` | Cotización con 3 ubicaciones vacías inicializadas | Tests de ubicaciones |
| `seed_quote_con_ubicaciones_completas` | Cotización con todas las ubicaciones en estado `COMPLETA` | Tests de coberturas y cálculo |
| `seed_quote_calculada` | Cotización en estado `CALCULADA` con primas persistidas | Tests de invalidación de cálculo |

---

## Modelos de Datos

### Entidades afectadas (solo lectura — sin modificaciones)

| Entidad | Uso en pruebas |
|---|---|
| `quotes` | Verificar estado, versión y JSONB tras cada operación |
| `locations` | Verificar `estado_validacion` y `alertas_bloqueantes` tras edición |

---

## API Endpoints

> Esta spec no define nuevos endpoints. Los endpoints a probar están definidos en SPEC-004.

---

## Reglas de Negocio

1. Ninguna prueba debe modificar datos de otro test (aislamiento total por test o por suite con `afterEach` truncate).
2. Los mocks de `Plataforma-core-ohs` deben residir en `test/mocks/external-core.mock.ts` y ser reutilizables.
3. No se permite usar `any` en el código de tests — todos los objetos deben estar tipados.
4. Los tests de integración que requieran BD deben conectar a `DATABASE_URL_TEST`, nunca a la BD de desarrollo.
5. Las pruebas E2E deben ejecutarse contra el ambiente `staging`, nunca contra `production`.
6. Cada test de integración debe ser independiente: hacer `beforeEach` con seed y `afterEach` con truncate.
7. Los tests unitarios no deben importar ni instanciar TypeORM — usar mocks del repositorio.

---

## Plan de Pruebas Unitarias (resumen ejecutivo)

### Backend — Services
- [x] `UT-QS-001` a `UT-QS-009` — QuoteService (9 tests)
- [x] `UT-QV-001` a `UT-QV-007` — Validadores datos generales (7 tests)
- [x] `UT-LS-001` a `UT-LS-011` — LocationService (11 tests)
- [x] `UT-PS-001` a `UT-PS-006` — PremiumService (6 tests)
- [x] `UT-CS-001` a `UT-CS-005` — ExternalCoreService (5 tests)

**Total unitarios backend**: ~38 tests

### Backend — Integración (Supertest)
- [x] `IT-QC-001` a `IT-QC-003` — Crear cotización (3 tests)
- [x] `IT-QG-001` a `IT-QG-002` — Consultar estado (2 tests)
- [x] `IT-GD-001` a `IT-GD-007` — Datos generales (7 tests)
- [x] `IT-LO-001` a `IT-LO-006` — Layout (6 tests)
- [x] `IT-LC-001` a `IT-LC-008` — Ubicaciones (8 tests)
- [x] `IT-CO-001` a `IT-CO-004` — Coberturas (4 tests)
- [x] `IT-CA-001` a `IT-CA-006` — Cálculo (6 tests)
- [x] `IT-CAT-001` a `IT-CAT-004` — Catálogos (4 tests)

**Total integración**: ~40 tests

### Frontend — Componentes y Hooks
- [x] `FE-HQ-001` a `FE-HQ-005` — useQuote (5 tests)
- [x] `FE-HL-001` a `FE-HL-003` — useLocations (3 tests)
- [x] `FE-GD-001` a `FE-GD-006` — GeneralDataForm (6 tests)
- [x] `FE-LC-001` a `FE-LC-003` — LocationCard (3 tests)
- [x] `FE-CS-001` a `FE-CS-003` — CoverageSelector (3 tests)
- [x] `FE-CR-001` a `FE-CR-003` — CalculationResult (3 tests)
- [x] `FE-ZS-001` a `FE-ZS-003` — QuoteStore (3 tests)

**Total frontend**: ~26 tests

### E2E — Playwright
- [x] `E2E-001` a `E2E-005` — Flujos críticos (5 tests)

**TOTAL GENERAL**: ~109 tests

---

## Dependencias

### Backend
- `jest` — test runner
- `ts-jest` — soporte TypeScript en Jest
- `supertest` — cliente HTTP para tests de integración
- `@types/jest`, `@types/supertest` — typings
- `pg` — conexión a PostgreSQL de test
- PostgreSQL 15+ en Docker (ambiente local de tests)

### Frontend
- `vitest` — test runner compatible con Vite
- `@testing-library/react` — utilidades de render y queries
- `@testing-library/user-event` — simulación de interacciones de usuario
- `@testing-library/jest-dom` — matchers de DOM
- `msw` (Mock Service Worker) — mock de llamadas HTTP en Vitest/JSDOM
- `@playwright/test` — runner E2E

---

## Notas de Implementación

1. **Aislamiento de BD en integración**: cada test suite debe usar una transacción que haga rollback al finalizar, o aplicar truncate en `afterEach`. Preferir el enfoque de transacción para mayor velocidad.
2. **Mock de `Plataforma-core-ohs`**: en tests unitarios y de integración, el servicio externo siempre debe ser mockeado con `jest.mock()`. No realizar llamadas reales al servicio externo en ninguna suite que no sea E2E.
3. **Cobertura de branches en validaciones**: dado que los validadores tienen múltiples ramas condicionales (RFC regex, rangos de fechas, existencia en catálogo), los tests de borde (edge cases) son críticos para alcanzar el umbral del 80% en branches.
4. **Version en tests de integración**: cada test que modifique un registro debe incluir `version: 1` en el body (o el valor correcto según el seed) para evitar errores de `VersionConflict` no intencionados.
5. **Idempotencia**: el test `IT-CA-006` debe ejecutar el mismo request dos veces en el mismo test y comparar los resultados; requiere que el seed esté en estado previo a `CALCULADA`.
6. **Playwright config**: los tests E2E deben correr en modo `headless` en CI y en modo `headed` opcionalmente en local. Usar `baseURL` desde variables de entorno para apuntar a staging.
