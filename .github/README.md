# ASSD Framework — Guía de Uso

**ASSD** (Agent Spec Software Development) es un framework de desarrollo asistido por IA que organiza el trabajo de software en cuatro fases orquestadas por agentes especializados en GitHub Copilot Chat.

```
Requerimiento → Spec → Backend → Frontend → Tests/QA
```

> **Índice completo de archivos**: `docs/README.md` (en la raíz del repositorio)

---

## Requisitos

| Requisito | Detalle |
|---|---|
| VS Code | Cualquier versión reciente |
| GitHub Copilot Chat | Extensión instalada y activa |
| Setting habilitado | `github.copilot.chat.codeGeneration.useInstructionFiles: true` |

El archivo `.vscode/settings.json` (en la raíz del repositorio) ya configura el auto-descubrimiento de agentes, skills, prompts e instructions — no requiere configuración manual adicional. Si no existe, créalo con las rutas correspondientes a `.github/`.

---

## Onboarding: nuevo proyecto

Al copiar esta carpeta `.github/` a un proyecto nuevo, completa estos archivos **en orden** antes de usar cualquier agente:

| # | Archivo | Qué escribir |
|---|---------|-------------|
| 1 | `README.md` (raíz del proyecto) | Stack, arquitectura, comandos (`install`, `dev`, `test`, `build`), variables de entorno |
| 2 | `docs/context/tech_stack_constraints.context.md` | Lenguaje, framework, base de datos, herramientas aprobadas |
| 3 | `docs/context/project_architecture.context.md` | Capas, módulos, bounded contexts |
| 4 | `docs/context/business_domain_dictionary.context.md` | Términos canónicos del negocio (glosario) |
| 5 | `docs/context/definition_of_ready.context.md` + `definition_of_done.context.md` | Criterios DoR y DoD del equipo |

Una vez completados, los agentes tienen todo el contexto necesario para operar de forma autónoma.

**No modificar nunca**: `agents/`, `skills/`, `instructions/`, `prompts/`, `docs/lineamientos/`, `copilot-instructions.md`, `AGENTS.md`

---

## El flujo ASSD paso a paso

### Paso 1 — Spec

Antes de escribir una sola línea de código, genera la especificación técnica del feature.

```
@Spec Generator describeme el feature: [tu requerimiento aquí]
```

O con el prompt:
```
/generate-spec
```

El agente ejecuta el **pipeline GAIDD** (validación INVEST/IEEE 830 → análisis de contexto → análisis técnico QUÉ/DÓNDE/POR QUÉ) y genera el archivo en `specs/<feature>.spec.md`.

---

### Paso 2 — Backend

Con la spec aprobada, implementa la capa backend:

```
@Backend Developer implementa la spec specs/<feature>.spec.md
```

O con el prompt:
```
/backend-task
```

El agente sigue la arquitectura en capas del proyecto (definida en `project_architecture.context.md`) y aplica los lineamientos de `dev-guidelines.md`.

---

### Paso 3 — Frontend

Con el backend listo, implementa la interfaz:

```
@Frontend Developer implementa la spec specs/<feature>.spec.md
```

O con el prompt:
```
/frontend-task
```

---

### Paso 4 — Tests y QA

Genera la suite de pruebas y la estrategia QA completa:

```
@Test Engineer genera tests para specs/<feature>.spec.md
```

O con el prompt:
```
/generate-tests
```

Para el flujo QA completo (estrategia + Gherkin + riesgos + automatización):
```
/qa-task
```

---

### Flujo completo en un solo comando

Para orquestar las 4 fases de principio a fin:

```
@Orchestrator ejecuta el flujo completo para: [tu requerimiento]
```

O:
```
/full-flow
```

---

## Agentes disponibles (`@nombre` en Copilot Chat)

| Agente | Cuándo usarlo |
|---|---|
| `@Orchestrator` | Coordinar el flujo completo o consultar estado (`/assd-orchestrate status`) |
| `@Spec Generator` | Validar un requerimiento y generar su spec técnica |
| `@Backend Developer` | Implementar un feature en la capa backend |
| `@Frontend Developer` | Implementar un feature en la capa frontend |
| `@Test Engineer` | Generar tests unitarios y ejecutar el flujo QA completo |

---

## Skills disponibles (`/comando` en Copilot Chat)

### ASSD Core
| Comando | Qué hace |
|---|---|
| `/assd-orchestrate` | Orquesta el flujo completo o muestra el estado actual |
| `/generate-spec` | Genera una spec técnica con pipeline GAIDD |
| `/backend-fastapi` | Implementa un feature en backend con arquitectura en capas |
| `/frontend-react` | Implementa un feature en frontend con componentes y hooks |
| `/unit-testing` | Genera suite de tests unitarios (backend + frontend) |

### Backend CoE
| Comando | Qué hace |
|---|---|
| `/clean-code-reviewer` | Revisa código backend: SOLID, Clean Code, nomenclatura |
| `/integration-test-generator` | Genera tests de integración para endpoints REST |
| `/contract-test-generator` | Genera contract tests entre servicios |

