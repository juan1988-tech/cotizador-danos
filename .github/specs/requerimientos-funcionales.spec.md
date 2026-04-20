# Spec: Requerimientos Funcionales del Sistema de Cotización de Seguros de Daños

## Metadata
- **ID**: SPEC-001
- **Fecha**: 2026-04-17
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Versión**: 1.0.0

---

## Descripción

El sistema de cotización de seguros de daños (`cotizador-danos`) permite a un agente registrar y calcular el costo de un seguro de daños a través de un flujo multi-paso guiado. El agente completa los datos generales del asegurado, configura las ubicaciones de riesgo, selecciona las opciones de cobertura y obtiene el desglose de prima neta y prima comercial por ubicación.

---

## Requerimiento de Negocio

Desarrollar un sistema que permita a un agente de seguros generar una cotización de daños de manera digital, capturando datos generales del asegurado, múltiples ubicaciones de riesgo con sus giros y garantías, seleccionando coberturas aplicables, y obteniendo el cálculo de prima neta y comercial desglosado por ubicación y cobertura. El sistema debe integrarse con el servicio externo `Plataforma-core-ohs` para obtener catálogos (agentes, suscriptores, giros, códigos postales, folios y tarifas).

---

## User Stories

### US-001 — Inicio de cotización (obtención de folio)
**Como** agente de seguros,  
**quiero** obtener un folio único para una nueva cotización,  
**para** identificar y continuar el proceso de cotización en cualquier momento.

**Criterios de aceptación:**
- CA-001.1: El sistema debe solicitar y reservar un `numeroFolio` al servicio externo `Plataforma-core-ohs`.
- CA-001.2: El folio debe ser único e irrepetible dentro del sistema.
- CA-001.3: Si el folio ya existe en el sistema, el endpoint debe ser idempotente y retornar la cotización existente sin crear un duplicado.
- CA-001.4: El folio generado debe quedar en estado `EN_EDICION`.
- CA-001.5: La respuesta debe incluir `numeroFolio`, `estadoCotizacion` y `fechaCreacion`.

---

### US-002 — Captura de datos generales
**Como** agente de seguros,  
**quiero** ingresar los datos generales del asegurado y del contrato,  
**para** identificar al cliente, el agente responsable y el tipo de negocio asegurado.

**Criterios de aceptación:**
- CA-002.1: Los campos obligatorios son: `nombreAsegurado`, `rfcAsegurado`, `agenteId`, `suscriptorId`, `tipoNegocio`, `giroId`, `vigenciaInicio`, `vigenciaFin`.
- CA-002.2: `vigenciaFin` debe ser posterior a `vigenciaInicio`; de lo contrario retornar `400` con mensaje descriptivo.
- CA-002.3: `agenteId` y `suscriptorId` deben existir en el catálogo de `Plataforma-core-ohs`; si no, retornar `422`.
- CA-002.4: `rfcAsegurado` debe cumplir formato RFC mexicano (12 caracteres para personas morales, 13 para físicas).
- CA-002.5: Los datos se guardan de forma parcial (PATCH); los campos no enviados no se modifican.
- CA-002.6: Al guardar, `estadoCotizacion` pasa a `DATOS_GENERALES_COMPLETOS` si todos los campos obligatorios están presentes.
- CA-002.7: La respuesta incluye el objeto completo de datos generales actualizado junto con la versión del registro (`version`).

---

### US-003 — Configuración del layout de ubicaciones
**Como** agente de seguros,  
**quiero** definir cuántas ubicaciones y con qué estructura se registrarán,  
**para** preparar la plantilla de captura de riesgos del asegurado.

**Criterios de aceptación:**
- CA-003.1: El layout debe especificar: `numeroUbicaciones` (1–50), `tipoLayout` (`UNIFORME` | `PERSONALIZADO`).
- CA-003.2: Si `tipoLayout` es `UNIFORME`, todas las ubicaciones comparten la misma estructura de garantías.
- CA-003.3: Si `tipoLayout` es `PERSONALIZADO`, cada ubicación puede tener garantías distintas.
- CA-003.4: `numeroUbicaciones` mínimo es 1; máximo es 50; fuera de rango retorna `400`.
- CA-003.5: Al guardar el layout, el sistema inicializa las ubicaciones vacías correspondientes.
- CA-003.6: Si ya existe un layout previo y se modifica `numeroUbicaciones`, el sistema ajusta las ubicaciones (agrega o elimina por el final) conservando las ya capturadas.
- CA-003.7: La respuesta incluye la `configuracionLayout` guardada.

---

### US-004 — Captura y edición de ubicaciones de riesgo
**Como** agente de seguros,  
**quiero** registrar los datos de cada ubicación de riesgo (dirección, giro, sumas aseguradas y garantías),  
**para** que el sistema pueda calcular la prima correspondiente a cada bien asegurado.

