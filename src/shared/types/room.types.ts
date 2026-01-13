/**
 * Room related types
 */

/**
 * v2.5 업데이트: ownerUrl, participantUrl 필드 제거
 * URL은 프론트엔드에서 직접 생성: /room/${roomId}?role=owner 또는 /room/${roomId}?role=participant
 */
export interface CreateRoomResponse {
  roomId: string;
  title: string;
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
