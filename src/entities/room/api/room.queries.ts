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
    onError: (error: AxiosError) => {
      logger.error('방 생성 실패:', error);

      if (error.response?.status === 429) {
        toast.error('방을 생성할 수 없습니다. 1분 뒤 다시 시도해주세요.');
      }
    }
  });
}

export type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse };
