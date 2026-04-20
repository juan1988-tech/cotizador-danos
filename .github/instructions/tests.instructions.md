---
applyTo: "backend/tests/**/*.ts,frontend/src/__tests__/**/*.{ts,tsx}"
---

> **Scope**: Las reglas de backend aplican a tests en TypeScript (Jest + ts-jest + Supertest); las de frontend aplican a tests en TypeScript/React (Vitest + Testing Library). En ambos casos, mantener los principios: independencia, aislamiento, AAA, cobertura ≥ 80%.

# Instrucciones para Archivos de Pruebas

## Principios Generales

- **Independencia**: Cada test es 100% independiente — sin estado compartido entre tests.
- **Aislamiento**: Mockear SIEMPRE dependencias externas (DB, APIs REST, servicios).
- **Claridad**: Nombre del test describe qué se prueba y cuándo (condición).
- **Cobertura**: Happy path + error path + edge cases para cada unidad. **Mínimo 80%**.
- **Estructura AAA** (obligatoria):
  ```
  GIVEN  — preparar datos, fixtures, contexto
  WHEN   — ejecutar la acción bajo prueba
  THEN   — verificar resultados esperados
  ```

## Backend (Jest + ts-jest + Supertest)

### Herramientas
- **Jest**: Framework de testing
- **ts-jest**: Preset para TypeScript
- **Supertest**: Testing de endpoints HTTP
- **@types/jest**: Tipado de Jest

### Estructura de archivos
```
backend/tests/
  unit/
    services/
      quote.service.spec.ts
      premium.service.spec.ts
    controllers/
      quote.controller.spec.ts
  integration/
    routes/
      quote.route.spec.ts
      location.route.spec.ts
  fixtures/
    quote.fixtures.ts
    location.fixtures.ts
  mocks/
    repositories.mock.ts
```

### Convenciones de Testing
- **Nombre**: `[función]_[escenario]` con formato `given_when_then`
  ```typescript
  describe('QuoteService', () => {
    describe('createQuote', () => {
      it('given_validInput_when_createQuote_then_returnsQuoteWithId', async () => {
        // GIVEN
        const input = { datosAsegurado: {...} };
        
        // WHEN
        const result = await quoteService.createQuote(input);
        
        // THEN
        expect(result.id).toBeDefined();
      });
    });
  });
  ```

- **Mocking**: Usar `jest.mock()` para repositorios, servicios externos
  ```typescript
  jest.mock('../repositories/QuoteRepository');
  
  const mockRepository = QuoteRepository as jest.Mocked<typeof QuoteRepository>;
  mockRepository.create.mockResolvedValue(mockQuote);
  ```

- **Fixtures**: Datos de prueba centralizados en archivos `*.fixtures.ts`
  ```typescript
  // backend/tests/fixtures/quote.fixtures.ts
  export const mockQuote = {
    numeroFolio: 'Q-2026-001',
    datosAsegurado: { nombre: 'Test', rfc: 'XXX' },
    version: 1,
  };
  ```

### Unit Tests de Servicios
```typescript
// backend/tests/unit/services/quote.service.spec.ts
import { QuoteService } from '../../../src/services/QuoteService';
import { QuoteRepository } from '../../../src/repositories/QuoteRepository';
import { mockQuote } from '../../fixtures/quote.fixtures';

jest.mock('../../../src/repositories/QuoteRepository');

describe('QuoteService', () => {
  let service: QuoteService;
  let mockRepo: jest.Mocked<QuoteRepository>;

  beforeEach(() => {
    mockRepo = new QuoteRepository() as jest.Mocked<QuoteRepository>;
    service = new QuoteService(mockRepo);
    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    it('given_validData_when_createQuote_then_savesAndReturnsQuote', async () => {
      // GIVEN
      mockRepo.save.mockResolvedValue(mockQuote);

      // WHEN
      const result = await service.createQuote({ datosAsegurado: {...} });

      // THEN
      expect(result.numeroFolio).toBe('Q-2026-001');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('given_invalidData_when_createQuote_then_throwsError', async () => {
      // GIVEN
      const invalidData = { datosAsegurado: null };

      // WHEN / THEN
      await expect(service.createQuote(invalidData))
        .rejects
        .toThrow('datosAsegurado is required');
    });
  });
});
```

### Integration Tests con Supertest
```typescript
// backend/tests/integration/routes/quote.route.spec.ts
import request from 'supertest';
import { app } from '../../../src/index';
import { mockQuote } from '../../fixtures/quote.fixtures';

describe('POST /api/quotes', () => {
  it('given_validPayload_when_createQuote_then_returns201', async () => {
    // GIVEN
    const payload = { datosAsegurado: { nombre: 'Test' } };

    // WHEN
    const response = await request(app)
      .post('/api/quotes')
      .send(payload);

    // THEN
    expect(response.status).toBe(201);
    expect(response.body.numeroFolio).toBeDefined();
  });

  it('given_missingField_when_createQuote_then_returns400', async () => {
    // WHEN
    const response = await request(app)
      .post('/api/quotes')
      .send({});

    // THEN
    expect(response.status).toBe(400);
  });
});
```

