/**
 * WebSocket event types and payloads
 */

import type { Role, WinSentiment } from './room.types';

// ============================================
// Client → Server Events
// ============================================

export interface RoomJoinPayload {
  roomId: string;
  role: Role;
  nickname?: string;
  token?: string; // Owner token for authentication
}

export interface RoomConfigSetPayload {
  roomId: string;
  winnersCount: number;
  winSentiment: WinSentiment;
}

export interface SpinRequestPayload {
  roomId: string;
  requestId: string;
}

export interface ParticipantReadyTogglePayload {
  roomId: string;
  ready: boolean;
}

export interface ParticipantNicknameChangePayload {
  roomId: string;
  nickname: string;
}

export interface RoomLeavePayload {
  roomId: string;
}

// ============================================
// Server → Client Events
// ============================================

export interface RoomJoinedPayload {
  roomId: string;
  serverTime: number;
  you: {
    isOwner: boolean;
    nickname: string;
    rid: string;
  };
}

export interface RoomJoinRejectedPayload {
  reason: 'OWNER_ALREADY_EXISTS' | 'INVALID_REQUEST' | 'INVALID_RID' | 'MISSING_OWNER_TOKEN' | 'INVALID_OWNER_TOKEN';
}

export interface RoomConfigPayload {
  roomId: string;
  winnersCount: number;
  winSentiment: WinSentiment;
  updatedAt: number;
}

export interface RoomConfigRejectedPayload {
  roomId: string;
  reason: 'INVALID' | 'NOT_OWNER';
}

export interface RoomStatePayload {
  roomId: string;
  ownerRid: string;
  lastSpin?: {
    spinId: string;
    decidedAt: number;
  };
}

export interface Participant {
  rid: string;
  nickname: string;
  ready: boolean;
}

export interface RoomParticipantsPayload {
  roomId: string;
  participants: Participant[];
  readyCount: number;
  totalCount: number;
  allReady: boolean;
}

export interface NicknameChangedPayload {
  roomId: string;
  nickname: string;
}

export interface NicknameChangeRejectedPayload {
  roomId: string;
  reason: 'INVALID_NICKNAME';
}

export interface ReadyToggleRejectedPayload {
  roomId: string;
  reason: 'ONLY_PARTICIPANTS_CAN_READY';
}

export interface SpinResolvedPayload {
  roomId: string;
  requestId: string;
  spinId: string;
  winnersCount: number;
  winSentiment: WinSentiment;
  decidedAt: number;
  animation: {
    revealAt: number;
    durationMs: number;
  };
}

export interface SpinOutcomePayload {
  roomId: string;
  spinId: string;
  outcome: 'WIN' | 'LOSE';
  winSentiment: WinSentiment;
}

export interface SpinResultPayload {
  roomId: string;
  spinId: string;
  outcomes: Array<{
    nickname: string;
    outcome: 'WIN' | 'LOSE';
  }>;
}

export interface SpinRejectedPayload {
  roomId: string;
  requestId: string;
  reason: 'NOT_OWNER' | 'ALREADY_SPINNING' | 'NO_MEMBERS' | 'NOT_ALL_READY';
}

export interface RoomLeftPayload {
  roomId: string;
  leftAt: number;
}

export interface RoomLeaveRejectedPayload {
  roomId: string;
  reason: 'INVALID_REQUEST' | 'NOT_IN_ROOM' | 'INTERNAL_ERROR';
}

export interface RoomClosedPayload {
  roomId: string;
  reason: 'EXPIRED' | 'DELETED';
  closedAt: number;
}

export interface RoomOwnerLeftPayload {
  roomId: string;
  leftAt: number;
}

// ============================================
// Event Names
// ============================================

export const SOCKET_EVENTS = {
  // Client → Server
  ROOM_JOIN: 'room:join',
  ROOM_CONFIG_SET: 'room:config:set',
  SPIN_REQUEST: 'spin:request',
  PARTICIPANT_READY_TOGGLE: 'participant:ready:toggle',
  PARTICIPANT_NICKNAME_CHANGE: 'participant:nickname:change',
  ROOM_LEAVE: 'room:leave',

  // Server → Client
  ROOM_JOINED: 'room:joined',
  ROOM_JOIN_REJECTED: 'room:join:rejected',
  ROOM_CONFIG: 'room:config',
  ROOM_CONFIG_REJECTED: 'room:config:rejected',
  ROOM_STATE: 'room:state',
  ROOM_PARTICIPANTS: 'room:participants',
  NICKNAME_CHANGED: 'nickname:changed',
  NICKNAME_CHANGE_REJECTED: 'nickname:change:rejected',
  READY_TOGGLE_REJECTED: 'ready:toggle:rejected',
  ROOM_LEFT: 'room:left',
  ROOM_LEAVE_REJECTED: 'room:leave:rejected',
  ROOM_OWNER_LEFT: 'room:owner:left',
  ROOM_CLOSED: 'room:closed',
  SPIN_RESOLVED: 'spin:resolved',
  SPIN_OUTCOME: 'spin:outcome',
  SPIN_RESULT: 'spin:result',
  SPIN_REJECTED: 'spin:rejected'
} as const;
