# Spec: Corrección y Mejora del Dockerizado del Proyecto

## Metadata
- **ID**: SPEC-007
- **Fecha**: 2026-04-20
- **Estado**: IMPLEMENTED
- **Autor**: Spec Generator Agent

## Descripción
Corregir la configuración de Docker del proyecto (docker-compose, Dockerfiles, inicialización de BD y seguridad) para que el entorno de desarrollo pueda levantarse correctamente con `docker compose up --build`. Actualmente el dockerizado presenta errores críticos de nomenclatura, rutas inexistentes, credenciales hardcodeadas y ausencia de `.dockerignore`.

## Requerimiento de Negocio
El equipo de desarrollo necesita un entorno dockerizado funcional que permita levantar los tres servicios del sistema (PostgreSQL, backend API, frontend SPA) con un solo comando, con la base de datos inicializada con el schema de tablas y sin exponer secretos ni archivos innecesarios en las imágenes.

## Casos de Uso

### UC-01: Levantar entorno de desarrollo completo
- **Actor**: Desarrollador
- **Precondición**: Docker y Docker Compose instalados; repositorio clonado
- **Flujo principal**:
  1. El desarrollador ejecuta `docker compose up --build` desde la raíz del proyecto
  2. Docker construye las imágenes de backend y frontend
  3. PostgreSQL se levanta y ejecuta el script de inicialización (`schema.sql`)
  4. El backend se conecta a PostgreSQL y queda disponible en `http://localhost:3000`
  5. El frontend se conecta al backend y queda disponible en `http://localhost:5173`
- **Flujo alternativo**: Si PostgreSQL no pasa el healthcheck en 50s, backend y frontend no arrancan (comportamiento esperado)
- **Postcondición**: Los 3 servicios están corriendo; la BD tiene las tablas `quotes`, `locations` y catálogos creados

### UC-02: Reconstruir solo un servicio
- **Actor**: Desarrollador
- **Precondición**: Entorno previamente levantado
- **Flujo principal**:
  1. El desarrollador ejecuta `docker compose up --build backend`
  2. Solo se reconstruye y reinicia el servicio backend
- **Postcondición**: El backend usa la nueva imagen; frontend y postgres no se reinician

### UC-03: Acceder a PgAdmin para gestión de BD
- **Actor**: Desarrollador
- **Precondición**: Entorno levantado
- **Flujo principal**:
  1. El desarrollador accede a `http://localhost:5050`
  2. Ingresa con las credenciales configuradas en `.env`
  3. Se conecta al servidor PostgreSQL (`postgres:5432`)
- **Postcondición**: Puede visualizar y gestionar las tablas de la BD

## Hallazgos a Corregir

### Críticos (impiden ejecución)

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 1 | `cotizador-danos-web/Dockerfile.yml` | Extensión `.yml` no reconocida por Docker | Renombrar a `Dockerfile` |
| 2 | `plataforma-danos-back/Dockerfile.yml` | Extensión `.yml` no reconocida por Docker | Renombrar a `Dockerfile` |
| 3 | `docker-compose.yml` (línea 30) | Ruta `./plataformas-danos-back` (con 's') no existe; la carpeta real es `plataforma-danos-back` | Corregir a `./plataforma-danos-back` |
| 4 | `docker-compose.yml` (línea 47) | Volume mount `./plataformas-danos-back:/app` misma errata con 's' | Corregir a `./plataforma-danos-back` |
| 5 | `docker-compose.yml` (línea 16) | Volume `./database/init` no existe; el schema está en `plataforma-danos-back/database/schema.sql` | Corregir ruta a `./plataforma-danos-back/database:/docker-entrypoint-initdb.d` o crear directorio `database/init/` en la raíz con el schema |

### Seguridad

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 6 | `docker-compose.yml` | Credenciales hardcodeadas (`admin123`) para PostgreSQL y PgAdmin | Externalizar a archivo `.env` con variables y referenciar con `${VARIABLE}` |
| 7 | Ambos sub-proyectos | No existen `.dockerignore` — se copian `node_modules`, `.git`, `.env`, `coverage/` a la imagen | Crear `.dockerignore` en ambos sub-proyectos |

