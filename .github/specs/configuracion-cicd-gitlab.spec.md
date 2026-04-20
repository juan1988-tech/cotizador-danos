# Spec: Configuración CI/CD en GitLab para cotizador-danos

## Metadata
- **ID**: SPEC-001-CICD
- **Fecha**: 2026-04-20
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent

## Descripción
Configurar un pipeline CI/CD en GitLab para los proyectos backend (Node.js/Express) y frontend (React/Vite), incluyendo servicios de base de datos PostgreSQL y variables de entorno necesarias. El pipeline debe ejecutar build, pruebas y preparar el despliegue automatizado.

## Requerimiento de Negocio
Configurar CI/CD. Configurar variables y servicios necesarios (por ejemplo, la base de datos). Subir tu código a un repositorio de GitLab.

## Casos de Uso

### UC-01: Integración Continua (CI)
- **Actor**: Desarrollador
- **Precondición**: Código subido a GitLab
- **Flujo principal**:
  1. El pipeline se dispara en cada push o merge request.
  2. Se instalan dependencias de backend y frontend.
  3. Se ejecutan pruebas unitarias y de integración.
  4. Se construyen los artefactos de frontend y backend.
- **Postcondición**: Artefactos listos y pruebas validadas.

### UC-02: Despliegue Continuo (CD)
- **Actor**: Desarrollador/DevOps
- **Precondición**: Pipeline CI exitoso
- **Flujo principal**:
  1. Si el pipeline es exitoso en rama main/master, se ejecuta el job de despliegue.
  2. Se usan variables de entorno seguras para credenciales y configuración.
  3. Se despliega a un entorno definido (Docker, VPS, etc.).
- **Postcondición**: Aplicación desplegada y accesible.

## Modelos de Datos

No aplica (configuración de infraestructura).

## API Endpoints

No aplica (configuración de infraestructura).

## Frontend
- Build y test automatizados usando Node.js 20+ y Vite.
- Artefactos generados en `cotizador-danos-web/dist`.

## Backend
- Build y test automatizados usando Node.js 20+ y TypeORM.
- Servicio PostgreSQL disponible como servicio de GitLab CI.
- Variables de entorno para conexión a base de datos y configuración.

## Reglas de Negocio
- El pipeline debe fallar si alguna prueba falla.
- El despliegue solo ocurre en ramas protegidas (main/master).
- Las variables sensibles (DB, JWT, etc.) nunca se exponen en logs.
- El servicio PostgreSQL debe estar disponible antes de ejecutar pruebas.

## Plan de Pruebas
- Validar que el pipeline ejecuta correctamente los jobs de build y test para ambos proyectos.
- Simular fallos en pruebas para verificar que el pipeline se detiene.
- Validar que las variables de entorno se inyectan correctamente.
- Verificar que el servicio PostgreSQL es accesible desde los jobs de backend.

## Dependencias
- GitLab CI/CD
- Node.js 20+
- PostgreSQL 15+
- Docker (opcional para despliegue)

## Notas de Implementación
- El archivo `.gitlab-ci.yml` debe estar en la raíz del repositorio.
- Usar `services: - postgres:15` en los jobs de backend.
- Definir variables de entorno en la configuración de GitLab (no en el repo).
- El pipeline debe ser compatible con monorepo (backend y frontend en carpetas separadas).
- Incluir caché de dependencias para acelerar builds.
- Documentar en README cómo personalizar variables y ejecutar el pipeline localmente.
