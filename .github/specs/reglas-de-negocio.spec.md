# Spec: Reglas de Negocio — Sistema de Cotización de Seguros de Daños

## Metadata
- **ID**: SPEC-005
- **Fecha**: 2026-04-17
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Versión**: 1.0.0
- **Relacionado con**: SPEC-001 (Requerimientos Funcionales), SPEC-002 (Arquitectura), SPEC-003 (Modelo de Datos), SPEC-004 (Contratos de API)

---

## Descripción

Este documento formaliza todas las reglas de negocio del sistema `cotizador-danos` en tres dimensiones:

1. **Lógica de cálculo de primas**: fórmulas, componentes del desglose y condiciones de inclusión por ubicación.
2. **Validaciones de negocio**: reglas de integridad aplicables a cada campo y a cada operación del flujo.
3. **Flujos de estado**: máquina de estados de la cotización, transiciones permitidas y condiciones de invalidación.

Es la fuente de verdad para `PremiumService.ts`, los middlewares de validación y cualquier lógica condicional implementada en los servicios del backend.

---

## Requerimiento de Negocio

Documentar formalmente las reglas de negocio del sistema para que:
1. El agente de backend implemente `PremiumService` y las validaciones de controladores sin ambigüedad ni interpretación libre.
2. Los agentes de frontend puedan replicar validaciones en el cliente (Zod) con exactamente las mismas reglas.
3. El equipo de QA disponga de criterios verificables para diseñar casos positivos, negativos y de borde.
4. Cualquier cambio en una regla quede trazado a esta spec antes de ser implementado.

---

## Casos de Uso

### UC-01: Ejecutar cálculo de prima
- **Actor**: Sistema (`PremiumService`)
- **Precondición**: Al menos una ubicación en estado `COMPLETA`; al menos una cobertura `seleccionada: true`.
- **Flujo principal**:
  1. El servicio filtra las ubicaciones con `estado_validacion = COMPLETA`.
  2. Para cada ubicación válida, obtiene la tarifa por componente desde `Plataforma-core-ohs`.
  3. Aplica las fórmulas de prima neta por componente (ver sección 3).
  4. Convierte prima neta a prima comercial usando `parametros_calculo` (ver sección 3.3).
  5. Persiste `primas_por_ubicacion` en `quotes` en una única transacción atómica.
  6. Cambia `estado_cotizacion` a `CALCULADA`.
- **Flujo alternativo — sin ubicaciones válidas**:
  - Retorna `422 NoValidLocationsForCalculation`.
- **Flujo alternativo — sin coberturas seleccionadas**:
  - Retorna `422 NoCoverageSelected`.
- **Postcondición**: `quotes.primas_por_ubicacion` contiene el resultado financiero completo.

### UC-02: Validar datos generales
- **Actor**: Sistema (`QuoteController`)
- **Precondición**: Request `PATCH /api/v1/quotes/:folio/general-data` recibida.
- **Flujo principal**:
  1. El controller valida cada campo con las reglas de la sección 2.1.
  2. Si todos los campos obligatorios están presentes y son válidos, persiste y transiciona el estado.
  3. Si algún campo falla, retorna `400 ValidationError` o `422 ExternalValidationError` con detalle del campo.

### UC-03: Validar y clasificar ubicación
- **Actor**: Sistema (`LocationController`)
- **Precondición**: Request de creación o edición de ubicación recibida.
- **Flujo principal**:
  1. El controller valida los campos de la ubicación (sección 2.2).
  2. El servicio evalúa si la ubicación cumple los criterios mínimos para cálculo (sección 2.3).
  3. Asigna `estado_validacion = COMPLETA` o `INCOMPLETA` y genera `alertas_bloqueantes` si corresponde.

### UC-04: Evaluar transición de estado
- **Actor**: Sistema (servicio de quotes)
- **Precondición**: Una operación de escritura fue completada.
- **Flujo principal**:
  1. Al completar cada paso, el sistema evalúa las condiciones de transición (sección 4.2).
  2. Si se cumplen, actualiza `estado_cotizacion` en la misma transacción de escritura.
  3. Si no se cumplen, mantiene el estado anterior.

---

## 1. Flujos de Estado

### 1.1 Máquina de estados de la cotización

