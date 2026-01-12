import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useRoomStore } from '@/shared/store/room.store';
import { removeOwnedRoom } from '@/shared/lib/room-storage';
import { SOCKET_EVENTS } from '@/shared/types/websocket.types';
import type {
  RoomJoinedPayload,
  RoomJoinRejectedPayload,
  RoomConfigPayload,
  RoomConfigRejectedPayload,
  RoomParticipantsPayload,
  NicknameChangedPayload,
  NicknameChangeRejectedPayload,
  ReadyToggleRejectedPayload,
  SpinResolvedPayload,
  SpinOutcomePayload,
  SpinResultPayload,
  SpinRejectedPayload
} from '@/shared/types/websocket.types';

/**
 * Hook to handle room-related WebSocket events
 * @param socket - Socket.IO instance
 */
export const useRoomEvents = (socket: Socket | null): void => {
  const {
    setMyInfo,
    setConfig,
    setParticipants,
    setMyReady,
    updateMyNickname,
    startSpin,
    setMyOutcome,
    setAllOutcomes,
    endSpin
  } = useRoomStore();

  useEffect(() => {
    if (!socket) {
      return;
    }

    // ============================================
    // Room Join Events
    // ============================================

    const handleRoomJoined = (payload: RoomJoinedPayload): void => {
      console.log('[Room] Joined:', payload);
      setMyInfo(payload.you.nickname, payload.you.rid, payload.you.isOwner);
    };

    const handleRoomJoinRejected = (payload: RoomJoinRejectedPayload): void => {
      console.error('[Room] Join rejected:', payload.reason);

      // 방장 토큰이 유효하지 않거나 방이 존재하지 않는 경우 localStorage에서 제거
      const roomId = useRoomStore.getState().roomId;
      const isOwner = useRoomStore.getState().isOwner;

      if (roomId && isOwner) {
        const shouldRemove =
          payload.reason === 'INVALID_OWNER_TOKEN' ||
          payload.reason === 'MISSING_OWNER_TOKEN' ||
          payload.reason === 'OWNER_ALREADY_EXISTS';

        if (shouldRemove) {
          console.log('[Room] Removing invalid owned room from storage:', roomId);
          removeOwnedRoom(roomId);
        }
      }

      alert(`방 입장이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Room Config Events
    // ============================================

    const handleRoomConfig = (payload: RoomConfigPayload): void => {
      console.log('[Room] Config updated:', payload);
      setConfig({
        winnersCount: payload.winnersCount,
        winSentiment: payload.winSentiment,
        updatedAt: payload.updatedAt
      });
    };

    const handleRoomConfigRejected = (payload: RoomConfigRejectedPayload): void => {
      console.error('[Room] Config rejected:', payload.reason);
      alert(`설정 변경이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Participants Events
    // ============================================

    const handleRoomParticipants = (payload: RoomParticipantsPayload): void => {
      console.log('[Room] Participants updated:', payload);
      setParticipants(payload.participants, payload.readyCount, payload.allReady);

      // Update my ready state if I'm a participant
      const myRid = useRoomStore.getState().myRid;
      const myParticipant = payload.participants.find(p => p.rid === myRid);
      if (myParticipant) {
        setMyReady(myParticipant.ready);
      }
    };

    // ============================================
    // Nickname Events
    // ============================================

    const handleNicknameChanged = (payload: NicknameChangedPayload): void => {
      console.log('[Room] Nickname changed:', payload);
      updateMyNickname(payload.nickname);
    };

    const handleNicknameChangeRejected = (payload: NicknameChangeRejectedPayload): void => {
      console.error('[Room] Nickname change rejected:', payload.reason);
      alert(`닉네임 변경이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Ready Events
    // ============================================

    const handleReadyToggleRejected = (payload: ReadyToggleRejectedPayload): void => {
      console.error('[Room] Ready toggle rejected:', payload.reason);
      alert(`준비 상태 변경이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Spin Events
    // ============================================

    const handleSpinResolved = (payload: SpinResolvedPayload): void => {
      console.log('[Spin] Resolved:', payload);
      startSpin(payload.spinId);
      setConfig({
        winnersCount: payload.winnersCount,
        winSentiment: payload.winSentiment,
        updatedAt: payload.decidedAt
      });
    };

    const handleSpinOutcome = (payload: SpinOutcomePayload): void => {
      console.log('[Spin] My outcome:', payload);
      setMyOutcome(payload.outcome);
    };

    const handleSpinResult = (payload: SpinResultPayload): void => {
      console.log('[Spin] Result:', payload);
      setAllOutcomes(payload.outcomes);
      endSpin();
    };

    const handleSpinRejected = (payload: SpinRejectedPayload): void => {
      console.error('[Spin] Rejected:', payload.reason);
      const messages: Record<string, string> = {
        NOT_OWNER: '방장만 룰렛을 돌릴 수 있습니다',
        ALREADY_SPINNING: '이미 룰렛이 진행 중입니다',
        NO_MEMBERS: '참가자가 없습니다',
        NOT_ALL_READY: '모든 참가자가 준비 완료해야 합니다'
      };
      alert(messages[payload.reason] || '룰렛 시작이 거부되었습니다');
    };

    // ============================================
    // Register Event Listeners
    // ============================================

    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.ROOM_JOIN_REJECTED, handleRoomJoinRejected);
    socket.on(SOCKET_EVENTS.ROOM_CONFIG, handleRoomConfig);
    socket.on(SOCKET_EVENTS.ROOM_CONFIG_REJECTED, handleRoomConfigRejected);
    socket.on(SOCKET_EVENTS.ROOM_PARTICIPANTS, handleRoomParticipants);
    socket.on(SOCKET_EVENTS.NICKNAME_CHANGED, handleNicknameChanged);
    socket.on(SOCKET_EVENTS.NICKNAME_CHANGE_REJECTED, handleNicknameChangeRejected);
    socket.on(SOCKET_EVENTS.READY_TOGGLE_REJECTED, handleReadyToggleRejected);
    socket.on(SOCKET_EVENTS.SPIN_RESOLVED, handleSpinResolved);
    socket.on(SOCKET_EVENTS.SPIN_OUTCOME, handleSpinOutcome);
    socket.on(SOCKET_EVENTS.SPIN_RESULT, handleSpinResult);
    socket.on(SOCKET_EVENTS.SPIN_REJECTED, handleSpinRejected);

    // ============================================
    // Cleanup
    // ============================================

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.ROOM_JOIN_REJECTED, handleRoomJoinRejected);
      socket.off(SOCKET_EVENTS.ROOM_CONFIG, handleRoomConfig);
      socket.off(SOCKET_EVENTS.ROOM_CONFIG_REJECTED, handleRoomConfigRejected);
      socket.off(SOCKET_EVENTS.ROOM_PARTICIPANTS, handleRoomParticipants);
      socket.off(SOCKET_EVENTS.NICKNAME_CHANGED, handleNicknameChanged);
      socket.off(SOCKET_EVENTS.NICKNAME_CHANGE_REJECTED, handleNicknameChangeRejected);
      socket.off(SOCKET_EVENTS.READY_TOGGLE_REJECTED, handleReadyToggleRejected);
      socket.off(SOCKET_EVENTS.SPIN_RESOLVED, handleSpinResolved);
      socket.off(SOCKET_EVENTS.SPIN_OUTCOME, handleSpinOutcome);
      socket.off(SOCKET_EVENTS.SPIN_RESULT, handleSpinResult);
      socket.off(SOCKET_EVENTS.SPIN_REJECTED, handleSpinRejected);
    };
  }, [
    socket,
    setMyInfo,
    setConfig,
    setParticipants,
    setMyReady,
    updateMyNickname,
    startSpin,
    setMyOutcome,
    setAllOutcomes,
    endSpin
  ]);
};
