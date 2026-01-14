'use client';

import { motion } from 'motion/react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/useSocket';
import { Badge } from '@/shared/ui/Badge';
import PixelCard from '@/shared/ui/PixelCard';
import { useParticipantCardAnimation } from '@/features/room/room-waiting/hooks/useParticipantCardAnimation';
import { RoomConfigCard } from '@/features/room/room-waiting/ui/RoomConfigCard';
import { ParticipantCardContent } from '@/features/room/room-waiting/ui/participant/ParticipantCardContent';
import { NicknameEditor } from '@/features/room/room-waiting/ui/participant/NicknameEditor';
import { AnimationOverlay } from '@/features/room/room-waiting/ui/participant/AnimationOverlay';

export const ParticipantView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, myReady, config, roomTitle, spin } = useRoomStore();

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

      <div className="h-full flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
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

          {/* Room Config */}
          {config && <RoomConfigCard config={config} />}

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
              {/* 앞면 */}
              <motion.div
                variants={frontVariants}
                animate={phase}
                className="absolute inset-0 bg-background rounded-[25px]"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <PixelCard
                  variant={getCardVariant()}
                  className="w-full"
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
