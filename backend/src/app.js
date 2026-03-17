import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRoutes from './routes/profileRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from root directory where index.html is located (if any)
app.use(express.static(path.join(__dirname, '..', '..')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

// API Endpoints
app.use('/api', profileRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke in the server!' });
});

export default app;
