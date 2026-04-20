import { OpenAPIV3 } from 'openapi-types';

// ─── Reusable schema components ───────────────────────────────────────────────

const ErrorResponse: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['error', 'message'],
  properties: {
    error:   { type: 'string', example: 'ValidationError' },
    message: { type: 'string', example: 'vigenciaFin debe ser posterior a vigenciaInicio' },
    details: { type: 'object', additionalProperties: true },
  },
};

const GarantiaInput: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['tipoGarantia', 'sumaAsegurada'],
  properties: {
    tipoGarantia:  { type: 'string', example: 'INCENDIO' },
    sumaAsegurada: { type: 'number', minimum: 0.01, example: 500000 },
  },
};

const GarantiaResumen: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['tipoGarantia', 'sumaAsegurada'],
  properties: {
    tipoGarantia:  { type: 'string', example: 'INCENDIO' },
    sumaAsegurada: { type: 'number', example: 500000 },
  },
};

const UbicacionResumen: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['indiceUbicacion', 'estadoValidacion', 'alertasBloqueantes', 'garantias', 'version'],
  properties: {
    indiceUbicacion:    { type: 'integer', example: 1 },
    descripcion:        { type: 'string', nullable: true, example: 'Bodega principal' },
    codigoPostal:       { type: 'string', nullable: true, example: '06600' },
    giroId:             { type: 'string', nullable: true, example: 'GIR-015' },
    estadoValidacion:   { type: 'string', enum: ['COMPLETA', 'INCOMPLETA'], example: 'COMPLETA' },
    alertasBloqueantes: { type: 'array', items: { type: 'string' } },
    garantias:          { type: 'array', items: { $ref: '#/components/schemas/GarantiaResumen' } },
    version:            { type: 'integer', example: 2 },
  },
};

const LocationsSummary: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['total', 'completas', 'incompletas'],
  properties: {
    total:       { type: 'integer', example: 3 },
    completas:   { type: 'integer', example: 2 },
    incompletas: { type: 'integer', example: 1 },
  },
};

const OpcionCobertura: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['codigoCobertura', 'descripcion', 'seleccionada', 'obligatoria'],
  properties: {
    codigoCobertura: { type: 'string', example: 'COB-001' },
    descripcion:     { type: 'string', example: 'Incendio y/o Rayo' },
    seleccionada:    { type: 'boolean', example: true },
    obligatoria:     { type: 'boolean', example: true },
  },
};

const DatosAsegurado: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    nombreAsegurado: { type: 'string', example: 'Empresa Ejemplo S.A. de C.V.' },
    rfcAsegurado:    { type: 'string', example: 'EEJ900101AAA' },
    agenteId:        { type: 'string', example: 'AGT-001' },
    suscriptorId:    { type: 'string', example: 'SUB-042' },
    tipoNegocio:     { type: 'string', example: 'Comercio al por menor' },
    giroId:          { type: 'string', example: 'GIR-015' },
    vigenciaInicio:  { type: 'string', format: 'date', example: '2026-05-01' },
    vigenciaFin:     { type: 'string', format: 'date', example: '2027-05-01' },
  },
};

const PrimaUbicacion: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['indiceUbicacion', 'primaNeta', 'primaComercial', 'desglose'],
  properties: {
    indiceUbicacion: { type: 'integer', example: 1 },
    primaNeta:       { type: 'number', example: 12500.50 },
    primaComercial:  { type: 'number', example: 15000.60 },
    desglose: {
      type: 'object',
      additionalProperties: { type: 'number' },
      example: { incendio: 8000, catNatural: 3000, interrupcionNegocio: 1500.5 },
    },
  },
};

// ─── Shared path param & error responses ─────────────────────────────────────

const folioParam: OpenAPIV3.ParameterObject = {
  name: 'folio',
  in: 'path',
  required: true,
  description: 'Número de folio de la cotización (alfanumérico, máx. 20 caracteres)',
  schema: { type: 'string', maxLength: 20, example: 'COT-2026-001' },
};