**Criterios de aceptación:**
- CA-004.1: Cada ubicación debe contener: `descripcion`, `codigoPostal`, `giroId`, `garantias[]`.
- CA-004.2: `codigoPostal` debe validarse contra el catálogo de `Plataforma-core-ohs`; si no existe retornar `422`.
- CA-004.3: El `giroId` seleccionado debe tener una `claveIncendio` asociada; de lo contrario la ubicación queda en estado `INCOMPLETA` con alerta.
- CA-004.4: Cada garantía debe especificar: `tipoGarantia`, `sumaAsegurada` (número positivo mayor a 0).
- CA-004.5: `sumaAsegurada` debe ser un número positivo; si es 0 o negativo, retornar `400`.
- CA-004.6: Una ubicación sin `codigoPostal` válido, sin `giro.claveIncendio` o sin al menos una garantía tarifable queda en estado `INCOMPLETA` y genera una `alertaBloqueante`.
- CA-004.7: Una ubicación `INCOMPLETA` no impide calcular las demás ubicaciones válidas.
- CA-004.8: El endpoint de actualización masiva acepta un arreglo de ubicaciones; el de edición individual acepta una sola ubicación por índice.
- CA-004.9: La respuesta de listado incluye `estadoValidacion` por cada ubicación y el resumen total.
- CA-004.10: Al editar una ubicación, el `version` de la cotización se incrementa (optimistic locking).

---

### US-005 — Consulta del resumen de ubicaciones
**Como** agente de seguros,  
**quiero** ver el estado de todas las ubicaciones capturadas,  
**para** identificar cuáles están incompletas antes de continuar al siguiente paso.

**Criterios de aceptación:**
- CA-005.1: El resumen muestra por cada ubicación: `indice`, `descripcion`, `estadoValidacion`, `alertasBloqueantes[]`.
- CA-005.2: El resumen global indica cuántas ubicaciones están `COMPLETA` y cuántas `INCOMPLETA`.
- CA-005.3: Si todas las ubicaciones están `INCOMPLETA`, el sistema debe mostrar una advertencia general indicando que no es posible calcular.
- CA-005.4: El endpoint es de solo lectura (GET) y no modifica el estado de la cotización.

---

### US-006 — Selección de opciones de cobertura
**Como** agente de seguros,  
**quiero** seleccionar las opciones de cobertura aplicables a la cotización,  
**para** personalizar el alcance del seguro según las necesidades del cliente.

**Criterios de aceptación:**
- CA-006.1: Las opciones de cobertura disponibles provienen del endpoint `GET /v1/quotes/{folio}/coverage-options`.
- CA-006.2: Cada opción de cobertura contiene: `codigoCobertura`, `descripcion`, `seleccionada` (boolean), `obligatoria` (boolean).
- CA-006.3: Las coberturas marcadas como `obligatoria: true` no pueden ser deseleccionadas; intentarlo retorna `422`.
- CA-006.4: Al guardar, se persiste el arreglo completo de `opcionesCobertura` con su estado `seleccionada`.
- CA-006.5: Al actualizar coberturas, el `estadoCotizacion` no cambia; solo se actualiza `opcionesCobertura` y el `version`.
- CA-006.6: Si existe un cálculo previo, al modificar coberturas el sistema invalida el resultado anterior (limpia `primasPorUbicacion`).

---

### US-007 — Cálculo de prima
**Como** agente de seguros,  
**quiero** ejecutar el cálculo de prima para obtener el costo total del seguro,  
**para** presentar al cliente el desglose financiero de la cotización.

**Criterios de aceptación:**
- CA-007.1: El cálculo solo puede ejecutarse si existe al menos una ubicación en estado `COMPLETA`.
- CA-007.2: El cálculo solo puede ejecutarse si al menos una cobertura está seleccionada.
- CA-007.3: Si ninguna ubicación está completa, el endpoint retorna `422` con el mensaje "No existen ubicaciones válidas para calcular".
- CA-007.4: El resultado incluye: `primaNetaTotal`, `primaComercialTotal`, `primasPorUbicacion[]`.
- CA-007.5: Cada elemento de `primasPorUbicacion` incluye: `indiceUbicacion`, `primaNeta`, `primaComercial`, `desglose` (por componente: incendio, CAT, BI, etc.).
- CA-007.6: Las ubicaciones en estado `INCOMPLETA` se excluyen del cálculo y se listan en `ubicacionesExcluidas[]`.
- CA-007.7: Los resultados se persisten en la cotización en una única transacción atómica.
- CA-007.8: Al finalizar el cálculo, `estadoCotizacion` pasa a `CALCULADA`.
- CA-007.9: El `version` de la cotización se incrementa tras el cálculo.
- CA-007.10: El cálculo es idempotente: ejecutarlo nuevamente con los mismos datos produce el mismo resultado.

---

### US-008 — Consulta del estado de la cotización
**Como** agente de seguros,  
**quiero** consultar el estado actual de una cotización en cualquier momento,  
**para** saber en qué paso del flujo me encuentro y si puedo continuar.

**Criterios de aceptación:**
- CA-008.1: El endpoint retorna: `numeroFolio`, `estadoCotizacion`, `version`, `fechaCreacion`, `fechaUltimaActualizacion`.
- CA-008.2: Los estados posibles son: `EN_EDICION`, `DATOS_GENERALES_COMPLETOS`, `UBICACIONES_CONFIGURADAS`, `COBERTURAS_SELECCIONADAS`, `CALCULADA`.
- CA-008.3: Si el folio no existe, retorna `404`.
- CA-008.4: El endpoint es de solo lectura y no modifica el estado.

