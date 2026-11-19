import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabaseSchema } from './server/db.ts';
import { seedDatabaseIfEmpty } from './server/seed.ts';
import { initSocketServer } from './server/socket.ts';
import authRoutes from './server/routes/auth.ts';
import marketplaceRoutes from './server/routes/marketplace.ts';
import projectRoutes from './server/routes/projects.ts';
import orderRoutes from './server/routes/orders.ts';
import chatRoutes from './server/routes/chat.ts';
import adminRoutes from './server/routes/admin.ts';
import openapiRoutes from './server/openapi.ts';

export async function createAppServer() {
  initDatabaseSchema();
  seedDatabaseIfEmpty();

  const app = express();
  const httpServer = http.createServer(app);

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'QurilishHub API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api', marketplaceRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', orderRoutes);
  app.use('/api', chatRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', openapiRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (req.path.startsWith('/api')) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
      return;
    }
    res.status(500).send('Internal server error');
  });

  initSocketServer(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return { app, httpServer };
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isMainModule) {
  const PORT = Number(process.env.PORT || 3000);
  createAppServer()
    .then(({ httpServer }) => {
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`QurilishHub full-stack server running on http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start QurilishHub server:', err);
      process.exit(1);
    });
}
