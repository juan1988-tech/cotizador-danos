# AGENTS.md — ASSD Project

> Canonical shared version: this file is the source of truth for shared agent guidelines.

This file defines general guidance for all AI agents working in this repository, following the **ASSD (Agent Spec Software Development)** workflow.

## Project Summary

> Ver `README.md` en la raíz del proyecto para stack, arquitectura y estructura de carpetas del proyecto actual.
> Ver `.github/README.md` para la estructura completa del framework ASSD.

## ASSD Workflow

**Every new feature must follow this pipeline:**

```
1. SPEC      → /generate-spec    → .github/specs/<feature>.spec.md
2. BACKEND   → /backend-task     → capas del proyecto (ver project_architecture.context.md)
3. FRONTEND  → /frontend-task    → páginas / componentes / hooks / servicios
4. TESTS     → /generate-tests   → tests backend + tests frontend
```

## Agent Skills (slash commands)

Skills are portable instruction sets invokable as `/command` in Copilot Chat. They work across VS Code, GitHub Copilot CLI, and Copilot coding agent.

### ASSD Core
| Skill | Slash Command | Descripción |
|-------|---------------|-------------|
| assd-orchestrate | `/assd-orchestrate` | Orquesta el flujo completo ASSD o consulta estado |
| generate-spec | `/generate-spec` | Genera spec técnica en `.github/specs/` |
| backend-fastapi | `/backend-fastapi` | Implementa feature en FastAPI (capas + patterns) |
| frontend-react | `/frontend-react` | Implementa feature en React/Vite (CSS Modules) |
| unit-testing | `/unit-testing` | Genera suite de tests (pytest + Vitest) |

### Backend CoE
| Skill | Slash Command | Descripción |
|-------|---------------|-------------|
| clean-code-reviewer | `/clean-code-reviewer` | Revisa código backend: SOLID, Clean Code, funciones largas |
| integration-test-generator | `/integration-test-generator` | Genera tests de integración para endpoints REST |
| contract-test-generator | `/contract-test-generator` | Genera contract tests entre servicios (Pact) |

### Frontend CoE
| Skill | Slash Command | Descripción |
|-------|---------------|-------------|
| component-reviewer | `/component-reviewer` | Revisa componentes: SRP, separación lógica/UI, tipado |
| accessibility-checker | `/accessibility-checker` | Verifica accesibilidad WCAG en interfaces |
| ui-test-generator | `/ui-test-generator` | Genera tests de UI con Vitest + Testing Library |

### QA CoE
| Skill | Slash Command | Descripción |
|-------|---------------|-------------|
| test-strategy-planner | `/test-strategy-planner` | Define pirámide de testing y estrategia QA |
| gherkin-case-generator | `/gherkin-case-generator` | Genera casos Given-When-Then desde criterios de aceptación |
| risk-identifier | `/risk-identifier` | Clasifica riesgos con Regla ASD (Alto/Medio/Bajo) |
| test-data-specifier | `/test-data-specifier` | Catálogo de datos de prueba sintéticos |
| critical-flow-mapper | `/critical-flow-mapper` | Mapea flujos críticos para E2E y smoke testing |
| regression-strategy | `/regression-strategy` | Define plan de regresión optimizado |
| automation-flow-proposer | `/automation-flow-proposer` | Propone flujos a automatizar y framework |
| performance-analyzer | `/performance-analyzer` | Planifica y analiza pruebas de performance |

## Lineamientos y Contexto (CoE Sofka)

Los agentes deben cargar estos archivos como **primer paso** antes de generar cualquier código:

| Documento | Ruta | Agentes que lo cargan |
|---|---|---|
| Lineamientos de Desarrollo | `.github/docs/lineamientos/dev-guidelines.md` | Backend Developer, Frontend Developer |
| Lineamientos QA | `.github/docs/lineamientos/qa-guidelines.md` | Test Engineer |
| Guía de Desarrollo | `.github/docs/lineamientos/guidelines.md` | Todos |
| Reglas de Oro | `.github/docs/context/reglas-de-oro.md` | Todos (siempre activas) |
| Definition of Done | `.github/docs/context/definition_of_done.context.md` | Test Engineer, Orchestrator |
| Definition of Ready | `.github/docs/context/definition_of_ready.context.md` | Spec Generator, Orchestrator |

---

## Reglas de Oro (CoE Sofka)

> Principio rector: todas las contribuciones de la IA deben ser seguras, transparentes, con propósito definido y alineadas con las instrucciones explícitas del usuario.

### I. Integridad del Código y del Sistema
- **No código no autorizado**: no escribir, generar ni sugerir código nuevo a menos que el usuario lo solicite explícitamente.
- **No modificaciones no autorizadas**: no modificar, refactorizar ni eliminar código, archivos o estructuras existentes sin aprobación explícita del usuario.
- **No creación de activos no autorizados**: no crear archivos, directorios, funciones, rutas ni componentes sin instrucción explícita.
- **Preservar la lógica existente**: respetar patrones arquitectónicos, estilo de codificación y lógica operativa del proyecto.

### II. Clarificación de Requisitos
- **Clarificación obligatoria**: si la solicitud es ambigua, incompleta o poco clara, detenerse y solicitar clarificación antes de proceder.
- **No realizar suposiciones**: basar todas las acciones estrictamente en información explícita proporcionada por el usuario.
- **Verificar la comprensión**: ante acciones significativas, resumir brevemente la tarea y buscar confirmación.

### III. Transparencia Operativa
- **Explicar antes de actuar**: antes de cualquier acción, explicar qué se va a hacer, los pasos y posibles implicaciones.
- **Registro de decisiones**: declarar claramente la acción realizada, la información base y el razonamiento.
- **Detención ante la incertidumbre**: si surge inseguridad o un conflicto con estas reglas, detenerse y consultar al usuario.
- **Acciones orientadas a un propósito**: cada acción debe ser directamente relevante para la solicitud explícita. Sin consejos ni funcionalidad no solicitados.

---

## Critical Rules for All Agents

1. **No implementation without a spec.** Always check `.github/specs/` first.
2. **Backend architecture is layered** — follow the pattern defined in `.github/docs/context/project_architecture.context.md`. Never bypass layers.
3. **Dependency wiring happens at the entry layer** (controller/router) — inject dependencies downward, never upward.
4. **UI state follows the project architecture** — use a single authoritative source of truth; no parallel state sources.
5. **I/O operations follow the project concurrency model** — sync or async as defined in `tech_stack_constraints.context.md`.
6. **Never commit secrets or credentials** — `.env`, credential files and API keys must be in `.gitignore`.

## Development Commands & Integration Notes

> Ver `README.md` en la raíz del proyecto.
