import { Router } from 'express';
import quoteRoutes from './quoteRoutes';
import locationRoutes from './locationRoutes';
import catalogRoutes from './catalogRoutes';

const router = Router();

// Quote-level routes: create, read, general-data, coverage-options, calculate
router.use('/quotes', quoteRoutes);

// Location-specific routes nested under a quote folio
router.use('/quotes/:folio', locationRoutes);

// Catalog proxy routes: agents, subscribers, giros
router.use('/catalogs', catalogRoutes);

export default router;
