// ==============================================================================
// HOUSE OF SHUBHANSHI — CENTRALIZED API CLIENT
// ==============================================================================

// In browser, ALWAYS use relative '/api' so cookies are first-party and proxy via Next.js rewrites
// In SSR (server-side), route directly to backend host without exposing to client
const API_BASE = typeof window !== 'undefined'
  ? '/api'
  : ((process.env.BACKEND_URL || process.env.INTERNAL_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api');

async function request(endpoint, options = {}) {
  // Normalize endpoint to prevent double /api/api
  let clean = endpoint;
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // Keep absolute url intact
  } else {
    if (clean.startsWith('/api/')) {
      clean = clean.slice(4);
    } else if (clean.startsWith('/api')) {
      clean = clean.slice(4);
    } else if (clean.startsWith('api/')) {
      clean = clean.slice(3);
    }
    const formatted = clean.startsWith('/') ? clean : `/${clean}`;
    clean = `${API_BASE}${formatted}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Always enforce HTTP-only auth cookies
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(clean, config);
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const message = (data && data.message)
        || (data && data.errors && Object.values(data.errors).join(', '))
        || `Request failed with status ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Provide clean, friendly message on network disconnection or server unreachable
    if (
      err.name === 'TypeError' ||
      (err.message && (
        err.message.includes('fetch') ||
        err.message.includes('network') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('ECONNREFUSED')
      ))
    ) {
      const connErr = new Error('Unable to connect to the server. Please try again.');
      connErr.status = 503;
      connErr.originalError = err;
      throw connErr;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  request,
  API_BASE
};

export default api;
