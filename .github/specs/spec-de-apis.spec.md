# Spec: Contratos de API — Sistema de Cotización de Seguros de Daños

## Metadata
- **ID**: SPEC-004
- **Fecha**: 2026-04-17
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Versión**: 1.0.0
- **Relacionado con**: SPEC-001 (Requerimientos Funcionales), SPEC-002 (Arquitectura de Alto Nivel), SPEC-003 (Modelo de Datos)

---

## Descripción

Este documento especifica los contratos completos de todos los endpoints REST del sistema `cotizador-danos`. Define los esquemas de request/response con sus tipos TypeScript, los códigos HTTP posibles por endpoint y el catálogo exhaustivo de errores del dominio. Es la fuente de verdad para la implementación de controladores, middlewares de validación y servicios de API en el frontend.

---

## Requerimiento de Negocio

Documentar formalmente todos los contratos de API del sistema para que:
1. El agente de backend implemente controladores y validaciones sin ambigüedad.
2. El agente de frontend construya servicios Axios tipados a partir de interfaces concretas.
3. El agente de QA genere casos de prueba positivos y negativos por endpoint.
4. Los contratos entre `cotizador-danos-web` y `plataformas-danos-back` sean explícitos y versionados.

---

## Casos de Uso

### UC-01: Consultar contrato de un endpoint
- **Actor**: Agente de desarrollo (backend / frontend / QA)
- **Precondición**: El endpoint está definido en esta spec.
- **Flujo principal**: El agente consulta esta spec para conocer el path, método, body esperado, respuesta exitosa y posibles errores.
- **Postcondición**: El agente implementa o consume el endpoint conforme al contrato.

### UC-02: Validar coherencia entre contratos
- **Actor**: Agente de QA
- **Precondición**: Los endpoints están implementados.
- **Flujo principal**: El agente verifica que las respuestas reales del backend coincidan con los esquemas documentados en esta spec.
- **Postcondición**: Las discrepancias se reportan como defectos.

---

## Convenciones Globales

### Base URL
```
/api/v1
```

### Headers obligatorios en todas las peticiones
| Header | Valor | Descripción |
|---|---|---|
| `Content-Type` | `application/json` | Requerido en requests con body |
| `Accept` | `application/json` | Requerido en todos los requests |

### Parámetro de ruta `:folio`
- Tipo: `string`
- Formato: alfanumérico, máximo 20 caracteres
- Ejemplo: `COT-2026-001`
- Es la PK de negocio. Nunca usar el `id` técnico de la tabla en URLs públicas.

### Estructura de respuesta exitosa

```typescript
// Respuesta con dato único
interface SuccessResponse<T> {
  data: T;
}

// Respuesta con arreglo paginado (catálogos)
interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
```

### Estructura de respuesta de error

```typescript
interface ErrorResponse {
  error: string;          // Código de error legible en PascalCase
  message: string;        // Mensaje descriptivo para logs o UI
  details?: Record<string, unknown>; // Contexto adicional (campo inválido, versiones, etc.)
}
```

### Enums de dominio

```typescript
type EstadoCotizacion =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

type TipoLayout = 'UNIFORME' | 'PERSONALIZADO';

type EstadoValidacionUbicacion = 'COMPLETA' | 'INCOMPLETA';
```

---

## Catálogo de Códigos de Error

### Errores de cliente (4xx)

| Código HTTP | `error` | Causa |
|---|---|---|
| `400` | `ValidationError` | Uno o más campos no cumplen las reglas de formato o rango (p. ej. fechas invertidas, suma asegurada ≤ 0, `numeroUbicaciones` fuera de 1–50). |
| `400` | `MissingRequiredField` | Un campo obligatorio no fue enviado en el body. |
| `404` | `QuoteNotFound` | El folio indicado en la ruta no existe en el sistema. |
| `404` | `LocationNotFound` | El índice de ubicación indicado en la ruta no existe para ese folio. |
| `409` | `VersionConflict` | La versión enviada no coincide con la versión actual en la base de datos (optimistic locking). |
| `422` | `ExternalValidationError` | El valor enviado fue rechazado por `Plataforma-core-ohs` (p. ej. agente, suscriptor o código postal inexistente). |
| `422` | `ObligatoryCoberturaCantBeDeselected` | Se intentó deseleccionar una cobertura marcada como `obligatoria: true`. |
| `422` | `NoValidLocationsForCalculation` | Se intentó calcular la prima sin ninguna ubicación en estado `COMPLETA`. |
| `422` | `NoCoverageSelected` | Se intentó calcular la prima sin ninguna cobertura seleccionada. |
| `422` | `InvalidQuoteStateTransition` | La operación solicitada no es válida para el `estadoCotizacion` actual. |

### Errores de servidor (5xx)

| Código HTTP | `error` | Causa |
|---|---|---|
| `500` | `InternalServerError` | Error inesperado del sistema. El mensaje interno no se expone al cliente. |
| `503` | `CatalogServiceUnavailable` | `Plataforma-core-ohs` no está disponible. El backend retorna este error como proxy. |

