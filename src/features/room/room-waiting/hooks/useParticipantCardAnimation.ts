'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Variants } from 'motion/react';

export type AnimationPhase =
  | 'idle'
  | 'ready'
  | 'flying-up'
  | 'waiting'
  | 'light-beam'
  | 'descending'
  | 'flip'
  | 'landed';

// Animation timing constants (in ms)
const FLYING_UP_DURATION = 600;
const WAITING_MIN_DURATION = 1000;
const LIGHT_BEAM_DURATION = 500;
const DESCENDING_DURATION = 1200;
const FLIP_DURATION = 600;

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
  // Animation variants
  containerVariants: Variants;
  frontVariants: Variants;
  backVariants: Variants;
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

  // Animation variants
  const containerVariants: Variants = {
    idle: { y: 0, opacity: 1, scale: 1 },
    ready: { y: 0, opacity: 1, scale: 1 },
    'flying-up': {
      y: '-100vh',
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.6, ease: 'easeIn' as const }
    },
    waiting: { y: '-100vh', opacity: 0 },
    'light-beam': { y: '-100vh', opacity: 0 },
    descending: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }
    },
    flip: { y: 0, opacity: 1, scale: 1 },
    landed: { y: 0, opacity: 1, scale: 1 }
  };

  const frontVariants: Variants = {
    idle: { rotateY: 0 },
    ready: { rotateY: 0 },
    'flying-up': { rotateY: 0, transition: { duration: 0.6 } },
    waiting: { rotateY: 180 },
    'light-beam': { rotateY: 180 },
    descending: { rotateY: 180, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const } },
    flip: { rotateY: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
    landed: { rotateY: 0 }
  };

  const backVariants: Variants = {
    idle: { rotateY: 180 },
    ready: { rotateY: 180 },
    'flying-up': { rotateY: 180, transition: { duration: 0.6 } },
    waiting: { rotateY: 360 },
    'light-beam': { rotateY: 360 },
    descending: { rotateY: 360, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const } },
    flip: { rotateY: 180, transition: { duration: 0.6, ease: 'easeOut' as const } },
    landed: { rotateY: 180 }
  };

  return {
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
  };
};