## Frontend (Vitest + Testing Library)

### Herramientas
- **Vitest**: Test runner compatible con Jest, optimizado para Vite
- **Testing Library**: Testing orientado al usuario (queries semánticas)
- **Playwright**: E2E testing (opcional pero recomendado para flujos críticos)

### Estructura de archivos
```
frontend/src/__tests__/
  unit/
    components/
      FormField.test.tsx
      Button.test.tsx
    hooks/
      useQuote.test.ts
      useForm.test.ts
  integration/
    features/
      quotes/QuotesPage.test.tsx
  e2e/
    quote-flow.spec.ts (Playwright)
```

### Convenciones de Testing
- **Nombre**: `[componente/hook]_[escenario]`
  ```typescript
  describe('QuoteForm', () => {
    it('renders email input field', () => {
      render(<QuoteForm />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('shows error when submitting empty form', async () => {
      render(<QuoteForm onSubmit={mockSubmit} />);
      const button = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(button);
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });
  ```

- **Queries**: Prioridad de Testing Library
  1. `getByRole()` — accesible por defecto
  2. `getByLabelText()` — formularios
  3. `getByPlaceholderText()`
  4. `getByText()`
  5. `getByTestId()` — último recurso

- **Mocking**: `vi.mock()` para módulos externos
  ```typescript
  vi.mock('../services/quoteApi', () => ({
    quoteApi: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
  }));
  ```

- **Cleanup automático**: Vitest + Testing Library lo hacen por defecto

### Unit Tests de Componentes
```typescript
// frontend/src/__tests__/unit/components/FormField.test.tsx
import { render, screen } from '@testing-library/react';
import { FormField } from '../../../shared/components/molecules/FormField';

describe('FormField', () => {
  it('renders label and children', () => {
    // WHEN
    render(
      <FormField label="Email">
        <input type="email" />
      </FormField>
    );

    // THEN
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    // WHEN
    render(
      <FormField label="Email" error="Invalid email">
        <input type="email" />
      </FormField>
    );

    // THEN
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    // WHEN
    render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>
    );

    // THEN
    expect(screen.getByText('*')).toHaveClass('text-red-600');
  });
});
```

### Unit Tests de Hooks
```typescript
// frontend/src/__tests__/unit/hooks/useQuote.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useQuote } from '../../../features/quotes/hooks/useQuote';
import * as quoteApi from '../../../features/quotes/services/quoteApi';

vi.mock('../../../features/quotes/services/quoteApi');

describe('useQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('given_validId_when_fetchQuote_then_returnsQuote', async () => {
    // GIVEN
    const mockQuote = { id: 1, numeroFolio: 'Q-001' };
    vi.spyOn(quoteApi, 'getById').mockResolvedValue(mockQuote);

    // WHEN
    const { result } = renderHook(() => useQuote('1'));

    // THEN
    await waitFor(() => {
      expect(result.current.quote).toEqual(mockQuote);
    });
  });

  it('given_apiError_when_fetchQuote_then_setsError', async () => {
    // GIVEN
    const error = new Error('API error');
    vi.spyOn(quoteApi, 'getById').mockRejectedValue(error);

    // WHEN
    const { result } = renderHook(() => useQuote('1'));

    // THEN
    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
  });
});
```

### E2E Tests con Playwright (flujos críticos)
```typescript
// frontend/src/__tests__/e2e/quote-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quote Creation Flow', () => {
  test('given_newUser_when_createQuote_then_completesSuccessfully', async ({ page }) => {
    // GIVEN
    await page.goto('http://localhost:5173/');

    // WHEN
    await page.click('text=Nueva Cotización');
    await page.fill('input[name="nombre"]', 'Juan Pérez');
    await page.fill('input[name="rfc"]', 'PEPE900101ABC');
    await page.click('button:has-text("Siguiente")');

    // THEN
    await expect(page).toHaveURL(/\/ubicaciones/);
    await expect(page.locator('h1')).toContainText('Ubicaciones');
  });
});
```

## Nunca hacer

- Tests que dependen del orden de ejecución
- Llamadas reales a APIs, BD o servicios externos (SIEMPRE mockear)
- `console.log` permanentes en tests
- Lógica condicional dentro de un test (if/else en tests)
- Usar `setTimeout`/`sleep` para sincronización (Tests flaky)
- Tests sin AAA structure
- Nombres confusos o sin contexto
- Shared state entre tests

## Checklist de PR

- [ ] Cobertura ≥ 80%
- [ ] Todos los tests pasan: `npm test`
- [ ] Nombres de tests claros en formato `given_when_then`
- [ ] Mocks centralizados (no inline)
- [ ] Sin llamadas a APIs/BD reales
- [ ] Cleanup adecuado (fixtures, mocks)

---

> Para estrategia de testing, pirámide, TDD, riesgos QA y automatización E2E, ver `.github/skills/test-strategy-planner/SKILL.md` y `.github/docs/lineamientos/qa-guidelines.md`.
- [ ] Con documentación y trazabilidad hacia la HU
