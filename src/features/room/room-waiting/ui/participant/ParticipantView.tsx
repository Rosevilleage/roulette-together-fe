'use client';

import { motion } from 'motion/react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/useSocket';
import { Badge } from '@/shared/ui/Badge';
import PixelCard from '@/shared/ui/PixelCard';
import { useParticipantCardAnimation } from '@/features/room/room-waiting/hooks/useParticipantCardAnimation';
import { ParticipantCardContent } from '@/features/room/room-waiting/ui/participant/ParticipantCardContent';
import { NicknameEditor } from '@/features/room/room-waiting/ui/participant/NicknameEditor';
import { AnimationOverlay } from '@/features/room/room-waiting/ui/participant/AnimationOverlay';
import { cn } from '@/shared/lib/utils';

export const ParticipantView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, myReady, roomTitle, spin } = useRoomStore();

  const {
    phase,
    isBackdropDismissed,
    dismissBackdrop,
    showBackdrop,
    showLightBeam,
    isCardSpinning,
    hasAnswer,
    canClick,
    containerVariants,
    frontVariants,
    backVariants
  } = useParticipantCardAnimation({
    myReady,
    isSpinning: spin?.isSpinning,
    myOutcome: spin?.myOutcome
  });

  const isReady = phase === 'ready' || (phase === 'landed' && isBackdropDismissed && myReady);

  const getCardVariant = (): 'default' | 'blue' | 'yellow' | 'pink' => {
    if (phase === 'landed' && isBackdropDismissed) {
      return 'blue';
    }
    if (phase === 'landed' || phase === 'flip') {
      return spin?.myOutcome === 'WIN' ? 'yellow' : 'pink';
    }
    return 'default';
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

  const handleSaveNickname = (newNickname: string): void => {
    if (!socket || !roomId) {
      return;
    }

    socket.emit('participant:nickname:change', {
      roomId,
      nickname: newNickname
    });
  };

  return (
    <>
      <AnimationOverlay
        phase={phase}
        showBackdrop={showBackdrop}
        showLightBeam={showLightBeam}
        onBackdropClick={dismissBackdrop}
      />

      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              참가자
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{roomTitle} 대기실</h1>
            <p className="text-muted-foreground">준비가 되면 카드를 클릭해주세요</p>
          </div>

          {/* Nickname Editor */}
          {myNickname && <NicknameEditor nickname={myNickname} onSave={handleSaveNickname} />}

          {/* Ready Card (PixelCard) */}
          <div className="flex justify-center items-center" style={{ perspective: '1000px' }}>
            <motion.div
              variants={containerVariants}
              animate={phase}
              onClick={handleToggleReady}
              style={{ transformStyle: 'preserve-3d' }}
              className={`relative w-full p-1 max-w-[300px] aspect-4/5 z-50 ${
                canClick ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'
              }`}
            >
              {/* 준비 상태 glow 애니메이션 */}
              {isReady && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[25px] overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(white, white)',
                    WebkitMaskImage: 'linear-gradient(white, white)'
                  }}
                >
                  <div
                    className="absolute inset-[-50%] animate-[spin_3s_linear_infinite]"
                    style={{
                      background: `conic-gradient(
                        from 0deg,
                        transparent 0deg,
                        transparent 40deg,
                        rgba(59, 130, 246, 0.8) 50deg,
                        rgba(147, 197, 253, 1) 60deg,
                        rgba(59, 130, 246, 0.8) 70deg,
                        transparent 80deg,
                        transparent 220deg,
                        rgba(59, 130, 246, 0.8) 230deg,
                        rgba(147, 197, 253, 1) 240deg,
                        rgba(59, 130, 246, 0.8) 250deg,
                        transparent 260deg,
                        transparent 360deg
                      )`,
                      filter: 'blur(20px)'
                    }}
                  />
                </div>
              )}

              {/* 앞면 */}
              <motion.div
                variants={frontVariants}
                animate={phase}
                className={cn('absolute inset-0 bg-background rounded-[25px]', isReady && 'inset-0.5')}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <PixelCard
                  variant={getCardVariant()}
                  className={cn('w-full', isReady && 'bg-primary/10')}
                  hasAnswer={hasAnswer}
                  isSpinning={isCardSpinning}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <ParticipantCardContent
                      phase={phase}
                      outcome={spin?.myOutcome}
                      isBackdropDismissed={isBackdropDismissed}
                      myReady={myReady}
                    />
                  </div>
                </PixelCard>
              </motion.div>

              {/* 뒷면 */}
              <motion.div
                variants={backVariants}
                animate={phase}
                className="absolute inset-0 bg-background rounded-[25px]"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <PixelCard variant="default" className="w-full" hasAnswer={false} isSpinning={false}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <div className="text-center space-y-2">
                      <span className="text-5xl">❓</span>
                      <p className="text-lg font-semibold text-foreground">두근두근...</p>
                    </div>
                  </div>
                </PixelCard>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
