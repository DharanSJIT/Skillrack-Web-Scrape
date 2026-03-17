import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profileRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: "Skillrack Backend API is running on Vercel" });
});

// API Endpoints
app.use('/api', profileRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke in the server!' });
});

export default app;
