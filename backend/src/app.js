import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "https://skillrack.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...envOrigins,
];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin) and configured frontends
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
