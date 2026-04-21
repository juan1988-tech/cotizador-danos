# Spec: Listar Cotizaciones en /cotizador

## Metadata
- **ID**: SPEC-010
- **Fecha**: 2026-04-21
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent

## Descripción
Cuando el usuario navega a la ruta `/cotizador`, el sistema debe mostrar la lista de todas las cotizaciones registradas en la base de datos, con información resumida de cada folio. Si no existen cotizaciones, se mantiene el estado vacío actual con la opción de crear una nueva.

## Requerimiento de Negocio
> "Como usuario, quiero que cuando estemos en la ruta /cotizador se muestre la lista de cotizaciones realizadas una vez he terminado el registro."

El usuario necesita visibilidad de su historial de cotizaciones al acceder a la landing del cotizador, para poder consultar, retomar o referenciar trabajos anteriores.

---

## Casos de Uso

### UC-01: Visualizar lista de cotizaciones existentes
- **Actor**: Usuario del sistema
- **Precondición**: Existen al menos una cotización guardada en la base de datos.
- **Flujo principal**:
  1. El usuario navega a `/cotizador`.
  2. El sistema realiza `GET /api/v1/quotes` al cargar la página.
  3. El backend retorna el listado de cotizaciones con campos resumen.
  4. La página muestra una lista de tarjetas (`QuoteCard`), una por cotización, con: número de folio, estado, nombre del asegurado, prima neta total (si existe) y fecha de última actualización.
  5. El usuario puede hacer clic en una tarjeta para navegar a `/quotes/:folio/general-info`.
- **Postcondición**: El usuario visualiza el listado actualizado de cotizaciones.

### UC-02: Estado vacío — sin cotizaciones previas
- **Actor**: Usuario del sistema
- **Precondición**: No existen cotizaciones en la base de datos.
- **Flujo principal**:
  1. El usuario navega a `/cotizador`.
  2. El sistema realiza `GET /api/v1/quotes` y recibe un array vacío.
  3. La página muestra el estado vacío actual ("No hay cotizaciones") con el botón de "Nueva Cotización".
- **Postcondición**: El usuario ve el estado vacío con la opción de crear la primera cotización.

### UC-03: Error al cargar la lista
- **Actor**: Usuario del sistema / Sistema
- **Precondición**: El backend no responde o devuelve un error 5xx.
- **Flujo alternativo**:
  1. El fetch a `GET /api/v1/quotes` falla.
  2. La página muestra un `Alert` de tipo `danger` con el mensaje de error.
  3. El botón "Nueva Cotización" permanece disponible.
- **Postcondición**: El usuario es informado del fallo sin bloqueo total de la UI.

---

## Modelos de Datos

### Entidades afectadas
| Entidad | Cambios | Descripción |
|---------|---------|-------------|
| `Quote` (backend model) | sin cambios | Se consulta sin modificar la entidad |
| `QuoteRepository` | nueva operación | Se añade `findAll()` para listar todos los folios |
| `QuoteController` | nueva función | Se añade `listQuotes` para el handler del endpoint |
| `Quote` (frontend type) | sin cambios | El tipo existente cubre todos los campos necesarios |

### Campos del resumen de cotización (response del endpoint)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numeroFolio` | `string` | Identificador único del folio |
| `estadoCotizacion` | `QuoteState` | Estado actual del flujo de cotización |
| `nombreAsegurado` | `string \| null` | Tomado de `datosAsegurado.nombreAsegurado` |
| `primaNetaTotal` | `number \| null` | Prima calculada; `null` si no se ha calculado |
| `fechaCreacion` | `string (ISO 8601)` | Fecha de creación del folio |
| `fechaUltimaActualizacion` | `string (ISO 8601)` | Fecha de la última modificación |

---

## API Endpoints