---

### US-009 — Consulta de catálogos
**Como** agente de seguros,  
**quiero** consultar agentes, suscriptores, giros, tipos de negocio y códigos postales disponibles,  
**para** seleccionar los valores correctos al llenar el formulario de cotización.

**Criterios de aceptación:**
- CA-009.1: Los catálogos disponibles son: `agentes`, `suscriptores`, `giros`, `tiposNegocio`, `codigosPostales`.
- CA-009.2: Todos los catálogos son de solo lectura y se consumen del servicio externo `Plataforma-core-ohs`.
- CA-009.3: El backend actúa como proxy; nunca expone errores internos de `Plataforma-core-ohs` al frontend.
- CA-009.4: Si `Plataforma-core-ohs` no responde, el backend retorna `503` con mensaje "Servicio de catálogos no disponible".
- CA-009.5: La búsqueda de `codigosPostales` permite filtrar por código (mínimo 3 caracteres para iniciar búsqueda).

---

## Casos de Uso Detallados

### UC-01: Iniciar cotización
- **Actor**: Agente de seguros
- **Precondición**: El agente tiene acceso al sistema.
- **Flujo principal**:
  1. El agente accede a la pantalla de nueva cotización.
  2. El sistema solicita un folio al servicio externo `Plataforma-core-ohs`.
  3. El sistema crea la cotización con `estadoCotizacion = EN_EDICION` y persiste el folio.
  4. El sistema redirige al agente al formulario de datos generales con el folio activo.
- **Flujo alternativo — folio ya existente**:
  - Si el folio ya existe, el sistema retorna la cotización existente sin crear un nuevo registro (idempotencia).
- **Flujo alternativo — `Plataforma-core-ohs` no disponible**:
  - El sistema muestra un error `503` y no avanza al siguiente paso.
- **Postcondición**: Cotización creada con folio único en estado `EN_EDICION`.

---

### UC-02: Registrar datos generales
- **Actor**: Agente de seguros
- **Precondición**: Existe una cotización con folio válido en estado `EN_EDICION`.
- **Flujo principal**:
  1. El agente completa el formulario con datos del asegurado, agente, suscriptor, tipo de negocio, giro y vigencia.
  2. El agente guarda el formulario.
  3. El sistema valida los datos (RFC, fechas, existencia de agente/suscriptor en catálogo).
  4. El sistema persiste los datos generales.
  5. `estadoCotizacion` avanza a `DATOS_GENERALES_COMPLETOS`.
  6. El sistema habilita el paso siguiente (configuración de ubicaciones).
- **Flujo alternativo — validación fallida**:
  - Si algún campo falla validación, el sistema retorna `400` / `422` con detalles del campo inválido.
  - El agente corrige y reenvía.
- **Postcondición**: Datos generales persistidos; `estadoCotizacion = DATOS_GENERALES_COMPLETOS`.

---

### UC-03: Configurar layout de ubicaciones
- **Actor**: Agente de seguros
- **Precondición**: `estadoCotizacion` es al menos `DATOS_GENERALES_COMPLETOS`.
- **Flujo principal**:
  1. El agente define cuántas ubicaciones tendrá la cotización y el tipo de layout.
  2. El sistema valida que `numeroUbicaciones` esté entre 1 y 50.
  3. El sistema persiste el layout e inicializa las ubicaciones vacías.
  4. El sistema muestra la lista de ubicaciones listas para ser completadas.
- **Flujo alternativo — layout ya existe**:
  - Si se modifica el número de ubicaciones hacia arriba, el sistema agrega ubicaciones vacías al final.
  - Si se reduce, el sistema elimina las últimas ubicaciones, conservando las que ya tienen datos.
- **Postcondición**: Layout persistido; ubicaciones inicializadas.

---

### UC-04: Capturar ubicación de riesgo
- **Actor**: Agente de seguros
- **Precondición**: Layout configurado con al menos una ubicación vacía.
- **Flujo principal**:
  1. El agente selecciona una ubicación de la lista.
  2. El agente ingresa: descripción, código postal, giro y garantías con sus sumas aseguradas.
  3. El sistema valida el código postal contra el catálogo.
  4. El sistema valida que el giro tenga `claveIncendio`.
  5. El sistema persiste la ubicación con `estadoValidacion = COMPLETA`.
  6. El sistema actualiza el resumen de ubicaciones.
- **Flujo alternativo — código postal inválido**:
  - El sistema retorna `422` e indica que el código postal no existe en catálogo.
  - La ubicación queda en `INCOMPLETA` con `alertaBloqueante`.
- **Flujo alternativo — giro sin claveIncendio**:
  - La ubicación se guarda como `INCOMPLETA` con alerta correspondiente.
- **Postcondición**: Ubicación persistida con su `estadoValidacion` determinado.

---

### UC-05: Seleccionar coberturas
- **Actor**: Agente de seguros
- **Precondición**: Al menos una ubicación está en estado `COMPLETA`.
- **Flujo principal**:
  1. El agente consulta las opciones de cobertura disponibles.
  2. El agente selecciona/deselecciona coberturas opcionales.
  3. El sistema valida que las coberturas obligatorias no hayan sido deseleccionadas.
  4. El sistema persiste `opcionesCobertura` con los estados actualizados.
  5. Si existía un cálculo previo, el sistema lo invalida.