```
[EN_EDICION]
      │
      │ Condición: todos los campos obligatorios de datos_asegurado presentes y válidos
      ▼
[DATOS_GENERALES_COMPLETOS]
      │
      │ Condición: configuracion_layout guardado + todas las ubicaciones creadas
      ▼
[UBICACIONES_CONFIGURADAS]
      │
      │ Condición: al menos una cobertura con seleccionada = true guardada
      ▼
[COBERTURAS_SELECCIONADAS]
      │
      │ Condición: cálculo ejecutado con al menos una ubicación COMPLETA
      ▼
[CALCULADA]
```

### 1.2 Tabla de transiciones permitidas

| Estado actual | Evento que dispara la transición | Condición de transición | Estado resultante |
|---|---|---|---|
| `EN_EDICION` | `PATCH /general-data` exitoso | Todos los campos obligatorios de `datosAsegurado` presentes y válidos | `DATOS_GENERALES_COMPLETOS` |
| `DATOS_GENERALES_COMPLETOS` | `POST /layout` exitoso | `configuracion_layout` guardado y ubicaciones inicializadas | `UBICACIONES_CONFIGURADAS` |
| `UBICACIONES_CONFIGURADAS` | `PUT /coverage-options` exitoso | Al menos una `opcionCobertura` con `seleccionada: true` | `COBERTURAS_SELECCIONADAS` |
| `COBERTURAS_SELECCIONADAS` | `POST /calculate` exitoso | Al menos una ubicación `COMPLETA` y al menos una cobertura seleccionada | `CALCULADA` |

> **Nota**: La transición de `EN_EDICION` a `DATOS_GENERALES_COMPLETOS` puede dispararse en cualquier `PATCH /general-data`, no solo el primero. La cotización permanece en `DATOS_GENERALES_COMPLETOS` si se vuelve a editar con todos los campos obligatorios completos. Si se borra un campo obligatorio (enviándolo vacío o nulo), el estado regresa a `EN_EDICION`.

### 1.3 Reglas de retroceso de estado (invalidación)

| Operación | Estado anterior | Estado resultante tras la operación |
|---|---|---|
| Editar `datosAsegurado` borrando un campo obligatorio | Cualquiera | `EN_EDICION` |
| `PATCH /layout` con `numeroUbicaciones` diferente | `UBICACIONES_CONFIGURADAS` o posterior | Retiene estado; solo ajusta registros `locations` |
| `PUT /coverage-options` modifica coberturas | `CALCULADA` | `COBERTURAS_SELECCIONADAS` + limpia `primas_por_ubicacion` |
| `PATCH /locations/:index` edita una ubicación | `CALCULADA` | `COBERTURAS_SELECCIONADAS` + limpia `primas_por_ubicacion` |
| `PUT /locations` actualización masiva | `CALCULADA` | `COBERTURAS_SELECCIONADAS` + limpia `primas_por_ubicacion` |

> **Regla crítica**: Cualquier modificación de coberturas o ubicaciones después de que la cotización alcanzó el estado `CALCULADA` **debe invalidar el resultado previo** limpiando `primas_por_ubicacion` en la misma transacción de escritura.

### 1.4 Estados no alcanzables directamente

| Intento | Resultado |
|---|---|
| Llamar `POST /calculate` con `estado_cotizacion = EN_EDICION` | `422 InvalidQuoteStateTransition` |
| Llamar `PUT /coverage-options` con `estado_cotizacion = EN_EDICION` | `422 InvalidQuoteStateTransition` |
| Deseleccionar una cobertura marcada `obligatoria: true` | `422 ObligatoryCoberturaCantBeDeselected` |

---

## 2. Validaciones de Negocio

### 2.1 Validaciones de datos generales (`datosAsegurado`)

