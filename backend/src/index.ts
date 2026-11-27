import "dotenv/config";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { analyticsRouter } from "./routes/analytics.routes";
import { appointmentRouter } from "./routes/appointment.routes";
import { authRouter } from "./routes/auth.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { categoryRouter } from "./routes/category.routes";
import { clientRouter } from "./routes/client.routes";
import { serviceRouter } from "./routes/service.routes";
import { uploadRouter } from "./routes/upload.routes";

const app = express();
// 5000 is taken by macOS AirPlay Receiver on many Macs, so the default is 4000.
const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV === "production") {
  // Trust the first proxy so rate limiting sees the real client IP.
  app.set("trust proxy", 1);
}

/* ------------------------------- middleware ------------------------------- */

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Browsers send Origin on state-changing requests. Reject anything that is
 * not the admin app, which is a cheap second layer behind SameSite=Strict.
 * Non-browser clients (curl, scripts) have no Origin and are allowed.
 */
app.use((req: Request, res: Response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");

  if (origin && !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "Request origin is not allowed" });
    return;
  }

  next();
});

/* --------------------------------- routes --------------------------------- */

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from the Express backend 👋" });
});

app.use("/api/auth", authRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/services", serviceRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/clients", clientRouter);
app.use("/api/uploads", uploadRouter); // ← add this
/* ------------------------------ error handling ----------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

/* ---------------------------------- start --------------------------------- */

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export default app;