# Docker — Comandos del proyecto

## Arrancar el proyecto

```bash
docker compose up --build -d
```

> Usa `--build` la primera vez o cuando cambies código. Las siguientes veces puede omitirse.

```bash
docker compose up -d
```

## Detener el proyecto

```bash
docker compose down
```

## Ver estado de los contenedores

```bash
docker compose ps
```

## Ver logs

```bash
# Todos los servicios
docker compose logs -f

# Por servicio
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

## Reconstruir un servicio específico

```bash
docker compose up --build -d frontend
docker compose up --build -d backend
```

## Limpiar todo (contenedores + volúmenes)

```bash
docker compose down -v
```

---

## URLs de acceso

| Servicio   | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:3000       |
| pgAdmin    | http://localhost:5051       |
| PostgreSQL | localhost:5433              |

### Health checks

```bash
curl http://localhost:3000/health/liveness
curl http://localhost:3000/health/readiness
```

---

## Credenciales pgAdmin

| Campo    | Valor                    |
|----------|--------------------------|
| Email    | admin@cotizador.com      |
| Password | admin123                 |

**Conexión a PostgreSQL desde pgAdmin:**

| Campo    | Valor             |
|----------|-------------------|
| Host     | postgres          |
| Port     | 5432              |
| Database | cotizador_danos   |
| Username | admin             |
| Password | admin123          |
