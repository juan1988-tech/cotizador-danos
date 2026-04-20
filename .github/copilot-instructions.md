# Copilot Instructions

## ASSD Workflow (Agent Spec Software Development)

Este repositorio sigue el flujo **ASSD**: toda funcionalidad nueva se ejecuta en cuatro fases orquestadas por agentes especializados.

```
[Orchestrator] → [Spec Generator] → [Backend Developer] → [Frontend Developer] → [Test Engineer]
```

### Fases del flujo ASSD
1. **SPEC**: El agente `spec-generator` genera una especificación técnica en `.github/specs/<feature>.spec.md`.
2. **BACKEND**: El agente `backend-developer` implementa la spec en Node.js + Express + TypeScript con arquitectura MVC (controllers, services, models, routes).
3. **FRONTEND**: El agente `frontend-developer` implementa la spec en React + TypeScript + Vite + TailwindCSS con arquitectura Feature-based + Atomic Design.
4. **TESTS**: El agente `test-engineer` genera pruebas unitarias basadas en la spec.

### Comandos de agente rápidos (slash commands):
- `/generate-spec` — genera una nueva spec técnica a partir de un requerimiento
- `/backend-task` — implementa una spec en el backend (Node.js + Express + TypeScript + PostgreSQL)
- `/frontend-task` — implementa una spec en el frontend (React + TypeScript + Vite + Tailwind + Zustand)
- `/generate-tests` — genera pruebas unitarias para una spec o módulo existente
- `/qa-task` — ejecuta el flujo completo de QA (estrategia, Gherkin, riesgos, automatización)
- `/full-flow` — orquesta el flujo completo: Spec → Backend → Frontend → QA

### Skills disponibles (slash commands portables):
- `/assd-orchestrate` — orquesta el flujo completo ASSD o consulta estado
- `/generate-spec` — skill para generar specs técnicas (incluye plantilla)
- `/unit-testing` — skill para generación de tests (Jest + ts-jest + Supertest para backend; Vitest + Testing Library para frontend)
- `/clean-code-reviewer` — revisión de código backend: SOLID, Clean Code (CoE)
- `/integration-test-generator` — tests de integración para endpoints REST (CoE)
- `/contract-test-generator` — contract tests entre servicios (CoE)
- `/component-reviewer` — revisión de componentes frontend (CoE)
- `/accessibility-checker` — verificación de accesibilidad WCAG (CoE)
- `/ui-test-generator` — tests de UI con Vitest + Testing Library (CoE)
- `/test-strategy-planner` — pirámide de testing y estrategia QA (CoE)
- `/gherkin-case-generator` — casos Given-When-Then desde criterios de aceptación (CoE)
- `/risk-identifier` — clasificación de riesgos ASD (CoE)
- `/test-data-specifier` — catálogo de datos de prueba sintéticos (CoE)
- `/critical-flow-mapper` — mapeo de flujos críticos para E2E y smoke (CoE)
- `/regression-strategy` — plan de regresión optimizado (CoE)
- `/automation-flow-proposer` — propuesta de automatización con ROI (CoE)
- `/performance-analyzer` — planificación de pruebas de performance (CoE)

### Specs
- Todas las specs viven en `.github/specs/`. Cada spec es la fuente de verdad para una funcionalidad.
- Antes de implementar cualquier desarrollo, debe existir una spec aprobada.

---

## Mapa de Archivos ASSD

> Índice navegable completo: consultar la documentación del proyecto

### Agentes
| Agente | Ruta |
|---|---|
| Orchestrator | `.github/agents/orchestrator.agent.md` |
| Spec Generator | `.github/agents/spec-generator.agent.md` |
| Backend Developer | `.github/agents/backend-developer.agent.md` |
| Frontend Developer | `.github/agents/frontend-developer.agent.md` |
| Test Engineer | `.github/agents/test-engineer.agent.md` |

### Skills
| Skill | Ruta principal | Recursos |
|---|---|---|
| `/assd-orchestrate` | `.github/skills/assd-orchestrate/SKILL.md` | — |
| `/generate-spec` | `.github/skills/generate-spec/SKILL.md` | `spec-template.md` |
| `/unit-testing` | `.github/skills/unit-testing/SKILL.md` | `templates/test_controller.ts`, `test_service.ts`, `Component.test.tsx`, `useHook.test.ts` |
| **Backend CoE** | | |
| `/clean-code-reviewer` | `.github/skills/clean-code-reviewer/SKILL.md` | — |
| `/integration-test-generator` | `.github/skills/integration-test-generator/SKILL.md` | — |
| `/contract-test-generator` | `.github/skills/contract-test-generator/SKILL.md` | — |
| **Frontend CoE** | | |
| `/component-reviewer` | `.github/skills/component-reviewer/SKILL.md` | — |
| `/accessibility-checker` | `.github/skills/accessibility-checker/SKILL.md` | — |
| `/ui-test-generator` | `.github/skills/ui-test-generator/SKILL.md` | — |
| **QA CoE** | | |
| `/test-strategy-planner` | `.github/skills/test-strategy-planner/SKILL.md` | — |
| `/gherkin-case-generator` | `.github/skills/gherkin-case-generator/SKILL.md` | — |
| `/risk-identifier` | `.github/skills/risk-identifier/SKILL.md` | — |
| `/test-data-specifier` | `.github/skills/test-data-specifier/SKILL.md` | — |
| `/critical-flow-mapper` | `.github/skills/critical-flow-mapper/SKILL.md` | — |
| `/regression-strategy` | `.github/skills/regression-strategy/SKILL.md` | — |
| `/automation-flow-proposer` | `.github/skills/automation-flow-proposer/SKILL.md` | — |
| `/performance-analyzer` | `.github/skills/performance-analyzer/SKILL.md` | — |

