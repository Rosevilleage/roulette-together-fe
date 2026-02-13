'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Stepper, { Step } from '@/shared/ui/Stepper';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCreateRoomMutation, getCreateRoomError } from '@/entities/room/api/room.queries';
import { saveOwnedRoom } from '@/entities/room/lib/room_storage';
import type { WinSentiment, CreateRoomResponse, RoomApiErrorResponse } from '@/entities/room/model/room.types';
import type { AxiosError } from 'axios';

/** 로딩 UI가 표시되는 최소 시간 (ms) */
const MIN_LOADING_MS = 2500;

/** Rate Limit 쿨다운 저장 키 (sessionStorage) */
const RATE_LIMIT_COOLDOWN_KEY = 'roomCreateRateLimitUntil';

/** Rate Limit 쿨다운 시간 (ms) */
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60초

interface CreateRoomStepperProps {
  onComplete?: () => void;
}

export const CreateRoomStepper: React.FC<CreateRoomStepperProps> = ({ onComplete }) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>('POSITIVE');

  // 로딩 스텝 관련 state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createdRoomData, setCreatedRoomData] = useState<CreateRoomResponse | null>(null);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const [createRoomErrorCode, setCreateRoomErrorCode] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);

  const { mutate: createRoom, isPending } = useCreateRoomMutation();

  // Rate limit 쿨다운 체크 (마운트 시 및 주기적으로)
  useEffect(() => {
    const checkRateLimitCooldown = (): void => {
      const cooldownUntil = sessionStorage.getItem(RATE_LIMIT_COOLDOWN_KEY);
      if (cooldownUntil) {
        const remaining = parseInt(cooldownUntil, 10) - Date.now();
        if (remaining > 0) {
          setRateLimitCooldown(remaining);
        } else {
          sessionStorage.removeItem(RATE_LIMIT_COOLDOWN_KEY);
          setRateLimitCooldown(0);
        }
      }
    };

    checkRateLimitCooldown();
    const interval = setInterval(checkRateLimitCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const isNextDisabled = (step: number): boolean => {
    if (step === 1) {
      return !title.trim();
    }
    if (step === 3) {
      // 3번째 스텝: Rate limit 쿨다운 중이면 비활성화
      return rateLimitCooldown > 0;
    }
    if (step === 4) {
      // 4번째 스텝: 생성 완료 또는 에러 발생 시에만 활성화
      return !createdRoomData && !createRoomError;
    }
    return false;
  };

  const handleStepChange = (step: number): void => {
    if (step === 4 && !isCreating && !createdRoomData && !createRoomError) {
      // 방 생성 시작
      setIsCreating(true);

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

      const startedAt = Date.now();

      createRoom(request, {
        onSuccess: response => {
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

          if (remaining > 0) {
            setTimeout(() => {
              setCreatedRoomData(response);
              saveOwnedRoom(response.roomId);
              setIsCreating(false);
            }, remaining);
          } else {
            setCreatedRoomData(response);
            saveOwnedRoom(response.roomId);
            setIsCreating(false);
          }
        },
        onError: (error: AxiosError) => {
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

          // API 에러 메시지 및 에러 코드 추출
          const { message, errorCode } = getCreateRoomError(error as AxiosError<RoomApiErrorResponse>);

          // Rate limit 에러 처리
          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            const cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
            sessionStorage.setItem(RATE_LIMIT_COOLDOWN_KEY, String(cooldownUntil));
            setRateLimitCooldown(RATE_LIMIT_COOLDOWN_MS);
          }

          if (remaining > 0) {
            setTimeout(() => {
              setCreateRoomError(message);
              setCreateRoomErrorCode(errorCode || null);
              setIsCreating(false);
            }, remaining);
          } else {
            setCreateRoomError(message);
            setCreateRoomErrorCode(errorCode || null);
            setIsCreating(false);
          }
        }
      });
    }
  };

  const handleEnterRoom = (): void => {
    if (createdRoomData) {
      router.push(`/room/${createdRoomData.roomId}?role=owner`);
      onComplete?.();
    }
  };

  const handleCloseModal = (): void => {
    onComplete?.();
  };

  const handleRetry = (): void => {
    // 에러 상태 초기화 후 재시도
    setCreateRoomError(null);
    setCreateRoomErrorCode(null);
    setIsCreating(true);

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

    const startedAt = Date.now();

    createRoom(request, {
      onSuccess: response => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

        if (remaining > 0) {
          setTimeout(() => {
            setCreatedRoomData(response);
            saveOwnedRoom(response.roomId);
            setIsCreating(false);
          }, remaining);
        } else {
          setCreatedRoomData(response);
          saveOwnedRoom(response.roomId);
          setIsCreating(false);
        }
      },
      onError: (error: AxiosError) => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

        const { message, errorCode } = getCreateRoomError(error as AxiosError<RoomApiErrorResponse>);

        if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          const cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          sessionStorage.setItem(RATE_LIMIT_COOLDOWN_KEY, String(cooldownUntil));
          setRateLimitCooldown(RATE_LIMIT_COOLDOWN_MS);
        }

        if (remaining > 0) {
          setTimeout(() => {
            setCreateRoomError(message);
            setCreateRoomErrorCode(errorCode || null);
            setIsCreating(false);
          }, remaining);
        } else {
          setCreateRoomError(message);
          setCreateRoomErrorCode(errorCode || null);
          setIsCreating(false);
        }
      }
    });
  };

  const getCompleteButtonText = (): string => {
    if (createRoomError) return '닫기';
    if (createdRoomData) return '방 입장';
    return 'Complete';
  };

  const getNextButtonProps = (): React.ButtonHTMLAttributes<HTMLButtonElement> => {
    if (createRoomError) {
      return {
        className:
          'duration-350 flex items-center justify-center rounded-full bg-red-500 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500'
      };
    }
    return {};
  };

  const getBackButtonProps = (): React.ButtonHTMLAttributes<HTMLButtonElement> => {
    // 4번째 스텝에서 로딩 중, 에러 발생, 또는 생성 성공 시 이전 버튼 비활성화
    if (isCreating || createRoomError || createdRoomData) {
      return {
        disabled: true,
        className: 'duration-350 rounded px-2 py-1 transition pointer-events-none opacity-50 text-neutral-400'
      };
    }
    return {};
  };

  return (
    <div className="w-full">
      <Stepper
        initialStep={1}
        onStepChange={handleStepChange}
        onFinalStepCompleted={createRoomError ? handleCloseModal : handleEnterRoom}
        nextButtonText="다음"
        backButtonText="이전"
        completeButtonText={getCompleteButtonText()}
        stepCircleContainerClassName="bg-card border-0"
        contentClassName="min-h-[200px]"
        isNextDisabled={isNextDisabled}
        nextButtonProps={getNextButtonProps()}
        backButtonProps={getBackButtonProps()}
        renderStepIndicator={({ step, currentStep, onStepClick }) => {
          const isLastStep = step === 4;
          const isActive = currentStep === step;
          const isComplete = currentStep > step;
          const showError = isLastStep && isActive && createRoomError;

          return (
            <motion.div
              onClick={() => {
                // 에러 또는 로딩 중일 때는 스텝 클릭 비활성화
                if (!isCreating && !createRoomError) {
                  onStepClick(step);
                }
              }}
              className={cn(
                'relative outline-none focus:outline-none',
                isCreating || createRoomError ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              <motion.div
                animate={{
                  scale: showError ? [1, 1.1, 1] : 1,
                  backgroundColor: showError ? '#ef4444' : isComplete || isActive ? '#5227FF' : '#222222'
                }}
                transition={{ duration: 0.3 }}
                className="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
              >
                {isComplete ? (
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
                    className="h-4 w-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : isActive ? (
                  <div className={cn('h-3 w-3 rounded-full', showError ? 'bg-white' : 'bg-[#060010]')} />
                ) : (
                  <span className="text-sm text-neutral-400">{step}</span>
                )}
              </motion.div>
            </motion.div>
          );
        }}
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
              <h3 className="text-lg font-semibold">랜덤 뽑기 설정</h3>
              <p className="text-sm text-muted-foreground">랜덤 뽑기의 당첨자 수와 당첨 감정을 설정해주세요</p>
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

            {rateLimitCooldown > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-center text-yellow-600">
                  너무 많은 요청을 보냈습니다. {Math.ceil(rateLimitCooldown / 1000)}초 후 다시 시도할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </Step>

        <Step>
          <LoadingStep
            isCreating={isCreating}
            createdRoomData={createdRoomData}
            createRoomError={createRoomError}
            createRoomErrorCode={createRoomErrorCode}
            title={title}
            winnersCount={winnersCount}
            winSentiment={winSentiment}
            onRetry={handleRetry}
          />
        </Step>
      </Stepper>
    </div>
  );
};

interface LoadingStepProps {
  isCreating: boolean;
  createdRoomData: CreateRoomResponse | null;
  createRoomError: string | null;
  createRoomErrorCode: string | null;
  title: string;
  winnersCount: number;
  winSentiment: WinSentiment;
  onRetry: () => void;
}

const loadingSteps = [
  { text: '방 생성 중...', delay: 0 },
  { text: '방 설정 적용 중...', delay: 800 },
  { text: '공유 링크 생성 중...', delay: 1600 },
  { text: '준비 완료!', delay: 2400 }
];

function LoadingStep({
  isCreating,
  createdRoomData,
  createRoomError,
  createRoomErrorCode,
  title,
  winnersCount,
  winSentiment,
  onRetry
}: LoadingStepProps): React.ReactElement {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  useEffect(() => {
    if (isCreating) {
      loadingSteps.forEach((step, index) => {
        setTimeout(() => {
          setActiveStepIndex(index);
        }, step.delay);
      });
    }
  }, [isCreating]);

  // 로딩 상태
  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <Spinner className="size-12 text-primary" />
        <div className="flex flex-col items-center gap-3">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step.text}
              initial={{ opacity: 0.4, color: 'hsl(var(--muted-foreground))' }}
              animate={{
                opacity: index <= activeStepIndex ? 1 : 0.4,
                color: index <= activeStepIndex ? '#5227FF' : 'hsl(var(--muted-foreground))'
              }}
              transition={{ duration: 0.5 }}
              className="text-sm font-medium"
            >
              {step.text}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (createRoomError) {
    // 500 계열 에러: 재시도 가능
    const isRetryableError =
      createRoomErrorCode === 'ROOM_CREATION_FAILED' ||
      createRoomErrorCode === 'DATABASE_ERROR' ||
      createRoomErrorCode === 'INTERNAL_ERROR';

    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="size-16 text-destructive" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-destructive">방 생성 실패</h3>
            <p className="text-sm text-muted-foreground">{createRoomError}</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 w-full">
          <p className="text-sm text-center text-destructive">오류가 발생했습니다.</p>
        </div>
        {isRetryableError && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full max-w-xs border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            재시도
          </Button>
        )}
      </div>
    );
  }

  // 성공 상태
  if (createdRoomData) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <CheckCircle2 className="size-16 text-green-500" />
          <div className="text-center space-y-0.5">
            <h3 className="text-lg font-semibold">방 생성 완료!</h3>
            <p className="text-sm text-muted-foreground">방이 성공적으로 생성되었습니다</p>
          </div>
        </motion.div>

        <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 w-full">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">방 제목:</span>
            <span className="font-medium">{title}</span>
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
      </div>
    );
  }

  return <div />;
}
