'use client';

import { Card } from '@/shared/ui/Card';
import type { RoomConfig } from '@/entities/room/model/room.types';

interface RoomConfigCardProps {
  config: RoomConfig;
}

export const RoomConfigCard: React.FC<RoomConfigCardProps> = ({ config }) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">룰렛 설정</h3>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">당첨자 수:</span>
          <span className="font-medium">{config.winnersCount}명</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">당첨 감정:</span>
          <span className="font-medium">{config.winSentiment === 'POSITIVE' ? '🎁 긍정적' : '😅 부정적'}</span>
        </div>
      </div>
    </Card>
  );
};