- **Flujo alternativo — intento de deseleccionar cobertura obligatoria**:
  - El sistema retorna `422` indicando que la cobertura es obligatoria.
- **Postcondición**: `opcionesCobertura` actualizado; cálculo anterior invalidado si aplica.

---

### UC-06: Calcular prima
- **Actor**: Agente de seguros
- **Precondición**: Al menos una ubicación `COMPLETA` y al menos una cobertura seleccionada.
- **Flujo principal**:
  1. El agente ejecuta el cálculo desde la pantalla de resultado.
  2. El sistema verifica que existan ubicaciones válidas y coberturas seleccionadas.
  3. El sistema ejecuta `PremiumService` para cada ubicación completa.
  4. El sistema persiste los resultados en una transacción atómica.
  5. `estadoCotizacion` pasa a `CALCULADA`.
  6. El sistema muestra el desglose financiero por ubicación y el total.
- **Flujo alternativo — sin ubicaciones completas**:
  - El sistema retorna `422` con mensaje de error descriptivo.
- **Flujo alternativo — error en cálculo de una ubicación**:
  - Esa ubicación se agrega a `ubicacionesExcluidas[]` con el motivo.
  - Las demás ubicaciones se calculan normalmente.
- **Postcondición**: Primas calculadas y persistidas; `estadoCotizacion = CALCULADA`.

---

### UC-07: Consultar estado de la cotización
- **Actor**: Agente de seguros / Sistema
- **Precondición**: Existe una cotización con el folio indicado.
- **Flujo principal**:
  1. El sistema o el agente consulta `GET /v1/quotes/{folio}/state`.
  2. El sistema retorna `numeroFolio`, `estadoCotizacion`, `version`, timestamps.
- **Flujo alternativo — folio no encontrado**:
  - El sistema retorna `404`.
- **Postcondición**: Estado retornado sin modificaciones al registro.

---

## Modelos de Datos

### Entidades afectadas
| Entidad | Cambios | Descripción |
|---------|---------|-------------|
| `Quote` | Nueva | Agregado raíz que almacena el ciclo de vida de la cotización |
| `Location` | Nueva | Ubicación de riesgo asociada a una cotización |
| `Coverage` | Nueva | Opciones de cobertura persistidas en JSONB |

### Campos clave — Entidad `Quote`
| Campo | Tipo | Obligatorio | Regla |
|-------|------|-------------|-------|
| `numeroFolio` | string | sí | Único; proveniente de `Plataforma-core-ohs` |
| `estadoCotizacion` | enum | sí | `EN_EDICION` → `CALCULADA` |
| `datosAsegurado` | JSONB | sí (tras paso 1) | RFC, nombre, agente, suscriptor, vigencia |
| `configuracionLayout` | JSONB | sí (tras paso 2) | `numeroUbicaciones`, `tipoLayout` |
| `opcionesCobertura` | JSONB | sí (tras paso 3) | Arreglo de coberturas con `seleccionada` |
| `primasPorUbicacion` | JSONB | no (hasta cálculo) | Resultado del cálculo por ubicación |
| `primaNetaTotal` | decimal | no (hasta cálculo) | Suma total de primas netas |
| `primaComercialTotal` | decimal | no (hasta cálculo) | Suma total de primas comerciales |
| `parametrosCalculo` | JSONB | no | Factores globales del cálculo |
| `version` | integer | sí | Optimistic locking; gestionado por trigger de BD |
| `fechaCreacion` | timestamp | sí | Auto-generado por trigger |
| `fechaUltimaActualizacion` | timestamp | sí | Auto-actualizado por trigger |

### Campos clave — Entidad `Location`
| Campo | Tipo | Obligatorio | Regla |
|-------|------|-------------|-------|
| `numeroFolio` | string (FK) | sí | Referencia a `Quote` |
| `indice` | integer | sí | Posición dentro del layout (1-based) |
| `descripcion` | string | sí | Nombre descriptivo de la ubicación |
| `codigoPostal` | string | sí | Validado contra catálogo externo |
| `giroId` | string | sí | Debe tener `claveIncendio` en catálogo |
| `garantias` | JSONB | sí | Arreglo de `{ tipoGarantia, sumaAsegurada }` |
| `estadoValidacion` | enum | sí | `COMPLETA` \| `INCOMPLETA` |
| `alertasBloqueantes` | JSONB | no | Arreglo de alertas si `INCOMPLETA` |
| `version` | integer | sí | Optimistic locking |

---

## API Endpoints

### POST /v1/quotes
- **Descripción**: Crea una nueva cotización reservando un folio en `Plataforma-core-ohs`. Idempotente por folio.
- **Auth requerida**: no (en esta versión)
- **Request Body**: `{}` (sin body; el folio se obtiene del servicio externo)
- **Response 201**:
  ```json
  {
    "data": {
      "numeroFolio": "DAN-2026-00001",
      "estadoCotizacion": "EN_EDICION",
      "version": 1,
      "fechaCreacion": "2026-04-17T10:00:00Z"
    }
  }
  ```
