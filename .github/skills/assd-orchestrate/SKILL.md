---
name: assd-orchestrate
description: Orquesta el flujo completo ASSD (Agent Spec Software Development) para un nuevo feature. Guía al usuario a través de las cuatro fases en orden: Spec → Backend → Frontend → Tests. Usa esta skill cuando necesites coordinar el desarrollo end-to-end de una funcionalidad nueva o ver el estado actual del flujo ASSD.
argument-hint: "<nombre-feature> | status"
---

# Skill: assd-orchestrate

Orquesta el flujo completo de desarrollo ASSD. Esta skill activa el proceso de coordinación entre las cuatro fases del desarrollo.

## Cuándo usar esta skill

- Al iniciar el desarrollo de una nueva funcionalidad
- Para consultar el estado actual del flujo ASSD (`/assd-orchestrate status`)
- Para reiniciar o continuar una fase interrumpida

## El Flujo ASSD

```
USUARIO: requerimiento de negocio
    │
    ▼
[FASE 1 — SPEC]
    Archivo: .github/specs/<feature>.spec.md
    Agente:  Spec Generator
    Skill:   /generate-spec
    Estado:  DRAFT → APPROVED
    │
    ▼ (solo si spec está APPROVED)
[FASE 2 — BACKEND]
    Archivos: app/models/, app/repositories/, app/services/, app/routes/
    Agente:   Backend Developer
    Skill:    /backend-fastapi
    │
    ▼
[FASE 3 — FRONTEND]
    Archivos: src/services/, src/hooks/, src/components/, src/pages/
    Agente:   Frontend Developer
    Skill:    /frontend-react
    │
    ▼
[FASE 4 — TESTS]
    Archivos: backend/tests/, frontend/src/__tests__/
    Agente:   Test Engineer
    Skill:    /unit-testing
    │
    ▼
FEATURE COMPLETO ✅
```

## Proceso de Orquestación

### Al recibir un nuevo requerimiento:

1. **Identifica** el nombre del feature (kebab-case)
2. **Verifica** si ya existe `.github/specs/<feature>.spec.md`
   - Si NO existe → activa `/generate-spec`
   - Si existe en DRAFT → pide aprobación al usuario antes de continuar
   - Si existe en APPROVED → continúa a la siguiente fase pendiente
3. **Confirma** la fase a ejecutar con el usuario
4. **Activa** la skill correspondiente
5. **Valida** el resultado antes de avanzar a la siguiente fase

### Comando de estado (`/assd-orchestrate status`):

Al recibir "status" como argumento, lista el estado de todos los features:

```
📋 Estado del Flujo ASSD
═══════════════════════════════════════

Feature: auth-firebase
    ✅ Spec     → .github/specs/auth-firebase.spec.md (IMPLEMENTED)
  ✅ Backend  → app/routes/auth_router.py
  ✅ Frontend → src/pages/LoginPage.jsx
  ⏳ Tests    → pendiente

Feature: [próximo feature]
  ⏳ Spec     → no iniciado
```

### Para determinar el estado de un feature, verifica:

| Fase | Archivo de referencia a verificar |
|------|----------------------------------|
| Spec | `.github/specs/<feature>.spec.md` |
| Backend | `backend/app/routes/<feature>_router.py` |
| Frontend | `frontend/src/pages/<Feature>Page.jsx` |
| Tests | `backend/tests/` + `frontend/src/__tests__/` |

## Reglas del Orquestador

1. **NUNCA** saltar la fase de spec
2. **SIEMPRE** pedir aprobación al usuario antes de avanzar entre fases
3. **SIEMPRE** verificar que los archivos existen después de cada fase
4. Comunicar claramente qué fase está activa y cuál será la siguiente
5. En caso de error en una fase, reportar sin silenciar el problema
