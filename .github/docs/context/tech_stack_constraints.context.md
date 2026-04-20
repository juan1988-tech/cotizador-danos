# Restricciones de Stack Tecnológico

> Este archivo es leído por el agente `spec-generator` (Paso 2 del pipeline GAIDD) para validar viabilidad técnica.

## Backend aprobado

| Categoría | Tecnología |
|---|---|
| Lenguaje | TypeScript (strict mode) |
| Runtime | Node.js LTS |
| Framework | Express.js |
| ORM | TypeORM |
| Validación | class-validator + class-transformer + Joi |
| Seguridad HTTP | Helmet + CORS |
| Logging | Morgan |
| Testing | Jest + Supertest |
| Linting | ESLint + Prettier |

## Frontend aprobado

| Categoría | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Framework UI | React 19 |
| Bundler | Vite |
| Estilos | Tailwind CSS |
| Enrutamiento | React Router v6 |
| Estado global | Zustand |
| HTTP / caché | Axios + TanStack React Query |
| Formularios | React Hook Form + Zod |
| Utilidades CSS | clsx + tailwind-merge |
| Iconos | Lucide React |
| Testing unitario | Vitest + Testing Library |
| Testing E2E | Playwright |

## Persistencia aprobada

- **PostgreSQL 15+** como única base de datos relacional
- Columnas `JSONB` para datos semi-estructurados (datos_asegurado, opciones_cobertura, primas_por_ubicacion)
- Versionado optimista mediante columna `version INTEGER` en las tablas `quotes` y `locations`
- Índices GIN para columnas JSONB consultadas frecuentemente

## API y contratos

- API REST JSON sobre HTTP
- Versionado por ruta (`/v1/...`)
- Códigos HTTP estándar: `200`, `201`, `204`, `400`, `404`, `409`, `422`, `500`
- Respuestas de error con estructura `{ error: string, details?: object }`

## Tecnologías no aprobadas

- Bases de datos NoSQL (MongoDB, Redis, etc.) — no homologadas para este dominio
- Frameworks de servidor alternativos (NestJS, Fastify, Koa) — fuera del stack aprobado
- Bibliotecas de UI adicionales (Material UI, Ant Design, Chakra) — se usa Tailwind + componentes propios
- ORM alternativos (Prisma, Sequelize) — se usa TypeORM

## Restricciones de diseño y antipatrones prohibidos

- No exponer errores internos de infraestructura (stack traces, mensajes de BD) en respuestas públicas.
- No usar `any` en TypeScript — todas las entidades deben tener tipos explícitos.
- No modificar `version` manualmente — debe ser gestionado por trigger de BD.
- No sobreescribir resultados de cálculo al editar otras secciones de la cotización.

## Capacidades y límites relevantes

- Optimistic locking soportado mediante `version` + manejo de `409 Conflict`.
- JSONB soporta consultas con operadores `@>`, `->`, `->>` en PostgreSQL.
- Timestamps automáticos (`fecha_creacion`, `fecha_ultima_actualizacion`) gestionados por triggers de BD.
- El servicio externo `Plataforma-core-ohs` es de solo lectura (catálogos, tarifas, folios) — no se escribe en él.
