import type { CreateRoomResponse, CreateRoomRequest } from "@/shared/types/room.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Create a new room
 * @param request - Optional nickname for the room owner
 * @returns Room information including roomId, tokens, and URLs
 */
export async function createRoom(
  request: CreateRoomRequest = {}
): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.statusText}`);
  }

  return response.json();
}
