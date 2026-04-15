const DEFAULT_LOCAL_ORIGIN = 'http://localhost:8080';

const PRODUCTION_ONLY_HTTPS_PROTOCOL = 'https:';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeOrigin = (origin: string): string => {
  return origin.trim().replace(/\/+$/, '');
};

const getPublicOrigin = (envName: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'): string => {
  const value = process.env[envName];

  if (value && value.trim().length > 0) {
    return normalizeOrigin(value);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[Config] Missing required public env: ${envName}`);
  }

  return DEFAULT_LOCAL_ORIGIN;
};

const assertHttpsInProduction = (url: string, envName: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'): string => {
  if (process.env.NODE_ENV !== 'production') {
    return url;
  }

  const parsed = new URL(url);
  if (LOCAL_HOSTNAMES.has(parsed.hostname)) {
    return url;
  }

  if (parsed.protocol !== PRODUCTION_ONLY_HTTPS_PROTOCOL) {
    throw new Error(`[Config] ${envName} must use https in production. Received: ${url}`);
  }

  return url;
};

export const getApiBaseUrl = (): string => {
  const apiOrigin = getPublicOrigin('NEXT_PUBLIC_API_URL');
  return assertHttpsInProduction(apiOrigin, 'NEXT_PUBLIC_API_URL');
};

export const getWebSocketBaseUrl = (): string => {
  const wsOrigin = getPublicOrigin('NEXT_PUBLIC_WS_URL');
  return assertHttpsInProduction(wsOrigin, 'NEXT_PUBLIC_WS_URL');
};
