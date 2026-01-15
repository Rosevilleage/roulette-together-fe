'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRoomStore } from '@/entities/room/model/room.store';

export type OwnerAnimationPhase = 'idle' | 'gathering' | 'stacked' | 'reveal-flip' | 'result-shown' | 'dispersing';

// Animation timing constants (in ms)
const GATHERING_DURATION = 600;
const REVEAL_FLIP_DURATION = 600;
const DISPERSING_DURATION = 800;

interface UseOwnerCardAnimationReturn {
  phase: OwnerAnimationPhase;
  showBackdrop: boolean;
  showLightBeams: boolean;
  isFlipped: boolean;
  winners: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
  dismissBackdrop: () => void;
}

export const useOwnerCardAnimation = (): UseOwnerCardAnimationReturn => {
  const { spin, participants } = useRoomStore();
  const [phase, setPhase] = useState<OwnerAnimationPhase>('idle');

  // Track previous spin state
  const prevSpinRef = useRef<{
    isSpinning?: boolean;
    allOutcomes?: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
  }>({});

  // Animation timeout ref
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Waiting start time for minimum duration
  const waitingStartTimeRef = useRef<number | null>(null);

  // Spin start time for tracking gathering phase
  const spinStartTimeRef = useRef<number | null>(null);

  const clearAnimationTimeout = useCallback((): void => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // Process result when ready
  const processResult = useCallback((): void => {
    setPhase('reveal-flip');
    animationTimeoutRef.current = setTimeout(() => {
      setPhase('result-shown');
    }, REVEAL_FLIP_DURATION);
  }, []);

  // Handle phase transitions
  useEffect(() => {
    const prevSpin = prevSpinRef.current;
    const isSpinning = spin?.isSpinning;
    const allOutcomes = spin?.allOutcomes ?? [];
    const animationDuration = spin?.animationDuration ?? 3000;

    // Detect spin start - begin animation
    if (isSpinning && !prevSpin.isSpinning) {
      clearAnimationTimeout();
      waitingStartTimeRef.current = null;
      spinStartTimeRef.current = Date.now();

      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setPhase('gathering');
      });

      animationTimeoutRef.current = setTimeout(() => {
        setPhase('stacked');
        waitingStartTimeRef.current = Date.now();
      }, GATHERING_DURATION);
    }

    // Detect results received
    if (allOutcomes.length > 0 && (prevSpin.allOutcomes?.length ?? 0) === 0) {
      const waitingElapsed = waitingStartTimeRef.current ? Date.now() - waitingStartTimeRef.current : 0;
      const remainingWaitTime = Math.max(0, animationDuration - waitingElapsed);

      if (phase === 'stacked') {
        clearAnimationTimeout();
        animationTimeoutRef.current = setTimeout(() => {
          processResult();
        }, remainingWaitTime);
      } else if (phase === 'gathering') {
        // Results came during gathering, wait for stacked phase
        const gatheringElapsed = spinStartTimeRef.current ? Date.now() - spinStartTimeRef.current : 0;
        const gatheringRemaining = Math.max(0, GATHERING_DURATION - gatheringElapsed);
        clearAnimationTimeout();
        animationTimeoutRef.current = setTimeout(() => {
          setPhase('stacked');
          waitingStartTimeRef.current = Date.now();
          animationTimeoutRef.current = setTimeout(() => {
            processResult();
          }, animationDuration);
        }, gatheringRemaining);
      }
    }

    prevSpinRef.current = { isSpinning, allOutcomes };
  }, [spin, participants, phase, clearAnimationTimeout, processResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, [clearAnimationTimeout]);

  // Dismiss backdrop and return to idle
  const dismissBackdrop = useCallback((): void => {
    if (phase === 'result-shown') {
      setPhase('dispersing');
      animationTimeoutRef.current = setTimeout(() => {
        setPhase('idle');
        // Reset prev spin ref to allow next spin
        prevSpinRef.current = { isSpinning: false, allOutcomes: [] };
      }, DISPERSING_DURATION);
    }
  }, [phase]);

  // Computed states
  const showBackdrop = phase !== 'idle';
  const showLightBeams = phase === 'stacked' || phase === 'reveal-flip';
  const isFlipped = phase === 'reveal-flip' || phase === 'result-shown' || phase === 'dispersing';

  // Get winners from outcomes
  const winners = useMemo(() => {
    return spin?.allOutcomes?.filter(o => o.outcome === 'WIN') ?? [];
  }, [spin?.allOutcomes]);

  return {
    phase,
    showBackdrop,
    showLightBeams,
    isFlipped,
    winners,
    dismissBackdrop
  };
};
