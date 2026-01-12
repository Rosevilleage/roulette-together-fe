'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/shared/ui/Stepper';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { createRoom } from '@/shared/api/room.api';
import type { WinSentiment } from '@/shared/types/room.types';

interface CreateRoomStepperProps {
  onComplete?: () => void;
}

export const CreateRoomStepper: React.FC<CreateRoomStepperProps> = ({ onComplete }) => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('');
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>('POSITIVE');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalStepCompleted = useCallback(async (): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);

      const request: {
        nickname?: string;
        winnersCount?: number;
        winSentiment?: WinSentiment;
      } = {};

      if (nickname.trim()) {
        request.nickname = nickname.trim();
      }
      if (winnersCount > 0) {
        request.winnersCount = winnersCount;
      }
      if (winSentiment) {
        request.winSentiment = winSentiment;
      }

      const response = await createRoom(request);

      // Navigate to room with owner role and token
      router.push(`/room/${response.roomId}?role=owner&token=${response.ownerToken}`);

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 생성에 실패했습니다.');
      setIsCreating(false);
    }
  }, [nickname, winnersCount, winSentiment, router, onComplete]);

  return (
    <div className="w-full">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={handleFinalStepCompleted}
        nextButtonText="다음"
        backButtonText="이전"
        stepCircleContainerClassName="bg-card border-0"
        contentClassName="min-h-[200px]"
      >
        <Step>
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">닉네임 설정</h3>
              <p className="text-sm text-muted-foreground">방에서 사용할 닉네임을 입력해주세요</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepper-nickname">닉네임 (선택사항)</Label>
              <Input
                id="stepper-nickname"
                type="text"
                placeholder="예: 방장님"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">입력하지 않으면 자동으로 닉네임이 생성됩니다</p>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">룰렛 설정</h3>
              <p className="text-sm text-muted-foreground">룰렛의 당첨자 수와 당첨 감정을 설정해주세요</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stepper-winners-count">당첨자 수</Label>
                <Input
                  id="stepper-winners-count"
                  type="number"
                  min="1"
                  max="100"
                  value={winnersCount}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value > 0) {
                      setWinnersCount(Math.min(value, 100));
                    } else if (e.target.value === '') {
                      setWinnersCount(1);
                    }
                  }}
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">뽑을 당첨자의 수를 입력해주세요 (1-100명)</p>
              </div>

              <div className="space-y-2">
                <Label>당첨 감정</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={winSentiment === 'POSITIVE' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setWinSentiment('POSITIVE')}
                    disabled={isCreating}
                  >
                    <span className="mr-2">🎁</span>
                    긍정적 (선물 추첨, 청소 면제 등)
                  </Button>
                  <Button
                    type="button"
                    variant={winSentiment === 'NEGATIVE' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setWinSentiment('NEGATIVE')}
                    disabled={isCreating}
                  >
                    <span className="mr-2">😅</span>
                    부정적 (설거지, 돈내기 등)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">뽑힌 사람이 받게 될 감정을 선택해주세요</p>
              </div>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">방 생성 준비 완료!</h3>
              <p className="text-sm text-muted-foreground">
                {nickname.trim()
                  ? `"${nickname.trim()}" 닉네임으로 방을 생성합니다`
                  : '자동 생성된 닉네임으로 방을 생성합니다'}
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">당첨자 수:</span>
                <span className="font-medium">{winnersCount}명</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">당첨 감정:</span>
                <span className="font-medium">{winSentiment === 'POSITIVE' ? '긍정적' : '부정적'}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>실시간 동기화</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>링크 공유</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>준비 상태 확인</span>
              </div>
            </div>

            {isCreating && <p className="text-center text-sm text-muted-foreground">방을 생성하는 중...</p>}
          </div>
        </Step>
      </Stepper>
    </div>
  );
};
