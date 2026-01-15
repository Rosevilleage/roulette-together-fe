'use client';

import { useState, useRef, useMemo, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/useSocket';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import PixelCard from '@/shared/ui/PixelCard';
import { ShareIcon, Users, Copy, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOwnerCardAnimation } from '../../hooks/useOwnerCardAnimation';
import { OwnerAnimationOverlay } from './OwnerAnimationOverlay';
import { CardStack } from './CardStack';

// 카드 위치 정보 타입
interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 뒤집히는 참가자 카드 컴포넌트
interface FlippableCardProps {
  nickname: string;
  ready: boolean;
  isFlipped: boolean;
}

const FlippableCard: React.FC<FlippableCardProps> = ({ nickname, ready, isFlipped }) => {
  return (
    <div className="w-full h-full" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 앞면 - 참가자 정보 */}
        <div className="absolute inset-0 bg-card rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
          <PixelCard variant={ready ? 'blue' : 'default'} doAnimation={ready && !isFlipped} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-3xl mb-2">{ready ? '✅' : '⏳'}</span>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{nickname}</p>
              <p className="text-xs text-foreground/60 mt-1">{ready ? '준비 완료' : '대기 중'}</p>
            </div>
          </PixelCard>
        </div>

        {/* 뒷면 - 물음표 */}
        <div
          className="absolute inset-0 bg-card rounded-[25px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <PixelCard variant="default" doAnimation={false} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-4xl">?</span>
            </div>
          </PixelCard>
        </div>
      </motion.div>
    </div>
  );
};

