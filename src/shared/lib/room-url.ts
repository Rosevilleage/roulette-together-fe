import type { Role } from '@/entities/room/model/room.types';

const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.trim().replace(/\/+$/, '');
};

export const buildRoomPath = (roomId: string, role: Role, nickname?: string): string => {
  const searchParams = new URLSearchParams({
    roomId,
    role
  });

  if (nickname && nickname.trim().length > 0) {
    searchParams.set('nickname', nickname);
  }

  return `/room?${searchParams.toString()}`;
};

export const buildRoomAbsoluteUrl = (baseUrl: string, roomId: string, role: Role = 'participant'): string => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return new URL(buildRoomPath(roomId, role), normalizedBaseUrl).toString();
};
