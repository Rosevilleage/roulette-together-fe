import { create } from 'zustand';
import type { Role, WinSentiment } from '@/shared/types/room.types';
import type { Participant } from '@/shared/types/websocket.types';

interface RoomConfig {
  winnersCount: number;
  winSentiment: WinSentiment;
  updatedAt: number;
}

interface SpinState {
  isSpinning: boolean;
  spinId: string | null;
  myOutcome: 'WIN' | 'LOSE' | null;
  allOutcomes: Array<{
    nickname: string;
    outcome: 'WIN' | 'LOSE';
  }>;
}

interface RoomStore {
  // Room information
  roomId: string | null;
  role: Role | null;
  isOwner: boolean;

  // User information
  myNickname: string | null;
  myRid: string | null;

  // Room configuration
  config: RoomConfig | null;

  // Participants list (for owner only)
  participants: Participant[];
  readyCount: number;
  allReady: boolean;

  // My ready state (for participants only)
  myReady: boolean;

  // Spin state
  spin: SpinState | null;

  // Actions
  setRoomInfo: (roomId: string, role: Role) => void;
  setMyInfo: (nickname: string, rid: string, isOwner: boolean) => void;
  setConfig: (config: RoomConfig) => void;
  setParticipants: (participants: Participant[], readyCount: number, allReady: boolean) => void;
  setMyReady: (ready: boolean) => void;
  updateMyNickname: (nickname: string) => void;
  startSpin: (spinId: string) => void;
  setMyOutcome: (outcome: 'WIN' | 'LOSE') => void;
  setAllOutcomes: (outcomes: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>) => void;
  endSpin: () => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  role: null,
  isOwner: false,
  myNickname: null,
  myRid: null,
  config: null,
  participants: [],
  readyCount: 0,
  allReady: false,
  myReady: false,
  spin: null
};

export const useRoomStore = create<RoomStore>(set => ({
  ...initialState,

  setRoomInfo: (roomId, role) =>
    set({
      roomId,
      role
    }),

  setMyInfo: (nickname, rid, isOwner) =>
    set({
      myNickname: nickname,
      myRid: rid,
      isOwner
    }),

  setConfig: config =>
    set({
      config
    }),

  setParticipants: (participants, readyCount, allReady) =>
    set({
      participants,
      readyCount,
      allReady
    }),

  setMyReady: ready =>
    set({
      myReady: ready
    }),

  updateMyNickname: nickname =>
    set({
      myNickname: nickname
    }),

  startSpin: spinId =>
    set({
      spin: {
        isSpinning: true,
        spinId,
        myOutcome: null,
        allOutcomes: []
      }
    }),

  setMyOutcome: outcome =>
    set(state => ({
      spin: state.spin
        ? {
            ...state.spin,
            myOutcome: outcome
          }
        : null
    })),

  setAllOutcomes: outcomes =>
    set(state => ({
      spin: state.spin
        ? {
            ...state.spin,
            allOutcomes: outcomes
          }
        : null
    })),

  endSpin: () =>
    set(state => ({
      spin: state.spin
        ? {
            ...state.spin,
            isSpinning: false
          }
        : null
    })),

  reset: () => set(initialState)
}));
