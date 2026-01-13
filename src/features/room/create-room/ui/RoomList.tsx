'use client';

import { useRouter } from 'next/navigation';
import { useRoomsQuery } from '@/entities/room/api/room.queries';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { TrophyIcon, Clock } from 'lucide-react';

const formatLastActivity = (timestamp: number, now: number): string => {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

export const RoomList: React.FC = () => {
  const router = useRouter();
  const { data, isLoading, error, dataUpdatedAt } = useRoomsQuery();

  // dataUpdatedAt은 쿼리가 업데이트될 때마다 변경되므로 안정적인 값
  const now = dataUpdatedAt;

  const handleRoomClick = (roomId: string): void => {
    router.push(`/room/${roomId}?role=owner`);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">내가 만든 방</h2>
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">내가 만든 방</h2>
        <div className="text-sm text-destructive">방 목록을 불러오는데 실패했습니다</div>
      </div>
    );
  }

  const rooms = data?.rooms ?? [];

  if (rooms.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">내가 만든 방</h2>
        <span className="text-xs text-muted-foreground">재연결 가능: 30분</span>
      </div>
      <div className="flex flex-col gap-2">
        {rooms.map(room => (
          <Card
            key={room.roomId}
            className="p-4 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => handleRoomClick(room.roomId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">{room.title}</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">{room.ownerNickname}</span>
                  <span className="text-xs text-muted-foreground">#{room.roomId.slice(-6)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="w-3.5 h-3.5" />
                    <span>
                      {room.winnersCount}명 {room.winSentiment === 'POSITIVE' ? '당첨' : '걸림'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatLastActivity(room.lastActivity, now)}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleRoomClick(room.roomId)}>
                입장
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
