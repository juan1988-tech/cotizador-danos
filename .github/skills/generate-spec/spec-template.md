# Spec: [Nombre de la Funcionalidad]

## Metadata
- **ID**: SPEC-###
- **Fecha**: YYYY-MM-DD
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent

## Descripción
Resumen de la funcionalidad en 2-3 oraciones. Qué hace, para quién y qué problema resuelve.

## Requerimiento de Negocio
El requerimiento original tal como fue proporcionado por el usuario.

## Casos de Uso

### UC-01: [Nombre del caso de uso]
- **Actor**: usuario autenticado / usuario anónimo / sistema
- **Precondición**: estado del sistema antes de ejecutar el flujo
- **Flujo principal**:
  1. Paso 1
  2. Paso 2
  3. Paso N
- **Flujo alternativo** (opcional): qué pasa si algo falla
- **Postcondición**: estado del sistema después de la operación

## Modelos de Datos

### Entidades afectadas
| Entidad | Cambios | Descripción |
|---------|---------|-------------|
| `EntidadX` | nueva / modificada | descripción |

### Campos relevantes
| Campo | Tipo | Obligatorio | Regla |
|-------|------|-------------|-------|
| `campo` | string / number / bool | sí / no | descripción |

## API Endpoints

### [MÉTODO] /[path]
- **Descripción**: qué hace este endpoint
- **Auth requerida**: sí / no
- **Request Body**:
  ```json
  { "campo": "valor" }
  ```
- **Response 200**:
  ```json
  { "data": { "campo": "valor" } }
  ```
- **Response 400**: descripción del error de validación
- **Response 401**: no autenticado (si aplica)
- **Response 404**: recurso no encontrado (si aplica)
- **Response 409**: conflicto de unicidad (si aplica)

## Frontend

### Componentes nuevos
| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `ComponentName` | `components/ComponentName` | `prop1: tipo` | qué hace |

### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `FeaturePage` | `pages/FeaturePage` | `/feature` | sí/no |

### Hooks / State
| Hook / Store | Archivo | Retorna | Descripción |
|--------------|---------|---------|-------------|
| `useFeature` | `hooks/useFeature` | `{ data, loading, error }` | qué hace |

### Servicios (llamadas API)
| Función | Archivo | Descripción |
|---------|---------|-------------|
| `getFeature()` | `services/featureService` | fetch a GET /feature |

## Reglas de Negocio
1. Regla de validación 1
2. Regla de autorización 2
3. Regla de integridad 3

## Plan de Pruebas Unitarias

### Backend — Services
- [ ] `test_[service]_[happy_path]` — descripción breve
- [ ] `test_[service]_[error_case]` — descripción breve

### Backend — Repositories
- [ ] `test_[repo]_[happy_path]` — descripción breve
- [ ] `test_[repo]_[error_case]` — descripción breve

### Backend — Routes
- [ ] `test_[route]_returns_200` — descripción breve
- [ ] `test_[route]_returns_401_unauthorized` — descripción breve

### Frontend — Components
- [ ] `[Component] renders [elemento] correctly` — descripción breve
- [ ] `[Component] calls [handler] on [evento]` — descripción breve

### Frontend — Hooks
- [ ] `[useHook] returns [estado] on mount` — descripción breve
- [ ] `[useHook] handles [error] gracefully` — descripción breve

## Dependencias
- Paquetes / librerías nuevas requeridas (si aplica)
- Servicios externos o infraestructura necesaria

## Notas de Implementación
Observaciones técnicas, decisiones de diseño o advertencias para los agentes de desarrollo.
