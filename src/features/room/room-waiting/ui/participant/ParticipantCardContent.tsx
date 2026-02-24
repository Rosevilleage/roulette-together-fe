'use client';

import type { WinSentiment } from '@/entities/room/model/room.types';
import { useRoomStore } from '@/entities/room/model/room.store';
import type { AnimationPhase } from '@/features/room/room-waiting/hooks/useParticipantCardAnimation';

interface ParticipantCardContentProps {
  phase: AnimationPhase;
  outcome: 'WIN' | 'LOSE' | null | undefined;
}

/** 당첨됐을 때 표시할 문구·이모지 (방 설정 감정에 따라) */
function getWinDisplay(winSentiment: WinSentiment): { text: string; emoji: string } {
  if (winSentiment === 'NEGATIVE') {
    return { text: '걸렸다!', emoji: '😱' };
  }
  return { text: '당첨!', emoji: '🎉' };
}

/** 당첨되지 않았을 때 표시할 문구·이모지 (방 설정 감정에 따라) */
function getLoseDisplay(winSentiment: WinSentiment): { text: string; emoji: string } {
  if (winSentiment === 'NEGATIVE') {
    return { text: '살았다!', emoji: '😮‍💨' };
  }
  return { text: '다음 기회에...', emoji: '😢' };
}

export const ParticipantCardContent: React.FC<ParticipantCardContentProps> = ({ phase, outcome }) => {
  // config 객체 전체가 아닌 winSentiment 원시값만 구독 → winnersCount/updatedAt 변경 시 불필요한 리렌더 방지
  const winSentiment = useRoomStore(s => s.config?.winSentiment ?? 'POSITIVE');
  const winDisplay = getWinDisplay(winSentiment);
  const loseDisplay = getLoseDisplay(winSentiment);
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
          <span className="text-5xl">{winDisplay.emoji}</span>
          <p className="text-3xl font-bold text-foreground">{winDisplay.text}</p>
        </div>
      );
    }
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">{loseDisplay.emoji}</span>
        <p className="text-xl font-semibold text-muted-foreground">{loseDisplay.text}</p>
      </div>
    );
  }

  // landed 상태 (결과 표시)
  if (outcome === 'WIN') {
    return (
      <div className="text-center space-y-2">
        <span className="text-5xl">{winDisplay.emoji}</span>
        <p className="text-3xl font-bold text-foreground">{winDisplay.text}</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      <span className="text-5xl">{loseDisplay.emoji}</span>
      <p className="text-xl font-semibold text-muted-foreground">{loseDisplay.text}</p>
    </div>
  );
};
