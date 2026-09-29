/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — CENTRAL FRONTEND API CONFIGURATION
 * Single origin architecture: All frontend requests route to relative /api
 * ==============================================================================
 */
const API_BASE_URL = '/api';
window.API_BASE_URL = API_BASE_URL;

/**
 * Standard Authenticated Fetch Wrapper
 * @param {string} endpoint - e.g. '/products' or '/auth/me'
 * @param {object} options - Standard fetch options
 */
async function apiRequest(endpoint, options = {}) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;
  
  const headers = { ...options.headers };
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include',
    headers
  };

  return fetch(url, config);
}

window.apiRequest = apiRequest;
