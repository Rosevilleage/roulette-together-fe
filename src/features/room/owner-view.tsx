'use client';

import { useState } from 'react';
import { useRoomStore } from '@/shared/store/room.store';
import { useSocket } from '@/shared/hooks/use-socket';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ShareIcon, CheckCircle2, Clock, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const OwnerView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, config, participants, readyCount, allReady } = useRoomStore();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const participantUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}?role=participant` : '';

  const handleShareLink = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '룰렛 투게더 - 방 참가',
          text: '룰렛 게임에 참가해보세요!',
          url: participantUrl
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      await navigator.clipboard.writeText(participantUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleSpinRoulette = (): void => {
    if (!socket || !roomId || !allReady) {
      return;
    }

    const requestId = uuidv4();
    setIsSpinning(true);
    socket.emit('spin:request', { roomId, requestId });

    // Reset spinning state after timeout
    setTimeout(() => {
      setIsSpinning(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <Badge variant="default" className="mb-2">
            방장
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{myNickname}님의 룰렛 방</h1>
          <p className="text-muted-foreground">참가자들이 모두 준비될 때까지 기다려주세요</p>
        </div>

        {/* Room Config */}
        {config && (
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
        )}

        {/* Participants List */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              참가자 목록
            </h3>
            <Badge variant="secondary">
              {readyCount}/{participants.length}명 준비 완료
            </Badge>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>아직 참가자가 없습니다</p>
              <p className="text-sm mt-2">링크를 공유해보세요!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {participants.map(participant => (
                <div key={participant.rid} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{participant.nickname}</span>
                  {participant.ready ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      준비 완료
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      대기 중
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleSpinRoulette}
            disabled={!allReady || isSpinning || participants.length === 0}
            className="w-full h-14 text-lg font-semibold"
          >
            {isSpinning ? '룰렛 돌리는 중...' : allReady ? '🎯 룰렛 돌리기' : '모든 참가자가 준비해야 합니다'}
          </Button>

          <Button size="lg" variant="outline" onClick={handleShareLink} className="w-full h-12 gap-2">
            <ShareIcon className="w-5 h-5" />
            참가자 링크 공유
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>방 ID: {roomId}</p>
        </div>
      </div>
    </div>
  );
};
