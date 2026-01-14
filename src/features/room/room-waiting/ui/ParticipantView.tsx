'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/use-socket';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import PixelCard from '@/shared/ui/PixelCard';
import { Edit2, Save } from 'lucide-react';

type AnimationPhase = 'idle' | 'ready' | 'flying-up' | 'waiting' | 'light-beam' | 'descending' | 'landed';

// Card content component
const CardContent: React.FC<{
  phase: AnimationPhase;
  outcome: 'WIN' | 'LOSE' | null | undefined;
  isBackdropDismissed: boolean;
  myReady: boolean;
}> = ({ phase, outcome, isBackdropDismissed, myReady }) => {
  if (phase === 'idle') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">⏳</span>
        <p className="text-lg font-semibold text-foreground">준비하기</p>
        <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground/50">카드를 클릭하세요</p>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">✅</span>
        <p className="text-lg font-semibold text-foreground">준비 완료!</p>
        <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground/50">취소하려면 클릭</p>
      </div>
    );
  }

  if (phase === 'flying-up' || phase === 'waiting') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl animate-pulse">🎯</span>
        <p className="text-lg font-semibold text-foreground">추첨 중...</p>
      </div>
    );
  }

  if (phase === 'descending') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">{outcome === 'WIN' ? '🎉' : '😢'}</span>
        <p className="text-lg font-semibold text-foreground">결과 확인 중...</p>
      </div>
    );
  }

  // landed
  const guideText = isBackdropDismissed
    ? myReady
      ? '준비를 취소하려면 클릭'
      : '다시 준비하려면 클릭'
    : '배경을 클릭하면 닫힙니다';

  if (outcome === 'WIN') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">🎉</span>
        <p className="text-3xl font-bold text-foreground">당첨!</p>
        <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground">{guideText}</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      <span className="text-5xl">😢</span>
      <p className="text-xl font-semibold text-muted-foreground">다음 기회에...</p>
      <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground">{guideText}</p>
    </div>
  );
};

// Animation timing constants (in ms)
const FLYING_UP_DURATION = 600;
const WAITING_MIN_DURATION = 1000; // Minimum time to show waiting state
const LIGHT_BEAM_DURATION = 500; // Time for light beam to appear before card descends
const DESCENDING_DURATION = 1200;

