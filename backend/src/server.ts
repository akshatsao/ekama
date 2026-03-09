// ⚠️ Dev-only: disable TLS certificate verification to fix Atlas SSL handshake errors
// Must be set before any imports that use TLS (dotenv not yet loaded here)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import routes
import collectionRoutes from './routes/collections';
import paymentRoutes from './routes/payments';
import productRoutes from './routes/products';
import settingsRoutes from './routes/settings';
import userRoutes from './routes/users';
import adminCouponsRoute from './routes/admin/coupons';
import customerCouponsRoute from './routes/customer/coupons';
import { initDatabase } from './utils/database';
import { getUploadsDir } from './utils/paths';

const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the API Gateway proxy so rate-limiter sees correct client IP instead of '127.0.0.1'
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration — allow any localhost origin in dev so Vite (5173 / 8080 / etc.) works
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://ekama-one.vercel.app',
  'https://ekama-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 in development
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Check if origin matches allowedOrigins (with trailing slash flexibility)
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      const normalizedOrigin = origin.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin;
    });

    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images with cross-origin headers
const unifiedUploadPath = getUploadsDir();
const uploadPaths = [
  unifiedUploadPath,
  path.join(__dirname, '../public/uploads'),
  path.join(process.cwd(), 'public/uploads'),
  path.join(process.cwd(), 'backend/public/uploads')
];

// Use a Set to ensure we only mount each unique path once
const uniquePaths = Array.from(new Set(uploadPaths));

uniquePaths.forEach(uploadPath => {
  if (fs.existsSync(uploadPath)) {
    console.log(`[Static] Serving uploads from: ${uploadPath}`);
    app.use('/uploads', express.static(uploadPath, {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://ekama-one.vercel.app');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      }
    }));
  }
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Coupon APIs
app.use('/api/admin/coupons', adminCouponsRoute);
app.use('/api/customer/coupons', customerCouponsRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint to check path existence
app.get('/api/debug-paths', (req, res) => {
  const dirs = {
    cwd: process.cwd(),
    __dirname: __dirname,
    node_env: process.env.NODE_ENV,
    checks: uploadPaths.map(p => ({
      path: p,
      exists: fs.existsSync(p),
      contents: fs.existsSync(p) ? fs.readdirSync(p).slice(0, 10) : []
    }))
  };
  res.json(dirs);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const error = err instanceof Error ? err : new Error('Unknown error');
  console.error(error.stack);

  // Log error to a file for debugging
  try {
    const logPath = path.resolve(__dirname, '../error_log.txt');
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${error.stack}\n\n`;
    fs.appendFileSync(logPath, logEntry);
  } catch (logErr) {
    console.error('Failed to write to error log file', logErr);
  }

  // Handle Multer errors specially
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message === 'File too large'
        ? 'Image file is too large. Max limit is 10MB.'
        : err.message
    });
  }

  return res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});



initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });

export default app;
// Trigger restart