- **Response 200**: folio ya existente (idempotencia)
- **Response 503**: `Plataforma-core-ohs` no disponible

---

### PUT /v1/quotes/{folio}/general-info
- **Descripción**: Guarda o actualiza los datos generales de la cotización.
- **Auth requerida**: no
- **Request Body**:
  ```json
  {
    "nombreAsegurado": "Empresa S.A. de C.V.",
    "rfcAsegurado": "EMP010101ABC",
    "agenteId": "AGT-001",
    "suscriptorId": "SUS-010",
    "tipoNegocio": "COMERCIAL",
    "giroId": "GIRO-05",
    "vigenciaInicio": "2026-05-01",
    "vigenciaFin": "2027-05-01"
  }
  ```
- **Response 200**:
  ```json
  {
    "data": {
      "numeroFolio": "DAN-2026-00001",
      "datosAsegurado": { ... },
      "estadoCotizacion": "DATOS_GENERALES_COMPLETOS",
      "version": 2
    }
  }
  ```
- **Response 400**: campos obligatorios faltantes o fechas inválidas
- **Response 404**: folio no encontrado
- **Response 422**: `agenteId` o `suscriptorId` no existen en catálogo; RFC con formato inválido

---

### GET /v1/quotes/{folio}/locations/layout
- **Descripción**: Consulta el layout de ubicaciones configurado.
- **Auth requerida**: no
- **Response 200**:
  ```json
  {
    "data": {
      "numeroFolio": "DAN-2026-00001",
      "configuracionLayout": {
        "numeroUbicaciones": 3,
        "tipoLayout": "UNIFORME"
      }
    }
  }
  ```
- **Response 404**: folio no encontrado

---

### PUT /v1/quotes/{folio}/locations/layout
- **Descripción**: Guarda o actualiza la configuración del layout de ubicaciones.
- **Auth requerida**: no
- **Request Body**:
  ```json
  {
    "numeroUbicaciones": 3,
    "tipoLayout": "UNIFORME"
  }
  ```
- **Response 200**:
  ```json
  {
    "data": {
      "configuracionLayout": { "numeroUbicaciones": 3, "tipoLayout": "UNIFORME" },
      "version": 3
    }
  }
  ```
- **Response 400**: `numeroUbicaciones` fuera de rango (< 1 o > 50)
- **Response 404**: folio no encontrado

---

### GET /v1/quotes/{folio}/locations
- **Descripción**: Obtiene la lista de ubicaciones con su estado de validación.
- **Auth requerida**: no
- **Response 200**:
  ```json
  {
    "data": {
      "ubicaciones": [
        {
          "indice": 1,
          "descripcion": "Sucursal Centro",
          "codigoPostal": "06600",
          "estadoValidacion": "COMPLETA",
          "alertasBloqueantes": []
        }
      ],
      "resumen": { "total": 3, "completas": 2, "incompletas": 1 }
    }
  }
  ```
- **Response 404**: folio no encontrado

---

### PUT /v1/quotes/{folio}/locations
- **Descripción**: Crea o actualiza ubicaciones en lote.
- **Auth requerida**: no
- **Request Body**:
  ```json
  {
    "ubicaciones": [
      {
        "indice": 1,
        "descripcion": "Sucursal Centro",
        "codigoPostal": "06600",
        "giroId": "GIRO-05",
        "garantias": [
          { "tipoGarantia": "EDIFICIO", "sumaAsegurada": 5000000 }
        ]
      }
    ]
  }
  ```
- **Response 200**: lista actualizada de ubicaciones con `estadoValidacion`
- **Response 400**: `sumaAsegurada` ≤ 0
- **Response 404**: folio no encontrado
- **Response 422**: `codigoPostal` no existe en catálogo

---

### PATCH /v1/quotes/{folio}/locations/{indice}
- **Descripción**: Edita una ubicación individual por su índice.
- **Auth requerida**: no
- **Request Body**: Igual que un elemento de `PUT /locations` pero para una sola ubicación
- **Response 200**: ubicación actualizada con `estadoValidacion`
- **Response 404**: folio o índice no encontrado
- **Response 409**: conflicto de versión (optimistic locking)

---

### GET /v1/quotes/{folio}/locations/summary
- **Descripción**: Retorna el resumen de validación de todas las ubicaciones.
- **Auth requerida**: no
- **Response 200**:
  ```json
  {
    "data": {
      "resumen": { "total": 3, "completas": 2, "incompletas": 1 },
      "ubicaciones": [
        { "indice": 1, "estadoValidacion": "COMPLETA", "alertasBloqueantes": [] },
        { "indice": 2, "estadoValidacion": "INCOMPLETA", "alertasBloqueantes": ["Sin claveIncendio en giro"] }
      ]
    }
  }
  ```
- **Response 404**: folio no encontrado

---

### GET /v1/quotes/{folio}/state
- **Descripción**: Consulta el estado actual de la cotización.
- **Auth requerida**: no
- **Response 200**:
  ```json
  {
    "data": {
      "numeroFolio": "DAN-2026-00001",
      "estadoCotizacion": "CALCULADA",
      "version": 7,
      "fechaCreacion": "2026-04-17T10:00:00Z",
      "fechaUltimaActualizacion": "2026-04-17T14:30:00Z"
    }
  }
  ```