### Configuración

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 8 | `plataforma-danos-back/Dockerfile.yml` | Hace `RUN npm run build` + `CMD npm start` pero compose sobreescribe con `npm run dev` — build desperdiciado | Separar en Dockerfile multi-stage con target `dev` y `prod`, o usar Dockerfile solo para dev |
| 9 | `docker-compose.yml` (línea 57) | `VITE_API_URL` como variable de runtime; las `VITE_*` se resuelven en build time | En modo dev (con volume mount) funciona; documentar la limitación para producción |
| 10 | `cotizador-danos-web/vite.config.ts` | No configura `server.host: true`; el Dockerfile pasa `--host` pero el formato exec de Docker puede no propagarlo | Configurar `server.host: true` en vite.config.ts |

### Limpieza

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 11 | `plataforma-danos-back/docker.compose` | Archivo vacío, sin propósito | Eliminar |
| 12 | `docker-compose.yml` (línea 1) | `version: '3.8'` deprecated en Compose V2 | Eliminar la línea `version` |

## Archivos Afectados

| Archivo | Acción |
|---------|--------|
| `docker-compose.yml` | Modificar (corregir rutas, externalizar credenciales, eliminar `version`) |
| `cotizador-danos-web/Dockerfile.yml` | Renombrar a `cotizador-danos-web/Dockerfile` |
| `plataforma-danos-back/Dockerfile.yml` | Renombrar a `plataforma-danos-back/Dockerfile` |
| `cotizador-danos-web/.dockerignore` | Crear nuevo |
| `plataforma-danos-back/.dockerignore` | Crear nuevo |
| `.env` (raíz) | Crear nuevo (credenciales de desarrollo) |
| `.env.example` (raíz) | Crear nuevo (plantilla sin secretos) |
| `plataforma-danos-back/docker.compose` | Eliminar |
| `cotizador-danos-web/vite.config.ts` | Modificar (agregar `server.host: true`) |

## Especificación de Archivos Nuevos

### `.dockerignore` — Frontend (`cotizador-danos-web`)
```
node_modules
dist
.git
.gitignore
.env
.env.*
*.md
coverage
.vscode
.idea
```

### `.dockerignore` — Backend (`plataforma-danos-back`)
```
node_modules
dist
.git
.gitignore
.env
.env.*
*.md
coverage
.vscode
.idea
tests
```

### `.env` (raíz) — Variables de entorno para Docker Compose
```env
# PostgreSQL
POSTGRES_DB=cotizador_danos
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

# Backend
NODE_ENV=development
PORT=3000

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@cotizador.com
PGADMIN_DEFAULT_PASSWORD=admin123

# Frontend
VITE_API_URL=http://localhost:3000
```

### `.env.example` (raíz) — Plantilla de referencia
```env
# PostgreSQL
POSTGRES_DB=cotizador_danos
POSTGRES_USER=admin
POSTGRES_PASSWORD=<cambiar>

# Backend
NODE_ENV=development
PORT=3000

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@cotizador.com
PGADMIN_DEFAULT_PASSWORD=<cambiar>

# Frontend
VITE_API_URL=http://localhost:3000
```

### `docker-compose.yml` — Versión corregida

```yaml
services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: cotizador-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./plataforma-danos-back/database:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cotizador-network

  # Backend API
  backend:
    build:
      context: ./plataforma-danos-back
      dockerfile: Dockerfile
    container_name: cotizador-backend
    ports:
      - "${PORT:-3000}:3000"
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./plataforma-danos-back:/app
      - /app/node_modules
    networks:
      - cotizador-network
    command: npm run dev

  # Frontend SPA
  frontend:
    build:
      context: ./cotizador-danos-web
      dockerfile: Dockerfile
    container_name: cotizador-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
    depends_on:
      - backend
    volumes:
      - ./cotizador-danos-web:/app
      - /app/node_modules
    networks:
      - cotizador-network
    command: npm run dev -- --host

  # PgAdmin (opcional, para gestión de BD)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cotizador-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - cotizador-network

volumes:
  postgres_data:

networks:
  cotizador-network:
    driver: bridge
```