---

## API Endpoints

---

### POST /api/v1/quotes
**Descripción**: Inicia una nueva cotización reservando un folio único en `Plataforma-core-ohs`. Si el folio ya existe en el sistema, retorna la cotización existente (idempotente).  
**Módulo**: `quotes`  
**Auth requerida**: No (por definir en SPEC de autenticación)

#### Request Body
```typescript
// Sin body — el folio se obtiene automáticamente de core-ohs
{}
```

#### Response 201 — Cotización creada
```typescript
interface CreateQuoteResponse {
  data: {
    numeroFolio:             string;           // Folio reservado en core-ohs
    estadoCotizacion:        'EN_EDICION';
    version:                 number;           // Siempre 1 en creación
    fechaCreacion:           string;           // ISO 8601 datetime
    fechaUltimaActualizacion: string;          // ISO 8601 datetime
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "estadoCotizacion": "EN_EDICION",
    "version": 1,
    "fechaCreacion": "2026-04-17T10:00:00.000Z",
    "fechaUltimaActualizacion": "2026-04-17T10:00:00.000Z"
  }
}
```

#### Response 200 — Cotización ya existente (idempotencia)
Misma estructura que 201.

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `503` | `CatalogServiceUnavailable` | `Plataforma-core-ohs` no disponible para reservar folio |
| `500` | `InternalServerError` | Error inesperado |

---

### PATCH /api/v1/quotes/:folio/general-data
**Descripción**: Guarda o actualiza parcialmente los datos generales del asegurado y del contrato. Los campos no enviados no se modifican.  
**Módulo**: `quotes`  
**Auth requerida**: No

#### Request Body
```typescript
interface PatchGeneralDataRequest {
  nombreAsegurado?: string;  // Min 2, Max 200 chars
  rfcAsegurado?:    string;  // Regex RFC mexicano: /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i
  agenteId?:        string;  // Debe existir en catálogo core-ohs
  suscriptorId?:    string;  // Debe existir en catálogo core-ohs
  tipoNegocio?:     string;  // Max 100 chars
  giroId?:          string;  // Debe existir en catálogo core-ohs
  vigenciaInicio?:  string;  // ISO 8601 date (YYYY-MM-DD). No puede ser fecha pasada
  vigenciaFin?:     string;  // ISO 8601 date (YYYY-MM-DD). Debe ser > vigenciaInicio
  version:          number;  // OBLIGATORIO — versión actual para optimistic locking
}
```

**Ejemplo**:
```json
{
  "nombreAsegurado": "Empresa Ejemplo S.A. de C.V.",
  "rfcAsegurado": "EEJ900101AAA",
  "agenteId": "AGT-001",
  "suscriptorId": "SUB-042",
  "tipoNegocio": "Comercio al por menor",
  "giroId": "GIR-015",
  "vigenciaInicio": "2026-05-01",
  "vigenciaFin": "2027-05-01",
  "version": 1
}
```

#### Response 200 — Datos generales actualizados
```typescript
interface PatchGeneralDataResponse {
  data: {
    numeroFolio:             string;
    estadoCotizacion:        EstadoCotizacion;
    datosAsegurado: {
      nombreAsegurado:  string;
      rfcAsegurado:     string;
      agenteId:         string;
      suscriptorId:     string;
      tipoNegocio:      string;
      giroId:           string;
      vigenciaInicio:   string;
      vigenciaFin:      string;
    };
    version:                 number;
    fechaUltimaActualizacion: string;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "estadoCotizacion": "DATOS_GENERALES_COMPLETOS",
    "datosAsegurado": {
      "nombreAsegurado": "Empresa Ejemplo S.A. de C.V.",
      "rfcAsegurado": "EEJ900101AAA",
      "agenteId": "AGT-001",
      "suscriptorId": "SUB-042",
      "tipoNegocio": "Comercio al por menor",
      "giroId": "GIR-015",
      "vigenciaInicio": "2026-05-01",
      "vigenciaFin": "2027-05-01"
    },
    "version": 2,
    "fechaUltimaActualizacion": "2026-04-17T10:05:00.000Z"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `ValidationError` | RFC inválido, `vigenciaFin` ≤ `vigenciaInicio`, o fecha en el pasado |
| `400` | `MissingRequiredField` | Campo `version` no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `409` | `VersionConflict` | `version` no coincide con la versión actual |
| `422` | `ExternalValidationError` | `agenteId`, `suscriptorId` o `giroId` no existen en core-ohs |
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible al validar catálogos |

**Ejemplo de error 409**:
```json
{
  "error": "VersionConflict",
  "message": "La versión enviada no coincide con la versión actual del registro.",
  "details": {
    "expectedVersion": 2,
    "currentVersion": 3
  }
}
```

**Ejemplo de error 400**:
```json
{
  "error": "ValidationError",
  "message": "vigenciaFin debe ser posterior a vigenciaInicio.",
  "details": {
    "field": "vigenciaFin",
    "value": "2026-04-01"
  }
}
```

---

### GET /api/v1/quotes/:folio
**Descripción**: Consulta el estado completo de una cotización. Endpoint de solo lectura.  
**Módulo**: `quotes`  
**Auth requerida**: No

#### Request Body
Sin body.

#### Response 200
```typescript
interface GetQuoteResponse {
  data: {
    numeroFolio:              string;
    estadoCotizacion:         EstadoCotizacion;
    datosAsegurado:           DatosAsegurado | null;
    configuracionLayout:      ConfiguracionLayout | null;
    opcionesCobertura:        OpcionCobertura[] | null;
    primasPorUbicacion:       ResultadoCalculo | null;
    version:                  number;
    fechaCreacion:            string;
    fechaUltimaActualizacion: string;
  };
}

