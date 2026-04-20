# Specs — Fuente de Verdad del Proyecto

Este directorio contiene las especificaciones técnicas ASSD de cada funcionalidad del sistema.

## ¿Qué es una Spec?

Una spec es un documento técnico que describe **qué debe hacer** una funcionalidad antes de que se implemente. Es la fuente de verdad que usan todos los agentes de desarrollo.

## Lifecycle de una Spec

```
DRAFT → APPROVED → IMPLEMENTED → TESTED
```

| Estado | Descripción |
|--------|-------------|
| `DRAFT` | Generada por el agente `spec-generator`, pendiente de revisión |
| `APPROVED` | Revisada y aprobada por el equipo, lista para implementar |
| `IMPLEMENTED` | Backend y/o frontend implementado |
| `TESTED` | Pruebas unitarias generadas y pasando |

## Convención de Nombres

```
.github/specs/<nombre-feature-kebab-case>.spec.md
```

Ejemplos:
- `.github/specs/user-profile.spec.md`
- `.github/specs/password-reset.spec.md`
- `.github/specs/audit-log.spec.md`

## Cómo Generar una Spec

Usa el slash command en Copilot Chat:

```
/generate-spec
```

O selecciona el agente `Spec Generator` en el menú de agentes de Copilot Chat.

## Specs Existentes

| Feature | Archivo | Estado |
|---------|---------|--------|
| — | — | — |

> Agrega aquí las specs a medida que se van creando.
