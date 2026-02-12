import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { logger } from '@/shared/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          logger.error('[API] 인증 오류');
          break;
        case 403:
          logger.error('[API] 권한 없음');
          break;
        case 404:
          logger.error('[API] 리소스를 찾을 수 없음');
          break;
        case 500:
          logger.error('[API] 서버 오류');
          break;
      }
    } else if (error.request) {
      logger.error('[API] 네트워크 오류');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