export const OwnerView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, participants, readyCount, allReady } = useRoomStore();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // 각 카드의 DOM 위치를 저장하는 ref
  const cardRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // 카드 위치 상태 (애니메이션 시작 시 캡처)
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(new Map());

  // Animation hook
  const { phase, showBackdrop, showLightBeams, isFlipped, winners, dismissBackdrop } = useOwnerCardAnimation();

  // 당첨자 닉네임 Set
  const winnerNicknames = useMemo(() => {
    return new Set(winners.map(w => w.nickname));
  }, [winners]);

  // gathering 시작 시 카드 위치 캡처
  useLayoutEffect(() => {
    if (phase === 'gathering') {
      const positions = new Map<string, CardPosition>();
      cardRefsMap.current.forEach((el, rid) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          positions.set(rid, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height
          });
        }
      });
      setCardPositions(positions);
    }
  }, [phase]);

  // 화면 중앙 좌표
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

  // 스택 오프셋 계산
  const getStackOffset = (index: number): { rotate: number; y: number } => {
    const direction = index % 2 === 0 ? 1 : -1;
    const rotate = direction * (index * 2);
    const y = -index * 2;
    return { rotate, y };
  };

  // 카드 ref 설정 함수
  const setCardRef =
    (rid: string) =>
    (el: HTMLDivElement | null): void => {
      cardRefsMap.current.set(rid, el);
    };

  // 당첨자인지 확인
  const isWinner = (nickname: string): boolean => {
    return winnerNicknames.has(nickname);
  };

  // 카드 애니메이션 상태 계산
  const getCardAnimationState = (
    rid: string,
    nickname: string,
    index: number
  ): {
    x: number;
    y: number;
    rotate: number;
    opacity: number;
    zIndex: number;
    scale: number;
    isCardFlipped: boolean;
  } => {
    const cardPos = cardPositions.get(rid);
    const { rotate: stackRotate, y: stackY } = getStackOffset(index);
    const participantIsWinner = isWinner(nickname);

    // idle: 원위치, 앞면
    if (phase === 'idle') {
      return { x: 0, y: 0, rotate: 0, opacity: 1, zIndex: 1, scale: 1, isCardFlipped: false };
    }

    // gathering: 중앙으로 이동하면서 뒤집힘
    if (phase === 'gathering') {
      if (!cardPos) {
        return { x: 0, y: 0, rotate: 0, opacity: 1, zIndex: 1, scale: 1, isCardFlipped: true };
      }

      const offsetX = centerX - cardPos.x;
      const offsetY = centerY - cardPos.y;

      return {
        x: offsetX,
        y: offsetY,
        rotate: 0,
        opacity: 1,
        zIndex: participants.length - index + 50,
        scale: 1,
        isCardFlipped: true
      };
    }

    // stacked: 중앙에서 스택 형태로 정렬, 뒤집힌 상태 유지
    if (phase === 'stacked') {
      if (!cardPos) {
        return { x: 0, y: 0, rotate: 0, opacity: 1, zIndex: 1, scale: 1, isCardFlipped: true };
      }

      const offsetX = centerX - cardPos.x;
      const offsetY = centerY - cardPos.y;

      return {
        x: offsetX,
        y: offsetY + stackY,
        rotate: stackRotate,
        opacity: 1,
        zIndex: participants.length - index + 50,
        scale: 1,
        isCardFlipped: true
      };
    }

    // reveal-flip: 원위치로 복귀, 아직 뒤집힌 상태 (당첨자는 투명하게)
    if (phase === 'reveal-flip') {
      return {
        x: 0,
        y: 0,
        rotate: 0,
        opacity: participantIsWinner ? 0 : 1,
        zIndex: 1,
        scale: 1,
        isCardFlipped: true
      };
    }

    // result-shown: 원위치, 다시 앞면으로 (당첨자는 투명 유지)
    if (phase === 'result-shown') {
      return {
        x: 0,
        y: 0,
        rotate: 0,
        opacity: participantIsWinner ? 0 : 1,
        zIndex: 1,
        scale: 1,
        isCardFlipped: false
      };
    }

    // dispersing: 원위치, 앞면
    if (phase === 'dispersing') {
      return { x: 0, y: 0, rotate: 0, opacity: 1, zIndex: 1, scale: 1, isCardFlipped: false };
    }

    return { x: 0, y: 0, rotate: 0, opacity: 1, zIndex: 1, scale: 1, isCardFlipped: false };
  };

  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const participantUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}?role=participant` : '';

  const handleCopyLink = async (): Promise<void> => {
    if (isCopied) {
      return;
    }

    try {
      await navigator.clipboard.writeText(participantUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShareLink = async (): Promise<void> => {
    if (isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: '룰렛 투게더 - 방 참가',
          text: '룰렛 게임에 참가해보세요!',
          url: participantUrl
        });
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
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

  // Handle backdrop click - only dismiss in result-shown phase
  const handleBackdropClick = (): void => {
    dismissBackdrop();
  };

  return (
    <>
      {/* Animation Overlay */}
      <OwnerAnimationOverlay
        showBackdrop={showBackdrop}
        showLightBeams={showLightBeams}
        onBackdropClick={handleBackdropClick}
      />

      {/* Card Stack - Result Card only */}
      <CardStack phase={phase} participantCount={participants.length} winners={winners} isFlipped={isFlipped} />

      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="default" className="mb-2">
              방장
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{myNickname}님의 룰렛 방</h1>
            <p className="text-muted-foreground">참가자들이 모두 준비될 때까지 기다려주세요</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleSpinRoulette}
              disabled={!allReady || isSpinning || participants.length === 0 || phase !== 'idle'}
              className="w-full h-14 text-lg font-semibold"
            >
              {isSpinning ? '룰렛 돌리는 중...' : allReady ? '🎯 룰렛 돌리기' : '모든 참가자가 준비해야 합니다'}
            </Button>

            <div className="flex gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={handleCopyLink}
                disabled={isCopied}
                className="flex-1 h-12 gap-2"
              >
                {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {isCopied ? '복사됨!' : '링크 복사'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleShareLink}
                disabled={isSharing}
                className="flex-1 h-12 gap-2"
              >
                <ShareIcon className="w-5 h-5" />
                {isSharing ? '공유 중...' : '공유하기'}
              </Button>
            </div>
          </div>

          {/* Participants List */}
          <div>
            <div className="flex items-center justify-between mb-4">
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
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:overflow-x-visible sm:pb-0">
                {participants.map((participant, index) => {
                  const animState = getCardAnimationState(participant.rid, participant.nickname, index);

                  return (
                    <motion.div
                      key={participant.rid}
                      ref={setCardRef(participant.rid)}
                      className="shrink-0 w-32 aspect-4/5 sm:w-auto"
                      animate={{
                        x: animState.x,
                        y: animState.y,
                        rotate: animState.rotate,
                        opacity: animState.opacity,
                        scale: animState.scale
                      }}
                      style={{
                        zIndex: animState.zIndex
                      }}
                      transition={{
                        duration: phase === 'gathering' ? 0.5 : 0.6,
                        ease: 'easeOut',
                        delay: phase === 'gathering' ? index * 0.03 : 0
                      }}
                    >
                      <FlippableCard
                        nickname={participant.nickname}
                        ready={participant.ready}
                        isFlipped={animState.isCardFlipped}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
