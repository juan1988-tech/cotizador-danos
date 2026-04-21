# Spec: Vista de Información General de Cotización (Read-Only)

## Metadata
- **ID**: SPEC-011
- **Fecha**: 2026-04-21
- **Estado**: DRAFT
- **Autor**: Spec Generator Agent
- **Relacionado con**: SPEC-002 (Arquitectura), SPEC-003 (Modelo de Datos), SPEC-004 (Contratos de API), SPEC-010 (Listar Cotizaciones)

---

## Descripción

La ruta `/quotes/:folio/general-info` debe funcionar como la **página principal de la cotización**, mostrando los datos generales del asegurado y los metadatos del folio en modo **lectura** de forma predeterminada. El usuario puede optar por entrar en modo edición pulsando un botón explícito. Actualmente, la página `GeneralInfoPage` fuerza al usuario directamente a un formulario editable, lo que no permite revisar información sin riesgo de modificarla accidentalmente.

---

## Requerimiento de Negocio

La ruta `http://localhost:5173/quotes/COT-2026-001000/general-info` debe ser la ruta equivalente a la "página de la cotización" como tal: debe mostrar la información general del folio (datos del asegurado, estado, vigencia, agente, suscriptor, giro y tipo de negocio) en un panel de solo lectura bien estructurado. La edición es una acción secundaria que se activa explícitamente, no el comportamiento por defecto.

---

## Pipeline GAIDD — Validación

### Paso 1 — Granularidad (INVEST)
| Criterio | Resultado |
|---|---|
| Independiente | ✅ No bloquea otros features |
| Negociable | ✅ El layout visual es flexible |
| Valiosa | ✅ Permite revisión sin riesgo de edición involuntaria |
| Estimable | ✅ Scope acotado: 1 componente nuevo + 1 refactor de página |
| Small | ✅ Cabe en un sprint |
| Testeable | ✅ Criterios verificables con Testing Library |

→ **Veredicto**: Historia de Usuario válida. Procede.

### Paso 2 — Viabilidad
- `GET /api/v1/quotes/:folio` ya existe y retorna todos los datos necesarios. No se requieren cambios de backend.
- `useCatalogStore` ya contiene catálogos de agentes, suscriptores y giros para resolver IDs a descripciones.
- Stack 100% compatible: React + TypeScript + Tailwind + Zustand + TanStack Query.

### Paso 3 — QUÉ / DÓNDE / POR QUÉ
- **QUÉ**: Pantalla de visualización de datos generales de la cotización en modo solo lectura. Muestra todos los campos de `DatosAsegurado` junto al estado, folio y fechas. Incluye botón "Editar" que activa el formulario existente.
- **DÓNDE**: Capa Frontend únicamente. Archivos: `GeneralInfoPage.tsx` (refactor), nuevo componente `GeneralInfoView.tsx`.
- **POR QUÉ**: El flujo de cotización ya está implementado como wizard multi-paso. La información general es el punto de entrada al folio y debe poder consultarse en cualquier momento sin disparar escrituras.

---

## Casos de Uso

### UC-01: Ver información general de una cotización
- **Actor**: Usuario del sistema (agente de seguros)
- **Precondición**: El folio `COT-YYYY-NNNNNN` existe en la base de datos y tiene o no tiene `datosAsegurado` poblados.
- **Flujo principal**:
  1. El usuario navega a `/quotes/:folio/general-info` (directamente o desde la lista de cotizaciones).
  2. El sistema carga el folio desde el store o mediante `GET /api/v1/quotes/:folio`.
  3. La página muestra el `QuoteHeader` con folio, estado y fechas.
  4. Si `datosAsegurado` está poblado: se muestra el panel `GeneralInfoView` con todos los campos en modo lectura.
  5. Si `datosAsegurado` es `null`: se muestra un banner informativo indicando que los datos generales aún no han sido completados, con botón "Completar ahora" que activa el modo edición.
  6. Se muestra el botón "Editar" en la esquina superior del panel (solo si `datosAsegurado` no es `null`).
- **Flujo alternativo (folio no encontrado)**:
  - El sistema retorna 404 desde el API; la página muestra un `Alert` de error y un enlace de regreso a `/cotizador`.
- **Postcondición**: No se produce ninguna escritura. El estado del store permanece igual.

