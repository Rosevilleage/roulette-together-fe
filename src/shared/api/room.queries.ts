import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { roomKeys } from './query-keys';
import type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse } from '@/shared/types/room.types';

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
    onError: error => {
      console.error('방 생성 실패:', error);
    }
  });
}

export type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse };
