# Diccionario de Dominio de Negocio

> Este archivo es leído por el agente `spec-generator` (Paso 2 del pipeline GAIDD) para validar que los términos sean unívocos.

## Términos canónicos

| Término | Definición canónica |
|---|---|
| **Cotización** | Proceso de evaluación y cálculo del costo de un seguro basado en el riesgo y las coberturas seleccionadas. |
| **Folio** (`numeroFolio`) | Identificador único de una cotización dentro del sistema. |
| **Estado de Cotización** (`estadoCotizacion`) | Situación actual de la cotización dentro del flujo (ej. en edición, calculada, incompleta). |
| **Asegurado** (`datosAsegurado`) | Persona o entidad que recibe la protección del seguro. |
| **Agente** | Intermediario autorizado que gestiona o comercializa seguros. |
| **Suscriptor** | Entidad o rol encargado de evaluar y aceptar riesgos para emitir seguros. |
| **Riesgo** | Probabilidad de ocurrencia de un evento que puede generar pérdidas económicas. |
| **Clasificación de Riesgo** (`clasificacionRiesgo`) | Categoría que agrupa el riesgo según su naturaleza o nivel de exposición. |
| **Tipo de Negocio** (`tipoNegocio`) | Segmento o giro económico al que pertenece el asegurado. |
| **Ubicación de Riesgo** | Lugar físico donde se encuentra el bien o actividad asegurada. |
| **Layout de Ubicaciones** (`configuracionLayout`) | Configuración estructural que define cómo se organizan y capturan las ubicaciones en la cotización. |
| **Ubicación** | Entidad que representa un punto físico asegurado con características propias. |
| **Código Postal** (`codigoPostal`) | Identificador geográfico utilizado para validar ubicación y determinar factores de riesgo. |
| **Giro** | Actividad económica asociada a la ubicación asegurada. |
| **giro.claveIncendio** | Clave técnica del giro utilizada para consultar la tarifa de incendio correspondiente. |
| **Garantía** | Cobertura específica incluida en el seguro que protege contra un riesgo determinado. |
| **Cobertura** (`opcionesCobertura`) | Conjunto de riesgos que el seguro protege bajo ciertas condiciones. |
| **Suma Asegurada** | Monto máximo que la aseguradora pagará en caso de siniestro. |
| **Prima** | Costo que paga el asegurado por la cobertura del seguro. |
| **Prima Neta** (`primaNeta`) | Costo del seguro sin incluir impuestos ni recargos adicionales. |
| **Prima Comercial** (`primaComercial`) | Costo total del seguro incluyendo gastos, recargos e impuestos. |
| **Prima por Ubicación** (`primasPorUbicacion`) | Costo del seguro calculado individualmente para cada ubicación. |
| **Desglose Financiero** | Detalle de cómo se compone la prima total (por ubicación, coberturas y factores). |
| **Parámetros de Cálculo** (`parametros_calculo`) | Valores globales utilizados para convertir la prima técnica en prima comercial. |
| **Tarifa** | Valor o tasa base utilizada para calcular la prima según el riesgo. |
| **Factor Técnico** | Coeficiente que ajusta la prima según condiciones específicas del riesgo. |
| **Zona Catastrófica** (`zonaCatastrofica`) | Clasificación geográfica que indica exposición a eventos de alto impacto. |
| **Validación** | Proceso de verificación de que los datos cumplen reglas de negocio. |
| **Ubicación Incompleta** | Ubicación que no cumple con los datos mínimos requeridos para cálculo (sin código postal válido, sin `giro.claveIncendio` o sin garantías tarifables). |
| **Alerta** (`alertasBloqueantes`) | Notificación generada cuando existen inconsistencias o datos faltantes en una ubicación. |
| **Estado de Validación** (`estadoValidacion`) | Indicador del nivel de completitud y validez de una ubicación. |
| **Idempotencia** | Propiedad de una operación que permite ejecutarla múltiples veces sin cambiar el resultado. Aplica a la creación de folios. |
| **Versionado** (`version`) | Control de cambios que incrementa una versión al modificar la cotización. Implementado como optimistic locking. |
| **Agregado** | Entidad principal del dominio que agrupa y controla la consistencia de la cotización. La cotización es el agregado raíz. |
| **Persistencia** | Proceso de almacenamiento de datos en la base de datos. |
| **Endpoint** | Punto de acceso a un servicio backend mediante HTTP. |
| **Catálogo** | Conjunto de datos de referencia (ej. agentes, giros, códigos postales) provistos por `Plataforma-core-ohs`. |
| **Siniestro** | Evento que genera una pérdida cubierta por el seguro. |
| **Metadatos** | Información adicional que describe o contextualiza la cotización (fecha de creación, usuario, etc.). |
| **Cálculo de Prima** | Proceso técnico que determina el costo del seguro a partir de riesgos y tarifas. |
| **Prima Total** | Suma de todas las primas calculadas por ubicación y coberturas. |
| **Resultado Financiero** | Conjunto de valores finales derivados del cálculo: `primaNeta`, `primaComercial` y `primasPorUbicacion`. |

## Componentes del desglose de prima por ubicación

| Componente | Descripción |
|---|---|
| Incendio edificios | Prima por cobertura de incendio sobre la estructura del edificio |
| Incendio contenidos | Prima por cobertura de incendio sobre el contenido del inmueble |
| Extensión de cobertura | Prima por coberturas adicionales a incendio básico |
| CAT TEV | Prima por riesgo catastrófico (Terremoto, Erupción Volcánica) |
| CAT FHM | Prima por riesgo catastrófico (Fenómenos Hidrometeorológicos) |
| Remoción de escombros | Prima por gastos de remoción post-siniestro |
| Gastos extraordinarios | Prima por gastos imprevistos derivados de un siniestro |
| Pérdida de rentas | Prima por pérdida de ingresos por renta durante reparación |
| BI (Business Interruption) | Prima por interrupción del negocio |
| Equipo electrónico | Prima por cobertura de equipo electrónico |
| Robo | Prima por cobertura de robo |
| Dinero y valores | Prima por cobertura de efectivo y valores |
| Vidrios | Prima por cobertura de rotura de vidrios |
| Anuncios luminosos | Prima por cobertura de anuncios luminosos |

## Reglas semánticas del dominio

1. El identificador canónico de la cotización es `numeroFolio` — no usar "id", "folio_id" ni variantes.
2. `version` es un entero gestionado por trigger de BD; nunca modificar manualmente.
3. `primaNeta`, `primaComercial` y `primasPorUbicacion` deben persistirse en una única operación lógica — nunca por separado.
4. Una ubicación incompleta genera alerta pero **no impide** calcular las demás ubicaciones válidas.
5. Las escrituras sobre la cotización se hacen por actualización parcial (PATCH/PUT de sección).
6. `fechaUltimaActualizacion` se actualiza automáticamente en cada modificación vía trigger.

## Ambigüedades comunes a evitar

- "Prima" sin calificador — siempre especificar: prima neta, prima comercial o prima por ubicación.
- "Folio" como sinónimo de "cotización" — el folio es el identificador; la cotización es el agregado completo.
- "Catálogo" propio vs. "Catálogo de core" — los catálogos de referencia (agentes, giros, CPs) son externos (`Plataforma-core-ohs`).
- "Cobertura" vs. "Garantía" — garantía es la unidad individual; cobertura es el conjunto de garantías aplicadas.