const indexParam: OpenAPIV3.ParameterObject = {
  name: 'index',
  in: 'path',
  required: true,
  description: 'Índice de la ubicación (entero 1-based)',
  schema: { type: 'integer', minimum: 1, example: 1 },
};

const qParam: OpenAPIV3.ParameterObject = {
  name: 'q',
  in: 'query',
  required: false,
  description: 'Filtro por nombre o código (máx. 100 caracteres)',
  schema: { type: 'string', maxLength: 100 },
};

function error(code: number, errorCode: string, description: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: { error: errorCode, message: description },
      },
    },
  };
}

// ─── OpenAPI document ─────────────────────────────────────────────────────────

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Cotizador de Daños — API',
    version: '1.0.0',
    description:
      'API REST para el sistema de cotización de seguros de daños. ' +
      'Cubre la creación de cotizaciones, configuración de ubicaciones, ' +
      'selección de coberturas, cálculo de prima y catálogos de referencia.',
    contact: {
      name: 'CoE DevArq',
    },
  },
  servers: [
    { url: '/api/v1', description: 'Versión actual (v1)' },
  ],
  tags: [
    { name: 'Quotes',    description: 'Gestión del ciclo de vida de una cotización' },
    { name: 'Locations', description: 'Configuración y edición de ubicaciones de riesgo' },
    { name: 'Catalogs',  description: 'Catálogos de referencia (proxy a Plataforma-core-ohs)' },
  ],
  components: {
    schemas: {
      ErrorResponse,
      GarantiaInput,
      GarantiaResumen,
      UbicacionResumen,
      LocationsSummary,
      OpcionCobertura,
      DatosAsegurado,
      PrimaUbicacion,
    },
  },
  paths: {

    // ── POST /quotes ──────────────────────────────────────────────────────────
    '/quotes': {
      post: {
        tags: ['Quotes'],
        summary: 'Iniciar nueva cotización',
        description:
          'Reserva un folio único en Plataforma-core-ohs y crea el registro de cotización en estado `EN_EDICION`.',
        operationId: 'postQuote',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: {},
            },
          },
        },
        responses: {
          '201': {
            description: 'Cotización creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        numeroFolio:              { type: 'string', example: 'COT-2026-001' },
                        estadoCotizacion:         { type: 'string', enum: ['EN_EDICION'], example: 'EN_EDICION' },
                        version:                  { type: 'integer', example: 1 },
                        fechaCreacion:            { type: 'string', format: 'date-time' },
                        fechaUltimaActualizacion: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    estadoCotizacion: 'EN_EDICION',
                    version: 1,
                    fechaCreacion: '2026-04-17T10:00:00.000Z',
                    fechaUltimaActualizacion: '2026-04-17T10:00:00.000Z',
                  },
                },
              },
            },
          },
          '503': error(503, 'CatalogServiceUnavailable', 'Plataforma-core-ohs no disponible para reservar folio'),
          '500': error(500, 'InternalServerError', 'Error inesperado del servidor'),
        },
      },
    },

    // ── /quotes/:folio ────────────────────────────────────────────────────────
    '/quotes/{folio}': {
      parameters: [folioParam],

      get: {
        tags: ['Quotes'],
        summary: 'Consultar cotización',
        description: 'Retorna el estado completo de una cotización: datos generales, layout, coberturas y primas.',
        operationId: 'getQuote',
        responses: {
          '200': {
            description: 'Cotización encontrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        numeroFolio:              { type: 'string', example: 'COT-2026-001' },
                        estadoCotizacion: {
                          type: 'string',
                          enum: ['EN_EDICION', 'DATOS_GENERALES_COMPLETOS', 'UBICACIONES_CONFIGURADAS', 'COBERTURAS_SELECCIONADAS', 'CALCULADA'],
                          example: 'DATOS_GENERALES_COMPLETOS',
                        },
                        datosAsegurado:           { $ref: '#/components/schemas/DatosAsegurado', nullable: true },
                        configuracionLayout: {
                          nullable: true,
                          type: 'object',
                          properties: {
                            numeroUbicaciones: { type: 'integer', example: 3 },
                            tipoLayout: { type: 'string', enum: ['UNIFORME', 'PERSONALIZADO'], example: 'UNIFORME' },
                          },
                        },
                        opcionesCobertura: {
                          nullable: true,
                          type: 'array',
                          items: { $ref: '#/components/schemas/OpcionCobertura' },
                        },
                        primasPorUbicacion: {
                          nullable: true,
                          type: 'object',
                          properties: {
                            primaNetaTotal:       { type: 'number', example: 12500.50 },
                            primaComercialTotal:  { type: 'number', example: 15000.60 },
                            primasPorUbicacion:   { type: 'array', items: { $ref: '#/components/schemas/PrimaUbicacion' } },
                            ubicacionesExcluidas: { type: 'array', items: { type: 'integer' } },
                          },
                        },
                        version:                  { type: 'integer', example: 2 },
                        fechaCreacion:            { type: 'string', format: 'date-time' },
                        fechaUltimaActualizacion: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    estadoCotizacion: 'DATOS_GENERALES_COMPLETOS',
                    datosAsegurado: {
                      nombreAsegurado: 'Empresa Ejemplo S.A. de C.V.',
                      rfcAsegurado: 'EEJ900101AAA',
                      agenteId: 'AGT-001',
                      suscriptorId: 'SUB-042',
                      tipoNegocio: 'Comercio al por menor',
                      giroId: 'GIR-015',
                      vigenciaInicio: '2026-05-01',
                      vigenciaFin: '2027-05-01',
                    },
                    configuracionLayout: null,
                    opcionesCobertura: null,
                    primasPorUbicacion: null,
                    version: 2,
                    fechaCreacion: '2026-04-17T10:00:00.000Z',
                    fechaUltimaActualizacion: '2026-04-17T10:05:00.000Z',
                  },
                },
              },
            },
          },
          '404': error(404, 'QuoteNotFound', "El folio indicado no existe"),
        },
      },
    },

    // ── PATCH /quotes/:folio/general-data ─────────────────────────────────────
    '/quotes/{folio}/general-data': {
      parameters: [folioParam],

      patch: {
        tags: ['Quotes'],
        summary: 'Actualizar datos generales',
        description:
          'Actualización parcial de los datos del asegurado. Los campos no enviados no se modifican. ' +
          'Avanza el estado a `DATOS_GENERALES_COMPLETOS` cuando todos los campos requeridos están presentes.',
        operationId: 'patchGeneralData',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version'],
                properties: {
                  nombreAsegurado: { type: 'string', minLength: 2, maxLength: 200, example: 'Empresa Ejemplo S.A. de C.V.' },
                  rfcAsegurado:    { type: 'string', pattern: '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$', example: 'EEJ900101AAA' },
                  agenteId:        { type: 'string', example: 'AGT-001' },
                  suscriptorId:    { type: 'string', example: 'SUB-042' },
                  tipoNegocio:     { type: 'string', maxLength: 100, example: 'Comercio al por menor' },
                  giroId:          { type: 'string', example: 'GIR-015' },
                  vigenciaInicio:  { type: 'string', format: 'date', example: '2026-05-01' },
                  vigenciaFin:     { type: 'string', format: 'date', example: '2027-05-01' },
                  version:         { type: 'integer', minimum: 1, example: 1 },
                },
              },
              example: {
                nombreAsegurado: 'Empresa Ejemplo S.A. de C.V.',
                rfcAsegurado: 'EEJ900101AAA',
                agenteId: 'AGT-001',
                suscriptorId: 'SUB-042',
                tipoNegocio: 'Comercio al por menor',
                giroId: 'GIR-015',
                vigenciaInicio: '2026-05-01',
                vigenciaFin: '2027-05-01',
                version: 1,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Datos generales actualizados',
            content: {
              'application/json': {
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    estadoCotizacion: 'DATOS_GENERALES_COMPLETOS',
                    datosAsegurado: {
                      nombreAsegurado: 'Empresa Ejemplo S.A. de C.V.',
                      rfcAsegurado: 'EEJ900101AAA',
                      agenteId: 'AGT-001',
                      suscriptorId: 'SUB-042',
                      tipoNegocio: 'Comercio al por menor',
                      giroId: 'GIR-015',
                      vigenciaInicio: '2026-05-01',
                      vigenciaFin: '2027-05-01',
                    },
                    version: 2,
                    fechaUltimaActualizacion: '2026-04-17T10:05:00.000Z',
                  },
                },
              },
            },
          },
          '400': error(400, 'ValidationError', 'RFC inválido o fechas en conflicto'),
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
          '409': {
            description: 'Conflicto de versión (optimistic locking)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: 'VersionConflict',
                  message: 'La versión enviada no coincide con la versión actual del registro.',
                  details: { expectedVersion: 2, currentVersion: 3 },
                },
              },
            },
          },
          '422': error(422, 'ExternalValidationError', 'agenteId, suscriptorId o giroId no existen en core-ohs'),
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },

    // ── POST /quotes/:folio/layout ────────────────────────────────────────────
    '/quotes/{folio}/layout': {
      parameters: [folioParam],

      post: {
        tags: ['Locations'],
        summary: 'Configurar layout de ubicaciones',
        description:
          'Define el número y tipo de ubicaciones. Si ya existía un layout, ajusta los registros de `locations` ' +
          '(agrega al final o elimina desde el final) conservando los datos ya capturados.',
        operationId: 'postLayout',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['numeroUbicaciones', 'tipoLayout', 'version'],
                properties: {
                  numeroUbicaciones: { type: 'integer', minimum: 1, maximum: 50, example: 3 },
                  tipoLayout:        { type: 'string', enum: ['UNIFORME', 'PERSONALIZADO'], example: 'UNIFORME' },
                  version:           { type: 'integer', minimum: 1, example: 2 },
                },
              },
              example: { numeroUbicaciones: 3, tipoLayout: 'UNIFORME', version: 2 },
            },
          },
        },
        responses: {
          '200': {
            description: 'Layout configurado',
            content: {
              'application/json': {
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    configuracionLayout: { numeroUbicaciones: 3, tipoLayout: 'UNIFORME' },
                    ubicacionesInicializadas: 3,
                    version: 3,
                    fechaUltimaActualizacion: '2026-04-17T10:10:00.000Z',
                  },
                },
              },
            },
          },
          '400': error(400, 'ValidationError', 'numeroUbicaciones fuera de rango o tipoLayout inválido'),
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
          '409': error(409, 'VersionConflict', 'La versión enviada no coincide con la actual'),
        },
      },
    },

    // ── GET /quotes/:folio/locations ──────────────────────────────────────────
    '/quotes/{folio}/locations': {
      parameters: [folioParam],

      get: {
        tags: ['Locations'],
        summary: 'Listar ubicaciones',
        description: 'Retorna todas las ubicaciones de la cotización con su estado de validación y garantías.',
        operationId: 'getLocations',
        responses: {
          '200': {
            description: 'Lista de ubicaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        ubicaciones: { type: 'array', items: { $ref: '#/components/schemas/UbicacionResumen' } },
                        resumen:     { $ref: '#/components/schemas/LocationsSummary' },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    ubicaciones: [
                      {
                        indiceUbicacion: 1,
                        descripcion: 'Bodega principal',
                        codigoPostal: '06600',
                        giroId: 'GIR-015',
                        estadoValidacion: 'COMPLETA',
                        alertasBloqueantes: [],
                        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
                        version: 2,
                      },
                      {
                        indiceUbicacion: 2,
                        descripcion: null,
                        codigoPostal: null,
                        giroId: null,
                        estadoValidacion: 'INCOMPLETA',
                        alertasBloqueantes: ['Código postal requerido'],
                        garantias: [],
                        version: 1,
                      },
                    ],
                    resumen: { total: 2, completas: 1, incompletas: 1 },
                  },
                },
              },
            },
          },
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
        },
      },

      put: {
        tags: ['Locations'],
        summary: 'Actualización masiva de ubicaciones',
        description:
          'Actualiza todas las ubicaciones de la cotización en una sola transacción. ' +
          'Cada elemento debe incluir su propia `version` para optimistic locking individual.',
        operationId: 'putLocations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ubicaciones', 'version'],
                properties: {
                  ubicaciones: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['indiceUbicacion', 'version'],
                      properties: {
                        indiceUbicacion: { type: 'integer', minimum: 1, example: 1 },
                        descripcion:     { type: 'string', maxLength: 200, example: 'Bodega principal' },
                        codigoPostal:    { type: 'string', example: '06600' },
                        giroId:          { type: 'string', example: 'GIR-015' },
                        garantias:       { type: 'array', items: { $ref: '#/components/schemas/GarantiaInput' } },
                        version:         { type: 'integer', minimum: 1, example: 1 },
                      },
                    },
                  },
                  version: { type: 'integer', minimum: 1, example: 3 },
                },
              },
              example: {
                ubicaciones: [
                  {
                    indiceUbicacion: 1,
                    descripcion: 'Bodega principal',
                    codigoPostal: '06600',
                    giroId: 'GIR-015',
                    garantias: [
                      { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
                      { tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 },
                    ],
                    version: 1,
                  },
                ],
                version: 3,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ubicaciones actualizadas',
            content: {
              'application/json': {
                example: {
                  data: {
                    ubicaciones: [
                      {
                        indiceUbicacion: 1,
                        descripcion: 'Bodega principal',
                        codigoPostal: '06600',
                        giroId: 'GIR-015',
                        estadoValidacion: 'COMPLETA',
                        alertasBloqueantes: [],
                        garantias: [
                          { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
                          { tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 },
                        ],
                        version: 2,
                      },
                    ],
                    resumen: { total: 1, completas: 1, incompletas: 0 },
                    version: 4,
                    fechaUltimaActualizacion: '2026-04-17T10:15:00.000Z',
                  },
                },
              },
            },
          },
          '400': error(400, 'ValidationError', 'sumaAsegurada ≤ 0 o campo de formato inválido'),
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
          '409': error(409, 'VersionConflict', 'Versión de cotización o de ubicación no coincide'),
          '422': error(422, 'ExternalValidationError', 'codigoPostal o giroId inválido en core-ohs'),
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },

    // ── PATCH /quotes/:folio/locations/:index ─────────────────────────────────
    '/quotes/{folio}/locations/{index}': {
      parameters: [folioParam, indexParam],

      patch: {
        tags: ['Locations'],
        summary: 'Editar una ubicación',
        description: 'Actualización parcial de una ubicación individual. Los campos no enviados no se modifican.',
        operationId: 'patchLocation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version'],
                properties: {
                  descripcion:  { type: 'string', maxLength: 200, example: 'Bodega secundaria' },
                  codigoPostal: { type: 'string', example: '44100' },
                  giroId:       { type: 'string', example: 'GIR-015' },
                  garantias:    { type: 'array', items: { $ref: '#/components/schemas/GarantiaInput' } },
                  version:      { type: 'integer', minimum: 1, example: 1 },
                },
              },
              example: {
                codigoPostal: '44100',
                garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 750000 }],
                version: 1,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ubicación actualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/UbicacionResumen' } },
                },
                example: {
                  data: {
                    indiceUbicacion: 1,
                    descripcion: 'Bodega secundaria',
                    codigoPostal: '44100',
                    giroId: 'GIR-015',
                    estadoValidacion: 'COMPLETA',
                    alertasBloqueantes: [],
                    garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 750000 }],
                    version: 2,
                  },
                },
              },
            },
          },
          '400': error(400, 'ValidationError', 'sumaAsegurada ≤ 0'),
          '404': error(404, 'LocationNotFound', 'El índice indicado no existe para este folio'),
          '409': error(409, 'VersionConflict', 'Versión de la ubicación no coincide'),
          '422': error(422, 'ExternalValidationError', 'codigoPostal o giroId inválido en core-ohs'),
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },

    // ── GET /quotes/:folio/coverage-options ───────────────────────────────────
    '/quotes/{folio}/coverage-options': {
      parameters: [folioParam],

      get: {
        tags: ['Quotes'],
        summary: 'Listar opciones de cobertura',
        description: 'Retorna las opciones de cobertura disponibles para la cotización. Si aún no se persistieron, retorna las opciones por defecto derivadas del giro.',
        operationId: 'getCoverageOptions',
        responses: {
          '200': {
            description: 'Opciones de cobertura',
            content: {
              'application/json': {
                example: {
                  data: {
                    opcionesCobertura: [
                      { codigoCobertura: 'COB-001', descripcion: 'Incendio y/o Rayo', seleccionada: true, obligatoria: true },
                      { codigoCobertura: 'COB-002', descripcion: 'Catástrofe Natural', seleccionada: false, obligatoria: false },
                      { codigoCobertura: 'COB-003', descripcion: 'Interrupción de Negocio', seleccionada: false, obligatoria: false },
                    ],
                  },
                },
              },
            },
          },
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
        },
      },

      put: {
        tags: ['Quotes'],
        summary: 'Guardar opciones de cobertura',
        description:
          'Persiste el arreglo completo de coberturas con su estado `seleccionada`. ' +
          'Si existe un cálculo previo lo invalida (limpia `primasPorUbicacion`). ' +
          'Las coberturas `obligatoria: true` no pueden tener `seleccionada: false`.',
        operationId: 'putCoverageOptions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['opcionesCobertura', 'version'],
                properties: {
                  opcionesCobertura: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['codigoCobertura', 'seleccionada'],
                      properties: {
                        codigoCobertura: { type: 'string', example: 'COB-001' },
                        seleccionada:    { type: 'boolean', example: true },
                      },
                    },
                  },
                  version: { type: 'integer', minimum: 1, example: 4 },
                },
              },
              example: {
                opcionesCobertura: [
                  { codigoCobertura: 'COB-001', seleccionada: true },
                  { codigoCobertura: 'COB-002', seleccionada: true },
                  { codigoCobertura: 'COB-003', seleccionada: false },
                ],
                version: 4,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Coberturas guardadas',
            content: {
              'application/json': {
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    opcionesCobertura: [
                      { codigoCobertura: 'COB-001', descripcion: 'Incendio y/o Rayo', seleccionada: true, obligatoria: true },
                      { codigoCobertura: 'COB-002', descripcion: 'Catástrofe Natural', seleccionada: true, obligatoria: false },
                      { codigoCobertura: 'COB-003', descripcion: 'Interrupción de Negocio', seleccionada: false, obligatoria: false },
                    ],
                    calculoInvalidado: false,
                    version: 5,
                    fechaUltimaActualizacion: '2026-04-17T10:20:00.000Z',
                  },
                },
              },
            },
          },
          '400': error(400, 'MissingRequiredField', 'Campo version no enviado'),
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
          '409': error(409, 'VersionConflict', 'La versión enviada no coincide con la actual'),
          '422': {
            description: 'Cobertura obligatoria no puede ser deseleccionada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: 'ObligatoryCoberturaCantBeDeselected',
                  message: 'La cobertura COB-001 es obligatoria y no puede ser deseleccionada.',
                  details: { codigoCobertura: 'COB-001' },
                },
              },
            },
          },
        },
      },
    },

    // ── POST /quotes/:folio/calculate ─────────────────────────────────────────
    '/quotes/{folio}/calculate': {
      parameters: [folioParam],

      post: {
        tags: ['Quotes'],
        summary: 'Calcular prima',
        description:
          'Ejecuta el cálculo de prima neta y comercial para todas las ubicaciones en estado `COMPLETA`. ' +
          'Las ubicaciones `INCOMPLETA` se excluyen y se listan en `ubicacionesExcluidas`. ' +
          'El estado de la cotización pasa a `CALCULADA`.',
        operationId: 'postCalculate',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version'],
                properties: {
                  version: { type: 'integer', minimum: 1, example: 5 },
                },
              },
              example: { version: 5 },
            },
          },
        },
        responses: {
          '200': {
            description: 'Cálculo ejecutado',
            content: {
              'application/json': {
                example: {
                  data: {
                    numeroFolio: 'COT-2026-001',
                    estadoCotizacion: 'CALCULADA',
                    primaNetaTotal: 12500.50,
                    primaComercialTotal: 15000.60,
                    primasPorUbicacion: [
                      {
                        indiceUbicacion: 1,
                        primaNeta: 12500.50,
                        primaComercial: 15000.60,
                        desglose: { incendio: 8000, catNatural: 3000, interrupcionNegocio: 1500.5 },
                      },
                    ],
                    ubicacionesExcluidas: [2],
                    version: 6,
                    fechaUltimaActualizacion: '2026-04-17T10:30:00.000Z',
                  },
                },
              },
            },
          },
          '400': error(400, 'MissingRequiredField', 'Campo version no enviado'),
          '404': error(404, 'QuoteNotFound', 'El folio indicado no existe'),
          '409': error(409, 'VersionConflict', 'La versión enviada no coincide con la actual'),
          '422': {
            description: 'Sin ubicaciones válidas o sin cobertura seleccionada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: 'NoValidLocationsForCalculation',
                  message: 'No existen ubicaciones válidas para calcular.',
                  details: { ubicacionesIncompletas: [1, 2, 3] },
                },
              },
            },
          },
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible al obtener tarifas'),
        },
      },
    },

    // ── GET /catalogs/agents ──────────────────────────────────────────────────
    '/catalogs/agents': {
      get: {
        tags: ['Catalogs'],
        summary: 'Listar agentes',
        description: 'Retorna la lista de agentes disponibles. Proxy hacia Plataforma-core-ohs.',
        operationId: 'getAgents',
        parameters: [qParam],
        responses: {
          '200': {
            description: 'Lista de agentes',
            content: {
              'application/json': {
                example: {
                  data: [
                    { id: 'AGT-001', nombre: 'Juan Pérez', codigo: 'JP001' },
                    { id: 'AGT-002', nombre: 'María López', codigo: 'ML002' },
                  ],
                  total: 2,
                },
              },
            },
          },
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },

    // ── GET /catalogs/subscribers ─────────────────────────────────────────────
    '/catalogs/subscribers': {
      get: {
        tags: ['Catalogs'],
        summary: 'Listar suscriptores',
        description: 'Retorna la lista de suscriptores disponibles. Proxy hacia Plataforma-core-ohs.',
        operationId: 'getSubscribers',
        parameters: [qParam],
        responses: {
          '200': {
            description: 'Lista de suscriptores',
            content: {
              'application/json': {
                example: {
                  data: [
                    { id: 'SUB-001', nombre: 'Suscriptor Alfa', codigo: 'SA001' },
                  ],
                  total: 1,
                },
              },
            },
          },
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },

    // ── GET /catalogs/giros ───────────────────────────────────────────────────
    '/catalogs/giros': {
      get: {
        tags: ['Catalogs'],
        summary: 'Listar giros económicos',
        description: 'Retorna la lista de giros económicos. Proxy hacia Plataforma-core-ohs.',
        operationId: 'getGiros',
        parameters: [qParam],
        responses: {
          '200': {
            description: 'Lista de giros',
            content: {
              'application/json': {
                example: {
                  data: [
                    { id: 'GIR-015', nombre: 'Comercio al por menor de abarrotes', claveIncendio: 'INC-03' },
                    { id: 'GIR-099', nombre: 'Almacenamiento de sustancias peligrosas', claveIncendio: null },
                  ],
                  total: 2,
                },
              },
            },
          },
          '503': error(503, 'CatalogServiceUnavailable', 'core-ohs no disponible'),
        },
      },
    },
  },
};
