const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

type ShiprocketTokenCache = {
  token: string;
  expiresAt: number;
};

type ShiprocketLoginResponse = {
  token?: string;
};

export type ShiprocketOrderPayload = {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;
  payment_method: 'COD' | 'Prepaid';
  shipping_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
};

export type ShiprocketOrderResponse = {
  order_id?: number;
  shipment_id?: number;
  status?: string;
};

type ProxyOrderResponse = ShiprocketOrderResponse & { success?: boolean };

let tokenCache: ShiprocketTokenCache = {
  token: '',
  expiresAt: 0
};

const getEnvNumber = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTokenCacheValid = () => tokenCache.token && tokenCache.expiresAt > Date.now();

export const getShiprocketToken = async () => {
  if (getTokenCacheValid()) return tokenCache.token;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured');
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = (await res.json().catch(() => ({}))) as ShiprocketLoginResponse;
  if (!res.ok || !data.token) {
    const message = res.ok ? 'Shiprocket token missing in response' : `Shiprocket auth failed: ${res.status}`;
    throw new Error(message);
  }

  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 9
  };
  return data.token;
};

export const buildShiprocketOrderPayload = (input: {
  orderId: string;
  createdAt: Date | string;
  customerName: string;
  customerEmail: string;
  shippingPhone: string;
  addressLine: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ name: string; sku: string; quantity: number; price: number }>;
  paymentMethod: string;
  totalAmount: number;
}) => {
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
  const [firstName, ...rest] = input.customerName.split(' ').filter(Boolean);
  const lastName = rest.join(' ') || 'Customer';
  const orderDate = new Date(input.createdAt).toISOString().slice(0, 10);
  const length = getEnvNumber('SHIPROCKET_DEFAULT_LENGTH_CM', 10);
  const breadth = getEnvNumber('SHIPROCKET_DEFAULT_BREADTH_CM', 10);
  const height = getEnvNumber('SHIPROCKET_DEFAULT_HEIGHT_CM', 5);
  const weight = getEnvNumber('SHIPROCKET_DEFAULT_WEIGHT_KG', 0.5);

  const paymentMethod = input.paymentMethod === 'cod' ? 'COD' : 'Prepaid';
  const address2 = input.locality ? `${input.locality}` : undefined;

  const payload: ShiprocketOrderPayload = {
    order_id: input.orderId,
    order_date: orderDate,
    pickup_location: pickupLocation,
    billing_customer_name: firstName || 'Customer',
    billing_last_name: lastName,
    billing_address: input.addressLine,
    billing_address_2: address2,
    billing_city: input.city,
    billing_pincode: input.pincode,
    billing_state: input.state,
    billing_country: 'India',
    billing_email: input.customerEmail,
    billing_phone: input.shippingPhone,
    shipping_is_billing: true,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.price
    })),
    payment_method: paymentMethod,
    shipping_charges: 0,
    total_discount: 0,
    sub_total: input.totalAmount,
    length,
    breadth,
    height,
    weight
  };

  return payload;
};

export const createShiprocketOrder = async (payload: ShiprocketOrderPayload) => {
  const proxyUrlRaw = process.env.SHIPROCKET_PROXY_URL;
  if (proxyUrlRaw) {
    const proxyUrl = proxyUrlRaw.replace(/\/$/, '');
    const proxyKey = process.env.SHIPROCKET_PROXY_KEY || '';
    const res = await fetch(`${proxyUrl}/api/shiprocket/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyKey ? { Authorization: `Bearer ${proxyKey}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = (await res.json().catch(() => ({}))) as ProxyOrderResponse;
    if (!res.ok) {
      throw new Error(`Shiprocket proxy failed: ${res.status}`);
    }
    return data;
  }

  return createShiprocketOrderDirect(payload);
};

export const createShiprocketOrderDirect = async (payload: ShiprocketOrderPayload) => {
  const token = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = (await res.json().catch(() => ({}))) as ShiprocketOrderResponse;
  if (!res.ok) {
    throw new Error(`Shiprocket order create failed: ${res.status}`);
  }
  return data;
};
