# Spec: Crear Cotización (Inicio de Folio)

## Metadata
- **ID**: SPEC-002
- **Fecha**: 2026-04-20
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **HU de referencia**: US-001 — Inicio de cotización (obtención de folio)

---

## Descripción

Permite a un agente de seguros iniciar una nueva cotización de daños obteniendo un folio único generado por la secuencia interna `seq_folios`. El sistema crea el registro en la base de datos con estado `EN_EDICION` y redirige al formulario de datos generales. Es la puerta de entrada obligatoria al flujo multi-paso de cotización.

---

## Requerimiento de Negocio

Al pulsar el botón **"+ Nueva Cotización"** en la pantalla de listado, el sistema debe:
1. Reservar un folio único (`COT-{año}-{seq 6 dígitos}`) mediante la secuencia PostgreSQL `seq_folios`.
2. Persistir el registro inicial en la tabla `quotes` con estado `EN_EDICION`.
3. Devolver el folio, estado y timestamps al frontend.
4. Navegar automáticamente al paso 1 (Datos Generales) del wizard de cotización.

---

## Casos de Uso

### UC-01: Crear nueva cotización desde el listado

- **Actor**: Agente de seguros
- **Precondición**: El agente se encuentra en la página `/quotes` (listado de cotizaciones).
- **Flujo principal**:
  1. El agente hace clic en **"+ Nueva Cotización"**.
  2. El frontend llama a `POST /api/v1/quotes` sin cuerpo.
  3. El backend consulta `SELECT nextval('seq_folios')` y construye el folio con formato `COT-{año}-{seq padded a 6 dígitos}`.
  4. El backend inserta la fila en `quotes` con `numero_folio` generado y retorna los campos de la fila creada.
  5. El backend responde `201 Created` con `{ data: { numeroFolio, estadoCotizacion, version, fechaCreacion, fechaUltimaActualizacion } }`.
  6. El frontend navega a `/quotes/:folio/general-info`.
- **Flujo alternativo — error de BD**:
  - Si `pool.query` lanza una excepción, el middleware `errorHandler` retorna `500` con `{ error: "Internal server error" }`.
  - El frontend muestra un `Alert` de tipo `danger` con el mensaje de error.
- **Postcondición**: Existe una fila en `quotes` con estado `EN_EDICION` y `version = 1`.

---

## Modelos de Datos

### Entidades afectadas

| Entidad | Cambios | Descripción |
|---------|---------|-------------|
| `quotes` | INSERT | Fila nueva con folio único, estado inicial y versión 1 |
| `seq_folios` | nextval | Secuencia PostgreSQL; avanza en cada llamada |

### Campos de la tabla `quotes` involucrados

| Campo | Tipo | Valor inicial | Regla |
|-------|------|---------------|-------|
| `numero_folio` | `VARCHAR(50) PK` | `COT-{año}-{seq 6d}` | Generado en el controller; único e irrepetible |
| `estado_cotizacion` | `VARCHAR(30)` | `'EN_EDICION'` | Default de BD; no lo envía el controller |
| `version` | `INTEGER` | `1` | Default de BD; gestionado por restricción `chk_version` |
| `fecha_creacion` | `TIMESTAMP` | `NOW()` | Default de BD |
| `fecha_ultima_actualizacion` | `TIMESTAMP` | `NOW()` | Default de BD |

### Formato del folio

```
COT-{YYYY}-{NNNNNN}
  └── año en curso (4 dígitos)
              └── nextval('seq_folios') con pad de 6 ceros
Ejemplo: COT-2026-001000
```

---

## API Endpoints

### POST /api/v1/quotes

- **Descripción**: Inicia una nueva cotización reservando un folio único y creando el registro base.
- **Auth requerida**: No (sprint actual; pendiente para sprint de autenticación).
- **Request Body**: Ninguno.
- **Response 201**:
  ```json
  {
    "data": {
      "numeroFolio": "COT-2026-001000",
      "estadoCotizacion": "EN_EDICION",
      "version": 1,
      "fechaCreacion": "2026-04-20T10:00:00.000Z",
      "fechaUltimaActualizacion": "2026-04-20T10:00:00.000Z"
    }
  }
  ```
- **Response 500**:
  ```json
  { "error": "Internal server error" }
  ```
  Causas: fallo en `nextval`, fallo en INSERT (BD caída, constraint violation inesperada).

---

## Frontend

### Páginas involucradas

| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `QuoteListPage` | `features/quotes/pages/QuoteListPage.tsx` | `/quotes` | No |
| `GeneralInfoPage` | `features/quotes/pages/GeneralInfoPage.tsx` | `/quotes/:folio/general-info` | No |

### Flujo de navegación

```
/quotes  ──[click "+ Nueva Cotización"]──►  POST /api/v1/quotes
                                                   │ 201
                                                   ▼
                                    /quotes/:folio/general-info
```

### Servicios (llamadas API)

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `createQuote()` | `features/quotes/services/quoteApi.ts` | `POST /api/v1/quotes`; retorna `CreateQuoteResponse['data']` |

### Hooks / State

| Hook / Store | Archivo | Retorna | Descripción |
|--------------|---------|---------|-------------|
| `useQuote.createNewQuote()` | `features/quotes/hooks/useQuote.ts` | `Promise<string>` (folio) | Llama a `createQuote()` y navega a `general-info` |
| `useQuoteStore.setQuote()` | `store/quoteStore.ts` | `void` | Persiste la quote en estado global tras crear |

