# Arquitectura del Proyecto (Nivel Alto)

> Este archivo es leído por los agentes para el análisis GAIDD (Paso 3 — QUÉ/DÓNDE/POR QUÉ).

## Estilo arquitectónico

- **Backend**: MVC (Model-View-Controller) en capas — `routes → controllers → services → models`.
- **Frontend**: Feature-based architecture + Atomic Design — cada funcionalidad es un módulo autónomo con sus propios componentes, hooks y servicios.
- **Comunicación**: REST JSON sobre HTTP. El frontend consume el backend principal (`plataformas-danos-back`) y el backend consume catálogos del servicio externo `Plataforma-core-ohs` (solo lectura).

## Sistemas del proyecto

| Sistema | Tipo | Responsabilidad |
|---|---|---|
| `cotizador-danos-web` | SPA React | Captura, navegación por pasos y visualización del resultado |
| `plataformas-danos-back` | API REST Node/Express | Orquestación de la cotización, cálculo de primas, persistencia |
| `Plataforma-core-ohs` | Servicio externo (mock) | Provee catálogos: agentes, suscriptores, giros, tarifas, CPs, folios |

## Bounded contexts

| Bounded Context | Descripción | Módulos involucrados |
|---|---|---|
| **Cotización (Quote)** | Ciclo de vida del folio: creación, datos generales, estado | `quotes` (back + front) |
| **Ubicaciones (Locations)** | Registro, edición y validación de ubicaciones de riesgo | `locations` (back + front) |
| **Cobertura (Coverage)** | Selección y persistencia de opciones de cobertura | `coverage` (back + front) |
| **Cálculo de Prima** | Lógica de negocio para calcular prima neta y comercial por ubicación | `calculation` (back + front) |
| **Catálogos (Core)** | Consulta de datos de referencia externos (solo lectura, delegado a core) | `CatalogController`, `ExternalCoreService` |

## Capas del Backend (`plataformas-danos-back`)

```
routes/          → Define los endpoints HTTP y mapea a controladores
controllers/     → Recibe la request, valida entrada, delega al servicio, responde
services/        → Lógica de negocio: cálculo de primas, orquestación, llamadas a core
models/          → Entidades TypeORM: Quote, Location, Coverage
middlewares/     → Validación de esquema (Joi/class-validator), error handler global
config/          → Conexión a PostgreSQL, variables de entorno
utils/           → Helpers, formateadores, constantes
```

### Módulos del backend

| Módulo | Archivos clave | Responsabilidad |
|---|---|---|
| `quotes` | `QuoteController`, `quoteRoutes` | CRUD del folio y datos generales |
| `locations` | `LocationController`, `locationRoutes` | Layout, registro y edición de ubicaciones |
| `coverage` | (en `QuoteController`) | Opciones de cobertura por cotización |
| `calculation` | `PremiumService` | Cálculo de prima neta y prima comercial |
| `catalog` | `CatalogController`, `ExternalCoreService` | Proxy hacia `Plataforma-core-ohs` |

### Estructura de carpetas (backend)

```
plataformas-danos-back/
└── src/
    ├── controllers/
    │   ├── QuoteController.ts
    │   ├── LocationController.ts
    │   └── CatalogController.ts
    ├── models/
    │   ├── Quote.ts
    │   ├── Location.ts
    │   └── Coverage.ts
    ├── routes/
    │   ├── quoteRoutes.ts
    │   ├── locationRoutes.ts
    │   └── index.ts
    ├── services/
    │   ├── PremiumService.ts
    │   └── ExternalCoreService.ts
    ├── middlewares/
    │   ├── errorHandler.ts
    │   └── validateRequest.ts
    ├── config/
    │   └── database.ts
    └── utils/
        └── helpers.ts
```

## Capas del Frontend (`cotizador-danos-web`)

```
features/        → Módulo autónomo por funcionalidad (components + hooks + services + types)
shared/          → Componentes atómicos reutilizables, hooks genéricos, apiClient
layouts/         → Estructura visual: MainLayout, QuoteLayout (stepper)
routes/          → AppRoutes (React Router v6), ProtectedRoute
store/           → Estado global con Zustand: quoteStore, catalogStore
```

### Módulos del frontend

| Módulo (feature) | Componentes clave | Hook principal | Servicio |
|---|---|---|---|
| `quotes` | `QuoteForm`, `QuoteHeader`, `QuoteProgress` | `useQuote`, `useQuoteState` | `quoteApi.ts` |
| `locations` | `LocationList`, `LocationForm`, `LocationCard` | `useLocations` | `locationApi.ts` |
| `coverage` | `CoverageOptions`, `CoverageSelector` | `useCoverage` | (via `quoteApi`) |
| `calculation` | `CalculationButton`, `PremiumResults`, `LocationBreakdown` | `useCalculation` | (via `quoteApi`) |

### Atomic Design (`shared/components`)

| Nivel | Ejemplos |
|---|---|
| Atoms | `Button`, `Input`, `Select`, `Alert` |
| Molecules | `FormField`, `Card` |
| Organisms | `Navbar`, `Sidebar` |
| Templates | `PageLayout` |

### Estructura de carpetas (frontend)

```
cotizador-danos-web/
└── src/
    ├── features/
    │   ├── quotes/       (components/ hooks/ services/ types/)
    │   ├── locations/    (components/ hooks/ services/)
    │   ├── coverage/     (components/ hooks/)
    │   └── calculation/  (components/ hooks/)
    ├── shared/
    │   ├── components/   (atoms/ molecules/ organisms/ templates/)
    │   ├── hooks/        (useApi.ts, useForm.ts)
    │   ├── services/     (apiClient.ts, queryClient.ts)
    │   ├── types/        (common.types.ts)
    │   └── utils/        (validators.ts, formatters.ts)
    ├── layouts/
    ├── routes/
    ├── store/
    ├── App.tsx
    └── main.tsx
```

## Flujo de datos principal

```
Usuario
  → SPA (feature module → hook → service → apiClient)
  → plataformas-danos-back (route → controller → service → model/TypeORM)
  → PostgreSQL
  → Plataforma-core-ohs (solo lectura, desde ExternalCoreService)
```

## Restricciones arquitectónicas

1. Los controladores no contienen lógica de negocio — delegan en `services/`.
2. `PremiumService` es la única fuente de verdad para el cálculo de primas; no replicar en controladores.
3. El frontend gestiona estado global exclusivamente con Zustand — no usar Context API para estado compartido entre features.
4. Los hooks de feature son la única capa que puede llamar a `services/`; los componentes no llaman a `apiClient` directamente.
5. Los resultados de cálculo (`prima_neta`, `prima_comercial`, `primas_por_ubicacion`) no pueden sobreescribirse al editar otras secciones del folio.
6. El servicio `Plataforma-core-ohs` es de solo lectura — nunca escribir en él desde `plataformas-danos-back`.

## Criterios de encaje para requerimientos

- Lógica de cálculo de primas → `PremiumService` en el bounded context **Cálculo de Prima**.
- Cambios en estructura del folio (datos generales, estado) → bounded context **Cotización**.
- Registro o edición de ubicaciones → bounded context **Ubicaciones**.
- Consultas a catálogos externos → `ExternalCoreService`, bounded context **Catálogos**.
- Requerimientos que cruzan dos bounded contexts en una historia deben descomponerse en tareas separadas.
