'use client';

import type { AnimationPhase } from '@/features/room/room-waiting/hooks/useParticipantCardAnimation';

interface ParticipantCardContentProps {
  phase: AnimationPhase;
  outcome: 'WIN' | 'LOSE' | null | undefined;
}

export const ParticipantCardContent: React.FC<ParticipantCardContentProps> = ({ phase, outcome }) => {
  // idle 상태
  if (phase === 'idle') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">⏳</span>
        <p className="text-lg font-semibold text-foreground">준비하기</p>
        <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground/50">카드를 클릭하세요</p>
      </div>
    );
  }

  // ready 상태
  if (phase === 'ready') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">✅</span>
        <p className="text-lg font-semibold text-foreground">준비 완료!</p>
        <p className="absolute bottom-8 left-0 right-0 text-xs text-foreground/50">취소하려면 클릭</p>
      </div>
    );
  }

  // 추첨 중 애니메이션 상태
  if (phase === 'flying-up' || phase === 'waiting') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl animate-pulse">🎯</span>
        <p className="text-lg font-semibold text-foreground">추첨 중...</p>
      </div>
    );
  }

  // 카드 뒤집히는 중 또는 결과 표시
  if (phase === 'flip') {
    if (outcome === 'WIN') {
      return (
        <div className="text-center space-y-2">
          <span className="text-5xl">🎉</span>
          <p className="text-3xl font-bold text-foreground">당첨!</p>
        </div>
      );
    }
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">😢</span>
        <p className="text-xl font-semibold text-muted-foreground">다음 기회에...</p>
      </div>
    );
  }

  // landed 상태 (결과 표시)
  if (outcome === 'WIN') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">🎉</span>
        <p className="text-3xl font-bold text-foreground">당첨!</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      <span className="text-5xl">😢</span>
      <p className="text-xl font-semibold text-muted-foreground">다음 기회에...</p>
    </div>
  );
};
