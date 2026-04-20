# Definition of Ready (DoR) del Proyecto

> Este archivo es leído por los agentes antes de iniciar una spec para verificar que el requerimiento está listo para desarrollo.

---

## 1) Criterios de negocio (obligatorios)

Una historia está Ready cuando:

1. Usa estructura completa **Como / Quiero / Para que**.
2. Usa términos canónicos del `business_domain_dictionary.context.md` (ej. `numeroFolio`, `primaNeta`, `ubicación`, `estadoCotizacion`).
3. El rol está definido de forma unívoca (agente, suscriptor, usuario final).
4. El valor de negocio es claro y verificable.
5. No contiene términos ambiguos sin operacionalizar (ej. "gestionar" debe especificar la acción CRUD).

---

## 2) Criterios de aceptación BDD (obligatorios)

1. Criterios en formato **Dado / Cuando / Entonces**.
2. Cubren: escenario feliz, validaciones de entrada, errores de negocio esperados.
3. Cada criterio es testeable y tiene resultado observable.
4. Si la historia toca el cálculo de prima, los criterios incluyen el comportamiento ante ubicaciones incompletas.
5. Si la historia toca la cotización como agregado, los criterios especifican el comportamiento del `version` y `fechaUltimaActualizacion`.

---

## 3) Contrato API (obligatorio para historias con endpoints)

1. Método HTTP y ruta versionada definidos bajo el patrón `/v1/quotes/{folio}/...`.
2. Request explícito: campos obligatorios, tipos TypeScript, reglas de validación con class-validator.
3. Response explícito: estructura de éxito y de error definidas en formato consistente.
4. Códigos HTTP definidos: `200`, `201`, `204`, `400`, `404`, `409`, `422`, `500`.
5. Si el endpoint modifica el agregado cotización, el contrato incluye el campo `version` en el request para control de concurrencia.

---

## 4) Alineación técnica (obligatorios)

1. Pertenece a uno de los bounded contexts definidos: Cotización, Ubicaciones, Cobertura, Cálculo de Prima o Catálogos.
2. Encaja en la arquitectura MVC del backend (`routes → controllers → services → models`) y feature-based del frontend.
3. Respeta el stack aprobado: Node.js + Express + TypeORM + PostgreSQL en backend; React 19 + Vite + Zustand en frontend.
4. Las fuentes de datos externas (agentes, giros, CPs, folios) se consumen exclusivamente desde `Plataforma-core-ohs`.
5. El impacto estimado es manejable en una iteración.

---

## 5) Preparación para ejecución (obligatorios)

1. Cumple INVEST (**Small** y **Testeable** son decisivos).
2. Dependencias críticas identificadas (ej. integración con `Plataforma-core-ohs`, tablas de tarifas).
3. Riesgos principales identificados con mitigación inicial.
4. Estimable sin supuestos críticos pendientes.

---

## 6) Checklist de entrada

- [ ] Términos canónicos del dominio usados correctamente.
- [ ] Criterios BDD completos y verificables (feliz + error + edge).
- [ ] Contrato API explícito (método, ruta, request, response, errores).
- [ ] Bounded context identificado.
- [ ] Alineación con arquitectura MVC y stack aprobados.
- [ ] Comportamiento de `version` y `fechaUltimaActualizacion` definido si aplica.
- [ ] Dependencias y riesgos documentados.

---

## 7) Relación DoR vs DoD

- **DoR**: controla la calidad de entrada al desarrollo.
- **DoD**: controla la calidad de salida al terminar la implementación.

Una historia puede iniciar desarrollo solo si está **Ready**, y solo puede cerrarse si está **Done**.
