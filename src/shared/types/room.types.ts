/**
 * Room related types
 */

export interface CreateRoomResponse {
  roomId: string;
  ownerToken: string;
  ownerUrl: string;
  participantUrl: string;
  createdAt: number;
}

export interface CreateRoomRequest {
  nickname?: string;
  winnersCount?: number;
  winSentiment?: WinSentiment;
}

export type Role = "owner" | "participant";

export type WinSentiment = "POSITIVE" | "NEGATIVE";

export interface RoomConfig {
  winnersCount: number;
  winSentiment: WinSentiment;
  updatedAt: number;
}
