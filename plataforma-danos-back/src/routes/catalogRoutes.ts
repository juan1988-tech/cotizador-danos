import { Router } from 'express';
import {
  getAgents,
  getSubscribers,
  getGiros,
  getPostalCode,
} from '../controllers/CatalogController';

const router = Router();

// GET /api/v1/catalogs/agents
router.get('/agents', getAgents);

// GET /api/v1/catalogs/subscribers
router.get('/subscribers', getSubscribers);

// GET /api/v1/catalogs/giros
router.get('/giros', getGiros);

// GET /api/v1/catalogs/postal-codes/:cp
router.get('/postal-codes/:cp', getPostalCode);

export default router;
