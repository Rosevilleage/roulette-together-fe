'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/shared/ui/Stepper';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Button } from '@/shared/ui/Button';
import { useCreateRoomMutation } from '@/entities/room/api/room.queries';
import { saveOwnedRoom } from '@/entities/room/lib/room_storage';
import type { WinSentiment } from '@/entities/room/model/room.types';

interface CreateRoomStepperProps {
  onComplete?: () => void;
}

export const CreateRoomStepper: React.FC<CreateRoomStepperProps> = ({ onComplete }) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>('POSITIVE');

  const { mutate: createRoom, isPending, error } = useCreateRoomMutation();

  const isNextDisabled = (step: number): boolean => {
    if (step === 1) {
      return !title.trim();
    }
    return false;
  };

  const handleFinalStepCompleted = (): void => {
    const request: {
      title: string;
      nickname?: string;
      winnersCount?: number;
      winSentiment?: WinSentiment;
    } = {
      title: title.trim()
    };

    if (nickname.trim()) {
      request.nickname = nickname.trim();
    }
    if (winnersCount > 0) {
      request.winnersCount = winnersCount;
    }
    if (winSentiment) {
      request.winSentiment = winSentiment;
    }

    createRoom(request, {
      onSuccess: response => {
        // v2.5: URL은 프론트엔드에서 직접 생성
        // ownerToken은 HTTP-only 쿠키로 자동 저장됨
        saveOwnedRoom(response.roomId);
        router.push(`/room/${response.roomId}?role=owner`);
        onComplete?.();
      }
    });
  };

  return (
    <div className="w-full">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={handleFinalStepCompleted}
        nextButtonText="다음"
        backButtonText="이전"
        stepCircleContainerClassName="bg-card border-0"
        contentClassName="min-h-[200px]"
        isNextDisabled={isNextDisabled}
      >
        <Step>
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">방 정보 설정</h3>
              <p className="text-sm text-muted-foreground">방 제목과 닉네임을 입력해주세요</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stepper-title">
                  방 제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stepper-title"
                  type="text"
                  placeholder="예: 점심 메뉴 정하기"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={50}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">방 제목을 입력해주세요</p>
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
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">입력하지 않으면 자동으로 닉네임이 생성됩니다</p>
              </div>
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
                  disabled={isPending}
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
                    disabled={isPending}
                  >
                    <span className="mr-2">🎁</span>
                    긍정적 (선물 추첨, 청소 면제 등)
                  </Button>
                  <Button
                    type="button"
                    variant={winSentiment === 'NEGATIVE' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setWinSentiment('NEGATIVE')}
                    disabled={isPending}
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
              <p className="text-sm text-muted-foreground">&quot;{title.trim()}&quot; 방을 생성합니다</p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">방 제목:</span>
                <span className="font-medium">{title.trim()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">닉네임:</span>
                <span className="font-medium">{nickname.trim() || '자동 생성'}</span>
              </div>
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
                <p className="text-sm text-destructive text-center">방 생성에 실패했습니다. 다시 시도해주세요.</p>
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

            {isPending && <p className="text-center text-sm text-muted-foreground">방을 생성하는 중...</p>}
          </div>
        </Step>
      </Stepper>
    </div>
  );
};
