'use client';

import { useState } from 'react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/use-socket';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { CheckCircle2, Clock, Edit2, Save } from 'lucide-react';

export const ParticipantView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, myReady, config, roomTitle } = useRoomStore();
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [newNickname, setNewNickname] = useState<string>(myNickname || '');

  const handleToggleReady = (): void => {
    if (!socket || !roomId) {
      return;
    }

    socket.emit('participant:ready:toggle', {
      roomId,
      ready: !myReady
    });
  };

  const handleSaveNickname = (): void => {
    if (!socket || !roomId || !newNickname.trim()) {
      return;
    }

    socket.emit('participant:nickname:change', {
      roomId,
      nickname: newNickname.trim()
    });
    setIsEditingNickname(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-2">
            참가자
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{roomTitle} 대기실</h1>
          <p className="text-muted-foreground">준비가 되면 준비 완료 버튼을 눌러주세요</p>
        </div>

        {/* Nickname Card */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">내 정보</h3>
          {isEditingNickname ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-nickname">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-nickname"
                  type="text"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  maxLength={20}
                  placeholder="새 닉네임"
                />
                <Button size="icon" onClick={handleSaveNickname} disabled={!newNickname.trim()}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">닉네임</p>
                <p className="font-medium text-lg">{myNickname}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setNewNickname(myNickname || '');
                  setIsEditingNickname(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

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

        {/* Ready Status */}
        <Card className="p-6 text-center">
          {myReady ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div>
                <h3 className="font-semibold text-lg mb-1">준비 완료!</h3>
                <p className="text-sm text-muted-foreground">방장이 룰렛을 시작할 때까지 기다려주세요</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg mb-1">대기 중</h3>
                <p className="text-sm text-muted-foreground">준비가 되면 아래 버튼을 눌러주세요</p>
              </div>
            </div>
          )}
        </Card>

        {/* Ready Button */}
        <Button
          size="lg"
          variant={myReady ? 'outline' : 'default'}
          onClick={handleToggleReady}
          className="w-full h-14 text-lg font-semibold"
        >
          {myReady ? '준비 취소' : '✓ 준비 완료'}
        </Button>
      </div>
    </div>
  );
};
