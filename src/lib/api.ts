const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
