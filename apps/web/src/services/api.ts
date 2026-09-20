const rawEnvApi = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '');

export const API_BASE = (() => {
  if (!rawEnvApi) return '/api/v1';
  if (rawEnvApi.endsWith('/api/v1')) return rawEnvApi;
  if (rawEnvApi.endsWith('/api')) return `${rawEnvApi}/v1`;
  return `${rawEnvApi}/api/v1`;
})();

export function getFullApiUrl(endpoint: string): string {
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1', '');
  }
  return `${API_BASE}${cleanEndpoint}`;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const officerToken = localStorage.getItem('metricheck_token');
  const citizenToken = localStorage.getItem('metricheck_citizen_token');
  const token = officerToken || citizenToken;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1', '');
  }
  let url = `${API_BASE}${cleanEndpoint}`;
  if (!officerToken && citizenToken && endpoint === '/complaints') {
    try {
      const citizen = JSON.parse(localStorage.getItem('metricheck_citizen_user') || '{}');
      if (citizen.phone && !url.includes('phone=')) {
        url += (url.includes('?') ? '&' : '?') + `phone=${encodeURIComponent(citizen.phone)}`;
      }
    } catch {}
  }

  // Safety timeout: abort if server doesn't respond within 12 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP error ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('सर्वर प्रतिक्रिया समय समाप्त हुआ • Request timed out. Please check network and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
