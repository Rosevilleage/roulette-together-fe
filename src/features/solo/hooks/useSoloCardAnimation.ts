'use client';

import { useState, useRef, useCallback } from 'react';
import {
  GATHERING_DURATION,
  REVEAL_FLIP_DURATION,
  DISPERSING_DURATION,
  RESULT_DELAY_AFTER_STACKED
} from '@/shared/lib/animation_constants';
import type { CardAnimationPhase } from '@/shared/types/animation.types';
import type { SoloCandidate } from '../model/solo-roulette.types';

/** Solo 모드 애니메이션 Phase (공통 타입 재사용) */
export type SoloAnimationPhase = CardAnimationPhase;

interface UseSoloCardAnimationReturn {
  phase: SoloAnimationPhase;
  showBackdrop: boolean;
  showLightBeams: boolean;
  isFlipped: boolean;
  winners: SoloCandidate[];
  isSpinning: boolean;
  startSpin: (candidates: SoloCandidate[], winnerCount: number) => SoloCandidate[];
  dismissBackdrop: () => void;
}

export const useSoloCardAnimation = (): UseSoloCardAnimationReturn => {
  const [phase, setPhase] = useState<SoloAnimationPhase>('idle');
  const [winners, setWinners] = useState<SoloCandidate[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Animation timeout ref
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimationTimeout = useCallback((): void => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // 랜덤 당첨자 선택 함수
  const selectRandomWinners = (candidates: SoloCandidate[], count: number): SoloCandidate[] => {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, candidates.length));
  };

  // 결과 처리
  const processResult = useCallback((): void => {
    setPhase('reveal-flip');
    animationTimeoutRef.current = setTimeout(() => {
      setPhase('result-shown');
      setIsSpinning(false);
    }, REVEAL_FLIP_DURATION);
  }, []);

  // 스핀 시작
  const startSpin = useCallback(
    (candidates: SoloCandidate[], winnerCount: number): SoloCandidate[] => {
      if (candidates.length === 0 || isSpinning) return [];

      clearAnimationTimeout();
      setIsSpinning(true);

      // 당첨자 미리 선택
      const selectedWinners = selectRandomWinners(candidates, winnerCount);
      setWinners(selectedWinners);

      // Phase: idle → gathering
      setPhase('gathering');

      // Phase: gathering → stacked
      animationTimeoutRef.current = setTimeout(() => {
        setPhase('stacked');

        // Phase: stacked → reveal-flip → result-shown
        animationTimeoutRef.current = setTimeout(() => {
          processResult();
        }, RESULT_DELAY_AFTER_STACKED);
      }, GATHERING_DURATION);

      return selectedWinners;
    },
    [isSpinning, clearAnimationTimeout, processResult]
  );

  // Dismiss backdrop and return to idle
  const dismissBackdrop = useCallback((): void => {
    if (phase === 'result-shown') {
      setPhase('dispersing');
      animationTimeoutRef.current = setTimeout(() => {
        setPhase('idle');
        setWinners([]);
      }, DISPERSING_DURATION);
    }
  }, [phase]);

  // Computed states
  const showBackdrop = phase !== 'idle';
  const showLightBeams = phase === 'stacked' || phase === 'reveal-flip';
  const isFlipped = phase === 'reveal-flip' || phase === 'result-shown' || phase === 'dispersing';

  return {
    phase,
    showBackdrop,
    showLightBeams,
    isFlipped,
    winners,
    isSpinning,
    startSpin,
    dismissBackdrop
  };
};
