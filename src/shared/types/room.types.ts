/**
 * Room related types
 */

export interface CreateRoomResponse {
  roomId: string;
  title: string;
  ownerUrl: string;
  participantUrl: string;
  createdAt: number;
}

export interface CreateRoomRequest {
  title?: string;
  nickname?: string;
  winnersCount?: number;
  winSentiment?: WinSentiment;
}

export type Role = 'owner' | 'participant';

export type WinSentiment = 'POSITIVE' | 'NEGATIVE';

export interface RoomConfig {
  winnersCount: number;
  winSentiment: WinSentiment;
  updatedAt: number;
}

export interface RoomListItem {
  roomId: string;
  title: string;
  participantCount: number;
  winnersCount: number;
  winSentiment: WinSentiment;
  lastActivity: number;
  ownerNickname: string;
}

export interface GetRoomsResponse {
  rooms: RoomListItem[];
  queriedAt: number;
}
