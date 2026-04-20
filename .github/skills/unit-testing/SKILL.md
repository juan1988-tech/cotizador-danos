---
name: unit-testing
description: Genera pruebas unitarias completas para backend (pytest + pytest-asyncio) y frontend (Vitest + Testing Library) a partir de una spec ASSD y el código implementado. Usa esta skill cuando necesites crear o completar la suite de tests de un feature. Cubre happy paths, error paths y edge cases.
argument-hint: "<nombre-feature> [backend|frontend|ambos]"
---

# Skill: unit-testing

Genera pruebas unitarias automáticamente basándose en la spec ASSD y el código ya implementado.

## Cuándo usar esta skill

- Después de implementar el backend o frontend de un feature
- Cuando necesites aumentar la cobertura de tests
- Para verificar que el código existente cumple los contratos de la spec

## Stack de Testing

| Entorno | Framework | Mocks | Runner |
|---------|-----------|-------|--------|
| Backend | pytest + pytest-asyncio | unittest.mock.AsyncMock | `poetry run pytest` |
| Frontend | Vitest | vi.mock() | `npx vitest run` |

## Proceso

1. **Lee la spec** en `.github/specs/<feature>.spec.md` — sección "Plan de Pruebas Unitarias"
2. **Lee el código** implementado para conocer los contratos exactos
3. **Genera tests** usando las plantillas en [templates/](./templates/)
4. **Ejecuta** los tests para verificar que pasan
5. **Reporta** al usuario el resultado

## Estructura de directorios de tests

```
backend/tests/
  conftest.py                            ← fixtures compartidas
  services/test_<feature>_service.py
  repositories/test_<feature>_repository.py
  routes/test_<feature>_router.py

frontend/src/__tests__/
  <Component>.test.jsx
  use<Hook>.test.js
```

## Cobertura obligatoria por unidad

Para cada función o componente, cubrir:
- ✅ **Happy path** — flujo exitoso con datos válidos
- ❌ **Error path** — excepción esperada o respuesta de error
- 🔲 **Edge case** — datos vacíos, duplicados, permisos, límites

## Plantillas de referencia

- Backend service test: [templates/test_service.py](./templates/test_service.py)
- Backend repository test: [templates/test_repository.py](./templates/test_repository.py)
- Backend router test: [templates/test_router.py](./templates/test_router.py)
- Frontend component test: [templates/Component.test.jsx](./templates/Component.test.jsx)
- Frontend hook test: [templates/useHook.test.js](./templates/useHook.test.js)

## Reglas críticas

- **Independencia**: cada test no depende del estado de otro
- **Sin efectos reales**: mockear Firebase, MongoDB y cualquier llamada de red
- **Nombres descriptivos**: `test_create_user_when_uid_exists_returns_existing_user`
- **Un assert lógico por test** (pueden ser múltiples `assert` si describen la misma cosa)
- Usar `conftest.py` para fixtures reutilizables del backend

## Comandos de instalación de dependencias

```bash
# Backend (si no están instalados)
cd backend
poetry add --group dev pytest pytest-asyncio httpx

# Frontend (si no están instalados)
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```
