import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { startPassExpiryCron } from "./cron/passExpiryJob.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet());

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Configure CORS
// Allows only CLIENT_URL and http://localhost:5173
const allowedOrigins = Array.from(
  new Set(["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean))
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. Postman, curl, server-side monitors) with no origin
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin '${origin}' is not permitted.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "Blue Metal ERP Backend API",
      version: "1.0.0",
      docs: "/api/health"
    },
    message: "Blue Metal ERP API is operational"
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 Catch-All Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Blue Metal ERP Server running on PORT: ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Auth Base:    http://localhost:${PORT}/api/auth`);
  console.log(`  Allowed CORS: ${allowedOrigins.join(", ")}`);
  console.log(`===============================================`);

  // Start background cron jobs
  startPassExpiryCron();
});

// Graceful process termination
const handleGracefulShutdown = (signal) => {
  console.log(`\n[Process] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log("[Process] HTTP server closed. Exiting process.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));

export default app;