### UC-02: Activar modo edición desde la vista
- **Actor**: Usuario del sistema
- **Precondición**: UC-01 completado exitosamente; `datosAsegurado` no es `null`.
- **Flujo principal**:
  1. El usuario pulsa el botón "Editar" en el panel de información general.
  2. El componente conmuta a modo edición mostrando el `QuoteForm` pre-poblado con los datos actuales.
  3. El usuario modifica los campos y pulsa "Guardar y continuar".
  4. El sistema ejecuta `PATCH /api/v1/quotes/:folio/general-data`.
  5. Al recibir respuesta exitosa, el componente regresa a modo lectura mostrando los datos actualizados.
- **Flujo alternativo (error de concurrencia 409)**:
  - Se muestra un `Alert` de tipo `danger` indicando que la cotización fue modificada por otro proceso. Se recarga el folio automáticamente.
- **Postcondición**: `datosAsegurado` actualizado en el store y en la pantalla.

### UC-03: Navegar desde la vista al siguiente paso
- **Actor**: Usuario del sistema
- **Precondición**: `datosAsegurado` está completo (`estadoCotizacion` ≥ `DATOS_GENERALES_COMPLETOS`).
- **Flujo principal**:
  1. El usuario pulsa "Continuar a Ubicaciones" (botón secundario en la vista de lectura).
  2. El sistema navega a `/quotes/:folio/locations`.
- **Postcondición**: Sin cambios en el store.

---

## Modelos de Datos

### Entidades afectadas
| Entidad | Cambios | Descripción |
|---|---|---|
| `Quote` | Sin cambios | Se consume read-only vía endpoint existente |
| `DatosAsegurado` | Sin cambios | Se muestra como panel de lectura |

### Campos visualizados (read-only)
| Campo | Label UI | Tipo | Fuente |
|---|---|---|---|
| `numeroFolio` | Folio | `string` | `Quote.numeroFolio` |
| `estadoCotizacion` | Estado | `QuoteState` | `Quote.estadoCotizacion` |
| `fechaCreacion` | Fecha de creación | `string` (ISO) | `Quote.fechaCreacion` |
| `fechaUltimaActualizacion` | Última actualización | `string` (ISO) | `Quote.fechaUltimaActualizacion` |
| `nombreAsegurado` | Nombre del Asegurado | `string` | `DatosAsegurado.nombreAsegurado` |
| `rfcAsegurado` | RFC | `string` | `DatosAsegurado.rfcAsegurado` |
| `agenteId` | Agente | `string` (ID → descripción) | `DatosAsegurado.agenteId` resuelto con `CatalogStore.agents` |
| `suscriptorId` | Suscriptor | `string` (ID → descripción) | `DatosAsegurado.suscriptorId` resuelto con `CatalogStore.subscribers` |
| `tipoNegocio` | Tipo de Negocio | `string` | `DatosAsegurado.tipoNegocio` |
| `giroId` | Giro | `string` (ID → descripción) | `DatosAsegurado.giroId` resuelto con `CatalogStore.giros` |
| `vigenciaInicio` | Vigencia — Inicio | `string` (fecha formateada) | `DatosAsegurado.vigenciaInicio` |
| `vigenciaFin` | Vigencia — Fin | `string` (fecha formateada) | `DatosAsegurado.vigenciaFin` |

---

## API Endpoints

### Sin cambios de backend

Todos los endpoints que esta feature consume ya existen:

#### GET /api/v1/quotes/:folio _(existente)_
- **Uso**: Cargar datos completos del folio al montar la página.
- **Response 200**:
  ```json
  {
    "data": {
      "numeroFolio": "COT-2026-001000",
      "estadoCotizacion": "DATOS_GENERALES_COMPLETOS",
      "datosAsegurado": {
        "nombreAsegurado": "Empresa Ejemplo S.A. de C.V.",
        "rfcAsegurado": "EEJ200101ABC",
        "agenteId": "AGT-001",
        "suscriptorId": "SUB-001",
        "tipoNegocio": "Comercial",
        "giroId": "GIR-001",
        "vigenciaInicio": "2026-01-01",
        "vigenciaFin": "2027-01-01"
      },
      "configuracionLayout": null,
      "opcionesCobertura": null,
      "version": 3,
      "fechaCreacion": "2026-04-21T10:00:00.000Z",
      "fechaUltimaActualizacion": "2026-04-21T12:00:00.000Z"
    }
  }
  ```
- **Response 404**: `{ "error": "Quote COT-2026-001000 not found" }`

#### PATCH /api/v1/quotes/:folio/general-data _(existente, usado en modo edición)_
- Ver SPEC-004 para contrato completo.

---

## Frontend

### Componentes nuevos

