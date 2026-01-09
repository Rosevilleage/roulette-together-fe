"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Stepper, { Step } from "@/shared/ui/Stepper";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { createRoom } from "@/shared/api/room.api";

interface CreateRoomStepperProps {
  onComplete?: () => void;
}

export const CreateRoomStepper: React.FC<CreateRoomStepperProps> = ({
  onComplete,
}) => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalStepCompleted = useCallback(async (): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await createRoom(
        nickname.trim() ? { nickname: nickname.trim() } : {}
      );

      // Navigate to room with owner role and token
      router.push(
        `/room/${response.roomId}?role=owner&token=${response.ownerToken}`
      );
      
      onComplete?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "방 생성에 실패했습니다."
      );
      setIsCreating(false);
    }
  }, [nickname, router, onComplete]);

  return (
    <div className="w-full">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={handleFinalStepCompleted}
        nextButtonText="다음"
        backButtonText="이전"
        stepCircleContainerClassName="bg-card border-border"
        contentClassName="min-h-[200px]"
      >
        <Step>
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">닉네임 설정</h3>
              <p className="text-sm text-muted-foreground">
                방에서 사용할 닉네임을 입력해주세요
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepper-nickname">닉네임 (선택사항)</Label>
              <Input
                id="stepper-nickname"
                type="text"
                placeholder="예: 방장님"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                입력하지 않으면 자동으로 닉네임이 생성됩니다
              </p>
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
                  : "자동 생성된 닉네임으로 방을 생성합니다"}
              </p>
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
            
            {isCreating && (
              <p className="text-center text-sm text-muted-foreground">
                방을 생성하는 중...
              </p>
            )}
          </div>
        </Step>
      </Stepper>
    </div>
  );
};
