---
name: generate-spec
description: Genera una especificación técnica ASSD para un nuevo feature. Usa este comando con el nombre e descripción del feature.
argument-hint: "<nombre-feature>: <descripción del requerimiento>"
agent: Spec Generator
tools:
  - edit/createFile
  - read/readFile
  - search/listDirectory
  - search
---

Genera una especificación técnica completa en `.github/specs/` para el siguiente requerimiento:

**Feature**: ${input:featureName:nombre del feature en kebab-case}
**Requerimiento**: ${input:requirement:descripción del requerimiento de negocio}

## Pasos a seguir:

1. Lee las instrucciones del proyecto en `.github/copilot-instructions.md`.
2. Analiza la estructura actual del proyecto para identificar patrones existentes.
3. Genera la spec siguiendo el formato estándar ASSD.
4. Guarda el archivo como `.github/specs/${input:featureName:nombre-feature}.spec.md`.
5. Confirma la creación del archivo al usuario con un resumen de la spec.

Asegúrate de cubrir:
- Modelos de datos (Pydantic + MongoDB)
- Endpoints de API con request/response
- Componentes de React necesarios
- Plan de pruebas unitarias
