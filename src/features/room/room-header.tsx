'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { LogOutIcon, Trash2Icon } from 'lucide-react';

type LeaveAction = 'leave' | 'delete' | null;

export const RoomHeader: React.FC = () => {
  const router = useRouter();
  const socket = useSocket();
  const { roomId, isOwner } = useRoomStore();
  const [leaveAction, setLeaveAction] = useState<LeaveAction>(null);

  const handleLeaveRoom = (): void => {
    if (!socket || !roomId) return;

    const payload: RoomLeavePayload = { roomId };
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE, payload);
    setLeaveAction(null);
  };

  const handleDisconnectOnly = (): void => {
    // Just navigate to home, socket will disconnect automatically
    // Room will remain for 30 minutes
    setLeaveAction(null);
    router.push('/');
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">룰렛 투게더</h1>
            {roomId && <span className="text-xs text-muted-foreground">#{roomId.slice(-6)}</span>}
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLeaveAction('leave')}>
                  <LogOutIcon className="w-4 h-4" />
                  나가기
                </Button>
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => setLeaveAction('delete')}>
                  <Trash2Icon className="w-4 h-4" />방 삭제
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLeaveAction('leave')}>
                <LogOutIcon className="w-4 h-4" />
                나가기
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={leaveAction === 'leave'} onOpenChange={open => !open && setLeaveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>방을 나가시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    💡 방은 30분간 유지 후 삭제됩니다.
                  </p>
                </div>
              ) : (
                '방을 나가면 다시 입장하려면 새로운 링크가 필요합니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={isOwner ? handleDisconnectOnly : handleLeaveRoom}>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={leaveAction === 'delete'} onOpenChange={open => !open && setLeaveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>방을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>방을 삭제하면 모든 참가자가 강제 퇴장됩니다.</p>
                <p className="text-destructive font-medium">이 작업은 즉시 실행되며 되돌릴 수 없습니다.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRoom} className="bg-destructive hover:bg-destructive/90">
              방 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
