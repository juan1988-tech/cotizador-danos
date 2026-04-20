# Definition of Done (DoD) del Proyecto

> Este archivo es leído por los agentes para verificar que las specs e implementaciones cumplen los criterios de terminado.

---

## 1) Criterios de negocio

Una historia se considera "Done" cuando:

1. Usa términos canónicos del `business_domain_dictionary.context.md`.
2. No contiene términos ambiguos sin criterio verificable.
3. Tiene estructura completa **Como / Quiero / Para que**.
4. Contiene criterios de aceptación en formato **BDD (Dado / Cuando / Entonces)**.
5. Los criterios cubren: escenario feliz, validaciones, errores esperados.

---

## 2) Criterios funcionales

1. Contrato de API completo: método HTTP, ruta versionada `/v1/quotes/{folio}/...`, request, response, códigos HTTP.
2. Respuestas de error en formato consistente `{ message, code, details? }`.
3. Validaciones de entrada cubiertas con class-validator para los campos críticos.
4. Si la historia modifica el agregado cotización: `version` fue validado (optimistic locking) y `fechaUltimaActualizacion` fue actualizado via trigger.
5. Si la historia ejecuta el cálculo de prima: `primaNeta`, `primaComercial` y `primasPorUbicacion` fueron persistidos en una única operación lógica.
6. Las ubicaciones incompletas generan alerta pero no impiden el cálculo de las ubicaciones válidas.

---

## 3) Criterios técnicos y arquitectura

1. Backend respeta la arquitectura MVC: `routes → controllers → services → models`; sin lógica de negocio en controllers ni en routes.
2. Frontend respeta la arquitectura feature-based: lógica en hooks/services, UI en components, estado global en Zustand store.
3. No introduce tecnologías fuera del stack aprobado en `tech_stack_constraints.context.md`.
4. Sin `any` en TypeScript.
5. `version` nunca modificado manualmente — gestionado exclusivamente por trigger de BD.
6. Resultados financieros (`primaNeta`, `primaComercial`) nunca sobreescriben opciones de cotización de otras secciones.
7. Las consultas a catálogos externos se hacen exclusivamente a través de `Plataforma-core-ohs`.

---

## 4) Calidad de código

1. Código compilable y sin errores de TypeScript (`tsc --noEmit` limpio).
2. Nombres coherentes con los términos del dominio (`numeroFolio`, `estadoCotizacion`, `primaNeta`, etc.).
3. Cumple los límites definidos en `dev-guidelines.md` (≤ 50 LOC/función, complejidad ciclomática ≤ 10).
4. Sin código duplicado, muerto ni valores mágicos (usar constantes o enums).

---

## 5) Pruebas

1. Cobertura ≥ 80% en lógica de negocio (services y cálculo de prima).
2. Pruebas unitarias cubren: happy path, validaciones de negocio, manejo de errores.
3. Si toca el cálculo de prima: tests incluyen escenario con ubicación incompleta y escenario con todas las ubicaciones válidas.
4. Los cambios no rompen contratos existentes de los módulos adyacentes.
5. Pruebas ejecutadas y en verde (`npm test` sin fallos).

---

## 6) Documentación y trazabilidad

1. Si se toma una decisión de diseño relevante, se documenta como ADR o comentario en la spec.
2. El spec del feature refleja el estado final implementado.
3. Variables de entorno nuevas documentadas en `.env.example`.

---

## 7) Checklist de cierre

- [ ] Términos canónicos del dominio usados en código y documentación.
- [ ] Criterios BDD completos y verificables.
- [ ] Contrato API explícito (request / response / códigos HTTP / errores).
- [ ] Arquitectura MVC (backend) y feature-based (frontend) respetadas.
- [ ] Stack aprobado — sin `any`, sin tecnologías no autorizadas.
- [ ] `version` y `fechaUltimaActualizacion` gestionados correctamente (si aplica).
- [ ] Cálculo de prima persiste los tres campos en una sola operación (si aplica).
- [ ] Cobertura de pruebas ≥ 80% en lógica de negocio.
- [ ] `tsc --noEmit` y `npm test` en verde.
- [ ] Spec actualizada con el estado final.
