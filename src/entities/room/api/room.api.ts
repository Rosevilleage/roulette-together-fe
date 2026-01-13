import type { CreateRoomResponse, CreateRoomRequest, GetRoomsResponse } from '../model/room.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create a new room
 * @param request - Optional nickname for the room owner
 * @returns Room information including roomId, tokens, and URLs
 */
export async function createRoom(request: CreateRoomRequest = {}): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // 쿠키 전송을 위해 필수
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get list of active rooms owned by the user
 * @returns List of active rooms
 */
export async function getRooms(): Promise<GetRoomsResponse> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'GET',
    credentials: 'include' // 쿠키 전송을 위해 필수
  });

  if (!response.ok) {
    throw new Error(`Failed to get rooms: ${response.statusText}`);
  }

  return response.json();
}