### Prompts
| Comando | Ruta |
|---|---|
| `/generate-spec` | `.github/prompts/generate-spec.prompt.md` |
| `/backend-task` | `.github/prompts/backend-task.prompt.md` |
| `/frontend-task` | `.github/prompts/frontend-task.prompt.md` |
| `/generate-tests` | `.github/prompts/generate-tests.prompt.md` |
| `/qa-task` | `.github/prompts/qa-task.prompt.md` |
| `/full-flow` | `.github/prompts/full-flow.prompt.md` |

### Lineamientos y Contexto (CoE Sofka)
| Documento | Ruta |
|---|---|
| Lineamientos de Desarrollo | `.github/docs/lineamientos/dev-guidelines.md` |
| Lineamientos QA | `.github/docs/lineamientos/qa-guidelines.md` |
| Guía de Desarrollo | `.github/docs/lineamientos/guidelines.md` |
| Reglas de Oro | `.github/docs/context/reglas-de-oro.md` |
| Definition of Done | `.github/docs/context/definition_of_done.context.md` |
| Definition of Ready | `.github/docs/context/definition_of_ready.context.md` |
| Arquitectura | `.github/docs/context/project_architecture.context.md` |
| Stack y restricciones | `.github/docs/context/tech_stack_constraints.context.md` |

### Instructions (path-scoped)
| Scope | Ruta | Se aplica a |
|---|---|---|
| Backend | `.github/instructions/backend.instructions.md` | `backend/src/**/*.ts` |
| Frontend | `.github/instructions/frontend.instructions.md` | `frontend/src/**/*.{ts,tsx}` |
| Tests | `.github/instructions/tests.instructions.md` | `backend/tests/**/*.ts` · `frontend/src/__tests__/**/*.{ts,tsx}` |

### Lineamientos generales para todos los agentes
- **Reglas de Oro**: ver sección siguiente de este archivo — rigen TODAS las interacciones.
- **Guía de agentes y reglas críticas**: `.github/AGENTS.md`
- **Specs activas**: `.github/specs/` — consultar siempre antes de implementar.
- **Documentación completa**: `docs/README.md` — índice de todos los archivos del repositorio.

---

## Reglas de Oro (CoE Sofka)

> Principio rector: todas las contribuciones de la IA deben ser seguras, transparentes, con propósito definido y alineadas con las instrucciones explícitas del usuario.

### I. Integridad del Código y del Sistema
- **No código no autorizado**: no escribir, generar ni sugerir código nuevo a menos que el usuario lo solicite explícitamente para una tarea específica.
- **No modificaciones no autorizadas**: no modificar, refactorizar ni eliminar código, archivos o estructuras existentes sin aprobación explícita.
- **Preservar la lógica existente**: respetar los patrones arquitectónicos, el estilo de codificación y la lógica operativa existentes del proyecto.

### II. Clarificación de Requisitos
- **Clarificación obligatoria**: si la solicitud, intención o contexto es ambiguo, incompleto o poco claro, detenerse y solicitar clarificación detallada antes de proceder.
- **No realizar suposiciones**: basar todas las acciones estrictamente en información explícita provista por el usuario.
- **Verificar la comprensión**: ante acciones significativas, resumir la tarea brevemente y confirmar con el usuario.

### III. Transparencia Operativa
- **Explicar antes de actuar**: antes de cualquier acción solicitada, explicar qué se hará, los pasos involucrados y posibles implicaciones.
- **Detención ante la incertidumbre**: si surge inseguridad o conflicto con estas reglas, detenerse y consultar al usuario.
- **Acciones orientadas a un propósito**: cada acción debe ser directamente relevante para la solicitud explícita. Sin funcionalidad ni consejos no solicitados.

---

## Project Overview

**Sistema de cotización de seguros de daños** con flujo multi-paso (datos generales → ubicaciones → coberturas → cálculo de prima).

### Stack completo

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL (JSONB para datos semi-estructurados, Optimistic Locking) |
| ORM | TypeORM |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Estado global | Zustand |
| Routing | React Router |
| Forms | React Hook Form + Zod |
| HTTP client | Axios + TanStack Query |
| Testing backend | Jest + ts-jest + Supertest |
| Testing frontend | Vitest + Testing Library + Playwright (E2E) |

### Arquitecturas

- **Backend**: MVC — `routes → controllers → services → models → PostgreSQL`
- **Frontend**: Feature-based + Atomic Design — `src/features/<feature>/` + `src/shared/components/{atoms,molecules,organisms,templates}/`

> Ver `README.md` en la raíz del proyecto para comandos de desarrollo y variables de entorno.


