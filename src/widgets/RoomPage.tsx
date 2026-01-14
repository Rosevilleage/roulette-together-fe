'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/shared/hooks/use-socket';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useRoomEvents } from '@/features/room/room-events/useRoomEvents';
import { RoomWaiting } from '@/features/room/room-waiting/ui/RoomWaiting';
import { NicknameInputDialog } from '@/features/room/join-room/ui/NicknameInputDialog';
import { getVisitedRoom } from '@/entities/room/lib/room-storage';
import { showConfirm, showAlert } from '@/shared/store/alert.store';
import type { Role } from '@/entities/room/model/room.types';
import { SOCKET_EVENTS } from '@/entities/room/model/websocket.types';
import { useRouter } from 'next/navigation';

interface RoomPageProps {
  roomId: string;
  role: Role;
  initialNickname?: string;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, role, initialNickname }) => {
  const socket = useSocket();
  const { setRoomInfo, reset, myNickname } = useRoomStore();
  const router = useRouter();
  // 한 번 방에 입장했었는지 추적 (재연결 시 사용)
  const hasJoinedOnce = useRef(false);

  // 참가자인 경우 저장된 닉네임을 먼저 확인
  const getSavedNickname = (): string => {
    if (role === 'participant' && !initialNickname) {
      const visitedRoom = getVisitedRoom(roomId);
      if (visitedRoom?.nickname) {
        return visitedRoom.nickname;
      }
    }
    return initialNickname || '';
  };

  const [nickname, setNickname] = useState<string>(getSavedNickname);

  // Setup room events
  useRoomEvents(socket);

  // Debug logging
  useEffect(() => {
    console.log('[RoomPage] Component state:', {
      roomId,
      role,
      initialNickname,
      nickname,
      myNickname,
      socketConnected: socket?.connected,
      socketId: socket?.id
    });
  }, [roomId, role, initialNickname, nickname, myNickname, socket?.connected, socket?.id]);

  // 참가자 연결 끊김 감지 및 재연결 처리
  useEffect(() => {
    if (!socket || role !== 'participant') return;

    const handleDisconnect = (reason: string): void => {
      console.log('[RoomPage] Participant disconnected:', reason);

      // 이미 한 번 입장했던 경우에만 재연결 다이얼로그 표시
      if (!hasJoinedOnce.current) return;

      showConfirm({
        title: '연결이 끊어졌습니다',
        description: '서버와의 연결이 끊어졌습니다. 재연결하시겠습니까?',
        confirmText: '재연결',
        cancelText: '나가기',
        onConfirm: () => {
          console.log('[RoomPage] Attempting to reconnect...');
          // 소켓 재연결 시도
          socket.connect();

          // 재연결 성공 시 room:join 재전송을 위한 일회성 핸들러
          const handleReconnect = (): void => {
            console.log('[RoomPage] Reconnected, rejoining room...');
            const joinPayload = {
              roomId,
              role,
              nickname: nickname.trim() || undefined
            };
            socket.emit(SOCKET_EVENTS.ROOM_JOIN, joinPayload);
            socket.off('connect', handleReconnect);
          };

          // 재연결 실패 처리
          const handleReconnectFailed = (): void => {
            console.log('[RoomPage] Reconnection failed');
            showAlert('재연결 실패', '서버에 연결할 수 없습니다. 메인 화면으로 이동합니다.');
            setTimeout(() => {
              router.replace('/');
            }, 1500);
            socket.off('connect_error', handleReconnectFailed);
          };

          socket.on('connect', handleReconnect);
          socket.on('connect_error', handleReconnectFailed);

          // 5초 후에도 연결 안 되면 실패 처리
          setTimeout(() => {
            if (!socket.connected) {
              socket.off('connect', handleReconnect);
              socket.off('connect_error', handleReconnectFailed);
              showAlert('재연결 실패', '서버에 연결할 수 없습니다. 메인 화면으로 이동합니다.');
              setTimeout(() => {
                router.replace('/');
              }, 1500);
            }
          }, 5000);
        },
        onCancel: () => {
          console.log('[RoomPage] User chose to leave');
          router.replace('/');
        }
      });
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, role, roomId, nickname, router]);

  // Set room info on mount
  useEffect(() => {
    setRoomInfo(roomId, role);

    return () => {
      reset();
    };
  }, [roomId, role, setRoomInfo, reset]);

  // 방 입장 성공 추적 (myNickname이 설정되면 입장 성공)
  useEffect(() => {
    if (myNickname && role === 'participant') {
      hasJoinedOnce.current = true;
    }
  }, [myNickname, role]);

  // Join room when connected and ready
  useEffect(() => {
    console.log('[RoomPage] Join effect triggered:', {
      connected: socket?.connected,
      myNickname,
      role,
      nickname: nickname.trim()
    });

    if (!socket?.connected || myNickname) {
      // Not connected or already joined
      console.log('[RoomPage] Skipping join - not connected or already joined');
      return;
    }

    // For participants without nickname, don't join yet
    if (role === 'participant' && !nickname.trim()) {
      console.log('[RoomPage] Skipping join - participant without nickname');
      return;
    }

    // Send join request
    const joinPayload = {
      roomId,
      role,
      nickname: nickname.trim() || undefined
    };

    console.log('[RoomPage] Sending room:join event:', joinPayload);
    socket.emit(SOCKET_EVENTS.ROOM_JOIN, joinPayload);
  }, [socket, socket?.connected, roomId, role, nickname, myNickname]);

  const handleNicknameSubmit = (submittedNickname: string): void => {
    setNickname(submittedNickname);
  };

  // Derive dialog visibility from current state
  const shouldShowNicknameDialog = Boolean(
    socket?.connected && role === 'participant' && !nickname.trim() && !myNickname
  );

  // 로딩 UI (SSR/CSR 일관된 구조 유지)
  if (!socket || !socket.connected) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">서버에 연결하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RoomWaiting />
      <NicknameInputDialog open={shouldShowNicknameDialog} onSubmit={handleNicknameSubmit} />
    </>
  );
};