| Campo | Tipo | Regla | Código de error |
|---|---|---|---|
| `nombreAsegurado` | `string` | Mínimo 2 caracteres, máximo 200. No puede ser solo espacios. | `400 ValidationError` |
| `rfcAsegurado` | `string` | Debe cumplir la expresión regular `/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i`. 12 caracteres para persona moral, 13 para persona física. | `400 ValidationError` |
| `agenteId` | `string` | Debe existir en el catálogo `GET /agents` de `Plataforma-core-ohs`. | `422 ExternalValidationError` |
| `suscriptorId` | `string` | Debe existir en el catálogo `GET /subscribers` de `Plataforma-core-ohs`. | `422 ExternalValidationError` |
| `tipoNegocio` | `string` | Máximo 100 caracteres. No puede estar vacío. | `400 ValidationError` |
| `giroId` | `string` | Debe existir en el catálogo `GET /giros` de `Plataforma-core-ohs`. | `422 ExternalValidationError` |
| `vigenciaInicio` | `string` | Formato ISO 8601 `YYYY-MM-DD`. La fecha no puede ser anterior al día actual (hora UTC). | `400 ValidationError` |
| `vigenciaFin` | `string` | Formato ISO 8601 `YYYY-MM-DD`. Debe ser **estrictamente mayor** a `vigenciaInicio`. Diferencia mínima: 1 día. | `400 ValidationError` |
| `version` | `number` | Campo **obligatorio** en toda escritura. Entero positivo ≥ 1. Debe coincidir con `quotes.version` actual. Si no coincide: conflicto de versión. | `400 MissingRequiredField` / `409 VersionConflict` |

#### Regla de completitud de `datosAsegurado`
Para que `estado_cotizacion` transite a `DATOS_GENERALES_COMPLETOS`, los **ocho** campos anteriores deben estar presentes y ser válidos simultáneamente. Si alguno está ausente o es inválido, el estado se mantiene en `EN_EDICION`.

---

### 2.2 Validaciones de layout (`configuracionLayout`)

| Campo | Tipo | Regla | Código de error |
|---|---|---|---|
| `numeroUbicaciones` | `number` | Entero. Mínimo `1`, máximo `50`. Valores fraccionarios se rechazan. | `400 ValidationError` |
| `tipoLayout` | `string` | Solo acepta los valores `'UNIFORME'` o `'PERSONALIZADO'`. Cualquier otro valor es inválido. | `400 ValidationError` |

#### Regla de ajuste al modificar el layout
Si ya existen ubicaciones registradas y se modifica `numeroUbicaciones`:
- Si el nuevo valor es **mayor**: se agregan ubicaciones vacías al final, con `estado_validacion = INCOMPLETA`.
- Si el nuevo valor es **menor**: se eliminan ubicaciones desde el final. Si alguna ubicación a eliminar ya tiene datos capturados, el sistema **la elimina de todas formas** sin advertencia adicional (la UI debe confirmar esta acción con el usuario antes de enviar la request).

---

### 2.3 Validaciones de ubicación (`Location`)

#### Campos del registro de ubicación

| Campo | Tipo | Regla | Código de error |
|---|---|---|---|
| `descripcion` | `string` | Opcional. Si se provee, máximo 200 caracteres. | `400 ValidationError` |
| `codigoPostal` | `string` | Obligatorio para estado `COMPLETA`. Debe validarse contra `Plataforma-core-ohs /postal-codes/:cp`. Mínimo 3 caracteres para iniciar búsqueda. | `422 ExternalValidationError` |
| `giroId` | `string` | Obligatorio para estado `COMPLETA`. El giro seleccionado debe tener una `claveIncendio` asociada en el catálogo. Si no la tiene, la ubicación queda `INCOMPLETA`. | — (genera alerta) |
| `garantias` | `array` | Mínimo un elemento con `tarifable: true` para estado `COMPLETA`. Arreglo vacío es válido pero resulta en `INCOMPLETA`. | — (genera alerta) |

#### Campos de cada garantía

| Campo | Tipo | Regla | Código de error |
|---|---|---|---|
| `tipoGarantia` | `string` | Código de tipo de garantía. No puede estar vacío. | `400 ValidationError` |
| `sumaAsegurada` | `number` | Número **positivo mayor a 0**. Valores ≤ 0 son rechazados explícitamente. | `400 ValidationError` |
| `tarifable` | `boolean` | Indica si la garantía genera prima. El sistema lo asigna según el `tipoGarantia`; no es editable por el agente. | — |

### 2.4 Criterios de clasificación de estado de validación de ubicación

Una ubicación se clasifica como `COMPLETA` **solo si cumple los tres criterios simultáneamente**:

| # | Criterio | Causa de `INCOMPLETA` si no se cumple | Alerta generada |
|---|---|---|---|
| 1 | `codigoPostal` existe y fue validado exitosamente en `Plataforma-core-ohs` | CP ausente o no encontrado | `"Código postal no válido o no encontrado"` |
| 2 | El `giroId` seleccionado tiene `claveIncendio` no nula en el catálogo de giros | Giro sin `claveIncendio` | `"El giro seleccionado no tiene tarifa de incendio asociada"` |
| 3 | Existe al menos una garantía con `tarifable: true` y `sumaAsegurada > 0` | Sin garantías tarifables | `"La ubicación no tiene garantías tarifables para calcular"` |

> **Regla de no bloqueo**: Una ubicación `INCOMPLETA` genera `alertas_bloqueantes` pero **no impide** la ejecución del cálculo para las demás ubicaciones `COMPLETA`. Las ubicaciones `INCOMPLETA` se excluyen del cálculo y su índice se lista en `ResultadoCalculo.ubicacionesExcluidas`.

---

### 2.5 Validaciones de coberturas (`opcionesCobertura`)

| Regla | Descripción | Código de error |
|---|---|---|
| Cobertura obligatoria no deseleccionable | Si `obligatoria: true`, el campo `seleccionada` debe ser `true`. Enviar `seleccionada: false` para una cobertura obligatoria es rechazado. | `422 ObligatoryCoberturaCantBeDeselected` |
| Arreglo completo | Al actualizar coberturas, se envía y persiste el arreglo **completo** de `opcionesCobertura`. No se aceptan actualizaciones parciales por elemento individual. | `400 ValidationError` |
| Al menos una seleccionada para calcular | En el momento del cálculo, debe existir al menos una cobertura con `seleccionada: true`. | `422 NoCoverageSelected` |

---

### 2.6 Validaciones de cálculo

| Condición previa al cálculo | Descripción | Código de error |
|---|---|---|
| Al menos una ubicación `COMPLETA` | Sin ubicaciones válidas el cálculo no puede ejecutarse. | `422 NoValidLocationsForCalculation` |
| Al menos una cobertura seleccionada | Sin coberturas seleccionadas el cálculo no puede ejecutarse. | `422 NoCoverageSelected` |
| `parametros_calculo` disponibles | Los parámetros globales de cálculo deben estar provistos por `Plataforma-core-ohs /rates`. Si el servicio no responde, abortar con error de disponibilidad. | `503 CatalogServiceUnavailable` |

---

### 2.7 Validación de optimistic locking (versionado)

Aplica a **todas las operaciones de escritura** sobre `quotes` y `locations`.

| Regla | Descripción | Código de error |
|---|---|---|
| `version` obligatorio | Toda request de escritura (PATCH, PUT, POST de cálculo) debe incluir el campo `version` con el valor entero actual del registro. | `400 MissingRequiredField` |
| Coincidencia de versión | El `version` enviado debe coincidir con `quotes.version` o `locations.version` en la DB al momento de la escritura. | `409 VersionConflict` |
| Respuesta de conflicto | En caso de conflicto, la respuesta incluye `details.expectedVersion` (enviada) y `details.currentVersion` (actual en DB) para que el cliente pueda refrescar y reintentar. | — |
| No modificar `version` manualmente | La columna `version` es gestionada exclusivamente por el trigger de BD en cada `UPDATE`. Nunca incrementarla desde código de aplicación. | — |

---

## 3. Lógica de Cálculo de Primas

### 3.1 Proceso de cálculo a alto nivel

```
Para cada ubicación en estado COMPLETA:
  1. Obtener tarifa por componente (claveIncendio, zonaCatastrofica) desde Plataforma-core-ohs /rates
  2. Calcular prima neta por componente (ver sección 3.2)
  3. Sumar componentes → primaNetaUbicacion
  4. Convertir a prima comercial (ver sección 3.3)
  5. Registrar desglose en DesgloseUbicacion

Sumar primaNetaUbicacion de todas las ubicaciones → primaNetaTotal
Sumar primaComercialUbicacion de todas las ubicaciones → primaComercialTotal
```

### 3.2 Fórmula de prima neta por componente

La prima neta de cada componente (garantía) se calcula como:

$$\text{primaNeta}_{componente} = \text{sumaAsegurada} \times \text{tasa}_{componente}$$

Donde `tasa_componente` es el valor provisto por `Plataforma-core-ohs /rates` para la combinación `(claveIncendio, tipoGarantia, zonaCatastrofica)`.

#### Componentes del desglose y sus fuentes de tarifa

