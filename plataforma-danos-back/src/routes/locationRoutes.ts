import { Router } from 'express';
import {
  getLocations,
  patchLocation,
  postLayout,
  putLocations,
} from '../controllers/LocationController';
import {
  requireFields,
  validateFolioParam,
  validateIndexParam,
  validateVersionBody,
  validateLayout,
  validatePutLocations,
  validatePatchLocation,
} from '../middlewares/validateRequest';

// mergeParams allows `:folio` from the parent router to be visible here
const router = Router({ mergeParams: true });

// Validate folio format for all routes in this sub-router
router.use(validateFolioParam);

// POST /quotes/:folio/layout
router.post(
  '/layout',
  requireFields('version', 'tipoLayout', 'numeroUbicaciones'),
  validateVersionBody,
  validateLayout,
  postLayout,
);

// GET /quotes/:folio/locations
router.get('/locations', getLocations);

// PUT /quotes/:folio/locations
router.put(
  '/locations',
  requireFields('version', 'ubicaciones'),
  validateVersionBody,
  validatePutLocations,
  putLocations,
);

// PATCH /quotes/:folio/locations/:index
router.patch(
  '/locations/:index',
  validateIndexParam,
  requireFields('version'),
  validateVersionBody,
  validatePatchLocation,
  patchLocation,
);

export default router;
