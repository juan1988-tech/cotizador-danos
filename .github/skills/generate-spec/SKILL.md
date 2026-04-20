---
name: generate-spec
description: Genera una especificación técnica ASSD completa a partir de un requerimiento de negocio. Usa esta skill cuando necesites documentar un nuevo feature antes de implementarlo. Crea el archivo spec en .github/specs/<nombre-feature>.spec.md siguiendo el formato estándar del proyecto.
argument-hint: "<nombre-feature>: <descripción del requerimiento>"
---

# Skill: generate-spec

Genera una especificación técnica completa en formato ASSD para un nuevo feature del proyecto.

## Cuándo usar esta skill

- Antes de implementar cualquier funcionalidad nueva
- Cuando necesites documentar los contratos de API entre backend y frontend
- Para definir el plan de pruebas antes de escribir código

## Proceso

1. **Analiza** el requerimiento de negocio del usuario
2. **Explora** el código existente para identificar patrones y entidades relacionadas:
   - Lee los modelos/entidades existentes del proyecto
   - Lee los endpoints/controladores existentes
   - Lee las páginas/vistas existentes del frontend (si aplica)
3. **Genera** la spec usando la plantilla en [spec-template.md](./spec-template.md)
4. **Guarda** el archivo en `.github/specs/<nombre-feature>.spec.md`
5. **Confirma** al usuario con un resumen de la spec creada

## Reglas

- El nombre del archivo debe ser en kebab-case
- La spec debe cubrir TODAS las secciones de la plantilla
- Los endpoints deben documentar request body, response 200 y posibles errores
- El plan de pruebas debe incluir mínimo un test por endpoint y por componente
- Estado inicial de toda spec: `DRAFT`

## Plantilla de referencia

Usa el archivo [spec-template.md](./spec-template.md) como base para la spec.
