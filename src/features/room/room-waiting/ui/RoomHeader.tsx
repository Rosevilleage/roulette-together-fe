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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/shared/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { Label } from '@/shared/ui/Label';
import { SOCKET_EVENTS } from '@/entities/room/model/websocket.types';
import type { RoomLeavePayload, RoomConfigSetPayload } from '@/entities/room/model/websocket.types';
import type { WinSentiment } from '@/entities/room/model/room.types';
import { LogOutIcon, SettingsIcon, UsersIcon, TrophyIcon } from 'lucide-react';

export const RoomHeader: React.FC = () => {
  const socket = useSocket();
  const { roomId, roomTitle, isOwner, config, participants } = useRoomStore();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [winnersCount, setWinnersCount] = useState<number>(config?.winnersCount ?? 1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>(config?.winSentiment ?? 'POSITIVE');

  const handleLeaveRoom = (): void => {
    setShowLeaveDialog(false);

    // 소켓 연결이 없거나 끊긴 경우 바로 메인 페이지로 이동
    if (!socket || !socket.connected || !roomId) {
      window.location.replace('/');
      return;
    }

    const payload: RoomLeavePayload = { roomId };
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE, payload);

    // 타임아웃 폴백: 3초 내에 서버 응답 없으면 강제 이동
    setTimeout(() => {
      window.location.replace('/');
    }, 3000);
  };

  const handleOpenConfigDialog = (): void => {
    if (config) {
      setWinnersCount(config.winnersCount);
      setWinSentiment(config.winSentiment);
    }
    setShowConfigDialog(true);
  };

  const handleSaveConfig = (): void => {
    if (!socket || !roomId) return;

    const payload: RoomConfigSetPayload = {
      roomId,
      winnersCount,
      winSentiment
    };
    socket.emit(SOCKET_EVENTS.ROOM_CONFIG_SET, payload);
    setShowConfigDialog(false);
  };

  const maxWinners = Math.min(10, Math.max(1, participants.length || 10));

  return (
    <>
      <div className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{roomTitle || '룰렛 투게더'}</h1>
            {roomId && <span className="text-xs text-muted-foreground">#{roomId.slice(-6)}</span>}
          </div>

          {/* 룰렛 설정 표시 */}
          <div className="flex items-center gap-3">
            {config && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrophyIcon className="w-4 h-4" />
                  <span>{config.winnersCount}명</span>
                </div>
                <span className="text-muted-foreground/50">|</span>
                <span>{config.winSentiment === 'POSITIVE' ? '긍정' : '부정'}</span>
                {isOwner && (
                  <Button variant="ghost" size="icon-sm" onClick={handleOpenConfigDialog} className="ml-1">
                    <SettingsIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

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
                  방장이 나가도 참가자들은 대기 상태로 유지됩니다. 30분 이내에 다시 입장할 수 있습니다.
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

      {/* Room Config Dialog (Owner Only) */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>랜덤 뽑기 설정</DialogTitle>
            <DialogDescription>당첨자 수와 당첨 감정을 설정하세요.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* 당첨자 수 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="winners-count">
                <UsersIcon className="w-4 h-4" />
                당첨자 수
              </Label>
              <Select value={String(winnersCount)} onValueChange={v => setWinnersCount(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue>당첨자 수 선택</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxWinners }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={String(num)}>
                      {num}명
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                최대 {participants.length > 0 ? Math.min(10, participants.length) : 10}명까지 선택 가능
              </p>
            </div>

            {/* 당첨 감정 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="win-sentiment">
                <TrophyIcon className="w-4 h-4" />
                당첨 감정
              </Label>
              <Select value={winSentiment} onValueChange={v => setWinSentiment(v as WinSentiment)}>
                <SelectTrigger className="w-full">
                  <SelectValue>당첨 감정 선택</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POSITIVE">긍정적 (당첨 = 좋은 것)</SelectItem>
                  <SelectItem value="NEGATIVE">부정적 (당첨 = 벌칙)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
            <Button onClick={handleSaveConfig}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
