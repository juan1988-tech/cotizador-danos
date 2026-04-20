import { Router } from 'express';
import quoteRoutes from './quoteRoutes';
import locationRoutes from './locationRoutes';
import catalogRoutes from './catalogRoutes';

const router = Router();

router.use('/quotes', quoteRoutes);
router.use('/quotes', locationRoutes);
router.use('/catalogs', catalogRoutes);

export default router;