| Componente (`DesgloseUbicacion`) | `tipoGarantia` asociado | Fuente de tasa |
|---|---|---|
| `incendioEdificios` | `INCENDIO_EDIFICIO` | `tasa = rates.incendio[claveIncendio].edificios` |
| `incendioContenidos` | `INCENDIO_CONTENIDO` | `tasa = rates.incendio[claveIncendio].contenidos` |
| `extensionCobertura` | `EXTENSION_COBERTURA` | `tasa = rates.extension[claveIncendio]` |
| `catTev` | `CAT_TEV` | `tasa = rates.cat.tev[zonaCatastrofica]` |
| `catFhm` | `CAT_FHM` | `tasa = rates.cat.fhm[zonaCatastrofica]` |
| `remocionEscombros` | `REMOCION_ESCOMBROS` | `tasa = rates.remocion` (tasa fija) |
| `gastosExtraordinarios` | `GASTOS_EXTRAORDINARIOS` | `tasa = rates.gastosExtraordinarios` (tasa fija) |
| `perdidaRentas` | `PERDIDA_RENTAS` | `tasa = rates.rentas` (tasa fija) |
| `businessInterruption` | `BUSINESS_INTERRUPTION` | `tasa = rates.bi` (tasa fija) |
| `equipoElectronico` | `EQUIPO_ELECTRONICO` | `tasa = rates.equipoElectronico` (tasa fija) |
| `robo` | `ROBO` | `tasa = rates.robo` (tasa fija) |
| `dineroValores` | `DINERO_VALORES` | `tasa = rates.dineroValores` (tasa fija) |
| `vidrios` | `VIDRIOS` | `tasa = rates.vidrios` (tasa fija) |
| `anunciosLuminosos` | `ANUNCIOS_LUMINOSOS` | `tasa = rates.anunciosLuminosos` (tasa fija) |

> **Regla de inclusión de componente**: Un componente solo se incluye en el desglose si:
> 1. La garantía correspondiente existe en `locations.garantias` para esa ubicación, **Y**
> 2. La cobertura asociada tiene `seleccionada: true` en `quotes.opciones_cobertura`, **Y**
> 3. La garantía tiene `tarifable: true` y `sumaAsegurada > 0`.
>
> Si alguna de las tres condiciones no se cumple, el componente no se calcula y no aparece en el desglose.

### 3.3 Fórmula de conversión prima neta → prima comercial

Usando `quotes.parametros_calculo`:

$$\text{primaComercial}_{ubicacion} = \left( \text{primaNeta}_{ubicacion} \times \text{factorComercial} + \text{derecho} \right) \times (1 + \text{recargo}) \times (1 + \text{iva})$$

| Parámetro | Tipo | Descripción | Restricción |
|---|---|---|---|
| `factorComercial` | `number` | Multiplicador de conversión prima técnica → base comercial | `> 0` |
| `derecho` | `number` | Monto fijo de derecho de póliza (en pesos) | `>= 0` |
| `recargo` | `number` | Porcentaje de recargo expresado como decimal (ej. `0.05` = 5%) | `>= 0`, `<= 1` |
| `iva` | `number` | Tasa de IVA expresada como decimal (ej. `0.16` = 16%) | `>= 0`, `<= 1` |

#### Restricción de coherencia del resultado
- `primaComercial` por ubicación debe ser **≥ `primaNeta`** por ubicación.
- `primaComercialTotal` debe ser **≥ `primaNetaTotal`**.
- Todos los valores de prima se redondean a **2 decimales** (usando redondeo bancario — half-even).

### 3.4 Condiciones de exclusión del cálculo

| Condición | Acción del sistema |
|---|---|
| Ubicación con `estado_validacion = INCOMPLETA` | Se excluye del cálculo. Su índice se agrega a `ResultadoCalculo.ubicacionesExcluidas`. |
| Garantía con `tarifable: false` | Se ignora en el cálculo. No aparece en el desglose. |
| Cobertura con `seleccionada: false` | Las garantías de ese tipo se excluyen del cálculo aunque existan en la ubicación. |
| Tasa no disponible en `Plataforma-core-ohs` para la combinación `(claveIncendio, tipoGarantia)` | Se registra la prima del componente como `0` y se genera una `alertaBloqueante` en la ubicación. La ubicación pasa a `INCOMPLETA` y se excluye del cálculo. |

