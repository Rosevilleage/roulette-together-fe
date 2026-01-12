'use client';

import { useState } from 'react';
import { useSocket } from '@/shared/hooks/use-socket';
import { useRoomStore } from '@/shared/store/room.store';
import { Button } from '@/shared/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog';
import { SOCKET_EVENTS } from '@/shared/types/websocket.types';
import type { RoomLeavePayload } from '@/shared/types/websocket.types';
import { LogOutIcon } from 'lucide-react';

export const RoomHeader: React.FC = () => {
  const socket = useSocket();
  const { roomId, isOwner } = useRoomStore();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const handleLeaveRoom = (): void => {
    if (!socket || !roomId) return;

    const payload: RoomLeavePayload = { roomId };
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE, payload);
    setShowLeaveDialog(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">룰렛 투게더</h1>
            {roomId && <span className="text-xs text-muted-foreground">#{roomId.slice(-6)}</span>}
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowLeaveDialog(true)}>
            <LogOutIcon className="w-4 h-4" />
            나가기
          </Button>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isOwner ? '방을 삭제하시겠습니까?' : '방을 나가시겠습니까?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner
                ? '방을 삭제하면 모든 참가자가 강제 퇴장됩니다. 이 작업은 되돌릴 수 없습니다.'
                : '방을 나가면 다시 입장하려면 새로운 링크가 필요합니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRoom}>{isOwner ? '삭제' : '나가기'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
