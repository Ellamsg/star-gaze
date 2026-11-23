import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { appointmentRouter } from "./routes/appointment.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { categoryRouter } from "./routes/category.routes";
import { clientRouter } from "./routes/client.routes";
import { serviceRouter } from "./routes/service.routes";

const app = express();
// 5000 is taken by macOS AirPlay Receiver on many Macs, so the default is 4000.
const PORT = Number(process.env.PORT) || 4000;

/* ------------------------------- middleware ------------------------------- */

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --------------------------------- routes --------------------------------- */

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from the Express backend 👋" });
});

app.use("/api/services", serviceRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/clients", clientRouter);

/* ------------------------------ error handling ----------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

/* ---------------------------------- start --------------------------------- */

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export default app;