### GET /api/v1/quotes
- **Descripción**: Lista todas las cotizaciones ordenadas por `fechaUltimaActualizacion` descendente.
- **Auth requerida**: no (alineado con el resto de endpoints del proyecto que no usan auth por ahora)
- **Query params**: ninguno en esta versión
- **Request Body**: ninguno
- **Response 200**:
  ```json
  {
    "data": [
      {
        "numeroFolio": "COT-2026-000001",
        "estadoCotizacion": "CALCULADA",
        "nombreAsegurado": "Empresa Ejemplo SA de CV",
        "primaNetaTotal": 15400.50,
        "fechaCreacion": "2026-04-20T10:00:00.000Z",
        "fechaUltimaActualizacion": "2026-04-21T08:30:00.000Z"
      },
      {
        "numeroFolio": "COT-2026-000002",
        "estadoCotizacion": "EN_EDICION",
        "nombreAsegurado": null,
        "primaNetaTotal": null,
        "fechaCreacion": "2026-04-21T09:00:00.000Z",
        "fechaUltimaActualizacion": "2026-04-21T09:00:00.000Z"
      }
    ]
  }
  ```
- **Response 500**: error interno del servidor

> **Nota**: Este endpoint proyecta únicamente los campos de resumen. No expone el JSONB completo de `datosAsegurado`, `configuracionLayout`, `opcionesCobertura` ni `primasPorUbicacion`, para reducir el payload.

---

## Frontend

### Componentes nuevos
| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `QuoteCard` | `features/quotes/components/QuoteCard.tsx` | `quote: QuoteSummary; onClick: () => void` | Tarjeta de resumen de una cotización. Muestra folio, estado, nombre del asegurado, prima neta y fecha. Al hacer clic navega al folio. |

### Tipos nuevos (frontend)
| Tipo | Archivo | Descripción |
|------|---------|-------------|
| `QuoteSummary` | `features/quotes/types/quote.types.ts` | DTO del resumen de cotización devuelto por `GET /api/v1/quotes` |
| `ListQuotesResponse` | `features/quotes/types/quote.types.ts` | Envuelve `{ data: QuoteSummary[] }` |

### Páginas modificadas
| Página | Archivo | Cambio |
|--------|---------|--------|
| `QuoteListPage` | `features/quotes/pages/QuoteListPage.tsx` | Consume `useQuoteList` para mostrar la lista; mantiene el estado vacío cuando `quotes.length === 0` |

