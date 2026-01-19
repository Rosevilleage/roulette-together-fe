'use client';

import { useState, useRef, useCallback } from 'react';
import type { SoloCandidate } from '../model/solo-roulette.types';

export type SoloAnimationPhase = 'idle' | 'gathering' | 'stacked' | 'reveal-flip' | 'result-shown' | 'dispersing';

// Animation timing constants (in ms) - Owner Room과 동일
const GATHERING_DURATION = 600;
const STACKED_MIN_DURATION = 1000;
const LIGHT_BEAM_DELAY = 500;
const DESCENDING_DURATION = 1200;
const REVEAL_FLIP_DURATION = 600;
const DISPERSING_DURATION = 800;

// 결과 발표까지의 대기 시간
const RESULT_DELAY_AFTER_STACKED = STACKED_MIN_DURATION + LIGHT_BEAM_DELAY + DESCENDING_DURATION;

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