### 3.5 Idempotencia del cálculo

El cálculo de prima es **idempotente**: ejecutar `POST /calculate` múltiples veces con los mismos datos de ubicaciones, coberturas y `parametros_calculo` produce exactamente el mismo resultado. El estado `CALCULADA` se mantiene si se recalcula sin cambios previos.

---

## Modelos de Datos Afectados

### Entidades afectadas

| Entidad | Cambios | Descripción |
|---|---|---|
| `Quote` (tabla `quotes`) | Sin cambios estructurales | Las reglas aplican a campos existentes definidos en SPEC-003 |
| `Location` (tabla `locations`) | Sin cambios estructurales | Las reglas aplican a campos existentes definidos en SPEC-003 |

### Enums de dominio (canónicos)

```typescript
type EstadoCotizacion =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

type TipoLayout = 'UNIFORME' | 'PERSONALIZADO';

type EstadoValidacionUbicacion = 'COMPLETA' | 'INCOMPLETA';

// Códigos de error canónicos (ErrorResponse.error)
type ErrorCode =
  | 'ValidationError'
  | 'MissingRequiredField'
  | 'QuoteNotFound'
  | 'LocationNotFound'
  | 'VersionConflict'
  | 'ExternalValidationError'
  | 'ObligatoryCoberturaCantBeDeselected'
  | 'NoValidLocationsForCalculation'
  | 'NoCoverageSelected'
  | 'InvalidQuoteStateTransition'
  | 'InternalServerError'
  | 'CatalogServiceUnavailable';
```

---

## API Endpoints

> Esta spec no define nuevos endpoints. Los endpoints existentes documentados en SPEC-004 son los que aplican las reglas descritas aquí. Esta sección mapea cada regla a su endpoint de aplicación.

### Mapa regla → endpoint

| Regla | Endpoint aplicable |
|---|---|
| Validaciones de `datosAsegurado` (sección 2.1) | `PATCH /api/v1/quotes/:folio/general-data` |
| Transición `EN_EDICION → DATOS_GENERALES_COMPLETOS` | `PATCH /api/v1/quotes/:folio/general-data` |
| Validaciones de layout (sección 2.2) | `POST /api/v1/quotes/:folio/layout` |
| Transición `DATOS_GENERALES_COMPLETOS → UBICACIONES_CONFIGURADAS` | `POST /api/v1/quotes/:folio/layout` |
| Validaciones de ubicación (sección 2.3) | `PUT /api/v1/quotes/:folio/locations`, `PATCH /api/v1/quotes/:folio/locations/:index` |
| Clasificación `COMPLETA / INCOMPLETA` (sección 2.4) | `PUT /api/v1/quotes/:folio/locations`, `PATCH /api/v1/quotes/:folio/locations/:index` |
| Validaciones de coberturas (sección 2.5) | `PUT /api/v1/quotes/:folio/coverage-options` |
| Invalidación del cálculo previo | `PUT /api/v1/quotes/:folio/coverage-options`, `PUT /api/v1/quotes/:folio/locations`, `PATCH /api/v1/quotes/:folio/locations/:index` |
| Transición `UBICACIONES_CONFIGURADAS → COBERTURAS_SELECCIONADAS` | `PUT /api/v1/quotes/:folio/coverage-options` |
| Validaciones pre-cálculo (sección 2.6) | `POST /api/v1/quotes/:folio/calculate` |
| Fórmulas de cálculo (sección 3) | `POST /api/v1/quotes/:folio/calculate` |
| Transición `COBERTURAS_SELECCIONADAS → CALCULADA` | `POST /api/v1/quotes/:folio/calculate` |
| Optimistic locking (sección 2.7) | Todos los endpoints de escritura (PATCH, PUT, POST de cálculo) |

---

## Reglas de Negocio (Resumen)

### Integridad de datos
1. `rfcAsegurado` debe cumplir el regex RFC mexicano: `/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i`.
2. `vigenciaFin` debe ser estrictamente mayor a `vigenciaInicio` (diferencia mínima de 1 día).
3. `vigenciaInicio` no puede ser una fecha anterior al día actual (UTC).
4. `sumaAsegurada` en una garantía debe ser un número positivo estrictamente mayor a 0.
5. `numeroUbicaciones` debe ser un entero entre 1 y 50 inclusive.

