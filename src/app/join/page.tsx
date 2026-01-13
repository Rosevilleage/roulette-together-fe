'use client';

import { useState, useCallback, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAlertStore } from '@/shared/store/alert.store';
import { ArrowLeftIcon, QrCodeIcon, ClockIcon, TrashIcon } from 'lucide-react';
import {
  getVisitedRooms,
  removeVisitedRoom,
  cleanupOldVisitedRooms,
  type VisitedRoomInfo
} from '@/shared/lib/room-storage';

// 초기 방문 기록 불러오기 (컴포넌트 외부에서 실행)
const getInitialVisitedRooms = (): VisitedRoomInfo[] => {
  if (typeof window === 'undefined') return [];
  cleanupOldVisitedRooms();
  return getVisitedRooms();
};

export default function JoinPage(): ReactElement {
  const router = useRouter();
  const showAlert = useAlertStore(state => state.showAlert);
  const [roomUrl, setRoomUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [visitedRooms, setVisitedRooms] = useState<VisitedRoomInfo[]>(getInitialVisitedRooms);

  const handleJoinByUrl = useCallback((): void => {
    try {
      // Parse URL to extract roomId and other params
      const url = new URL(roomUrl);
      const pathname = url.pathname;

      // Expected format: /room/:roomId?role=participant
      if (pathname.startsWith('/room/')) {
        router.push(`${pathname}${url.search || '?role=participant'}`);
      } else {
        showAlert('올바른 방 링크가 아닙니다.');
      }
    } catch {
      showAlert('올바른 URL 형식이 아닙니다.');
    }
  }, [roomUrl, router, showAlert]);

  const handleQrScan = (): void => {
    setIsScanning(true);
    // QR 스캔 기능은 추후 구현
    // 카메라 권한 요청 및 QR 코드 스캔
    showAlert('QR 코드 스캔 기능은 개발 중입니다.');
    setIsScanning(false);
  };

  const handleJoinVisitedRoom = useCallback(
    (room: VisitedRoomInfo): void => {
      router.push(`/room/${room.roomId}?role=participant`);
    },
    [router]
  );

  const handleRemoveVisitedRoom = useCallback((roomId: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    removeVisitedRoom(roomId);
    setVisitedRooms(prev => prev.filter(room => room.roomId !== roomId));
  }, []);

  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = useCallback(
    (timestamp: number): string => {
      const diff = currentTime - timestamp;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return '방금 전';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      return `${days}일 전`;
    },
    [currentTime]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">방 참가하기</h1>
            <p className="text-sm text-muted-foreground">QR 코드를 스캔하거나 링크를 입력하세요</p>
          </div>
        </div>

        {/* Visited Rooms Section */}
        {visitedRooms.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">최근 참가한 방</p>
            {visitedRooms.map(room => (
              <div
                key={room.roomId}
                onClick={() => handleJoinVisitedRoom(room)}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{room.roomName || `방 ${room.roomId.slice(0, 8)}...`}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{room.nickname}</span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {formatRelativeTime(room.visitedAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => handleRemoveVisitedRoom(room.roomId, e)}
                >
                  <TrashIcon className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* QR Scan Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full aspect-square max-w-[280px] bg-muted/30 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
              {isScanning ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">카메라로 QR 코드를 비춰주세요</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <QrCodeIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">QR 코드 스캔 영역</p>
                </div>
              )}
            </div>
            <Button size="lg" className="w-full" onClick={handleQrScan} disabled={isScanning}>
              <QrCodeIcon className="w-5 h-5 mr-2" />
              {isScanning ? '스캔 중...' : 'QR 코드 스캔하기'}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-url">방 링크 입력</Label>
            <Input
              id="room-url"
              type="text"
              placeholder="https://example.com/room/..."
              value={roomUrl}
              onChange={e => setRoomUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">방장에게 받은 링크를 입력해주세요</p>
          </div>
          <Button size="lg" className="w-full" onClick={handleJoinByUrl} disabled={!roomUrl.trim()}>
            링크로 참가하기
          </Button>
        </div>
      </div>
    </div>
  );
}