- **Response 404**: folio no encontrado

---

### GET /v1/quotes/{folio}/coverage-options
- **Descripción**: Obtiene las opciones de cobertura disponibles para la cotización.
- **Auth requerida**: no
- **Response 200**:
  ```json
  {
    "data": {
      "coberturas": [
        { "codigoCobertura": "INC", "descripcion": "Incendio", "seleccionada": true, "obligatoria": true },
        { "codigoCobertura": "BI", "descripcion": "Interrupción de negocio", "seleccionada": false, "obligatoria": false }
      ]
    }
  }
  ```
- **Response 404**: folio no encontrado

---

### PUT /v1/quotes/{folio}/coverage-options
- **Descripción**: Guarda las opciones de cobertura seleccionadas.
- **Auth requerida**: no
- **Request Body**:
  ```json
  {
    "coberturas": [
      { "codigoCobertura": "INC", "seleccionada": true },
      { "codigoCobertura": "BI", "seleccionada": true }
    ]
  }
  ```
- **Response 200**: `opcionesCobertura` actualizado y `version` incrementado
- **Response 404**: folio no encontrado
- **Response 422**: intento de deseleccionar cobertura obligatoria

---

### POST /v1/quotes/{folio}/calculate
- **Descripción**: Ejecuta el cálculo de prima para todas las ubicaciones completas.
- **Auth requerida**: no
- **Request Body**: `{}` (sin parámetros adicionales)
- **Response 200**:
  ```json
  {
    "data": {
      "numeroFolio": "DAN-2026-00001",
      "estadoCotizacion": "CALCULADA",
      "primaNetaTotal": 125000.50,
      "primaComercialTotal": 148750.60,
      "primasPorUbicacion": [
        {
          "indiceUbicacion": 1,
          "primaNeta": 75000.00,
          "primaComercial": 89250.00,
          "desglose": {
            "incendioEdificios": 40000.00,
            "incendioContenidos": 20000.00,
            "catTev": 10000.00,
            "catFhm": 5000.00
          }
        }
      ],
      "ubicacionesExcluidas": [{ "indiceUbicacion": 2, "motivo": "Sin claveIncendio en giro" }],
      "version": 8
    }
  }
  ```
- **Response 422**: sin ubicaciones completas o sin coberturas seleccionadas
- **Response 404**: folio no encontrado

---

## Frontend

### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `NewQuotePage` | `features/quotes/pages/NewQuotePage` | `/quotes/new` | no |
| `GeneralInfoPage` | `features/quotes/pages/GeneralInfoPage` | `/quotes/:folio/general-info` | no |
| `LocationLayoutPage` | `features/locations/pages/LocationLayoutPage` | `/quotes/:folio/locations/layout` | no |
| `LocationListPage` | `features/locations/pages/LocationListPage` | `/quotes/:folio/locations` | no |
| `LocationFormPage` | `features/locations/pages/LocationFormPage` | `/quotes/:folio/locations/:indice` | no |
| `CoverageOptionsPage` | `features/coverage/pages/CoverageOptionsPage` | `/quotes/:folio/coverage-options` | no |
| `CalculationPage` | `features/calculation/pages/CalculationPage` | `/quotes/:folio/calculate` | no |

### Componentes nuevos (selección)
| Componente | Archivo | Props principales | Descripción |
|------------|---------|-------------------|-------------|
| `QuoteStepper` | `shared/components/organisms/QuoteStepper` | `currentStep, steps[]` | Indicador de progreso del flujo |
| `GeneralInfoForm` | `features/quotes/components/GeneralInfoForm` | `folio, onSubmit` | Formulario React Hook Form de datos generales |
| `LocationCard` | `features/locations/components/LocationCard` | `location, onEdit` | Tarjeta resumen de una ubicación con estado |
| `LocationForm` | `features/locations/components/LocationForm` | `indice, folio, onSave` | Formulario de captura de ubicación |
| `CoverageSelector` | `features/coverage/components/CoverageSelector` | `coberturas[], onChange` | Lista de coberturas seleccionables |
| `PremiumResults` | `features/calculation/components/PremiumResults` | `resultado` | Desglose financiero del cálculo |
| `LocationBreakdown` | `features/calculation/components/LocationBreakdown` | `primasPorUbicacion[]` | Tabla de primas por ubicación |
| `AlertBanner` | `shared/components/molecules/AlertBanner` | `alertas[], tipo` | Banner de alertas bloqueantes |

### Hooks / State
| Hook / Store | Archivo | Retorna | Descripción |
|--------------|---------|---------|-------------|
| `useQuote` | `features/quotes/hooks/useQuote` | `{ quote, isLoading, error }` | TanStack Query para datos del folio |
| `useGeneralInfo` | `features/quotes/hooks/useGeneralInfo` | `{ save, isSaving }` | Mutación para guardar datos generales |
| `useLocations` | `features/locations/hooks/useLocations` | `{ locations, summary, isLoading }` | Query de ubicaciones con resumen |
| `useLocationForm` | `features/locations/hooks/useLocationForm` | `{ save, isSaving }` | Mutación para guardar una ubicación |
| `useCoverageOptions` | `features/coverage/hooks/useCoverageOptions` | `{ coberturas, save, isSaving }` | Query + mutación de coberturas |
| `useCalculation` | `features/calculation/hooks/useCalculation` | `{ calculate, resultado, isCalculating }` | Mutación de cálculo + resultado |
| `quoteStore` | `store/quoteStore` | `{ folio, estadoCotizacion, setFolio }` | Zustand: estado global del folio activo |

