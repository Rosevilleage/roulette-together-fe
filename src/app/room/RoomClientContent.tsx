'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect, useMemo } from 'react';
import { isOwnedRoom } from '@/entities/room/lib/room_storage';
import type { Role } from '@/entities/room/model/room.types';
import { RoomHeader } from '@/features/room/room-waiting/ui/RoomHeader';
import { RoomPage } from '@/page-components/RoomPage';
import { disconnectSocket } from '@/shared/hooks/useSocket';

const DEFAULT_ROLE: Role = 'participant';

const parseRole = (value: string | null): Role | null => {
  if (value === 'owner' || value === 'participant') {
    return value;
  }

  return null;
};

export function RoomClientContent(): ReactElement {
  const searchParams = useSearchParams();

  const roomId = searchParams.get('roomId') || '';
  const urlRole = parseRole(searchParams.get('role'));
  const initialNickname = searchParams.get('nickname');

  const role: Role = useMemo(() => {
    if (urlRole) {
      return urlRole;
    }

    if (isOwnedRoom(roomId)) {
      return 'owner';
    }

    return DEFAULT_ROLE;
  }, [roomId, urlRole]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  if (!roomId) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">잘못된 접근입니다</h1>
          <p className="text-muted-foreground">올바른 방 링크를 통해 접속해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <RoomHeader />
      <div className="relative flex-1 w-full overflow-auto">
        <RoomPage roomId={roomId} role={role} initialNickname={initialNickname || undefined} />
      </div>
    </div>
  );
}
