import type { CreateRoomResponse, CreateRoomRequest, GetRoomsResponse } from '../model/room.types';
import { apiClient } from '@/shared/api/client';

/**
 * Create a new room
 * @param request - Optional nickname for the room owner
 * @returns Room information including roomId, tokens, and URLs
 */
export async function createRoom(request: CreateRoomRequest = {}): Promise<CreateRoomResponse> {
  const response = await apiClient.post<CreateRoomResponse>('/rooms', request);
  return response.data;
}

/**
 * Get list of active rooms owned by the user
 * @returns List of active rooms
 */
export async function getRooms(): Promise<GetRoomsResponse> {
  const response = await apiClient.get<GetRoomsResponse>('/rooms');
  return response.data;
}
