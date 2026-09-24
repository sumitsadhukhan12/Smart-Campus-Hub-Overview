import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth.ts';
import noticeRoutes from './server/routes/notices.ts';
import eventRoutes from './server/routes/events.ts';
import complaintRoutes from './server/routes/complaints.ts';
import lostFoundRoutes from './server/routes/lostFound.ts';
import resourceRoutes from './server/routes/resources.ts';
import notificationRoutes from './server/routes/notifications.ts';
import analyticsRoutes from './server/routes/analytics.ts';
import searchRoutes from './server/routes/search.ts';
import userRoutes from './server/routes/users.ts';
import aiRoutes from './server/routes/ai.ts';
import { getDatabase, resetDatabase } from './server/db.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize database
  getDatabase();

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      application: 'Smart Campus Hub',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Demo DB reset utility
  app.post('/api/seed/reset', (req, res) => {
    resetDatabase();
    res.json({ success: true, message: 'Campus database reset to initial demo state.' });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/notices', noticeRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/lost-found', lostFoundRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`[Smart Campus Hub] Server running on http://localhost:${PORT}`);
  });
}

startServer();
