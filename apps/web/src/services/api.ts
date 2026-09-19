const API_BASE = '/api/v1';

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

  let url = `${API_BASE}${endpoint}`;
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
