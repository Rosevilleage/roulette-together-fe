import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useRoomStore } from '@/shared/store/room.store';
import { showAlert } from '@/shared/store/alert.store';
import { removeOwnedRoom, saveVisitedRoom, removeVisitedRoom } from '@/shared/lib/room-storage';
import { SOCKET_EVENTS } from '@/shared/types/websocket.types';
import type {
  RoomJoinedPayload,
  RoomJoinRejectedPayload,
  RoomConfigPayload,
  RoomConfigRejectedPayload,
  RoomParticipantsPayload,
  NicknameChangedPayload,
  NicknameChangeRejectedPayload,
  ReadyToggledPayload,
  ReadyToggleRejectedPayload,
  RoomLeftPayload,
  RoomLeaveRejectedPayload,
  RoomOwnerLeftPayload,
  RoomClosedPayload,
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
    setOwnerPresent,
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
      // 방에 입장하면 방장이 있다고 가정 (방장 본인이거나 방장이 있는 방에 입장)
      setOwnerPresent(true);

      // 참가자인 경우 방문 기록 저장
      if (!payload.you.isOwner) {
        saveVisitedRoom(payload.roomId, payload.you.nickname);
      }
    };

    const handleRoomJoinRejected = (payload: RoomJoinRejectedPayload): void => {
      console.error('[Room] Join rejected:', payload.reason);

      // 방장 토큰이 유효하지 않거나 방이 존재하지 않는 경우 localStorage에서 제거
      const roomId = useRoomStore.getState().roomId;
      const isOwner = useRoomStore.getState().isOwner;

      // Error messages for each rejection reason
      const errorMessages: Record<string, string> = {
        OWNER_ALREADY_EXISTS:
          '방장이 이미 다른 곳에서 접속 중입니다.\n잠시 후 다시 시도해주세요. (재연결 가능 시간: 30분)',
        INVALID_OWNER_TOKEN: '방장 인증 정보가 유효하지 않습니다.\n방이 만료되었거나 삭제되었을 수 있습니다.',
        MISSING_OWNER_TOKEN: '방장 인증 정보가 없습니다.',
        INVALID_REQUEST: '잘못된 요청입니다.',
        INVALID_RID: '세션 정보가 유효하지 않습니다.'
      };

      if (roomId) {
        if (isOwner) {
          const shouldRemove =
            payload.reason === 'INVALID_OWNER_TOKEN' ||
            payload.reason === 'MISSING_OWNER_TOKEN' ||
            payload.reason === 'OWNER_ALREADY_EXISTS';

          if (shouldRemove) {
            console.log('[Room] Removing invalid owned room from storage:', roomId);
            removeOwnedRoom(roomId);
          }
        } else {
          // 참가자인 경우 방문 기록 삭제 (방이 존재하지 않음)
          console.log('[Room] Removing visited room from storage:', roomId);
          removeVisitedRoom(roomId);
        }
      }

      const message = errorMessages[payload.reason] || `방 입장이 거부되었습니다: ${payload.reason}`;
      showAlert(message);
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
      showAlert(`설정 변경이 거부되었습니다: ${payload.reason}`);
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
      showAlert(`닉네임 변경이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Ready Events
    // ============================================

    const handleReadyToggled = (payload: ReadyToggledPayload): void => {
      console.log('[Room] Ready toggled:', payload);
      setMyReady(payload.ready);
    };

    const handleReadyToggleRejected = (payload: ReadyToggleRejectedPayload): void => {
      console.error('[Room] Ready toggle rejected:', payload.reason);
      showAlert(`준비 상태 변경이 거부되었습니다: ${payload.reason}`);
    };

    // ============================================
    // Room Leave Events
    // ============================================

    const handleRoomLeft = (payload: RoomLeftPayload): void => {
      console.log('[Room] Left successfully:', payload);

      // Clean up room storage if owner
      const roomId = useRoomStore.getState().roomId;
      const isOwner = useRoomStore.getState().isOwner;

      if (roomId && isOwner) {
        removeOwnedRoom(roomId);
      }

      // Navigate to home
      window.location.href = '/';
    };

    const handleRoomLeaveRejected = (payload: RoomLeaveRejectedPayload): void => {
      console.error('[Room] Leave rejected:', payload.reason);
      const messages: Record<string, string> = {
        INVALID_REQUEST: '잘못된 요청입니다',
        NOT_IN_ROOM: '방에 입장하지 않았습니다',
        INTERNAL_ERROR: '서버 오류가 발생했습니다'
      };
      showAlert(`방 나가기가 거부되었습니다: ${messages[payload.reason] || payload.reason}`);
    };

    const handleRoomOwnerLeft = (payload: RoomOwnerLeftPayload): void => {
      console.log('[Room] Owner left:', payload);

      // Update owner presence state
      setOwnerPresent(false);

      // Show notification to participants
      showAlert('방장이 나갔습니다', '방장이 돌아올 때까지 대기하거나 나갈 수 있습니다.');
    };

    const handleRoomClosed = (payload: RoomClosedPayload): void => {
      console.log('[Room] Room closed:', payload);

      // 방이 닫히면 방문 기록에서 삭제
      removeVisitedRoom(payload.roomId);

      const messages: Record<string, string> = {
        EXPIRED: '방이 만료되어 삭제되었습니다.',
        DELETED: '방이 삭제되었습니다.'
      };

      // Show alert to participants
      showAlert(messages[payload.reason] || '방이 삭제되었습니다.');

      // Navigate to home after 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
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
      showAlert(messages[payload.reason] || '룰렛 시작이 거부되었습니다');
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
    socket.on(SOCKET_EVENTS.READY_TOGGLED, handleReadyToggled);
    socket.on(SOCKET_EVENTS.READY_TOGGLE_REJECTED, handleReadyToggleRejected);
    socket.on(SOCKET_EVENTS.ROOM_LEFT, handleRoomLeft);
    socket.on(SOCKET_EVENTS.ROOM_LEAVE_REJECTED, handleRoomLeaveRejected);
    socket.on(SOCKET_EVENTS.ROOM_OWNER_LEFT, handleRoomOwnerLeft);
    socket.on(SOCKET_EVENTS.ROOM_CLOSED, handleRoomClosed);
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
      socket.off(SOCKET_EVENTS.READY_TOGGLED, handleReadyToggled);
      socket.off(SOCKET_EVENTS.READY_TOGGLE_REJECTED, handleReadyToggleRejected);
      socket.off(SOCKET_EVENTS.ROOM_LEFT, handleRoomLeft);
      socket.off(SOCKET_EVENTS.ROOM_LEAVE_REJECTED, handleRoomLeaveRejected);
      socket.off(SOCKET_EVENTS.ROOM_OWNER_LEFT, handleRoomOwnerLeft);
      socket.off(SOCKET_EVENTS.ROOM_CLOSED, handleRoomClosed);
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
    setOwnerPresent,
    updateMyNickname,
    startSpin,
    setMyOutcome,
    setAllOutcomes,
    endSpin
  ]);
};
