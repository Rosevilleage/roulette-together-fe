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

/**
 * 방 생성 API 에러 응답 타입 (백엔드 가이드 기준)
 */
export interface RoomApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: {
    field?: string;
    constraints?: string[];
    value?: unknown;
    limit?: number;
    window?: string;
    [key: string]: unknown;
  };
}

/**
 * 방 생성 API 에러 코드
 */
export enum RoomErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_TITLE_LENGTH = 'INVALID_TITLE_LENGTH',
  INVALID_NICKNAME_LENGTH = 'INVALID_NICKNAME_LENGTH',
  INVALID_WINNERS_COUNT = 'INVALID_WINNERS_COUNT',
  INVALID_WIN_SENTIMENT = 'INVALID_WIN_SENTIMENT',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  ROOM_CREATION_FAILED = 'ROOM_CREATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
