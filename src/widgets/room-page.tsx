'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/shared/hooks/use-socket';
import { useRoomStore } from '@/shared/store/room.store';
import { useRoomEvents } from '@/shared/hooks/use-room-events';
import { RoomWaiting } from '@/features/room/room-waiting';
import { NicknameInputDialog } from '@/features/room/nickname-input-dialog';
import { getVisitedRoom } from '@/shared/lib/room-storage';
import type { Role } from '@/shared/types/room.types';
import { SOCKET_EVENTS } from '@/shared/types/websocket.types';

interface RoomPageProps {
  roomId: string;
  role: Role;
  initialNickname?: string;
}

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, role, initialNickname }) => {
  const socket = useSocket();
  const { setRoomInfo, reset, myNickname } = useRoomStore();

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

  // Set room info on mount
  useEffect(() => {
    setRoomInfo(roomId, role);

    return () => {
      reset();
    };
  }, [roomId, role, setRoomInfo, reset]);

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

  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">소켓 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (!socket.connected) {
    const isOwnerRole = role === 'owner';
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">서버에 연결하는 중...</p>
          {isOwnerRole && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 mt-4">
              💡 방장은 탭을 닫았다가 30분 이내에 다시 접속하면 같은 방으로 돌아올 수 있습니다.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Socket ID: {socket.id || '연결 대기 중'}</p>
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