| Componente | Archivo | Props | Descripción |
|---|---|---|---|
| `GeneralInfoView` | `features/quotes/components/GeneralInfoView.tsx` | `data: DatosAsegurado`, `onEdit?: () => void`, `onContinue?: () => void`, `canContinue?: boolean` | Panel de solo lectura que muestra los campos de `DatosAsegurado` resolviendo IDs desde `useCatalogStore`. Incluye botón "Editar" y botón "Continuar". |

### Páginas modificadas

| Página | Archivo | Cambio |
|---|---|---|
| `GeneralInfoPage` | `features/quotes/pages/GeneralInfoPage.tsx` | Añadir estado local `mode: 'view' \| 'edit'`. Por defecto `'view'`. Si `datosAsegurado` es `null`, inicializar en `'edit'`. Renderizar `GeneralInfoView` en modo `'view'` o `QuoteForm` en modo `'edit'`. |

### Estado de modo (interno a la página)

```typescript
// Estado local en GeneralInfoPage
const [mode, setMode] = useState<'view' | 'edit'>(() =>
  quote?.datosAsegurado ? 'view' : 'edit'
);
```

> No se requiere estado global nuevo. El modo `view/edit` es UI local de la página.

### Hooks / State

| Hook / Store | Archivo | Uso en esta feature |
|---|---|---|
| `useQuote` | `features/quotes/hooks/useQuote.ts` | Sin cambios. Provee `quote`, `loading`, `error`, `loadQuote`, `saveGeneralData`. |
| `useCatalogStore` | `store/catalogStore.ts` | Sin cambios. `GeneralInfoView` lo consume para resolver IDs → descripciones de agente, suscriptor y giro. |

### Servicios (llamadas API)

No se requieren nuevas funciones de servicio. Las existentes en `quoteApi.ts` son suficientes.

### Lógica de resolución de catálogos

`GeneralInfoView` implementa una función auxiliar interna:

```typescript
// Dentro de GeneralInfoView.tsx
function resolveLabel(
  id: string | undefined,
  catalog: { id: string; descripcion: string }[]
): string {
  if (!id) return '—';
  return catalog.find((c) => c.id === id)?.descripcion ?? id;
}
```

Si el catálogo no está cargado (array vacío), se muestra el ID directamente como fallback. No se bloquea la renderización.

### Estructura de secciones en `GeneralInfoView`

El panel se divide en dos secciones visuales:

**Sección 1 — Datos del Asegurado**
- Nombre del Asegurado
- RFC

**Sección 2 — Datos del Contrato**
- Agente (resuelto)
- Suscriptor (resuelto)
- Tipo de Negocio
- Giro (resuelto)
- Vigencia Inicio — Vigencia Fin

**Acciones**
- Botón "Editar" (secundario, visible siempre que `onEdit` esté definido)
- Botón "Continuar a Ubicaciones" (primario, visible solo si `canContinue === true`)

### Nota sobre shadcn/ui (opcional)

