import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "https://skillrack.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...envOrigins,
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  // Allow Vercel preview/branch URLs for this frontend project
  return /^https:\/\/skillrack(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Skillrack Backend API is running on Vercel with Puppeteer",
  });
});

// API Endpoints
app.use("/api", profileRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke in the server!" });
});

export default app;
