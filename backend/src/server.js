import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from project root (2 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import versesRoutes from './routes/verses.js';
import studyContentRoutes from './routes/studyContent.js';
import scheduleRoutes from './routes/schedule.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false  // Configure production origins as needed
    : 'http://localhost:5173',  // Restrict to Vite dev server in development
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/verses', versesRoutes);
app.use('/api/study-content', studyContentRoutes);
app.use('/api/schedule', scheduleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bible Study API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📖 Bible Study API ready`);
  console.log(`📝 AUTH_PASSWORD is ${process.env.AUTH_PASSWORD ? 'SET' : 'NOT SET'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/courses`);
  console.log(`  GET    /api/courses/all`);
  console.log(`  GET    /api/courses/:id`);
  console.log(`  POST   /api/courses`);
  console.log(`  PUT    /api/courses/:id`);
  console.log(`  DELETE /api/courses/:id`);
  console.log(`  POST   /api/verses`);
  console.log(`  POST   /api/verses/bulk`);
  console.log(`  PUT    /api/verses/:id`);
  console.log(`  DELETE /api/verses/:id`);
  console.log(`  GET    /api/study-content/:courseId`);
  console.log(`  POST   /api/study-content`);
  console.log(`  DELETE /api/study-content/:courseId`);
  console.log(`  GET    /api/schedule`);
  console.log(`  GET    /api/schedule/all`);
  console.log(`  POST   /api/schedule`);
  console.log(`  PUT    /api/schedule/:id`);
  console.log(`  PATCH  /api/schedule/:id/visibility`);
  console.log(`  DELETE /api/schedule/:id`);
  console.log(`  POST   /api/schedule/auto-populate`);
  console.log(`  POST   /api/schedule/sync-from-courses\n`);
});
