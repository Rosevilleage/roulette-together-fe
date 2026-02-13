import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse } from '../model/room.types';
import { logger } from '@/shared/lib/logger';

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...roomKeys.lists(), filters] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (roomId: string) => [...roomKeys.details(), roomId] as const
};

/**
 * 방 목록 조회 Query Hook
 */
export function useRoomsQuery() {
  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: async (): Promise<GetRoomsResponse> => {
      const { data } = await apiClient.get<GetRoomsResponse>('/rooms');
      return data;
    },
    staleTime: 1000 * 60 * 2 // 2분
  });
}

/**
 * API 에러 응답 타입
 */
interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: string;
}

/**
 * 방 생성 에러 메시지 생성
 */
function getCreateRoomErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  // 타임아웃 에러
  if (error.code === 'ECONNABORTED') {
    return '서버 응답이 없습니다. 잠시 후 다시 시도해주세요.';
  }

  // 네트워크 에러 (서버에 도달 못함)
  if (!error.response) {
    return '네트워크 연결을 확인해주세요.';
  }

  const { status, data } = error.response;

  // 백엔드에서 제공한 에러 메시지 우선 사용
  if (data?.message) {
    return data.message;
  }

  // HTTP 상태 코드별 기본 메시지
  switch (status) {
    case 400:
      return '잘못된 요청입니다. 입력 정보를 확인해주세요.';
    case 401:
      return '인증이 필요합니다. 로그인 후 다시 시도해주세요.';
    case 403:
      return '권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 방입니다.';
    case 429:
      return '너무 많은 요청을 보냈습니다. 1분 뒤 다시 시도해주세요.';
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 502:
    case 503:
      return '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
    case 504:
      return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '방 생성에 실패했습니다. 다시 시도해주세요.';
  }
}

/**
 * 방 생성 Mutation Hook
 */
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateRoomRequest): Promise<CreateRoomResponse> => {
      const { data } = await apiClient.post<CreateRoomResponse>('/rooms', request);
      return data;
    },
    onSuccess: () => {
      // 방 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      logger.error('방 생성 실패:', error);

      const errorMessage = getCreateRoomErrorMessage(error);
      toast.error(errorMessage, {
        duration: 4000
      });
    }
  });
}

export type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse };
