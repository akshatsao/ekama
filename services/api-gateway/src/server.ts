import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const app = express();
const PORT = Number(process.env.GATEWAY_PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Trust the proxy (e.g. Nginx, Load Balancer) so rate limits use correct client IP
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS: allow the SPA
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Rate limit to protect gateway
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000 });
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', gateway: true, backend: BACKEND_URL });
});

// Proxies: forward to current backend
const proxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path: string) => path, // keep /api/... as-is
  onProxyRes: function (proxyRes: any, req: any, res: any) {
    if (req.url?.includes('/stream')) {
      proxyRes.headers['Cache-Control'] = 'no-cache';
      proxyRes.headers['Connection'] = 'keep-alive';
    }
  },
};

app.use('/api/products', createProxyMiddleware(proxyOptions));
app.use('/api/collections', createProxyMiddleware(proxyOptions));
app.use('/api/users', createProxyMiddleware(proxyOptions));
app.use('/api/settings', createProxyMiddleware(proxyOptions));
app.use('/api/payments', createProxyMiddleware({ ...proxyOptions, timeout: 0 }));
app.use('/uploads', createProxyMiddleware(proxyOptions));

// Fallback 404
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Gateway route not found' });
});

app.listen(PORT, () => {
  console.log(`🛡️  API Gateway running on port ${PORT}`);
  console.log(`↔️  Proxying to backend at ${BACKEND_URL}`);
  console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
});

export default app;
// Trigger restart again