### Integridad referencial externa (core-ohs)
6. `agenteId`, `suscriptorId` y `giroId` en `datosAsegurado` deben existir en `Plataforma-core-ohs`.
7. `codigoPostal` de cada ubicación debe ser validado contra `Plataforma-core-ohs`.
8. El `giroId` de una ubicación debe tener `claveIncendio` en el catálogo de giros; si no, la ubicación es `INCOMPLETA`.

### Integridad del cálculo
9. El cálculo solo puede ejecutarse con al menos una ubicación `COMPLETA` y al menos una cobertura seleccionada.
10. Una ubicación `INCOMPLETA` se excluye del cálculo pero no bloquea el cálculo de las demás.
11. `primaComercial` por ubicación debe ser siempre ≥ `primaNeta` por ubicación.
12. Los resultados de prima se redondean a 2 decimales con redondeo bancario (half-even).
13. `primaNeta`, `primaComercial` y `primasPorUbicacion` se persisten en una única transacción atómica.

### Integridad de estado
14. Las coberturas marcadas `obligatoria: true` no pueden tener `seleccionada: false`.
15. Modificar coberturas o ubicaciones después de `CALCULADA` invalida el resultado previo (limpia `primas_por_ubicacion` y retrocede a `COBERTURAS_SELECCIONADAS`).
16. La columna `version` es gestionada exclusivamente por trigger de BD; nunca modificarla desde código de aplicación.
17. Toda operación de escritura debe incluir el campo `version`; la discrepancia retorna `409 VersionConflict`.

---

## Plan de Pruebas Unitarias

### Backend — `PremiumService`

#### Happy paths
- [ ] `calcularPrima_ubicacionCompleta_retornaPrimaNetaYComercialCorrectos` — una ubicación con incendio + CAT TEV, valida fórmulas y desglose
- [ ] `calcularPrima_multipleUbicaciones_sumaTotalEsCorrecta` — tres ubicaciones completas, verifica `primaNetaTotal` y `primaComercialTotal`
- [ ] `calcularPrima_algunasUbicacionesIncompletas_excluyeIncompletas` — mix COMPLETA/INCOMPLETA, verifica `ubicacionesExcluidas`
- [ ] `calcularPrima_coberturaNOSeleccionada_ignoraComponenteEnDesglose` — garantía presente pero cobertura `seleccionada: false`, componente no aparece
- [ ] `calcularPrima_idempotente_mismoResultadoEnSegundaEjecucion` — mismos datos, mismo resultado

#### Error paths
- [ ] `calcularPrima_sinUbicacionesCompletas_lanza422` — todas las ubicaciones `INCOMPLETA`
- [ ] `calcularPrima_sinCoberturasSeleccionadas_lanza422` — `opcionesCobertura` todas `seleccionada: false`
- [ ] `calcularPrima_coreOhsNoDisponible_lanza503` — `ExternalCoreService` lanza error de red

#### Edge cases
- [ ] `calcularPrima_sumaAseguradaMinima_retornaPrimaPositiva` — `sumaAsegurada = 0.01`, prima neta > 0
- [ ] `calcularPrima_factorComercialUno_primaComercialIgualNeta` — `factorComercial = 1, derecho = 0, recargo = 0, iva = 0`
- [ ] `calcularPrima_redondeoHalfEven_aplicaCorrectamente` — resultado con decimales que requieren redondeo bancario

---

### Backend — Lógica de validación (servicio/controller)

#### Validaciones de `datosAsegurado`
- [ ] `validarDatosGenerales_rfcPersonaMoral12Chars_valido`
- [ ] `validarDatosGenerales_rfcPersonaFisica13Chars_valido`
- [ ] `validarDatosGenerales_rfcFormatoInvalido_retorna400`
- [ ] `validarDatosGenerales_vigenciaFinMenorInicio_retorna400`
- [ ] `validarDatosGenerales_vigenciaInicioEnPasado_retorna400`
- [ ] `validarDatosGenerales_agenteNoExisteEnCore_retorna422`
- [ ] `validarDatosGenerales_todosLosCamposCompletos_transicionaEstado`