export const ParticipantView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, myReady, config, roomTitle, spin } = useRoomStore();
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [newNickname, setNewNickname] = useState<string>(myNickname || '');
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [isBackdropDismissed, setIsBackdropDismissed] = useState<boolean>(false);

  // Track previous values and animation state
  const prevSpinRef = useRef<{ isSpinning?: boolean; myOutcome?: 'WIN' | 'LOSE' | null }>({});
  const prevMyReadyRef = useRef<boolean>(myReady);

  // Queue for pending result - stores outcome when it arrives during animation
  const pendingResultRef = useRef<'WIN' | 'LOSE' | null>(null);
  const waitingStartTimeRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeout
  const clearAnimationTimeout = useCallback((): void => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // Process pending result (called when ready to show result)
  const processPendingResult = useCallback((): void => {
    if (pendingResultRef.current) {
      // First show light beam
      setPhase('light-beam');
      animationTimeoutRef.current = setTimeout(() => {
        // Then descend the card
        setPhase('descending');
        animationTimeoutRef.current = setTimeout(() => {
          setPhase('landed');
          pendingResultRef.current = null;
        }, DESCENDING_DURATION);
      }, LIGHT_BEAM_DURATION);
    }
  }, []);

  // Handle transition to waiting state and check for pending results
  const transitionToWaiting = useCallback((): void => {
    setPhase('waiting');
    waitingStartTimeRef.current = Date.now();

    // If result already arrived, process it after minimum waiting time
    if (pendingResultRef.current) {
      animationTimeoutRef.current = setTimeout(() => {
        processPendingResult();
      }, WAITING_MIN_DURATION);
    }
  }, [processPendingResult]);

  // Phase transition logic
  const updatePhase = useCallback((): void => {
    const prevSpin = prevSpinRef.current;
    const prevMyReady = prevMyReadyRef.current;

    // Detect spin start
    if (spin?.isSpinning && !prevSpin.isSpinning && myReady) {
      clearAnimationTimeout();
      pendingResultRef.current = null;
      waitingStartTimeRef.current = null;
      setIsBackdropDismissed(false); // Reset dismissed state for new spin
      setPhase('flying-up');
      animationTimeoutRef.current = setTimeout(() => {
        transitionToWaiting();
      }, FLYING_UP_DURATION);
    }
    // Detect result received
    else if (spin?.myOutcome && !prevSpin.myOutcome) {
      // Store the result
      pendingResultRef.current = spin.myOutcome;

      // Check current phase and handle accordingly
      if (phase === 'waiting') {
        // Already in waiting, check if minimum time has passed
        const waitingElapsed = waitingStartTimeRef.current ? Date.now() - waitingStartTimeRef.current : 0;
        const remainingWaitTime = Math.max(0, WAITING_MIN_DURATION - waitingElapsed);

        clearAnimationTimeout();
        animationTimeoutRef.current = setTimeout(() => {
          processPendingResult();
        }, remainingWaitTime);
      }
      // If still in flying-up, the result will be processed after transitionToWaiting
    }
    // Ready state changed (only when not in animation, or when backdrop is dismissed after landing)
    else if (
      myReady !== prevMyReady &&
      (!['flying-up', 'waiting', 'light-beam', 'descending', 'landed'].includes(phase) ||
        (phase === 'landed' && isBackdropDismissed))
    ) {
      // When backdrop is dismissed after landing, allow phase change regardless of myOutcome
      const canChangeToReady =
        phase === 'landed' && isBackdropDismissed ? !spin?.isSpinning : !spin?.isSpinning && !spin?.myOutcome;

      if (myReady && canChangeToReady) {
        setPhase('ready');
      } else if (!myReady && !spin?.isSpinning) {
        setPhase('idle');
      }
    }

    // Update refs
    prevSpinRef.current = { isSpinning: spin?.isSpinning, myOutcome: spin?.myOutcome };
    prevMyReadyRef.current = myReady;
  }, [
    myReady,
    spin?.isSpinning,
    spin?.myOutcome,
    phase,
    isBackdropDismissed,
    clearAnimationTimeout,
    transitionToWaiting,
    processPendingResult
  ]);

  useEffect(() => {
    updatePhase();
  }, [updatePhase]);

  // Initialize phase based on current state
  useEffect(() => {
    if (myReady && !spin?.isSpinning && !spin?.myOutcome) {
      setPhase('ready');
    } else if (!myReady) {
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, [clearAnimationTimeout]);

  // Computed animation states
  const showBackdrop =
    ['flying-up', 'waiting', 'light-beam', 'descending', 'landed'].includes(phase) && !isBackdropDismissed;
  // const isBackdropSpinning = ['flying-up', 'waiting'].includes(phase);
  const showLightBeam = ['light-beam', 'descending', 'landed'].includes(phase) && !isBackdropDismissed;
  const isCardSpinning = ['ready', 'flying-up', 'descending'].includes(phase);
  const hasAnswer = phase === 'landed';
  // Allow clicking when idle, ready, or when backdrop is dismissed after landing
  const canClick = phase === 'idle' || phase === 'ready' || (phase === 'landed' && isBackdropDismissed);

  const getCardVariant = (): 'default' | 'blue' | 'yellow' => {
    if (phase === 'landed' || phase === 'descending') {
      return spin?.myOutcome === 'WIN' ? 'yellow' : 'default';
    }
    return 'blue';
  };

  // Framer Motion variants
  const cardVariants = {
    idle: { y: 0, opacity: 1, scale: 1 },
    ready: { y: 0, opacity: 1, scale: 1 },
    'flying-up': {
      y: '-100vh',
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.6, ease: 'easeIn' as const }
    },
    waiting: { y: '-100vh', opacity: 0 },
    'light-beam': { y: '-100vh', opacity: 0 }, // Card stays hidden while light beam appears
    descending: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }
    },
    landed: { y: 0, opacity: 1, scale: 1 }
  };

  const handleToggleReady = (): void => {
    if (!socket || !roomId || !canClick) {
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
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {showBackdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 overflow-hidden"
          >
            {/* Semi-transparent background */}
            <div
              className={`absolute inset-0 bg-black/60 ${phase === 'landed' ? 'cursor-pointer' : ''}`}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (phase === 'landed') {
                  setIsBackdropDismissed(true);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light beam effect */}
      <AnimatePresence>
        {showLightBeam && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[200px] h-[60vh] z-50 pointer-events-none origin-top"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)',
              filter: 'blur(20px)'
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              참가자
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{roomTitle} 대기실</h1>
            <p className="text-muted-foreground">준비가 되면 카드를 클릭해주세요</p>
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

          {/* Ready Card (PixelCard) */}
          <div className="flex justify-center items-center">
            <motion.div
              variants={cardVariants}
              animate={phase}
              onClick={handleToggleReady}
              className={`relative w-full p-1 max-w-[300px] aspect-4/5 z-50 ${
                canClick ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'
              }`}
            >
              <PixelCard
                variant={getCardVariant()}
                className="w-full bg-card"
                hasAnswer={hasAnswer}
                isSpinning={isCardSpinning}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <CardContent
                    phase={phase}
                    outcome={spin?.myOutcome}
                    isBackdropDismissed={isBackdropDismissed}
                    myReady={myReady}
                  />
                </div>
              </PixelCard>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