### Frontend CoE
| Comando | Qué hace |
|---|---|
| `/component-reviewer` | Revisa componentes: SRP, separación UI/lógica, tipado |
| `/accessibility-checker` | Verifica accesibilidad WCAG en interfaces |
| `/ui-test-generator` | Genera tests de UI con Testing Library |

### QA CoE
| Comando | Qué hace |
|---|---|
| `/test-strategy-planner` | Define pirámide de testing y estrategia QA |
| `/gherkin-case-generator` | Genera casos Given-When-Then desde criterios de aceptación |
| `/risk-identifier` | Clasifica riesgos por nivel (Alto/Medio/Bajo) |
| `/test-data-specifier` | Catálogo de datos de prueba sintéticos |
| `/critical-flow-mapper` | Mapea flujos críticos para E2E y smoke tests |
| `/regression-strategy` | Plan de regresión optimizado |
| `/automation-flow-proposer` | Propone flujos a automatizar con estimación de ROI |
| `/performance-analyzer` | Planifica pruebas de carga y performance |

---

## Prompts disponibles (`/nombre` en Copilot Chat)

| Comando | Cuándo usarlo |
|---|---|
| `/generate-spec` | Crear una nueva spec desde un requerimiento |
| `/backend-task` | Implementar una spec en el backend |
| `/frontend-task` | Implementar una spec en el frontend |
| `/generate-tests` | Generar tests para una spec o módulo existente |
| `/qa-task` | Ejecutar el flujo QA completo (8 skills secuenciales) |
| `/full-flow` | Orquestar las 4 fases de principio a fin |

---

## Instructions automáticas (sin intervención manual)

Estos archivos se inyectan automáticamente en el contexto de Copilot cuando el archivo activo coincide con el patrón:

| Archivo activo | Instructions aplicadas |
|---|---|
| `backend/**/*.py` (o equivalente) | `instructions/backend.instructions.md` |
| `frontend/src/**/*.{js,jsx}` (o equivalente) | `instructions/frontend.instructions.md` |
| `backend/tests/**` / `frontend/src/__tests__/**` | `instructions/tests.instructions.md` |

> Si el proyecto usa un stack diferente, los patrones `applyTo:` de cada archivo deben ajustarse al stack real.

---

## Lineamientos de referencia

Cargados automáticamente por los agentes durante la ejecución:

| Documento | Contenido |
|---|---|
| `docs/lineamientos/dev-guidelines.md` | Clean Code, SOLID, API REST, Seguridad, Observabilidad, Testing (LIN-DEV-001…013) |
| `docs/lineamientos/qa-guidelines.md` | Estrategia QA, Gherkin, Riesgos, Automatización, Performance |
| `docs/lineamientos/guidelines.md` | Referencia rápida de estándares: código, tests, API, Git, pipeline |

---

## Estructura de carpetas

```
.github/
├── README.md                        ← este archivo
├── AGENTS.md                        ← reglas críticas para todos los agentes
├── copilot-instructions.md          ← siempre activo en Copilot Chat
│
├── agents/                          ← 5 agentes (@nombre en Copilot Chat)
│   ├── orchestrator.agent.md
│   ├── spec-generator.agent.md
│   ├── backend-developer.agent.md
│   ├── frontend-developer.agent.md
│   └── test-engineer.agent.md
│
├── skills/                          ← 19 skills (/comando en Copilot Chat)
│   ├── assd-orchestrate/
│   ├── generate-spec/
│   ├── backend-fastapi/
│   ├── frontend-react/
│   ├── unit-testing/
│   └── [14 skills CoE más...]
│
├── prompts/                         ← 6 prompts (/nombre en Copilot Chat)
│   ├── generate-spec.prompt.md
│   ├── backend-task.prompt.md
│   ├── frontend-task.prompt.md
│   ├── generate-tests.prompt.md
│   ├── qa-task.prompt.md
│   └── full-flow.prompt.md
│
├── instructions/                    ← se aplican automáticamente por contexto de archivo
│   ├── backend.instructions.md
│   ├── frontend.instructions.md
│   └── tests.instructions.md
│
├── specs/                           ← specs generadas por @Spec Generator
│   └── <feature>.spec.md
│
└── docs/
    ├── lineamientos/                ← lineamientos CoE (no modificar)
    │   ├── dev-guidelines.md
    │   ├── qa-guidelines.md
    │   └── guidelines.md
    └── context/                     ← archivos de contexto del proyecto (completar por proyecto)
        ├── tech_stack_constraints.context.md
        ├── project_architecture.context.md
        ├── business_domain_dictionary.context.md
        ├── definition_of_ready.context.md
        └── definition_of_done.context.md
```

---

## Reglas de Oro

Rigen todas las interacciones de los agentes con el código:

1. **No código no autorizado** — los agentes no generan ni modifican código sin instrucción explícita del usuario.
2. **No suposiciones** — si el requerimiento es ambiguo, el agente pregunta antes de actuar.
3. **Transparencia** — el agente explica qué va a hacer antes de hacerlo.
4. **No implementar sin spec** — siempre debe existir una spec aprobada en `specs/` antes de cualquier desarrollo.