interface DatosAsegurado {
  nombreAsegurado: string;
  rfcAsegurado:    string;
  agenteId:        string;
  suscriptorId:    string;
  tipoNegocio:     string;
  giroId:          string;
  vigenciaInicio:  string;
  vigenciaFin:     string;
}

interface ConfiguracionLayout {
  numeroUbicaciones: number;
  tipoLayout:        TipoLayout;
}

interface OpcionCobertura {
  codigoCobertura: string;
  descripcion:     string;
  seleccionada:    boolean;
  obligatoria:     boolean;
}

interface ResultadoCalculo {
  primaNetaTotal:       number;
  primaComercialTotal:  number;
  primasPorUbicacion:   PrimaUbicacion[];
  ubicacionesExcluidas: number[];  // índices de ubicaciones INCOMPLETA excluidas
}

interface PrimaUbicacion {
  indiceUbicacion: number;
  primaNeta:       number;
  primaComercial:  number;
  desglose: {
    incendio?:    number;
    catNatural?:  number;
    interrupcionNegocio?: number;
    [componente: string]: number | undefined;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "estadoCotizacion": "DATOS_GENERALES_COMPLETOS",
    "datosAsegurado": {
      "nombreAsegurado": "Empresa Ejemplo S.A. de C.V.",
      "rfcAsegurado": "EEJ900101AAA",
      "agenteId": "AGT-001",
      "suscriptorId": "SUB-042",
      "tipoNegocio": "Comercio al por menor",
      "giroId": "GIR-015",
      "vigenciaInicio": "2026-05-01",
      "vigenciaFin": "2027-05-01"
    },
    "configuracionLayout": null,
    "opcionesCobertura": null,
    "primasPorUbicacion": null,
    "version": 2,
    "fechaCreacion": "2026-04-17T10:00:00.000Z",
    "fechaUltimaActualizacion": "2026-04-17T10:05:00.000Z"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `404` | `QuoteNotFound` | Folio no existe |

---

### POST /api/v1/quotes/:folio/layout
**Descripción**: Configura el layout de ubicaciones de riesgo. Si ya existía un layout, ajusta la cantidad de registros en `locations` (agrega al final o elimina desde el final) conservando los ya capturados.  
**Módulo**: `locations`  
**Auth requerida**: No

#### Request Body
```typescript
interface PostLayoutRequest {
  numeroUbicaciones: number;            // Entero, mínimo 1, máximo 50
  tipoLayout:        TipoLayout;        // 'UNIFORME' | 'PERSONALIZADO'
  version:           number;            // OBLIGATORIO — versión actual de la cotización
}
```

**Ejemplo**:
```json
{
  "numeroUbicaciones": 3,
  "tipoLayout": "UNIFORME",
  "version": 2
}
```

#### Response 200 — Layout configurado
```typescript
interface PostLayoutResponse {
  data: {
    numeroFolio:          string;
    configuracionLayout: {
      numeroUbicaciones: number;
      tipoLayout:        TipoLayout;
    };
    ubicacionesInicializadas: number;  // Cantidad de ubicaciones vacías creadas
    version:                  number;
    fechaUltimaActualizacion: string;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "configuracionLayout": {
      "numeroUbicaciones": 3,
      "tipoLayout": "UNIFORME"
    },
    "ubicacionesInicializadas": 3,
    "version": 3,
    "fechaUltimaActualizacion": "2026-04-17T10:10:00.000Z"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `ValidationError` | `numeroUbicaciones` < 1 o > 50, o `tipoLayout` inválido |
| `400` | `MissingRequiredField` | Campo `version` no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `409` | `VersionConflict` | `version` no coincide |

---

### GET /api/v1/quotes/:folio/locations
**Descripción**: Retorna la lista de ubicaciones con su estado de validación. Endpoint de solo lectura.  
**Módulo**: `locations`  
**Auth requerida**: No

#### Request Body
Sin body.

#### Response 200
```typescript
interface GetLocationsResponse {
  data: {
    ubicaciones: UbicacionResumen[];
    resumen: {
      total:      number;
      completas:  number;
      incompletas: number;
    };
  };
}

interface UbicacionResumen {
  indiceUbicacion:    number;
  descripcion:        string | null;
  codigoPostal:       string | null;
  giroId:             string | null;
  estadoValidacion:   EstadoValidacionUbicacion;
  alertasBloqueantes: string[];
  garantias: Garantia[];
  version:            number;
}

interface Garantia {
  tipoGarantia:   string;
  sumaAsegurada:  number;
}
```

**Ejemplo**:
```json
{
  "data": {
    "ubicaciones": [
      {
        "indiceUbicacion": 1,
        "descripcion": "Bodega principal",
        "codigoPostal": "06600",
        "giroId": "GIR-015",
        "estadoValidacion": "COMPLETA",
        "alertasBloqueantes": [],
        "garantias": [
          { "tipoGarantia": "INCENDIO", "sumaAsegurada": 500000 }
        ],
        "version": 2
      },
      {
        "indiceUbicacion": 2,
        "descripcion": null,
        "codigoPostal": null,
        "giroId": null,
        "estadoValidacion": "INCOMPLETA",
        "alertasBloqueantes": [
          "Código postal requerido",
          "Se requiere al menos una garantía con suma asegurada mayor a 0"
        ],
        "garantias": [],
        "version": 1
      }
    ],
    "resumen": {
      "total": 2,
      "completas": 1,
      "incompletas": 1
    }
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `404` | `QuoteNotFound` | Folio no existe |

---

### PUT /api/v1/quotes/:folio/locations
**Descripción**: Actualiza masivamente todas las ubicaciones de una cotización en una sola transacción. Reemplaza los datos de cada ubicación identificada por `indiceUbicacion`.  
**Módulo**: `locations`  
**Auth requerida**: No

#### Request Body
```typescript
interface PutLocationsRequest {
  ubicaciones: UbicacionInput[];
  version:     number;  // OBLIGATORIO — versión actual de la cotización
}

interface UbicacionInput {
  indiceUbicacion: number;         // 1-based, debe existir en el layout
  descripcion?:    string;         // Max 200 chars
  codigoPostal?:   string;         // Validado contra core-ohs
  giroId?:         string;         // Validado contra core-ohs
  garantias?:      GarantiaInput[];
  version:         number;         // OBLIGATORIO — versión de la ubicación individual
}

interface GarantiaInput {
  tipoGarantia:  string;   // Código del tipo de garantía
  sumaAsegurada: number;   // Número positivo > 0
}
```

**Ejemplo**:
```json
{
  "ubicaciones": [
    {
      "indiceUbicacion": 1,
      "descripcion": "Bodega principal",
      "codigoPostal": "06600",
      "giroId": "GIR-015",
      "garantias": [
        { "tipoGarantia": "INCENDIO", "sumaAsegurada": 500000 },
        { "tipoGarantia": "CAT_NATURAL", "sumaAsegurada": 300000 }
      ],
      "version": 1
    }
  ],
  "version": 3
}
```

#### Response 200 — Ubicaciones actualizadas
```typescript
interface PutLocationsResponse {
  data: {
    ubicaciones:             UbicacionResumen[];  // Ver GET /locations para estructura
    resumen: {
      total:      number;
      completas:  number;
      incompletas: number;
    };
    version:                 number;              // Versión actualizada de la cotización
    fechaUltimaActualizacion: string;
  };
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `ValidationError` | `sumaAsegurada` ≤ 0 o campo de formato inválido |
| `400` | `MissingRequiredField` | Campo `version` (cotización o ubicación) no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `404` | `LocationNotFound` | `indiceUbicacion` fuera del layout configurado |
| `409` | `VersionConflict` | `version` de cotización o de ubicación no coincide |
| `422` | `ExternalValidationError` | `codigoPostal` o `giroId` no existen en core-ohs |
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

---

### PATCH /api/v1/quotes/:folio/locations/:index
**Descripción**: Edita una única ubicación identificada por su índice. Actualización parcial: los campos no enviados no se modifican.  
**Módulo**: `locations`  
**Parámetro de ruta**: `:index` — entero 1-based correspondiente a `indiceUbicacion`.  
**Auth requerida**: No

#### Request Body
```typescript
interface PatchLocationRequest {
  descripcion?: string;
  codigoPostal?: string;
  giroId?:       string;
  garantias?:    GarantiaInput[];
  version:       number;  // OBLIGATORIO — versión de la ubicación individual
}
```

**Ejemplo**:
```json
{
  "codigoPostal": "44100",
  "garantias": [
    { "tipoGarantia": "INCENDIO", "sumaAsegurada": 750000 }
  ],
  "version": 1
}
```

#### Response 200 — Ubicación actualizada
```typescript
interface PatchLocationResponse {
  data: UbicacionResumen;  // Ver GET /locations para estructura de UbicacionResumen
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `ValidationError` | `sumaAsegurada` ≤ 0 |
| `400` | `MissingRequiredField` | Campo `version` no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `404` | `LocationNotFound` | `:index` fuera del layout configurado |
| `409` | `VersionConflict` | `version` de la ubicación no coincide |
| `422` | `ExternalValidationError` | `codigoPostal` o `giroId` inválido en core-ohs |
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

---

### GET /api/v1/quotes/:folio/coverage-options
**Descripción**: Lista las opciones de cobertura disponibles para la cotización. Si aún no se han persistido, retorna las opciones por defecto derivadas del giro.  
**Módulo**: `quotes / coverage`  
**Auth requerida**: No

#### Request Body
Sin body.

#### Response 200
```typescript
interface GetCoverageOptionsResponse {
  data: {
    opcionesCobertura: OpcionCobertura[];
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "opcionesCobertura": [
      {
        "codigoCobertura": "COB-001",
        "descripcion": "Incendio y/o Rayo",
        "seleccionada": true,
        "obligatoria": true
      },
      {
        "codigoCobertura": "COB-002",
        "descripcion": "Catastrofe Natural",
        "seleccionada": false,
        "obligatoria": false
      },
      {
        "codigoCobertura": "COB-003",
        "descripcion": "Interrupción de Negocio",
        "seleccionada": false,
        "obligatoria": false
      }
    ]
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `404` | `QuoteNotFound` | Folio no existe |

---

### PUT /api/v1/quotes/:folio/coverage-options
**Descripción**: Persiste el arreglo completo de opciones de cobertura con su estado `seleccionada`. Si existe un cálculo previo, lo invalida (limpia `primasPorUbicacion`).  
**Módulo**: `quotes / coverage`  
**Auth requerida**: No

#### Request Body
```typescript
interface PutCoverageOptionsRequest {
  opcionesCobertura: OpcionCoberturaInput[];
  version:           number;  // OBLIGATORIO
}

interface OpcionCoberturaInput {
  codigoCobertura: string;
  seleccionada:    boolean;
}
```

**Ejemplo**:
```json
{
  "opcionesCobertura": [
    { "codigoCobertura": "COB-001", "seleccionada": true },
    { "codigoCobertura": "COB-002", "seleccionada": true },
    { "codigoCobertura": "COB-003", "seleccionada": false }
  ],
  "version": 4
}
```

#### Response 200 — Coberturas guardadas
```typescript
interface PutCoverageOptionsResponse {
  data: {
    numeroFolio:             string;
    opcionesCobertura:       OpcionCobertura[];
    calculoInvalidado:       boolean;   // true si se limpió primasPorUbicacion previo
    version:                 number;
    fechaUltimaActualizacion: string;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "opcionesCobertura": [
      { "codigoCobertura": "COB-001", "descripcion": "Incendio y/o Rayo", "seleccionada": true, "obligatoria": true },
      { "codigoCobertura": "COB-002", "descripcion": "Catastrofe Natural", "seleccionada": true, "obligatoria": false },
      { "codigoCobertura": "COB-003", "descripcion": "Interrupción de Negocio", "seleccionada": false, "obligatoria": false }
    ],
    "calculoInvalidado": false,
    "version": 5,
    "fechaUltimaActualizacion": "2026-04-17T10:20:00.000Z"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `MissingRequiredField` | Campo `version` no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `409` | `VersionConflict` | `version` no coincide |
| `422` | `ObligatoryCoberturaCantBeDeselected` | Se intentó enviar `seleccionada: false` en una cobertura obligatoria |

**Ejemplo de error 422**:
```json
{
  "error": "ObligatoryCoberturaCantBeDeselected",
  "message": "La cobertura COB-001 es obligatoria y no puede ser deseleccionada.",
  "details": {
    "codigoCobertura": "COB-001"
  }
}
```

---

### POST /api/v1/quotes/:folio/calculate
**Descripción**: Ejecuta el cálculo de prima neta y comercial para todas las ubicaciones en estado `COMPLETA`. Las ubicaciones `INCOMPLETA` se excluyen y se listan en `ubicacionesExcluidas`. El cálculo es idempotente. Al finalizar, `estadoCotizacion` pasa a `CALCULADA`.  
**Módulo**: `calculation`  
**Auth requerida**: No

#### Request Body
```typescript
interface PostCalculateRequest {
  version: number;  // OBLIGATORIO — versión actual de la cotización
}
```

**Ejemplo**:
```json
{
  "version": 5
}
```

#### Response 200 — Cálculo ejecutado
```typescript
interface PostCalculateResponse {
  data: {
    numeroFolio:            string;
    estadoCotizacion:       'CALCULADA';
    primaNetaTotal:         number;
    primaComercialTotal:    number;
    primasPorUbicacion:     PrimaUbicacion[];
    ubicacionesExcluidas:   number[];
    version:                number;
    fechaUltimaActualizacion: string;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "numeroFolio": "COT-2026-001",
    "estadoCotizacion": "CALCULADA",
    "primaNetaTotal": 12500.50,
    "primaComercialTotal": 15000.60,
    "primasPorUbicacion": [
      {
        "indiceUbicacion": 1,
        "primaNeta": 12500.50,
        "primaComercial": 15000.60,
        "desglose": {
          "incendio": 8000.00,
          "catNatural": 3000.00,
          "interrupcionNegocio": 1500.50
        }
      }
    ],
    "ubicacionesExcluidas": [2],
    "version": 6,
    "fechaUltimaActualizacion": "2026-04-17T10:30:00.000Z"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `MissingRequiredField` | Campo `version` no enviado |
| `404` | `QuoteNotFound` | Folio no existe |
| `409` | `VersionConflict` | `version` no coincide |
| `422` | `NoValidLocationsForCalculation` | Ninguna ubicación en estado `COMPLETA` |
| `422` | `NoCoverageSelected` | Ninguna cobertura con `seleccionada: true` |
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible al obtener tarifas |

**Ejemplo de error 422 — sin ubicaciones válidas**:
```json
{
  "error": "NoValidLocationsForCalculation",
  "message": "No existen ubicaciones válidas para calcular. Todas las ubicaciones están en estado INCOMPLETA.",
  "details": {
    "ubicacionesIncompletas": [1, 2, 3]
  }
}
```

---

### GET /api/v1/catalogs/agents
**Descripción**: Retorna la lista de agentes disponibles. Actúa como proxy hacia `Plataforma-core-ohs`.  
**Módulo**: `catalog`  
**Auth requerida**: No

#### Query Parameters
| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `q` | `string` | No | Filtro por nombre o código. Sin mínimo de caracteres. |

#### Response 200
```typescript
interface GetAgentsResponse {
  data: Agente[];
  total: number;
}

interface Agente {
  id:     string;
  nombre: string;
  codigo: string;
}
```

**Ejemplo**:
```json
{
  "data": [
    { "id": "AGT-001", "nombre": "Juan Pérez", "codigo": "JP001" },
    { "id": "AGT-002", "nombre": "María López", "codigo": "ML002" }
  ],
  "total": 2
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

---

### GET /api/v1/catalogs/subscribers
**Descripción**: Retorna la lista de suscriptores disponibles. Proxy hacia `Plataforma-core-ohs`.  
**Módulo**: `catalog`  
**Auth requerida**: No

#### Query Parameters
| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `q` | `string` | No | Filtro por nombre o código. |

#### Response 200
```typescript
interface GetSubscribersResponse {
  data: Suscriptor[];
  total: number;
}

interface Suscriptor {
  id:     string;
  nombre: string;
  codigo: string;
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

---

### GET /api/v1/catalogs/giros
**Descripción**: Retorna la lista de giros económicos disponibles. Proxy hacia `Plataforma-core-ohs`.  
**Módulo**: `catalog`  
**Auth requerida**: No

#### Query Parameters
| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `q` | `string` | No | Filtro por nombre o código. |

#### Response 200
```typescript
interface GetGirosResponse {
  data: Giro[];
  total: number;
}

interface Giro {
  id:            string;
  nombre:        string;
  claveIncendio: string | null;  // null si el giro no tiene tarifa de incendio asociada
}
```

**Ejemplo**:
```json
{
  "data": [
    { "id": "GIR-015", "nombre": "Comercio al por menor de abarrotes", "claveIncendio": "INC-03" },
    { "id": "GIR-099", "nombre": "Almacenamiento de sustancias peligrosas", "claveIncendio": null }
  ],
  "total": 2
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

---

### GET /api/v1/catalogs/postal-codes/:cp
**Descripción**: Valida y retorna la información de un código postal. Proxy hacia `Plataforma-core-ohs`. Mínimo 3 caracteres en `:cp` para activar la búsqueda.  
**Módulo**: `catalog`  
**Auth requerida**: No

#### Parámetro de ruta `:cp`
- Tipo: `string`
- Mínimo: 3 caracteres
- Ejemplo: `06600`

#### Response 200 — Código postal válido
```typescript
interface GetPostalCodeResponse {
  data: {
    codigoPostal: string;
    municipio:    string;
    estado:       string;
    pais:         string;
  };
}
```

**Ejemplo**:
```json
{
  "data": {
    "codigoPostal": "06600",
    "municipio": "Cuauhtémoc",
    "estado": "Ciudad de México",
    "pais": "México"
  }
}
```

#### Errores posibles
| Código | `error` | Condición |
|---|---|---|
| `400` | `ValidationError` | `:cp` tiene menos de 3 caracteres |
| `404` | `QuoteNotFound` | No aplica — usar `ExternalValidationError` si CP no existe |
| `422` | `ExternalValidationError` | El código postal no existe en el catálogo core-ohs |
| `503` | `CatalogServiceUnavailable` | core-ohs no disponible |

**Nota**: Si el CP no existe en core-ohs, la respuesta es `422 ExternalValidationError`, no `404`, para distinguir la ausencia de un recurso externo de un recurso propio del sistema.

---

## Modelos de Datos Afectados

| Entidad | Cambios | Descripción |
|---|---|---|
| `Quote` | Sin cambios estructurales | Esta spec documenta los contratos existentes |
| `Location` | Sin cambios estructurales | Esta spec documenta los contratos existentes |

> Ver SPEC-003 para el modelo de datos completo.

---

## Frontend — Servicios API

### Servicios a implementar

| Función | Archivo | Endpoint |
|---|---|---|
| `createQuote()` | `features/quotes/services/quoteApi.ts` | `POST /api/v1/quotes` |
| `patchGeneralData(folio, data)` | `features/quotes/services/quoteApi.ts` | `PATCH /api/v1/quotes/:folio/general-data` |
| `getQuote(folio)` | `features/quotes/services/quoteApi.ts` | `GET /api/v1/quotes/:folio` |
| `getCoverageOptions(folio)` | `features/quotes/services/quoteApi.ts` | `GET /api/v1/quotes/:folio/coverage-options` |
| `putCoverageOptions(folio, data)` | `features/quotes/services/quoteApi.ts` | `PUT /api/v1/quotes/:folio/coverage-options` |
| `calculatePremium(folio, version)` | `features/quotes/services/quoteApi.ts` | `POST /api/v1/quotes/:folio/calculate` |
| `postLayout(folio, data)` | `features/locations/services/locationApi.ts` | `POST /api/v1/quotes/:folio/layout` |
| `getLocations(folio)` | `features/locations/services/locationApi.ts` | `GET /api/v1/quotes/:folio/locations` |
| `putLocations(folio, data)` | `features/locations/services/locationApi.ts` | `PUT /api/v1/quotes/:folio/locations` |
| `patchLocation(folio, index, data)` | `features/locations/services/locationApi.ts` | `PATCH /api/v1/quotes/:folio/locations/:index` |
| `getAgents(q?)` | `features/quotes/services/catalogApi.ts` | `GET /api/v1/catalogs/agents` |
| `getSubscribers(q?)` | `features/quotes/services/catalogApi.ts` | `GET /api/v1/catalogs/subscribers` |
| `getGiros(q?)` | `features/quotes/services/catalogApi.ts` | `GET /api/v1/catalogs/giros` |
| `validatePostalCode(cp)` | `features/quotes/services/catalogApi.ts` | `GET /api/v1/catalogs/postal-codes/:cp` |

### Manejo de errores en el frontend

El cliente Axios (`shared/apiClient.ts`) debe interceptar las respuestas de error y normalizar el `ErrorResponse` antes de propagarlo a los hooks de TanStack Query:

- `409 VersionConflict`: invalidar la query del folio y relanzar la operación con la versión actualizada, o notificar al usuario.
- `503 CatalogServiceUnavailable`: mostrar banner de error global "Servicio de catálogos no disponible temporalmente."
- `422 ExternalValidationError`: mostrar el mensaje de error junto al campo del formulario correspondiente.
- `500 InternalServerError`: mostrar mensaje genérico sin exponer detalles técnicos.

---

## Reglas de Negocio

1. El campo `version` es **obligatorio** en todos los endpoints de escritura (`POST layout`, `PATCH general-data`, `PUT locations`, `PATCH location/:index`, `PUT coverage-options`, `POST calculate`). Omitirlo retorna `400 MissingRequiredField`.
2. Los errores de infraestructura (stack traces, mensajes de BD) nunca deben incluirse en el body de respuesta pública.
3. Los catálogos (`agents`, `subscribers`, `giros`, `postal-codes`) son de **solo lectura** — nunca escribir en `Plataforma-core-ohs`.
4. Si `Plataforma-core-ohs` retorna un error 5xx, el backend lo traduce siempre a `503 CatalogServiceUnavailable` con mensaje descriptivo, sin exponer el error interno.
5. El `id` técnico de las tablas (`quotes.id`, `locations.id`) **nunca** se expone en los contratos públicos. Solo se usa `numeroFolio` e `indiceUbicacion` como identificadores de negocio.
6. Modificar coberturas después de un cálculo previo **invalida** el resultado: `primasPorUbicacion` se limpia y se refleja en `calculoInvalidado: true` en la respuesta.
7. El cálculo excluye automáticamente las ubicaciones `INCOMPLETA` y las lista en `ubicacionesExcluidas`. No es un error; es comportamiento esperado del dominio.

---

## Plan de Pruebas Unitarias

### Backend — Controllers

- [ ] `QuoteController_POST_returns_201_on_new_folio` — POST /quotes retorna 201 con estructura esperada
- [ ] `QuoteController_POST_returns_200_on_existing_folio` — Idempotencia: folio duplicado retorna 200
- [ ] `QuoteController_POST_returns_503_when_core_unavailable` — core-ohs down retorna 503
- [ ] `QuoteController_PATCH_generalData_returns_200_valid_payload` — PATCH datos generales exitoso
- [ ] `QuoteController_PATCH_generalData_returns_400_invalid_rfc` — RFC inválido retorna 400 con field
- [ ] `QuoteController_PATCH_generalData_returns_400_invalid_dates` — `vigenciaFin` ≤ `vigenciaInicio` retorna 400
- [ ] `QuoteController_PATCH_generalData_returns_409_version_conflict` — versión errónea retorna 409 con expectedVersion/currentVersion
- [ ] `QuoteController_PATCH_generalData_returns_422_agent_not_in_catalog` — agente inexistente retorna 422
- [ ] `QuoteController_GET_quote_returns_200_with_full_state` — GET folio retorna objeto completo
- [ ] `QuoteController_GET_quote_returns_404_not_found` — folio inexistente retorna 404
- [ ] `QuoteController_PUT_coverageOptions_returns_422_deselect_mandatory` — cobertura obligatoria retorna 422
- [ ] `QuoteController_POST_calculate_returns_422_no_valid_locations` — sin ubicaciones completas retorna 422
- [ ] `QuoteController_POST_calculate_returns_422_no_coverage_selected` — sin coberturas retorna 422

### Backend — Controllers (Locations)

- [ ] `LocationController_POST_layout_returns_200_valid_range` — layout 1-50 retorna 200
- [ ] `LocationController_POST_layout_returns_400_out_of_range` — `numeroUbicaciones` > 50 retorna 400
- [ ] `LocationController_GET_locations_returns_200_with_summary` — listado incluye resumen completas/incompletas
- [ ] `LocationController_PUT_locations_returns_409_version_conflict` — versión errónea retorna 409
- [ ] `LocationController_PATCH_location_returns_404_index_not_found` — índice fuera de layout retorna 404
- [ ] `LocationController_PATCH_location_returns_400_invalid_suma_asegurada` — suma ≤ 0 retorna 400

### Backend — Controllers (Catalogs)

- [ ] `CatalogController_GET_agents_returns_200` — proxy exitoso retorna lista de agentes
- [ ] `CatalogController_GET_agents_returns_503_when_core_down` — core-ohs down retorna 503
- [ ] `CatalogController_GET_postalCode_returns_422_not_found_in_core` — CP inexistente retorna 422
- [ ] `CatalogController_GET_postalCode_returns_400_too_short` — CP < 3 chars retorna 400

### Backend — Services

- [ ] `PremiumService_calculate_excludes_incomplete_locations` — ubicaciones INCOMPLETA excluidas del cálculo
- [ ] `PremiumService_calculate_result_is_idempotent` — mismo input produce mismo resultado
- [ ] `PremiumService_calculate_invalidates_previous_result_on_coverage_change` — cambio de coberturas limpia resultado
- [ ] `ExternalCoreService_returns_503_on_timeout` — timeout de core-ohs propagado como 503

### Frontend — Services

- [ ] `quoteApi_createQuote_calls_POST_quotes` — verifica método y path correctos
- [ ] `quoteApi_patchGeneralData_sends_version_in_body` — versión incluida en payload
- [ ] `locationApi_patchLocation_handles_409_and_retries_with_new_version` — manejo de conflicto de versión
- [ ] `catalogApi_getAgents_with_query_param` — parámetro `q` enviado en query string

---

## Dependencias

- Esta spec depende de SPEC-003 (Modelo de Datos) para las definiciones de estructuras JSONB.
- La autenticación de endpoints está pendiente de una spec dedicada — actualmente `Auth requerida: No` en todos los endpoints.
- Los campos de tarifa y desglose del cálculo (`desglose`) son extensibles conforme al catálogo de tarifas de `Plataforma-core-ohs`; se usa `[componente: string]: number` para soportar claves dinámicas.

---

## Notas de Implementación

1. **Versionado de la API**: todos los endpoints bajo `/api/v1/`. Futuras versiones usarán `/api/v2/`.
2. **Anti-corruption layer**: `ExternalCoreService` nunca expone el contrato interno de `Plataforma-core-ohs` al frontend. Si core-ohs cambia su esquema, solo `ExternalCoreService` debe actualizarse.
3. **`version` en writes**: el backend debe validar la versión al inicio del handler, antes de cualquier operación de escritura, para fallar rápido ante conflictos.
4. **Errores de infraestructura**: el middleware `errorHandler` debe capturar cualquier excepción no manejada y retornar siempre `500 InternalServerError` con mensaje genérico, sin stack trace.
5. **Tipos TypeScript**: todos los esquemas de request/response definidos en esta spec deben implementarse como interfaces TypeScript en `src/types/` (backend) y en `src/features/<feature>/types/` (frontend). Prohibido usar `any`.
6. **Idempotencia del cálculo**: `POST /calculate` con los mismos datos produce el mismo resultado. El backend no debe crear nuevos registros; actualiza `primas_por_ubicacion` en la cotización existente dentro de una transacción atómica.
7. **`calculoInvalidado`**: el frontend debe interpretar `calculoInvalidado: true` en la respuesta de `PUT /coverage-options` como señal para navegar al paso de cálculo o mostrar una advertencia al usuario.
