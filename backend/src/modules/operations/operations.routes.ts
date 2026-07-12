import { Router } from 'express';
import { vehiclesRouter } from './vehicles.routes.js';
import { driversRouter } from './drivers.routes.js';
import { tripsRouter } from './trips.routes.js';
import { maintenanceRouter } from './maintenance.routes.js';
import { financeRouter } from './finance.routes.js';

export const operationsRouter = Router();

operationsRouter.use('/vehicles', vehiclesRouter);
operationsRouter.use('/drivers', driversRouter);
operationsRouter.use('/trips', tripsRouter);
operationsRouter.use('/maintenance', maintenanceRouter);
operationsRouter.use('/', financeRouter);