### Servicios (llamadas API)
| Función | Archivo | Descripción |
|---------|---------|-------------|
| `createQuote()` | `features/quotes/services/quoteApi` | POST /v1/quotes |
| `saveGeneralInfo(folio, data)` | `features/quotes/services/quoteApi` | PUT /v1/quotes/{folio}/general-info |
| `getQuoteState(folio)` | `features/quotes/services/quoteApi` | GET /v1/quotes/{folio}/state |
| `getLocations(folio)` | `features/locations/services/locationApi` | GET /v1/quotes/{folio}/locations |
| `saveLocations(folio, data)` | `features/locations/services/locationApi` | PUT /v1/quotes/{folio}/locations |
| `updateLocation(folio, indice, data)` | `features/locations/services/locationApi` | PATCH /v1/quotes/{folio}/locations/{indice} |
| `getLocationsSummary(folio)` | `features/locations/services/locationApi` | GET /v1/quotes/{folio}/locations/summary |
| `getLayoutConfig(folio)` | `features/locations/services/locationApi` | GET /v1/quotes/{folio}/locations/layout |
| `saveLayoutConfig(folio, data)` | `features/locations/services/locationApi` | PUT /v1/quotes/{folio}/locations/layout |
| `getCoverageOptions(folio)` | `features/coverage/services/coverageApi` | GET /v1/quotes/{folio}/coverage-options |
| `saveCoverageOptions(folio, data)` | `features/coverage/services/coverageApi` | PUT /v1/quotes/{folio}/coverage-options |
| `calculatePremium(folio)` | `features/calculation/services/calculationApi` | POST /v1/quotes/{folio}/calculate |

---

## Reglas de Negocio

1. **Idempotencia de folio**: Un folio proveniente de `Plataforma-core-ohs` no puede duplicarse en el sistema; la creación es idempotente.
2. **Flujo secuencial**: El sistema habilita cada paso del flujo solo si el paso previo está completo (estadoCotizacion).
3. **Ubicación incompleta no bloquea el cálculo**: Una ubicación `INCOMPLETA` se excluye del cálculo pero no impide calcular las demás.
4. **Cálculo atómico**: Los resultados de prima (`primaNeta`, `primaComercial`, `primasPorUbicacion`) se persisten en una única transacción; no se admiten escrituras parciales.
5. **Invalidación del cálculo**: Cualquier modificación a coberturas, ubicaciones o datos de cálculo tras un resultado `CALCULADA` invalida el cálculo previo y regresa el estado a `EN_EDICION`.
6. **Cobertura obligatoria**: Las coberturas marcadas como `obligatoria: true` no pueden ser deseleccionadas por el agente.
7. **Optimistic locking**: Toda escritura sobre `Quote` y `Location` verifica la `version` del registro; en caso de conflicto retorna `409`.
8. **`version` inmutable por cliente**: El campo `version` es gestionado exclusivamente por triggers de base de datos; el cliente nunca lo envía en el body.
9. **No exponer errores internos**: Los errores de infraestructura (mensajes de base de datos, stack traces) nunca se exponen en la respuesta HTTP al frontend.
10. **Suma asegurada positiva**: Toda `sumaAsegurada` en una garantía debe ser un número mayor a 0.
11. **Catálogos solo lectura**: El backend nunca escribe en `Plataforma-core-ohs`; todos los catálogos son consultas de solo lectura.
12. **Timestamps automáticos**: `fechaCreacion` y `fechaUltimaActualizacion` son gestionados por triggers de BD; el cliente nunca los envía.

---

## Flujo de Estados de la Cotización

```
EN_EDICION
  └─► DATOS_GENERALES_COMPLETOS  (cuando todos los campos obligatorios de datos generales están presentes)
        └─► UBICACIONES_CONFIGURADAS  (cuando el layout está guardado y al menos una ubicación completa existe)
              └─► COBERTURAS_SELECCIONADAS  (cuando al menos una cobertura está seleccionada)
                    └─► CALCULADA  (cuando el cálculo de prima se ejecuta exitosamente)

Cualquier modificación posterior a CALCULADA → regresa a EN_EDICION
```

---

## Plan de Pruebas Unitarias

### Backend — Services

#### QuoteService
- [ ] `test_createQuote_returns_new_folio_on_success` — verifica que se crea la cotización y se retorna el folio
- [ ] `test_createQuote_returns_existing_quote_when_folio_exists` — verifica idempotencia
- [ ] `test_saveGeneralInfo_advances_state_when_all_fields_present` — estado avanza a `DATOS_GENERALES_COMPLETOS`
- [ ] `test_saveGeneralInfo_returns_422_when_agent_not_in_catalog` — agente inválido
- [ ] `test_saveGeneralInfo_returns_400_when_vigencia_fin_before_inicio` — fechas inválidas

