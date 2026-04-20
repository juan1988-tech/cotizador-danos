import { Router } from 'express';
import {
  getAgents,
  getSubscribers,
  getGiros,
} from '../controllers/CatalogController';
import { validateCatalogQuery } from '../middlewares/validateRequest';

const router = Router();

// GET /catalogs/agents — proxy to core-ohs agents list
router.get('/agents', validateCatalogQuery, getAgents);

// GET /catalogs/subscribers — proxy to core-ohs subscribers list
router.get('/subscribers', validateCatalogQuery, getSubscribers);

// GET /catalogs/giros — proxy to core-ohs giros list
router.get('/giros', validateCatalogQuery, getGiros);

export default router;