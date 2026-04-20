---
applyTo: "backend/src/**/*.ts"
---

> **Scope**: Se aplica a la capa backend del proyecto (Node.js + Express + TypeScript + PostgreSQL). La arquitectura es MVC estricta: `routes → controllers → services → models → PostgreSQL`.

# Instrucciones para Archivos de Backend (Node.js/Express + TypeScript)

## Arquitectura MVC Obligatoria

El proyecto sigue **MVC Architecture** tal como se define en `README.md`. Cada layer tiene responsabilidades bien definidas:

```
src/
├── controllers/       ← Parsean HTTP, orquestan, responden
├── services/         ← Lógica de negocio pura (sin DB)
├── models/           ← Entidades TypeORM + tipos DTO
├── routes/           ← Definición de endpoints
├── middlewares/      ← Validaciones, error handling, auth
├── config/           ← Base de datos, variables de entorno
└── utils/            ← Funciones helper y constantes
```

### Responsabilidades por Layer

- **`routes/`**: Solo definición de endpoints. Registran handlers y middlewares.
- **`controllers/`**: Parsean request, validan (usando middlewares), llaman a services, responden. NUNCA lógica de negocio.
- **`services/`**: Lógica de negocio pura. Reciben inyecciones, NO tocan HTTP.
- **`models/`**: Entidades TypeORM (SQL DDL) + tipos DTO para request/response.
- **`middlewares/`**: Validaciones de entrada, error handling global, autenticación.
- **`config/`**: Configuración de base de datos PostgreSQL via TypeORM.
- **`utils/`**: Funciones reutilizables, constantes, helpers.

## Convenciones de Código

### Nombres
- **Archivos**: `PascalCase.ts` para controladores y servicios (ej. `QuoteController.ts`, `PremiumService.ts`)
- **Exportes**: `camelCase` para funciones y `PascalCase` para clases
- **Variables**: `camelCase` para todas las variables locales

### TypeScript
- **Tipos explícitos siempre**: Todas las funciones tienen tipos de parámetros y retorno
- **Evitar `any`**: Usar tipos genéricos o interfaces cuando sea necesario
- **Modelos de datos**: Usar interfaces o tipos para DTOs; entidades TypeORM para BD

### Database (PostgreSQL + TypeORM)
- Usar TypeORM **repositories** para acceso a datos (nunca raw SQL excepto en casos extremos)
- Todas las operaciones DB son `async`
- Siempre usar `try/catch` en servicios que tocan DB
- JSONB columns: Preferir para datos semi-estructurados (ej. `datosAsegurado: jsonb`)
- **Optimistic Locking**: Usar campo `version` para evitar race conditions en updates críticos

### Controllers
```typescript
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  async createQuote(req: Request, res: Response): Promise<void> {
    const { datosAsegurado } = req.body;
    // Validar entrada (hecho en middleware)
    const quote = await this.quoteService.createQuote(datosAsegurado);
    res.status(201).json(quote);
  }
}
```

### Services
```typescript
export class QuoteService {
  constructor(private quoteRepository: Repository<Quote>) {}

  async createQuote(datosAsegurado: DatosAsegurado): Promise<Quote> {
    // Solo lógica de negocio
    const quote = new Quote();
    quote.datosAsegurado = datosAsegurado;
    quote.version = 1;
    return await this.quoteRepository.save(quote);
  }
}
```

### Error Handling
- Crear custom `AppError` o `HttpException` para errores previstos
- NUNCA retornar stack traces en respuestas de producción
- Middleware global de errores en el servidor Express principal

## Nuevas Rutas / Controladores

Para agregar un nuevo endpoint:

1. **Crear el router** en `src/routes/`:
```typescript
// src/routes/quoteRoutes.ts
import { Router } from 'express';
import { QuoteController } from '../controllers/QuoteController';

const router = Router();
const controller = new QuoteController(quoteService);

router.post('/', (req, res) => controller.createQuote(req, res));
export default router;
```

2. **Registrar en main** (`src/index.ts` o similar):
```typescript
app.use('/api/quotes', quoteRoutes);
```

3. **No olvidar middleware de validación** antes del handler

## Nunca hacer

- Lógica de negocio en controllers
- Llamadas directas a BD desde controllers o rutas
- Operaciones síncronas en funciones que tocan BD
- Exponer detalles técnicos (stack traces, nombres de tablas) en respuestas HTTP
- Inyectar dependencias globales — pasar por constructor

---

> Para estándares de código limpio, SOLID, patrones de diseño y API REST, ver `.github/docs/lineamientos/dev-guidelines.md`.
