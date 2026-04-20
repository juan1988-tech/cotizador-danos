import { Router } from 'express';
import {
  createQuote,
  getQuote,
  patchGeneralData,
  getCoverageOptions,
  putCoverageOptions,
  calculatePremium,
} from '../controllers/QuoteController';
import { requireFields, validateGeneralData } from '../middlewares/validateRequest';

const router = Router();

// POST   /api/v1/quotes
router.post('/', createQuote);

// GET    /api/v1/quotes/:folio
router.get('/:folio', getQuote);

// PATCH  /api/v1/quotes/:folio/general-data
router.patch(
  '/:folio/general-data',
  requireFields('version'),
  validateGeneralData,
  patchGeneralData
);

// GET    /api/v1/quotes/:folio/coverage-options
router.get('/:folio/coverage-options', getCoverageOptions);

// PUT    /api/v1/quotes/:folio/coverage-options
router.put(
  '/:folio/coverage-options',
  requireFields('version', 'opcionesCobertura'),
  putCoverageOptions
);

// POST   /api/v1/quotes/:folio/calculate
router.post('/:folio/calculate', requireFields('version'), calculatePremium);

export default router;
