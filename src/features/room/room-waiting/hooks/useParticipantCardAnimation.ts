'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type AnimationPhase =
  | 'idle'
  | 'ready'
  | 'flying-up'
  | 'waiting'
  | 'light-beam'
  | 'descending'
  | 'flip'
  | 'landed';

// Animation timing constants (in ms) - exported for DOM animation hook
export const FLYING_UP_DURATION = 600;
export const WAITING_MIN_DURATION = 1000;
export const LIGHT_BEAM_DURATION = 500;
export const DESCENDING_DURATION = 1200;
export const FLIP_DURATION = 600;

interface UseParticipantCardAnimationParams {
  myReady: boolean;
  isSpinning: boolean | undefined;
  myOutcome: 'WIN' | 'LOSE' | null | undefined;
}

interface UseParticipantCardAnimationReturn {
  phase: AnimationPhase;
  isBackdropDismissed: boolean;
  dismissBackdrop: () => void;
  // Computed states
  showBackdrop: boolean;
  showLightBeam: boolean;
  isCardSpinning: boolean;
  hasAnswer: boolean;
  canClick: boolean;
}

export const useParticipantCardAnimation = ({
  myReady,
  isSpinning,
  myOutcome
}: UseParticipantCardAnimationParams): UseParticipantCardAnimationReturn => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [isBackdropDismissed, setIsBackdropDismissed] = useState<boolean>(false);

  // Track previous values and animation state
  const prevSpinRef = useRef<{ isSpinning?: boolean; myOutcome?: 'WIN' | 'LOSE' | null }>({});
  const prevMyReadyRef = useRef<boolean>(myReady);

  // Queue for pending result
  const pendingResultRef = useRef<'WIN' | 'LOSE' | null>(null);
  const waitingStartTimeRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimationTimeout = useCallback((): void => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  const processPendingResult = useCallback((): void => {
    if (pendingResultRef.current) {
      setPhase('light-beam');
      animationTimeoutRef.current = setTimeout(() => {
        setPhase('descending');
        animationTimeoutRef.current = setTimeout(() => {
          setPhase('flip');
          animationTimeoutRef.current = setTimeout(() => {
            setPhase('landed');
            pendingResultRef.current = null;
          }, FLIP_DURATION);
        }, DESCENDING_DURATION);
      }, LIGHT_BEAM_DURATION);
    }
  }, []);

  const transitionToWaiting = useCallback((): void => {
    setPhase('waiting');
    waitingStartTimeRef.current = Date.now();

    if (pendingResultRef.current) {
      animationTimeoutRef.current = setTimeout(() => {
        processPendingResult();
      }, WAITING_MIN_DURATION);
    }
  }, [processPendingResult]);

  const updatePhase = useCallback((): void => {
    const prevSpin = prevSpinRef.current;
    const prevMyReady = prevMyReadyRef.current;

    // Detect spin start
    if (isSpinning && !prevSpin.isSpinning && myReady) {
      clearAnimationTimeout();
      pendingResultRef.current = null;
      waitingStartTimeRef.current = null;
      setIsBackdropDismissed(false);
      setPhase('flying-up');
      animationTimeoutRef.current = setTimeout(() => {
        transitionToWaiting();
      }, FLYING_UP_DURATION);
    }
    // Detect result received
    else if (myOutcome && !prevSpin.myOutcome) {
      pendingResultRef.current = myOutcome;

      if (phase === 'waiting') {
        const waitingElapsed = waitingStartTimeRef.current ? Date.now() - waitingStartTimeRef.current : 0;
        const remainingWaitTime = Math.max(0, WAITING_MIN_DURATION - waitingElapsed);

        clearAnimationTimeout();
        animationTimeoutRef.current = setTimeout(() => {
          processPendingResult();
        }, remainingWaitTime);
      }
    }
    // Ready state changed
    else if (myReady !== prevMyReady && !isSpinning) {
      const isInAnimation = ['flying-up', 'waiting', 'light-beam', 'descending', 'flip'].includes(phase);
      const canChangePhase = !isInAnimation && (phase !== 'landed' || isBackdropDismissed);

      if (canChangePhase) {
        setPhase(myReady ? 'ready' : 'idle');
      }
    }

    prevSpinRef.current = { isSpinning, myOutcome };
    prevMyReadyRef.current = myReady;
  }, [
    myReady,
    isSpinning,
    myOutcome,
    phase,
    isBackdropDismissed,
    clearAnimationTimeout,
    transitionToWaiting,
    processPendingResult
  ]);

  useEffect(() => {
    updatePhase();
  }, [updatePhase]);

  // Initialize phase based on current state
  useEffect(() => {
    if (myReady && !isSpinning && !myOutcome) {
      setPhase('ready');
    } else if (!myReady) {
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, [clearAnimationTimeout]);

  // Computed animation states
  const showBackdrop =
    ['flying-up', 'waiting', 'light-beam', 'descending', 'flip', 'landed'].includes(phase) && !isBackdropDismissed;
  const showLightBeam = ['light-beam', 'descending', 'flip', 'landed'].includes(phase) && !isBackdropDismissed;
  const isCardSpinning = ['ready', 'flying-up', 'descending'].includes(phase);
  const hasAnswer = (phase === 'flip' || phase === 'landed') && !isBackdropDismissed;
  const canClick = phase === 'idle' || phase === 'ready' || (phase === 'landed' && isBackdropDismissed);

  const dismissBackdrop = useCallback((): void => {
    if (phase === 'landed') {
      setIsBackdropDismissed(true);
      // prevSpinRef 초기화하여 updatePhase에서 결과 처리 로직이 다시 실행되지 않도록 함
      prevSpinRef.current = { isSpinning: false, myOutcome: null };
      setPhase(myReady ? 'ready' : 'idle');
    }
  }, [phase, myReady]);

  return {
    phase,
    isBackdropDismissed,
    dismissBackdrop,
    showBackdrop,
    showLightBeam,
    isCardSpinning,
    hasAnswer,
    canClick
  };
};
