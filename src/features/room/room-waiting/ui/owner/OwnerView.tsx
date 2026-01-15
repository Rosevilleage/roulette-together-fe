'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '@/entities/room/model/room.store';
import { useSocket } from '@/shared/hooks/useSocket';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Share2, Users } from 'lucide-react';
import { ShareDialog } from '../ShareDialog';
import { v4 as uuidv4 } from 'uuid';
import { useOwnerCardAnimation } from '../../hooks/useOwnerCardAnimation';
import { useCardDomAnimation } from '../../hooks/useCardDomAnimation';
import { OwnerAnimationOverlay } from './OwnerAnimationOverlay';
import { CardStack } from './CardStack';
import { FlippableCard } from './FlippableCard';

export const OwnerView: React.FC = () => {
  const socket = useSocket();
  const { roomId, myNickname, participants, readyCount, allReady, config } = useRoomStore();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);

  // Animation hooks
  const { phase, showBackdrop, showLightBeams, isFlipped, winners, dismissBackdrop } = useOwnerCardAnimation();
  const { setCardRef, getFirstCardSize, animatePhase } = useCardDomAnimation();

  // 당첨자 닉네임 Set (js-set-map-lookups - O(1) 조회)
  const winnerNicknames = useMemo(() => new Set(winners.map(w => w.nickname)), [winners]);

  // 카드 크기 상태 (CardStack에 전달)
  const [cardSize, setCardSize] = useState<{ width: number; height: number } | null>(null);
  const hasCapturedRef = useRef(false);

  // 카드 크기 캡처 (phase가 idle → gathering으로 변경될 때만 실행)
  useEffect(() => {
    if (phase === 'gathering' && !hasCapturedRef.current) {
      // requestAnimationFrame으로 다음 프레임에 측정 (레이아웃 완료 후)
      const rafId = requestAnimationFrame(() => {
        const size = getFirstCardSize();
        if (size) {
          setCardSize(size);
          hasCapturedRef.current = true;
        }
      });
      return () => cancelAnimationFrame(rafId);
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
  const isAnimating = phase !== 'idle';

  // 이벤트 핸들러 (rerender-functional-setstate - 안정적인 콜백)
  const handleSpinRoulette = useCallback((): void => {
    if (!socket || !roomId || !allReady) return;

    const requestId = uuidv4();
    setIsSpinning(true);
    socket.emit('spin:request', { roomId, requestId });

    setTimeout(() => {
      setIsSpinning(false);
    }, 5000);
  }, [socket, roomId, allReady]);

  const handleBackdropClick = useCallback((): void => {
    dismissBackdrop();
  }, [dismissBackdrop]);

  const handleOpenShareDialog = useCallback((): void => {
    setShowShareDialog(true);
  }, []);

  // 버튼 비활성화 조건 (렌더링 최적화를 위해 미리 계산)
  const isSpinDisabled = !allReady || isSpinning || participants.length === 0 || phase !== 'idle';

  // 버튼 텍스트 결정
  const spinButtonText = isSpinning ? '뽑는 중...' : allReady ? '🎯 랜덤 뽑기' : '모든 참가자가 준비해야 합니다';

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
              disabled={isSpinDisabled}
              className="w-full h-14 text-lg font-semibold"
            >
              {spinButtonText}
            </Button>

            <Button size="lg" variant="outline" onClick={handleOpenShareDialog} className="w-full h-12 gap-2">
              <Share2 className="w-5 h-5" />
              공유하기
            </Button>
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

            {/* 조건부 렌더링 개선 (rendering-conditional-render - ternary 사용) */}
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
                      willChange: isAnimating ? 'transform, opacity' : 'auto'
                    }}
                  >
                    <FlippableCard
                      nickname={participant.nickname}
                      ready={participant.ready}
                      isFlipped={isCardFlipped}
                      isAnimating={isAnimating}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog - 조건부 렌더링 (rendering-conditional-render) */}
      {roomId ? <ShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} roomId={roomId} /> : null}
    </>
  );
};