### Comportamiento de UI

| Estado | Comportamiento visible |
|--------|----------------------|
| `loading = true` | Botón "Nueva Cotización" muestra spinner y queda deshabilitado |
| `error != null` | Se renderiza `<Alert type="danger">` con el mensaje de error encima del listado |
| `201 recibido` | `useNavigate` redirige a `/quotes/:folio/general-info` |

---

## Reglas de Negocio

1. El folio debe tener el formato `COT-{año}-{seq padded a 6 dígitos}` exactamente.
2. El número de secuencia proviene **exclusivamente** de `nextval('seq_folios')`; no se calcula en aplicación.
3. El estado inicial `EN_EDICION` lo asigna el `DEFAULT` de la BD; el controller no lo envía explícitamente en el INSERT.
4. La fila se inserta solo con `numero_folio`; todos los demás campos usan el valor por defecto de la tabla.
5. No se valida el cuerpo del request (es vacío); el endpoint no acepta parámetros de entrada.
6. Si la secuencia o el INSERT fallan, el error no debe exponer detalles internos de BD al cliente.

---

## Criterios de Aceptación (Gherkin)

```gherkin
Feature: Crear cotización

  Scenario: Creación exitosa desde el listado
    Given el agente se encuentra en la página de listado de cotizaciones
    When hace clic en "+ Nueva Cotización"
    Then el sistema llama a POST /api/v1/quotes
    And recibe 201 con un campo "numeroFolio" con formato "COT-YYYY-NNNNNN"
    And navega a /quotes/{numeroFolio}/general-info

  Scenario: Error de base de datos
    Given la base de datos no está disponible
    When el agente hace clic en "+ Nueva Cotización"
    Then el sistema llama a POST /api/v1/quotes
    And recibe 500
    And se muestra un Alert de tipo danger con el mensaje de error
    And el agente permanece en la página de listado

  Scenario: Múltiples cotizaciones generan folios distintos
    Given se crean dos cotizaciones consecutivas en el mismo año
    When cada una completa el flujo POST /api/v1/quotes
    Then los folios retornados son distintos
    And el número de secuencia del segundo folio es mayor que el del primero
```

---

## Plan de Pruebas Unitarias

### Backend — Controller (`QuoteController.postQuote`)

- [ ] `given_postQuote_when_db_succeeds_then_returns_201_with_folio` — el controller llama a pool.query dos veces (nextval + INSERT) y responde con `201` y el shape correcto.
- [ ] `given_postQuote_when_nextval_throws_then_calls_next_with_error` — si la primera query falla, se llama a `next(err)` sin llamar a `res.status`.
- [ ] `given_postQuote_when_insert_throws_then_calls_next_with_error` — si la segunda query falla, se llama a `next(err)`.
- [ ] `given_postQuote_when_succeeds_then_folio_format_matches_COT_pattern` — el folio del response tiene formato `COT-{year}-{6digits}`.

### Backend — Integración (`POST /api/v1/quotes`)

- [ ] `given_POST_quotes_when_db_available_then_returns_201_and_body_matches_schema` — test con Supertest + BD real (o mock de pool).
- [ ] `given_POST_quotes_when_called_twice_then_folios_are_different` — dos llamadas producen folios únicos.

### Frontend — Component (`QuoteListPage`)

- [ ] `QuoteListPage renders button "Nueva Cotización"` — el botón está presente en el render inicial.
- [ ] `QuoteListPage shows spinner when loading` — durante el llamado, el botón muestra spinner.
- [ ] `QuoteListPage shows error alert when createQuote rejects` — si la API devuelve error, se renderiza `<Alert type="danger">`.
- [ ] `QuoteListPage navigates to /quotes/:folio/general-info on success` — tras recibir el folio, `navigate` se llama con la ruta correcta.

### Frontend — Hook (`useQuote.createNewQuote`)

- [ ] `createNewQuote calls createQuote service and navigates on success` — verifica que `navigate` se llama con `/quotes/{folio}/general-info`.
- [ ] `createNewQuote calls setError on service rejection` — si `createQuote` lanza, `setError` del store se invoca.

---

## Dependencias

- **Infraestructura**: Secuencia `seq_folios` definida en `database/schema.sql` (`CREATE SEQUENCE IF NOT EXISTS seq_folios START 1000`). Debe existir antes del primer llamado.
- **Sin paquetes nuevos**: la implementación usa únicamente `pg` (ya instalado) y la lógica nativa de Express.

---

## Notas de Implementación

- El controller (`postQuote`) debe importar `pool` desde `../config/database` directamente, siguiendo el patrón de `LocationController` (sin inyección de repositorio, por consistencia con el módulo actual).
- El folio se construye con `String(seqRows[0].seq).padStart(6, '0')` para garantizar 6 dígitos independientemente del valor de la secuencia.
- El año se obtiene con `new Date().getFullYear()` en tiempo de ejecución; no debe ser un valor fijo.
- El estado `EN_EDICION` **no** se envía en el INSERT; se deja al `DEFAULT` de la BD para mantener la fuente de verdad del estado en la base de datos.
- El test unitario debe mockear `../../src/config/database` con `jest.mock` antes de los imports para evitar conexiones reales (ver patrón en `location.controller.test.ts`).
- Dado que los timestamps (`fechaCreacion`, `fechaUltimaActualizacion`) vienen directamente del `RETURNING` del INSERT, el frontend los recibe como fechas ISO y los almacena como `string` en el tipo `CreateQuoteResponse`.