Los componentes `Card`, `Badge` y `Separator` de [shadcn/ui](https://ui.shadcn.com) son compatibles con el stack (Tailwind + Radix UI). Se pueden instalar con:

```bash
npx shadcn@latest add card badge separator
```

Su uso es **opcional**: el componente puede implementarse íntegramente con clases de Tailwind si no se desea agregar shadcn al proyecto.

---

## Reglas de Negocio

1. **La página es read-only por defecto**: al montar `GeneralInfoPage`, si `datosAsegurado` ya fue completado (`!= null`), el modo inicial es `'view'`. Solo si `datosAsegurado` es `null` el modo inicial es `'edit'`.
2. **No se escribe sin acción explícita del usuario**: la carga de datos no produce ninguna mutación. El `PATCH` solo se ejecuta cuando el usuario pulsa "Guardar" desde el modo edición.
3. **Resolución de catálogos es best-effort**: si el catálogo no está cargado, el campo muestra el ID sin interrumpir la renderización.
4. **El botón "Continuar" solo aparece en modo lectura**: cuando `estadoCotizacion` es `DATOS_GENERALES_COMPLETOS`, `UBICACIONES_CONFIGURADAS`, `COBERTURAS_SELECCIONADAS` o `CALCULADA`.
5. **Tras guardar en modo edición, se regresa automáticamente a modo lectura**: `handleSubmit` de `GeneralInfoPage` llama a `saveGeneralData` y, en caso de éxito, ejecuta `setMode('view')` en lugar de navegar directamente a `locations`.
6. **Campos vacíos se muestran como `—`**: ningún campo de `DatosAsegurado` lanza error si es `undefined` o vacío en modo lectura.

---

## Plan de Pruebas Unitarias

### Frontend — Componente `GeneralInfoView`
- [ ] `GeneralInfoView renders all DatosAsegurado fields in read-only mode` — verifica que cada campo definido en `DatosAsegurado` aparece en el DOM.
- [ ] `GeneralInfoView resolves agenteId to agent description from catalog store` — cuando el store tiene el agente, muestra la descripción, no el ID.
- [ ] `GeneralInfoView falls back to ID when catalog is empty` — si `agents` está vacío, muestra el ID sin error.
- [ ] `GeneralInfoView shows dash for undefined fields` — campos `undefined` o `null` se muestran como `—`.
- [ ] `GeneralInfoView calls onEdit when Editar button is clicked` — simula click y verifica callback.
- [ ] `GeneralInfoView calls onContinue when Continuar button is clicked` — simula click y verifica callback.
- [ ] `GeneralInfoView hides Continuar button when canContinue is false` — botón no está en el DOM.

### Frontend — Página `GeneralInfoPage`
- [ ] `GeneralInfoPage renders GeneralInfoView when quote has datosAsegurado` — modo inicial `'view'`.
- [ ] `GeneralInfoPage renders QuoteForm when quote.datosAsegurado is null` — modo inicial `'edit'`.
- [ ] `GeneralInfoPage switches to edit mode when onEdit is triggered` — `setMode('edit')`.
- [ ] `GeneralInfoPage returns to view mode after successful save` — tras `saveGeneralData` exitoso, el modo es `'view'`.
- [ ] `GeneralInfoPage shows loading spinner while quote is loading` — estado de carga visible.
- [ ] `GeneralInfoPage shows Alert on error` — error del hook renderiza `Alert` de tipo `danger`.

### Frontend — Hook `useQuote` (sin cambios, documentar regresión)
- [ ] `useQuote loadQuote fetches and stores quote by folio` — happy path.
- [ ] `useQuote saveGeneralData calls PATCH and updates store` — verifica llamada a `patchGeneralData`.

---

## Dependencias

### Paquetes existentes (sin cambios)
- `react-router-dom` — ya instalado
- `zustand` — ya instalado
- `axios` — ya instalado

### Paquetes opcionales (a evaluar)
| Paquete | Versión | Uso | Instalación |
|---|---|---|---|
| `@radix-ui/react-separator` | latest | Línea divisoria accesible entre secciones | `npx shadcn@latest add separator` |
| Componente `Card` de shadcn | latest | Contenedor visual con header/content/footer | `npx shadcn@latest add card` |
| Componente `Badge` de shadcn | latest | Chip de estado de cotización | `npx shadcn@latest add badge` |

> Si no se instalan shadcn components, el componente `GeneralInfoView` debe implementar equivalentes con Tailwind puro.

---

## Notas de Implementación

1. **`mode` es estado local de `GeneralInfoPage`**: no va al store global de Zustand. El store ya tiene `currentQuote` que es la fuente de verdad de los datos; el modo de UI no es parte del dominio.

2. **Inicialización del modo**: usar inicializador lazy de `useState` para derivar el modo del estado del quote:
   ```typescript
   const [mode, setMode] = useState<'view' | 'edit'>(() =>
     quote?.datosAsegurado ? 'view' : 'edit'
   );
   ```
   Sin embargo, como `quote` puede llegar `null` en el primer render (mientras carga), hay que actualizar el modo en un `useEffect` cuando `quote` cambie de `null` a un valor con `datosAsegurado`.

3. **`GeneralInfoView` no accede al store directamente** para los datos del folio: recibe `data: DatosAsegurado` como prop. Sí accede a `useCatalogStore` para la resolución de IDs.

4. **Compatibilidad con el wizard**: `QuoteProgress` y `QuoteLayout` no se modifican. La ruta `/quotes/:folio/general-info` sigue siendo el paso 1 del wizard.

5. **Transición a `locations`**: el botón "Continuar a Ubicaciones" en `GeneralInfoView` llama `onContinue`, que en `GeneralInfoPage` ejecuta `navigate(\`/quotes/${folio}/locations\`)`. No se llama `saveGeneralData` al continuar desde modo lectura.

6. **shadcn/ui es compatible con el stack**: aunque el lineamiento prohíbe "Material UI, Ant Design, Chakra", shadcn/ui no es una librería de UI tradicional sino una colección de componentes copiados al proyecto (Tailwind + Radix UI). Debe validarse con el tech lead antes de instalarlo.