#### LocationService
- [ ] `test_saveLayout_initializes_empty_locations` — layout crea ubicaciones vacías
- [ ] `test_saveLayout_returns_400_when_locations_count_out_of_range` — fuera de rango 1–50
- [ ] `test_saveLocation_sets_COMPLETA_when_all_valid` — ubicación válida → COMPLETA
- [ ] `test_saveLocation_sets_INCOMPLETA_when_postal_code_invalid` — CP inválido → INCOMPLETA
- [ ] `test_saveLocation_sets_INCOMPLETA_when_giro_has_no_claveIncendio` — giro sin tarifa → INCOMPLETA
- [ ] `test_saveLocation_returns_400_when_sumaAsegurada_is_zero` — suma asegurada inválida

#### PremiumService
- [ ] `test_calculate_returns_prima_neta_and_comercial` — cálculo exitoso para ubicación válida
- [ ] `test_calculate_excludes_incomplete_locations` — ubicaciones incompletas excluidas
- [ ] `test_calculate_returns_422_when_no_complete_locations` — sin ubicaciones válidas
- [ ] `test_calculate_returns_422_when_no_coverage_selected` — sin coberturas
- [ ] `test_calculate_persists_result_atomically` — escritura atómica de resultados

#### CoverageService
- [ ] `test_saveCoverageOptions_invalidates_previous_calculation` — cálculo previo invalidado
- [ ] `test_saveCoverageOptions_returns_422_when_mandatory_coverage_deselected` — cobertura obligatoria

### Backend — Routes (integración)
- [ ] `test_POST_quotes_returns_201_with_folio` — creación exitosa
- [ ] `test_PUT_general_info_returns_200_on_valid_data` — datos generales válidos
- [ ] `test_PUT_general_info_returns_400_on_invalid_rfc` — RFC inválido
- [ ] `test_PUT_locations_returns_422_on_invalid_postal_code` — CP inválido
- [ ] `test_POST_calculate_returns_200_with_desglose` — cálculo exitoso con desglose
- [ ] `test_POST_calculate_returns_422_when_no_valid_locations` — sin ubicaciones válidas
- [ ] `test_GET_state_returns_404_when_folio_not_found` — folio inexistente

### Frontend — Components
- [ ] `GeneralInfoForm renders all required fields` — campos obligatorios visibles
- [ ] `GeneralInfoForm shows validation error on invalid RFC` — error de RFC en campo
- [ ] `LocationCard renders estadoValidacion badge correctly` — badge COMPLETA/INCOMPLETA
- [ ] `LocationCard shows alertas when INCOMPLETA` — alertas visibles
- [ ] `CoverageSelector disables mandatory coverage checkbox` — cobertura obligatoria no editable
- [ ] `PremiumResults renders primaNetaTotal and primaComercialTotal` — totales visibles
- [ ] `LocationBreakdown renders one row per location` — una fila por ubicación

### Frontend — Hooks
- [ ] `useQuote returns loading state on mount` — estado de carga inicial
- [ ] `useQuote returns quote data on successful fetch` — datos del folio
- [ ] `useGeneralInfo calls PUT endpoint with correct payload` — payload correcto al API
- [ ] `useCalculation sets resultado after successful calculate` — resultado tras cálculo
- [ ] `useCalculation handles 422 error gracefully` — error 422 manejado sin crash

---

## Dependencias

### Paquetes nuevos
- Ninguno adicional al stack aprobado (ver `tech_stack_constraints.context.md`)

### Servicios externos
- **`Plataforma-core-ohs`** (mock): catálogos de agentes, suscriptores, giros, códigos postales, tarifas, folios. Solo lectura.

### Infraestructura
- **PostgreSQL 15+**: tablas `quotes`, `locations`, columnas JSONB, triggers para `version` y timestamps.

---

## Notas de Implementación

1. **Optimistic locking**: Implementar como `WHERE id = :id AND version = :version` en los `UPDATE`. Si 0 filas afectadas → lanzar `ConflictException (409)`.
2. **JSONB con índices GIN**: Los campos `datosAsegurado`, `opcionesCobertura`, `primasPorUbicacion` y `garantias` deben tener índices GIN en PostgreSQL para consultas eficientes.
3. **Proxy de catálogos**: `CatalogController` debe capturar cualquier error de `Plataforma-core-ohs` y retornar `503` sin exponer detalles internos.
4. **Transacción atómica en cálculo**: El `PremiumService.calculate()` debe ejecutarse dentro de una transacción TypeORM; si falla parcialmente se hace rollback completo.
5. **Invalidación del cálculo**: Implementar como un método `invalidateCalculation()` en `QuoteService` que limpia `primasPorUbicacion`, `primaNetaTotal`, `primaComercialTotal` y regresa `estadoCotizacion` a `EN_EDICION`.
6. **Validación de RFC**: Usar regex `/^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/i` para validar el formato RFC mexicano.
7. **Paginación de catálogos**: Los catálogos grandes (giros, CPs) deben soportar filtrado por query string; la búsqueda de `codigoPostal` requiere mínimo 3 caracteres.
8. **No usar `any` en TypeScript**: Todos los request/response bodies deben tener DTOs tipados con `class-validator`.
