'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { RoomPage } from '@/page-components/RoomPage';
import { ReactElement, useMemo, useEffect } from 'react';
import { isOwnedRoom } from '@/entities/room/lib/room_storage';
import type { Role } from '@/entities/room/model/room.types';
import { RoomHeader } from '@/features/room/room-waiting/ui/RoomHeader';
import { disconnectSocket } from '@/shared/hooks/useSocket';

export default function Page(): ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params?.roomId as string;
  const urlRole = searchParams?.get('role') as 'owner' | 'participant' | null;
  const initialNickname = searchParams?.get('nickname');

  // localStorage를 확인하여 role 결정
  // 1. URL에 role이 명시된 경우 사용
  // 2. URL에 role이 없으면 localStorage 확인하여 생성한 방인지 판단
  const role: Role = useMemo(() => {
    if (urlRole) {
      return urlRole;
    }

    // localStorage에서 생성한 방인지 확인
    if (isOwnedRoom(roomId)) {
      return 'owner';
    }

    // 그 외는 참가자로 취급
    return 'participant';
  }, [roomId, urlRole]);

  // 방 페이지를 떠날 때 소켓 연결 해제
  // 새 방 입장 시 새 쿠키로 재연결할 수 있도록 함
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
