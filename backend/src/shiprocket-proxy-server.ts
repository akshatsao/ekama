import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createShiprocketOrderDirect, ShiprocketOrderPayload } from './utils/shiprocket';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.PORT || 4001);
const proxyKey = process.env.SHIPROCKET_PROXY_KEY || '';

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/shiprocket/orders/create', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!proxyKey || token !== proxyKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const payload = req.body as ShiprocketOrderPayload;
    const data = await createShiprocketOrderDirect(payload);
    return res.json({ success: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Shiprocket proxy error';
    return res.status(500).json({ success: false, error: message });
  }
});

app.listen(port, () => {
  console.log(`Shiprocket proxy listening on port ${port}`);
});
