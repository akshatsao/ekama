const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
const IS_PROD = import.meta.env.PROD && !isLocal;
const PROD_API_URL = 'https://ekama.onrender.com';
const DEV_API_URL = 'http://localhost:3001';

const BASE_URL = import.meta.env.VITE_API_URL || (IS_PROD ? PROD_API_URL : DEV_API_URL);

if (IS_PROD) {
  console.log('[API] Environment: Production');
  console.log(`[API] Using Base URL: ${BASE_URL}`);
}

export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) return imagePath;

  // If it starts with /images, it is a static asset in the frontend public folder
  if (imagePath.startsWith('/images')) return imagePath;

  // Otherwise, if it starts with / or is a relative path, we assume it's a backend upload
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${cleanPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;

  // Try to get token from localStorage for automatic authentication
  let token: string | null = null;
  try {
    const raw = localStorage.getItem("ekama-auth-v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.token || null;
    }
  } catch (e) {
    console.error('[apiFetch] Error reading auth token:', e);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed: ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export { BASE_URL };
