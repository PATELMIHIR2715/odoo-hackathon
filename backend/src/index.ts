import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { vehiclesRouter } from "./modules/vehicle/vehicle.routes.js";
import { driversRouter } from "./modules/driver/driver.routes.js";
import { tripsRouter } from "./modules/trip/trip.routes.js";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { financeRouter } from "./modules/finance/finance.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { successResponse } from "./lib/response.js";

export const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => successResponse(res, { status: "ok" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/dashboard", authenticate, dashboardRouter);
app.use("/api/v1/vehicles", authenticate, vehiclesRouter);
app.use("/api/v1/drivers", authenticate, driversRouter);
app.use("/api/v1/trips", authenticate, tripsRouter);
app.use("/api/v1/maintenance", authenticate, maintenanceRouter);
app.use("/api/v1/finance", authenticate, financeRouter);
app.use("/api/v1/analytics", authenticate, analyticsRouter);

app.use(notFound);
app.use(errorHandler);

const shutdown = async () => {
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

if (env.NODE_ENV !== "test") {
  httpServer.listen(env.PORT, () => {
    console.log(`TransitOps API listening on port ${env.PORT}`);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
