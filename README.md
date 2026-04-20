# Reto AI center

## Objetivo

Construir una solución funcional para un cotizador de daños que permita capturar un folio, registrar información general, administrar ubicaciones de riesgo, calcular la prima neta comercial, y mostrar el resultado en una interfaz web

## 🎯 Resumen Ejecutivo

**Proyecto**: Sistema de cotización de seguros de daños  
**Stack**: React + TypeScript + Tailwind / Node + Express + PostgreSQL  
**Metodología**: ASSD (obligatorio)  
**Fecha límite**: 21 de abril de 2026, 5:00 PM  

---

## Investigación y Especificación ASSD

### 🔍 Actividades principales

#### 1. Metodología ASSD y estrategia de IA

### Definición de estrategia IA

Para el caso de de este proyecto se adoptó la metodología **ASDD** basada en una orquestación de agentes, bajo el contexto de la propuesta oficial de **Sofka IA center**. De igual forma se generó un [plan de trabajo](/plan.md)

A partir del repositorio oficial se obtiene la siguiente estructura

```file
.github/
├── README.md                        ← este archivo
├── AGENTS.md                        ← reglas críticas para todos los agentes
├── copilot-instructions.md          ← siempre activo en Copilot Chat
│
├── agents/                          ← Conjunto que usan modelos LLM para la ejecución de instrucciones complejas 
│
├── skills/                          ← Set de instrucciones para dotar al modelo de capacidades especificas
│
├── prompts/                         ← Prompts customizados para la elaboración de procesos recurrentes
│
├── instructions/                    ← Instrucciones de alto nivel que ayudan al modelo a tomar mejores desiciones
│
├── specs/                           ← documentos de especificación ténica orientados a guiar el desarrollo
│   
└── docs/                            ← documentos definitorios de las limitaciones y alcance de los modelos
```

#### 2. Análisis del dominio de negocio

## Reglas de negocio críticas

La implementación debe respetar las siguientes reglas

- la cotización se identifica por **numeroFolio**
- el backend debe persistir la cotización como agregado principal
- las escrituras deben hacerse por actualización parcial
- al editar secciones funcionales, debe incrementarse la **versión**
- debe actualizarse **fechaUltimaActualizacion**
- el calculo debe guardar **primaNeta, primaComercial y primasPorUbicacion** en una misma operación lógica
- si una ubicación está incompleta, esta ubicación genera alerta, pero no debe impedir calcular las demás
- una ubicación no debe calcularse si no tiene código postal válido,**giro.claveIncendio** o garantías tarifables

### Dominio mínimo esperado

#### Cotización

La cotización debe contemplar, como mínimo:

- numeroFolio
- estadoCotizacion
- datosAsegurado
- datos Conduccion.código Agente
- clasificacionRiesgo
- tipoNegocio
- configuracionLayout
- opcionesCobertura
- ubicaciones[]
- primaNeta
- primaComercial
- primasPorUbicacion[]
- versión
- metadato

Cada ubicación debe incluir al menos:

- índice
- nombreUbicacion
- direccion
- codigoPostal
- estado
- municipio
- colonia
- ciudad
- tipoConstructivo
- nivel
- anioConstruccion
- giro
- giro.claveIncendio
- garantías[]
- zonaCatastrofica
- alertasBloqueantes
- estadoValidacion

#### Integración con servicios de referencia

El backend debe consumir o simular las siguientes capacidades del servicio core:

- catálogo de suscriptores
- consulta de agente por clave
- consulta de giros
- validación y consulta de código postal
- generación secuencial de folio
- consulta de catálogos de clasificación de riesgo y garantías
- consulta de tarifas y factores técnicos

--

#### 3. SPECS (con apoyo de IA)

Los SPECS  son documentos estructurados que definen exactamente qué debe hacer el software. A diferencia de la documentación tradicional, en esta metodología son legibles por máquinas, permitiendo que agentes de IA generen el código directamente a partir de ellos.

Para el cumplimiento de esta prueba técnica se han comtemplado 6 SPECS, las cuales son la **fuente de la verdad** que guían toda desición ténica implementada en el desarrollo de esta prueba