### Hooks nuevos
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useQuoteList` | `features/quotes/hooks/useQuoteList.ts` | `{ quotes, loading, error, refresh }` | Carga la lista de cotizaciones al montar; expone `refresh` para recargar manualmente |

### Servicios modificados
| Función | Archivo | Cambio |
|---------|---------|--------|
| `listQuotes()` | `features/quotes/services/quoteApi.ts` | Ya existe pero devuelve `Quote[]`; actualizar para usar `QuoteSummary[]` como tipo de retorno |

### Diseño de QuoteCard
La tarjeta debe mostrar:
- **Folio** en negrita (ej. `COT-2026-000001`)
- **Badge de estado** con color según `estadoCotizacion`:
  - `EN_EDICION` → gris
  - `DATOS_GENERALES_COMPLETOS` → azul
  - `UBICACIONES_CONFIGURADAS` → azul
  - `COBERTURAS_SELECCIONADAS` → amarillo
  - `CALCULADA` → verde
- **Nombre del asegurado** o "Sin datos generales" en caso de `null`
- **Prima neta** formateada como moneda MXN o "No calculada" si es `null`
- **Fecha de última actualización** en formato `DD/MM/YYYY`
- Hover con borde azul para indicar que es clickeable

---

## Reglas de Negocio
1. La lista se ordena por `fechaUltimaActualizacion` descendente (más reciente primero).
2. El endpoint devuelve **todas** las cotizaciones sin paginación en esta versión.
3. El campo `nombreAsegurado` en el resumen se extrae de `datosAsegurado.nombreAsegurado`; si `datosAsegurado` es `null`, el campo del resumen será `null`.
4. El campo `primaNetaTotal` se incluye directamente desde la columna del mismo nombre; si es `null`, se muestra "No calculada" en la UI.
5. Al hacer clic en una `QuoteCard`, el usuario navega a `/quotes/:folio/general-info` y la cotización correspondiente se carga en `useQuoteStore` (`setQuote`).
6. El listado es de solo lectura — no se puede eliminar ni archivar cotizaciones desde esta pantalla (fuera del alcance de esta spec).

---

## Plan de Pruebas Unitarias

### Backend — Repository
- [ ] `findAll_returns_all_quotes_ordered_by_fecha_ultima_actualizacion_desc` — verifica que el SQL retorna registros ordenados correctamente
- [ ] `findAll_returns_empty_array_when_no_quotes_exist` — verifica que devuelve `[]` sin errores

### Backend — Controller
- [ ] `listQuotes_returns_200_with_summary_array` — verifica response 200 con la proyección de campos correcta
- [ ] `listQuotes_returns_500_on_db_error` — verifica que el error handler cubre fallos de base de datos
- [ ] `listQuotes_nombreAsegurado_is_null_when_datosAsegurado_is_null` — verifica la proyección cuando el JSONB es nulo

### Backend — Routes
- [ ] `GET /api/v1/quotes returns 200` — test de integración del endpoint completo

### Frontend — Hook
- [ ] `useQuoteList returns quotes array on successful fetch` — verifica el estado `quotes` tras fetch exitoso
- [ ] `useQuoteList sets loading=true during fetch and false after` — verifica la bandera `loading`
- [ ] `useQuoteList sets error on fetch failure` — verifica el estado `error` cuando la API falla
- [ ] `useQuoteList refresh re-fetches the list` — verifica que `refresh()` dispara un nuevo fetch

### Frontend — Componente QuoteCard
- [ ] `QuoteCard renders folio number` — verifica que el folio aparece en el DOM
- [ ] `QuoteCard renders correct estado badge color for CALCULADA` — verifica el badge verde
- [ ] `QuoteCard renders "Sin datos generales" when nombreAsegurado is null` — verifica el fallback
- [ ] `QuoteCard renders "No calculada" when primaNetaTotal is null` — verifica el fallback
- [ ] `QuoteCard calls onClick when clicked` — verifica la interacción

### Frontend — Página QuoteListPage
- [ ] `QuoteListPage renders QuoteCard for each quote` — verifica la lista renderizada
- [ ] `QuoteListPage renders empty state when quotes array is empty` — verifica el estado vacío
- [ ] `QuoteListPage renders Alert when error is present` — verifica el manejo de error

---

## Dependencias
- Sin dependencias de paquetes nuevos.
- El endpoint `GET /api/v1/quotes` debe existir antes de que el agente frontend pueda integrar la página.
- La función `listQuotes()` en `quoteApi.ts` ya existe; solo requiere ajuste de tipos.

---

## Notas de Implementación

1. **Proyección SQL (backend)**: El `findAll()` del repositorio debe proyectar únicamente los campos del resumen usando `datos_asegurado->>'nombreAsegurado' AS nombre_asegurado` para evitar deserializar el JSONB completo en cada registro.

2. **Tipo `QuoteSummary` vs `Quote`**: En el frontend, `listQuotes()` actualmente declara retorno `Quote[]`. Cambiar al tipo `QuoteSummary` (más liviano) sin romper el tipo `Quote` existente. El hook `useQuote` existente no debe verse afectado.

3. **Carga de la cotización al hacer clic en una card**: Al navegar desde `QuoteCard` hacia `/quotes/:folio/general-info`, el hook `useQuote` en `GeneralInfoPage` ya realiza el `loadQuote(folio)` al montar, por lo que la navegación directa es suficiente — no se necesita pre-cargar desde `QuoteListPage`.

4. **Orden del router (backend)**: La ruta `GET /` debe declararse **antes** de `GET /:folio` en `quoteRoutes.ts` para evitar que Express interprete `quotes/` como un folio vacío.

5. **Sin paginación en v1**: Para esta versión no se implementa paginación. Si el número de cotizaciones crece significativamente, una siguiente spec deberá añadir `limit` / `offset` o cursor-based pagination.
