import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes/index';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { apiLimiter } from './middlewares/rateLimiter';
import { swaggerDocument } from './config/swagger';

const app = express();

app.use(cors());
app.use(requestLogger);
app.use(express.json());

// Rate limiting applied to all versioned API routes (LIN-DEV-010)
app.use('/api/v1', apiLimiter);

// OpenAPI docs — available at /api/docs (excluded from error handler scope)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Cotizador de Daños — API Docs',
  swaggerOptions: { defaultModelsExpandDepth: -1 },
}));

// All API routes are versioned under /api/v1
app.use('/api/v1', apiRoutes);

// Global error handler — must be registered after routes
app.use(errorHandler);

export default app;
