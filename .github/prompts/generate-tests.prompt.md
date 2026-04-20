---
name: generate-tests
description: Genera pruebas unitarias para backend (pytest) y/o frontend (Vitest) basadas en la spec ASSD y el código implementado.
argument-hint: "<nombre-feature> [--backend] [--frontend] (por defecto genera ambos)"
agent: Test Engineer
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---

Genera pruebas unitarias completas para el feature especificado.

**Feature**: ${input:featureName:nombre del feature en kebab-case}
**Scope**: ${input:scope:backend, frontend, o ambos (default)}

## Pasos obligatorios:

1. **Lee la spec** en `.github/specs/${input:featureName:nombre-feature}.spec.md` — sección "Plan de Pruebas Unitarias".
2. **Lee el código implementado** en `backend/app/` y/o `frontend/src/`.
3. **Genera tests de backend** (si aplica):
   - `backend/tests/services/test_${input:featureName:feature}_service.py`
   - `backend/tests/repositories/test_${input:featureName:feature}_repository.py`
   - `backend/tests/routes/test_${input:featureName:feature}_router.py`
4. **Genera tests de frontend** (si aplica):
   - `frontend/src/__tests__/[ComponentName].test.jsx`
   - `frontend/src/__tests__/use[HookName].test.js`
5. **Verifica** que los tests corren:
   - Backend: `cd backend && poetry run pytest tests/ -v`
   - Frontend: `cd frontend && npx vitest run`

## Cobertura obligatoria por test:
- ✅ Happy path (flujo exitoso)
- ❌ Error path (excepciones, errores de red, datos inválidos)
- 🔲 Edge cases (campos vacíos, duplicados, permisos)

## Restricciones:
- Cada test debe ser independiente (no compartir estado).
- Mockear SIEMPRE las dependencias externas (DB, Firebase, API).
- Para backend: usar `pytest-asyncio` + `unittest.mock.AsyncMock`.
- Para frontend: usar `vitest` + `@testing-library/react`.
