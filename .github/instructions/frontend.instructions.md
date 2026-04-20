---
applyTo: "frontend/src/**/*.{ts,tsx}"
---

> **Scope**: Se aplica a la capa frontend del proyecto (React + TypeScript + Vite + TailwindCSS). La arquitectura es Feature-based + Atomic Design tal como se define en `README.md`.

# Instrucciones para Archivos de Frontend (React + TypeScript + Vite + Tailwind)

## Arquitectura Feature-based + Atomic Design

El proyecto organiza componentes en **dos niveles**:

```
src/
├── features/                     ← Módulos por funcionalidad de negocio
│   ├── quotes/
│   │   ├── components/           ← Componentes específicos del feature
│   │   │   ├── QuoteForm.tsx
│   │   │   ├── QuoteHeader.tsx
│   │   │   └── QuoteProgress.tsx
│   │   ├── hooks/
│   │   │   ├── useQuote.ts
│   │   │   └── useQuoteState.ts
│   │   ├── services/
│   │   │   └── quoteApi.ts
│   │   ├── types/
│   │   │   └── quote.types.ts
│   │   └── utils/
│   │
│   ├── locations/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── coverage/
│       ├── components/
│       └── hooks/
│
├── shared/                       ← Componentes reutilizables + Atomic Design
│   ├── components/
│   │   ├── atoms/                ← Más pequeños (Button, Input, Label)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Alert.tsx
│   │   ├── molecules/            ← Composición de atoms (FormField, Card)
│   │   │   ├── FormField.tsx
│   │   │   └── Card.tsx
│   │   ├── organisms/            ← Secciones grandes (Navbar, Sidebar)
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   └── templates/            ← Plantillas de layout
│   │       └── PageLayout.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   └── useForm.ts
│   ├── services/
│   │   ├── apiClient.ts
│   │   └── queryClient.ts
│   ├── types/
│   │   └── common.types.ts
│   └── utils/
│       ├── validators.ts
│       └── formatters.ts
│
├── store/                        ← State global con Zustand
│   ├── quoteStore.ts
│   └── catalogStore.ts
│
├── routes/                       ← Definición de rutas
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
│
├── layouts/
│   ├── MainLayout.tsx
│   └── QuoteLayout.tsx
│
├── App.tsx
└── main.tsx
```

## Convenciones Obligatorias

### Nombres de Archivos
- **Componentes React**: `PascalCase.tsx` (ej. `QuoteForm.tsx`, `FormField.tsx`)
- **Hooks**: `camelCase.ts` (ej. `useQuote.ts`, `useForm.ts`)
- **Servicios**: `camelCase.ts` (ej. `quoteApi.ts`, `apiClient.ts`)
- **Tipos**: `camelCase.types.ts` (ej. `quote.types.ts`)
- **Utils**: `camelCase.ts` (ej. `validators.ts`, `formatters.ts`)
- **Stores**: `camelCase.store.ts` (ej. `quoteStore.ts`)

### TypeScript
- **Tipos explícitos siempre**: Props tipadas, retornos de funciones siempre
- **Props interfaces**: Usar `interface PropsName { ... }` o `type PropsName = { ... }`
- **Evitar `any`**: Usar `unknown` si es necesario y castear explícitamente
- **Genéricos**: Usar para hooks reutilizables y componentes flexibles

### Estilos
- **SIEMPRE usar TailwindCSS**: Utility-first classes en JSX
- **NUNCA CSS Modules ni clases CSS globales**
- **Convención de clases**: Mantener legibilidad con líneas razonables
- **Responsive**: Mobile-first con breakpoints (`sm:`, `md:`, `lg:`, `xl:`)

Ejemplo correcto:
```tsx
<div className="flex flex-col gap-4 p-4 md:p-6 lg:flex-row">
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
    Click me
  </button>
</div>
```

## State Management con Zustand

- **Global state**: Usar Zustand (stores en `src/store/`)
- **Local state**: `useState` para estado componente-específico
- **Patrón de tiendas**:

```typescript
// src/store/quoteStore.ts
import { create } from 'zustand';
import { Quote } from '../features/quotes/types/quote.types';

interface QuoteStore {
  quotes: Quote[];
  selectedQuote: Quote | null;
  setSelectedQuote: (quote: Quote) => void;
  addQuote: (quote: Quote) => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  quotes: [],
  selectedQuote: null,
  setSelectedQuote: (quote) => set({ selectedQuote: quote }),
  addQuote: (quote) => set((state) => ({
    quotes: [...state.quotes, quote],
  })),
}));
```

## Formularios (React Hook Form + Zod)

- Usar **React Hook Form** para manejar formularios
- Validación con **Zod** (schema-first)
- Componentes controlados mínimos

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export function QuoteForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('nombre')} />
      {errors.nombre && <p>{errors.nombre.message}</p>}
    </form>
  );
}
```

## Rutas (React Router v6)

Registrar rutas en `src/routes/AppRoutes.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { QuotesPage } from '../features/quotes/pages/QuotesPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/quotes" 
          element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## API Client (Axios + TanStack Query)

- Usar **Axios** para HTTP calls
- Usar **TanStack Query (React Query)** para caching y sincronización de estado
- Centralizar llamadas en servicios

```typescript
// src/features/quotes/services/quoteApi.ts
import axios from 'axios';
import { Quote } from '../types/quote.types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const quoteApi = {
  create: async (data: Partial<Quote>) => {
    const { data: response } = await apiClient.post('/quotes', data);
    return response;
  },
  
  getById: async (id: string) => {
    const { data: response } = await apiClient.get(`/quotes/${id}`);
    return response;
  },
};
```

Con TanStack Query en componentes:
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { quoteApi } from '../services/quoteApi';

export function QuoteDetails({ id }: { id: string }) {
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quoteApi.getById(id),
  });

  if (isLoading) return <div>Cargando...</div>;
  return <div>{quote?.numero_folio}</div>;
}
```

## Variables de Entorno

- **Siempre prefijo `VITE_`** para que Vite las exponga
- Ejemplo: `VITE_API_URL`, `VITE_APP_NAME`
- Usar en componentes: `import.meta.env.VITE_API_URL`

## Componentes

- **Un componente por archivo**
- **Props destructuradas** en la firma
- **Separación lógica**:
  - Lógica compleja → hooks
  - Datos → stores o queries
  - Estilos → Tailwind en JSX
- **Tipos de props siempre explícitos**

Ejemplo:
```tsx
// src/shared/components/molecules/FormField.tsx
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
```

## Nunca hacer

- CSS global o CSS Modules — SOLO Tailwind
- Estado global para datos que cambian frecuentemente (excepto en Zustand)
- Lógica de negocio en componentes — delegar a hooks o servicios
- Pasar callbacks como props cuando hay alternativas con Zustand
- Variables de entorno sin prefijo `VITE_`
- Componentes sin tipos de props

---

> Para estándares de accesibilidad, performance, y best practices de React, ver `.github/docs/lineamientos/dev-guidelines.md` y `.github/skills/vercel-react-best-practices/SKILL.md`.
