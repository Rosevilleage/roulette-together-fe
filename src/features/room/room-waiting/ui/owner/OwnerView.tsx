'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/useSocket';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import PixelCard from '@/shared/ui/PixelCard';
import { ShareIcon, Users, Copy, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOwnerCardAnimation } from '../../hooks/useOwnerCardAnimation';
import { useCardDomAnimation } from '../../hooks/useCardDomAnimation';
import { OwnerAnimationOverlay } from './OwnerAnimationOverlay';
import { CardStack } from './CardStack';

// 뒤집히는 참가자 카드 컴포넌트 (CSS 기반 플립)
interface FlippableCardProps {
  nickname: string;
  ready: boolean;
  isFlipped: boolean;
  isAnimating: boolean;
}

const FlippableCard: React.FC<FlippableCardProps> = ({ nickname, ready, isFlipped, isAnimating }) => {
  const shouldUseSimpleCard = isAnimating;

  if (shouldUseSimpleCard) {
    return (
      <div className="w-full h-full" style={{ perspective: '1000px' }}>
        <div
          className="relative w-full h-full transition-transform duration-400 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 앞면 - 단순 배경 */}
          <div
            className="absolute inset-0 rounded-[25px] border border-[#27272a] bg-background"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <span className="text-3xl mb-2">{ready ? '✅' : '⏳'}</span>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{nickname}</p>
              <p className="text-xs text-foreground/60 mt-1">{ready ? '준비 완료' : '대기 중'}</p>
            </div>
          </div>

          {/* 뒷면 - 단순 배경 */}
          <div
            className="absolute inset-0 bg-card rounded-[25px] border border-[#27272a]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <span className="text-4xl">?</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 카드 (idle 상태) - PixelCard 사용
  return (
    <div className="w-full h-full" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full h-full transition-transform duration-400 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* 앞면 - 참가자 정보 */}
        <div className="absolute inset-0 bg-background rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
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
      </div>
    </div>
  );
};

export const OwnerView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, participants, readyCount, allReady, config } = useRoomStore();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Animation hooks
  const { phase, showBackdrop, showLightBeams, isFlipped, winners, dismissBackdrop } = useOwnerCardAnimation();
  const { setCardRef, getFirstCardSize, animatePhase } = useCardDomAnimation();

  // 당첨자 닉네임 Set
  const winnerNicknames = useMemo(() => {
    return new Set(winners.map(w => w.nickname));
  }, [winners]);

  // 카드 크기 상태 (CardStack에 전달)
  const [cardSize, setCardSize] = useState<{ width: number; height: number } | null>(null);

  // 첫 카드 크기 캡처
  const hasCapturedRef = useRef(false);
  useEffect(() => {
    if (phase === 'gathering' && !hasCapturedRef.current) {
      const size = getFirstCardSize();
      if (size) {
        setCardSize(size);
        hasCapturedRef.current = true;
      }
    }
    if (phase === 'idle') {
      hasCapturedRef.current = false;
    }
  }, [phase, getFirstCardSize]);

  // Phase 변경 시 DOM 애니메이션 실행
  useEffect(() => {
    animatePhase(phase, participants, winnerNicknames);
  }, [phase, participants, winnerNicknames, animatePhase]);

  // 카드가 뒤집혔는지 여부 (phase 기반)
  const isCardFlipped = phase === 'gathering' || phase === 'stacked' || phase === 'reveal-flip';

  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const participantUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}?role=participant` : '';

  const handleCopyLink = async (): Promise<void> => {
    if (isCopied) return;

    try {
      await navigator.clipboard.writeText(participantUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShareLink = async (): Promise<void> => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: '룰렛 투게더 - 방 참가',
          text: '랜덤 뽑기 게임에 참가해보세요!',
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
    if (!socket || !roomId || !allReady) return;

    const requestId = uuidv4();
    setIsSpinning(true);
    socket.emit('spin:request', { roomId, requestId });

    setTimeout(() => {
      setIsSpinning(false);
    }, 5000);
  };

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
      <CardStack
        phase={phase}
        participantCount={participants.length}
        winners={winners}
        isFlipped={isFlipped}
        cardSize={cardSize}
        winSentiment={config?.winSentiment ?? 'POSITIVE'}
      />

      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <Badge variant="default" className="mb-2">
              방장
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{myNickname}님의 랜덤 뽑기 방</h1>
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
              {isSpinning ? '뽑는 중...' : allReady ? '🎯 랜덤 뽑기' : '모든 참가자가 준비해야 합니다'}
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
              <div
                className={`flex gap-3 pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:pb-0 ${
                  phase === 'idle' ? 'overflow-x-auto sm:overflow-x-visible' : 'overflow-visible'
                }`}
              >
                {participants.map(participant => (
                  <div
                    key={participant.rid}
                    ref={setCardRef(participant.rid)}
                    className="shrink-0 w-48 aspect-4/5 sm:w-auto"
                    style={{
                      willChange: phase !== 'idle' ? 'transform, opacity' : 'auto'
                    }}
                  >
                    <FlippableCard
                      nickname={participant.nickname}
                      ready={participant.ready}
                      isFlipped={isCardFlipped}
                      isAnimating={phase !== 'idle'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