#### Validaciones de ubicación
- [ ] `validarUbicacion_sinCodigoPostal_clasificaIncompleta`
- [ ] `validarUbicacion_codigoPostalInvalidoEnCore_clasificaIncompleta`
- [ ] `validarUbicacion_giroSinClaveIncendio_clasificaIncompleta`
- [ ] `validarUbicacion_sinGarantiasTarifables_clasificaIncompleta`
- [ ] `validarUbicacion_sumaAseguradaCero_retorna400`
- [ ] `validarUbicacion_sumaAseguradaNegativa_retorna400`
- [ ] `validarUbicacion_criteriosCompletosOk_clasificaCompleta`

#### Validaciones de coberturas
- [ ] `validarCoberturas_intentaDeseleccionarObligatoria_retorna422`
- [ ] `validarCoberturas_todasDeseleccionadas_permiteGuardar`

#### Transiciones de estado
- [ ] `transicionEstado_camposObligatoriosCompletos_avanzaADatosGeneralesCompletos`
- [ ] `transicionEstado_borraUnCampoObligatorio_retrocededAEnEdicion`
- [ ] `transicionEstado_calculado_editarUbicacion_limpiaResultadoYRetrocede`
- [ ] `transicionEstado_calculado_editarCoberturas_limpiaResultadoYRetrocede`

#### Optimistic locking
- [ ] `optimisticLocking_versionCorrecta_escrituraExitosa`
- [ ] `optimisticLocking_versionIncorrecta_retorna409ConDetalles`
- [ ] `optimisticLocking_versionAusente_retorna400`

---

### Frontend — Zod schemas (validación en cliente)

- [ ] `rfcSchema_personaMoral_valido`
- [ ] `rfcSchema_personaFisica_valido`
- [ ] `rfcSchema_formatoInvalido_arrojaError`
- [ ] `vigenciaSchema_finMenorInicio_arrojaError`
- [ ] `sumaAseguradaSchema_cero_arrojaError`
- [ ] `sumaAseguradaSchema_negativa_arrojaError`
- [ ] `numeroUbicacionesSchema_mayorDe50_arrojaError`
- [ ] `coberturaSchema_obligatoriaDeseleccionada_arrojaError`

---

## Dependencias

| Dependency | Tipo | Descripción |
|---|---|---|
| SPEC-001 | Requerimiento previo | User Stories US-002 a US-007 que originan estas reglas |
| SPEC-002 | Requerimiento previo | Arquitectura y ADRs que fundamentan las decisiones de diseño |
| SPEC-003 | Requerimiento previo | Modelos de datos y estructuras JSONB sobre los que operan las reglas |
| SPEC-004 | Requerimiento previo | Contratos de API que exponen los endpoints donde se aplican las validaciones |
| `PremiumService.ts` | Implementación | Debe implementar las fórmulas de la sección 3 |
| `validateRequest.ts` | Implementación | Debe aplicar las validaciones de la sección 2 como middleware |
| `Plataforma-core-ohs` | Servicio externo | Provee tarifas (`/rates`), validación de catálogos y `parametros_calculo` |

---

## Notas de Implementación

1. **Redondeo bancario (half-even)**: usar `Math.round` estándar no es suficiente para redondeo half-even. Implementar una función utilitaria `roundHalfEven(value: number, decimals: number): number` en `utils/helpers.ts`.
2. **Conversión prima neta → comercial**: el `derecho` es un monto fijo que se suma **antes** de aplicar recargo e IVA, no después. El orden de la fórmula es crítico para el resultado correcto.
3. **Validación de RFC**: el regex `/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i` aplica tanto en backend (class-validator) como en frontend (Zod). Compartir la constante de regex en un paquete o archivo compartido para evitar divergencia.
4. **Invalidación del cálculo**: la limpieza de `primas_por_ubicacion` y el retroceso de `estado_cotizacion` deben ocurrir en la **misma transacción de escritura** que la modificación que disparó la invalidación. No separar en dos operaciones.
5. **`parametros_calculo` en el momento del cálculo**: obtener siempre los parámetros frescos de `Plataforma-core-ohs /rates` al ejecutar `POST /calculate`. No reutilizar parámetros cacheados de ejecuciones anteriores.
6. **Ubicación excluida vs. ubicación con error**: una ubicación `INCOMPLETA` se excluye silenciosamente del cálculo. Solo se reporta en `ubicacionesExcluidas`. No lanzar error 422 por ubicaciones incompletas si hay al menos una válida.
