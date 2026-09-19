const envApi = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const API_BASE = envApi ? envApi.replace(/\/+$/, '') : '/api/v1';

export function getFullApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE}${cleanEndpoint}`;
  if (!officerToken && citizenToken && endpoint === '/complaints') {
    try {
      const citizen = JSON.parse(localStorage.getItem('metricheck_citizen_user') || '{}');
      if (citizen.phone && !url.includes('phone=')) {
        url += (url.includes('?') ? '&' : '?') + `phone=${encodeURIComponent(citizen.phone)}`;
      }
    } catch {}
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `HTTP error ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}