### Dockerfile — Backend (`plataforma-danos-back/Dockerfile`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

> Nota: Se elimina `RUN npm run build` y `CMD npm start` porque el compose usa `command: npm run dev` con volume mount para desarrollo. Para producción se debe crear un Dockerfile multi-stage separado o un target `prod`.

### Dockerfile — Frontend (`cotizador-danos-web/Dockerfile`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

### Modificación en `vite.config.ts`
Agregar `server.host: true` para que Vite escuche en todas las interfaces:

```typescript
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    host: true,
  },
})
```

## Reglas de Negocio
1. El archivo `.env` con credenciales reales **no debe** subirse al repositorio — agregar `.env` al `.gitignore` raíz.
2. Solo `.env.example` (sin secretos reales) debe versionarse.
3. El schema SQL en `plataforma-danos-back/database/schema.sql` debe ser ejecutable como init script de PostgreSQL (ya lo es: usa `CREATE TABLE IF NOT EXISTS`).
4. El healthcheck de PostgreSQL debe pasar antes de que el backend intente conectarse.
5. Los `node_modules` se excluyen del volume mount con el patrón de volumen anónimo (`/app/node_modules`).

## Plan de Pruebas

### Pruebas manuales de infraestructura
- [ ] `docker compose up --build` — los 3 servicios arrancan sin errores
- [ ] `docker compose ps` — muestra postgres, backend y frontend como `running` / `healthy`
- [ ] `curl http://localhost:3000` — backend responde (200 o 404 esperado)
- [ ] `curl http://localhost:5173` — frontend sirve el HTML de la SPA
- [ ] `docker compose exec postgres psql -U admin -d cotizador_danos -c '\dt'` — lista tablas `quotes` y `locations`
- [ ] `docker compose down && docker compose up` — se levanta sin rebuild usando volúmenes persistentes
- [ ] `docker compose down -v && docker compose up --build` — rebuild limpio con BD re-inicializada
- [ ] PgAdmin accesible en `http://localhost:5050` con credenciales del `.env`

### Verificaciones de seguridad
- [ ] `.env` no está incluido en ninguna imagen Docker (verificar con `docker run --rm <image> ls -la /app`)
- [ ] `node_modules` local no se copia a la imagen (verificar que `.dockerignore` lo excluye)
- [ ] No hay credenciales hardcodeadas en `docker-compose.yml`

### Verificaciones de hot-reload (desarrollo)
- [ ] Modificar un archivo `.ts` en el backend → nodemon reinicia automáticamente
- [ ] Modificar un archivo `.tsx` en el frontend → Vite HMR refleja el cambio en el navegador

## Dependencias
- Docker Engine 20.10+
- Docker Compose V2 (comando `docker compose` sin guión)
- No se requieren paquetes npm adicionales

## Notas de Implementación
1. **Renombrar archivos**: Los `Dockerfile.yml` deben renombrarse a `Dockerfile` (sin extensión). Esto requiere renombrar el archivo en el sistema de archivos, no solo cambiar contenido.
2. **Eliminar archivo muerto**: `plataforma-danos-back/docker.compose` está vacío y debe eliminarse.
3. **Init de BD**: PostgreSQL ejecuta automáticamente los archivos `.sql` que encuentre en `/docker-entrypoint-initdb.d/` al crear el volumen por primera vez. Si el volumen ya existe (`postgres_data`), los init scripts **no se re-ejecutan**. Para forzar re-ejecución: `docker compose down -v`.
4. **Producción**: Esta spec cubre exclusivamente el entorno de **desarrollo**. Para producción se necesitaría: Dockerfiles multi-stage con build optimizado, nginx para servir el frontend estático, variables de entorno inyectadas en build-time para Vite, y un compose profile separado.
5. **`.gitignore`**: Verificar que `.env` esté en el `.gitignore` de la raíz del proyecto. Si no existe, crearlo.