| **SPEC** | **Descripción** | **Link** |
| :--- | :--- | :--- |
| **Arquitectura de Alto Nivel** | Guía las decisiones del modelo a partir de la definición de registros de decisiones arquitectónicas (ADRs). | [Arquitectura de Alto Nivel](#) |
| **Modelo de Datos** | Conjunto de especificaciones para el modelo de datos, considerando las restricciones y validaciones propias de PostgreSQL. | [Modelo de Datos](#) |
| **Reglas de Negocio** | Especificaciones para el cumplimiento de las reglas planteadas: creación de folio, persistencia y cálculo de prima neta, comercial y por ubicación. | [Reglas de Negocio](#) |
| **API** | Conjunto de especificaciones para la conexión de la API CRUD con un tipado fuerte en TypeScript. | [Reglas de API](#) |
| **SPEC de Pruebas** | Establece la pirámide de testing, herramientas por capa, catálogo de casos de prueba y métricas de cobertura esperadas. | [SPEC de Pruebas](#) |


## Diseño de Arquitectura

### Reglas para el backend

- Crear folios con idempotencia
- Consultar y guardar datos generales de una cotización
- Consultar y guardar la configuración del Layout de ubicaciones
- Registrar, consultar y editar ubicaciones
- Consultar el estado de la cotización
- Consultar guardado y opciones de cobertura
- Ejecutar el guardado de la prima neta y prima comercial
- Persistir el resultado financiero sin sobreescribir otras opciones de cotización
- Manejar versionado optimista en operaciones de edició

### Arquitectura Backend

**Enfoque**: Arquitectura de Modelo Vista Controlador (MVC) con **Express** para efectuar la interacción con la API, **Node.js** para configurar el servidor y **Typescript** para un tipado fuerte en el backend

```typescript
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

### Reglas para el Frontend

Implementar una SPA que permita:

- crear o abrir un folio
- capturar datos generales
- consultar suscriptores, agentes, giros y códigos postales
- capturar una o varias ubicaciones
- editar una ubicación puntual
- visualizar el progreso y estado del folio
- configurar opciones de cobertura
- ejecutar el cálculo
- mostrar la prima neta, la prima comercial y el desglose por ubicación
- mostrar alertas de ubicaciones incompletas sin bloquear completamente el foli

### Arquitectura Frontend

**Enfoque**: Arquitectura basada en diseño atómico con, usando **React** como framework de desarrollo web **Typescript** para tipado y escritura de componentes y lógica de componentes, y **Tailwind** cómo framework de estilos de CSS

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
├── vite.config.ts
└── package.json
```

### Diseño de Base de Datos

#### Modelo de Datos Principal

1. **Entidad Principal: cotizaciones_danos**

Es el agregado principal que persiste toda la operación del folio.

- Campos clave: `numeroFolio (PK)`, `estadoCotizacion`, `version`, `fechaUltimaActualizacion`
- Información General: `datosAsegurado`, `codigoAgente`, `tipoNegocio`, `clasificacionRiesgo`.
- Configuración: `configuracionLayout`, `opcionesCobertura`.
- Resultados Financieros: `primaNeta`, `primaComercial`, `metadatos`.

2. **Entidad Dependiente: ubicaciones**

Relación de uno a uno con la cotización (se guarda como un arreglo o tabla vinculada).

- Campos clave: `índice`, `nombreUbicacion`.
- Geografía: `direccion`, `codigoPostal`, `estado`, `municipio`, `colonia`, `ciudad`.
- Técnicos: `tipoConstructivo`, `nivel, anioConstruccion`, `giro, claveIncendio`, `zonaCatastrofica`.
- Estado: `alertasBloqueantes`, `estadoValidacion`.
- Financieros: `primasPorUbicacion (resultado del cálculo)`.

3. **Colecciones de Referencia (Catálogos y Tarifas)**
Tablas para la lógica de negocio y cálculo técnico:

- parametros_calculo: `Parámetros globales para conversión de primas`.
- tarifas_incendio: `Tasas base por giro`.
- tarifas_cat / tarifa_fhm: `Factores por zona y riesgos hidrometeorológicos`.
- factores_equipo_electronico: `Factores técnicos por clase/nivel`.
- catalogo_cp_zonas: `Relación CP con zonas técnicas (TEV/FHM)`.

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


