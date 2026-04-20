---
name: frontend-react
description: Implementa un feature completo en el frontend React 19 + Vite del proyecto, creando páginas, componentes, hooks y servicios. Usa esta skill cuando necesites implementar la UI de una funcionalidad a partir de una spec ASSD aprobada. Respeta CSS Modules, React Router v6 y el hook useAuth como fuente única de auth state.
argument-hint: "<nombre-feature> (debe existir .github/specs/<nombre-feature>.spec.md)"
---

# Skill: frontend-react

Implementa funcionalidades en el frontend React/Vite respetando la arquitectura y convenciones del proyecto.

## Cuándo usar esta skill

- Cuando tengas un backend implementado y una spec aprobada
- Para crear páginas, componentes, hooks o servicios del frontend
- Para registrar rutas en `src/App.jsx`

## Arquitectura del Frontend

```
App.jsx (rutas)
  └── ProtectedRoute (guarda auth)
        └── PageName.jsx (página)
              ├── useHookName.js (estado/efectos)
              ├── featureService.js (llamadas API)
              └── ComponentName.jsx (UI reutilizable)
```

### Archivos clave — NO modificar sin razón

| Archivo | Rol |
|---------|-----|
| `src/config/firebase.js` | Init Firebase — no duplicar |
| `src/hooks/useAuth.js` | Fuente única de verdad del usuario |
| `src/components/ProtectedRoute.jsx` | Guardia de rutas autenticadas |

## Proceso paso a paso

Sigue este orden. Usa las plantillas en [templates/](./templates/).

### 1. Servicio (si hay llamadas API nuevas)
```js
// src/services/featureService.js
const API_URL = import.meta.env.VITE_API_URL;

export async function getFeature(idToken) {
  const res = await fetch(`${API_URL}/feature`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch feature');
  return res.json();
}
```

### 2. Hook (si hay estado o efectos complejos)
```js
// src/hooks/useFeature.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getFeature } from '../services/featureService';

export function useFeature() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    user.getIdToken()
      .then(token => getFeature(token))
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user]);

  return { data, loading, error };
}
```

### 3. Componentes reutilizables (`src/components/`)
Ver plantilla [templates/Component.jsx](./templates/Component.jsx).

### 4. Página + CSS Module (`src/pages/`)
Ver plantilla [templates/Page.jsx](./templates/Page.jsx) y [templates/Page.module.css](./templates/Page.module.css).

### 5. Registrar ruta en `src/App.jsx`
```jsx
import FeaturePage from './pages/FeaturePage';

// Dentro del <Routes>:
<Route path="/feature" element={
  <ProtectedRoute><FeaturePage /></ProtectedRoute>
} />
```

## Verificación final

```bash
cd frontend
npm run build
npm run lint
```

## Convenciones críticas

- **CSS Modules SIEMPRE**: `import styles from './PageName.module.css'`
- **NUNCA** estado de auth local — usar `const { user, loading } = useAuth()`
- **SIEMPRE** prefijo `VITE_` para variables de entorno
- **NUNCA** exponer Firebase config directamente — solo vía `src/config/firebase.js`
- Componentes en PascalCase, hooks en camelCase con prefijo `use`
