import { Router } from 'express';
import {
  postQuote,
  getQuote,
  patchGeneralData,
  getCoverageOptions,
  putCoverageOptions,
  postCalculate,
} from '../controllers/QuoteController';
import {
  requireFields,
  validateFolioParam,
  validateVersionBody,
  validateGeneralData,
  validatePutCoverageOptions,
} from '../middlewares/validateRequest';

const router = Router();

// POST /quotes — initiate a new quote (no body required)
router.post('/', postQuote);

// GET /quotes/:folio — read full quote state
router.get(
  '/:folio',
  validateFolioParam,
  getQuote,
);

// PATCH /quotes/:folio/general-data — partial update of insured data
router.patch(
  '/:folio/general-data',
  validateFolioParam,
  requireFields('version'),
  validateVersionBody,
  validateGeneralData,
  patchGeneralData,
);

// GET /quotes/:folio/coverage-options — list available coverages
router.get(
  '/:folio/coverage-options',
  validateFolioParam,
  getCoverageOptions,
);

// PUT /quotes/:folio/coverage-options — persist selected coverages
router.put(
  '/:folio/coverage-options',
  validateFolioParam,
  requireFields('version', 'opcionesCobertura'),
  validateVersionBody,
  validatePutCoverageOptions,
  putCoverageOptions,
);

// POST /quotes/:folio/calculate — trigger premium calculation
router.post(
  '/:folio/calculate',
  validateFolioParam,
  requireFields('version'),
  validateVersionBody,
  postCalculate,
);

export default router;