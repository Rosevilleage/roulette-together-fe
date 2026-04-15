const DEFAULT_LOCAL_ORIGIN = 'http://localhost:8080';

const PRODUCTION_ONLY_HTTPS_PROTOCOL = 'https:';
const PRODUCTION_ONLY_WSS_PROTOCOL = 'wss:';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeOrigin = (origin: string): string => {
  return origin.trim().replace(/\/+$/, '');
};

const resolvePublicEnv = (envName: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'): string | undefined => {
  // Next.js는 빌드 타임에 process.env.NEXT_PUBLIC_* 를 정적 치환합니다.
  // 동적 bracket 접근(process.env[variable])은 webpack DefinePlugin이 치환하지 못하므로
  // 반드시 정적 프로퍼티 접근으로 분기해야 합니다.
  if (envName === 'NEXT_PUBLIC_API_URL') {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_WS_URL;
};

const getPublicOrigin = (envName: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'): string => {
  const value = resolvePublicEnv(envName);

  if (value && value.trim().length > 0) {
    return normalizeOrigin(value);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Config] Required environment configuration is missing.');
  }

  return DEFAULT_LOCAL_ORIGIN;
};

const assertSecureProtocolInProduction = (
  url: string,
  envName: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'
): string => {
  if (process.env.NODE_ENV !== 'production') {
    return url;
  }

  const parsed = new URL(url);
  if (LOCAL_HOSTNAMES.has(parsed.hostname)) {
    return url;
  }

  const isApiEnv = envName === 'NEXT_PUBLIC_API_URL';
  const allowedProtocol = isApiEnv ? PRODUCTION_ONLY_HTTPS_PROTOCOL : PRODUCTION_ONLY_WSS_PROTOCOL;

  if (parsed.protocol !== allowedProtocol) {
    const expected = isApiEnv ? 'https' : 'wss';
    throw new Error(`[Config] Invalid protocol in environment configuration. Expected ${expected}://.`);
  }

  return url;
};

export const getApiBaseUrl = (): string => {
  const apiOrigin = getPublicOrigin('NEXT_PUBLIC_API_URL');
  return assertSecureProtocolInProduction(apiOrigin, 'NEXT_PUBLIC_API_URL');
};

export const getWebSocketBaseUrl = (): string => {
  const wsOrigin = getPublicOrigin('NEXT_PUBLIC_WS_URL');
  return assertSecureProtocolInProduction(wsOrigin, 'NEXT_PUBLIC_WS_URL');
};
