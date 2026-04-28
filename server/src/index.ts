import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import passportSetup from "./middleware/passport";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Passport init
app.use(passportSetup.initialize());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);

// Health check (must be before customerRoutes which requires auth)
app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/admin", adminRoutes);
app.use("/api", customerRoutes);

// Centralised error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 PropertyPortal API running on http://localhost:${PORT}\n`);
});

export default app;
