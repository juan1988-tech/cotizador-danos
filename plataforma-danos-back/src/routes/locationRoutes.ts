import { Router } from 'express';
import {
  postLayout,
  getLocations,
  putLocations,
  patchLocation,
} from '../controllers/LocationController';
import { requireFields, validateLayout } from '../middlewares/validateRequest';

const router = Router({ mergeParams: true });

// POST   /api/v1/quotes/:folio/layout
router.post(
  '/layout',
  requireFields('version', 'numeroUbicaciones', 'tipoLayout'),
  validateLayout,
  postLayout
);

// GET    /api/v1/quotes/:folio/locations
router.get('/locations', getLocations);

// PUT    /api/v1/quotes/:folio/locations
router.put('/locations', requireFields('version', 'ubicaciones'), putLocations);

// PATCH  /api/v1/quotes/:folio/locations/:index
router.patch('/locations/:index', requireFields('version'), patchLocation);

export default router;
