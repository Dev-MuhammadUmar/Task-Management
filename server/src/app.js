import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Management API is running',
  });
});

app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
