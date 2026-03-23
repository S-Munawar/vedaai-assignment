export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
}

export function getWsBaseUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_WS_URL || getApiBaseUrl();

  if (typeof window === 'undefined') {
    return configuredBase;
  }

  // Avoid mixed-content websocket failures on HTTPS pages.
  if (window.location.protocol === 'https:') {
    if (configuredBase.startsWith('ws://')) {
      return configuredBase.replace(/^ws:\/\//, 'wss://');
    }

    if (configuredBase.startsWith('http://')) {
      return configuredBase.replace(/^http:\/\//, 'https://');
    }
  }

  return configuredBase;
}

export function getApiUrl(path: string) {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
