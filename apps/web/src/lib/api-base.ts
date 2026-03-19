export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
}

export function getWsBaseUrl() {
  return process.env.NEXT_PUBLIC_WS_URL || getApiBaseUrl();
}

export function getApiUrl(path: string) {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
