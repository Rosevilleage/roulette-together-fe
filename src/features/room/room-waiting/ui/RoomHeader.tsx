'use client';

import { useState } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { useRoomStore } from '@/entities/room/model/room.store';
import { Button } from '@/shared/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/ui/AlertDialog';
import { SOCKET_EVENTS } from '@/entities/room/model/websocket.types';
import type { RoomLeavePayload } from '@/entities/room/model/websocket.types';
import { LogOutIcon } from 'lucide-react';

export const RoomHeader: React.FC = () => {
  const socket = useSocket();
  const { roomId, roomTitle, isOwner } = useRoomStore();
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
            <h1 className="text-xl font-bold">{roomTitle || '룰렛 투게더'}</h1>
            {roomId && <span className="text-xs text-muted-foreground">#{roomId.slice(-6)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowLeaveDialog(true)}>
              <LogOutIcon className="w-4 h-4" />
              나가기
            </Button>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>방을 나가시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner ? (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                  💡 방장이 나가도 참가자들은 대기 상태로 유지됩니다. 30분 이내에 다시 입장할 수 있습니다.
                </p>
              ) : (
                '방이 닫히기 전까지는 다시 접속할 수 있습니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRoom}>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
