import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { operationsRouter } from './modules/operations/operations.routes.js';
import { authenticate } from './middlewares/auth.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { successResponse } from './lib/response.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => successResponse(res, { status: 'ok' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', authenticate, operationsRouter);

app.use(notFound);
app.use(errorHandler);

const shutdown = async () => {
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

httpServer.listen(env.PORT, () => {
  console.log(`TransitOps API listening on port ${env.PORT}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
