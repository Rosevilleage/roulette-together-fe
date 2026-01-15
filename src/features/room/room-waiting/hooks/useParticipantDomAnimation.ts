'use client';

import { useRef, useCallback, useEffect } from 'react';
import { animate } from 'motion';
import type { AnimationPlaybackControlsWithThen } from 'motion-dom';
import type { AnimationPhase } from './useParticipantCardAnimation';
import { FLYING_UP_DURATION, DESCENDING_DURATION, FLIP_DURATION } from './useParticipantCardAnimation';

interface UseParticipantDomAnimationReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  frontRef: React.RefObject<HTMLDivElement | null>;
  backRef: React.RefObject<HTMLDivElement | null>;
}

export const useParticipantDomAnimation = (phase: AnimationPhase): UseParticipantDomAnimationReturn => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);

  // 현재 진행 중인 애니메이션 컨트롤러
  const activeAnimationsRef = useRef<AnimationPlaybackControlsWithThen[]>([]);

  // 진행 중인 애니메이션 취소
  const cancelActiveAnimations = useCallback((): void => {
    activeAnimationsRef.current.forEach(anim => {
      try {
        anim.stop();
      } catch {
        // 이미 완료된 애니메이션 무시
      }
    });
    activeAnimationsRef.current = [];
  }, []);

  // Phase에 따른 애니메이션 실행
  useEffect(() => {
    const container = containerRef.current;
    const front = frontRef.current;
    const back = backRef.current;

    if (!container || !front || !back) return;

    cancelActiveAnimations();

    // 뷰포트 높이
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

    switch (phase) {
      case 'idle':
      case 'ready': {
        // 원위치, 앞면 보이기
        container.style.transform = 'translateY(0) scale(1)';
        container.style.opacity = '1';
        front.style.transform = 'rotateY(0deg)';
        back.style.transform = 'rotateY(180deg)';
        break;
      }

      case 'flying-up': {
        // 카드가 위로 날아가면서 뒤집히기 시작
        const containerAnim = animate(
          container,
          {
            y: [-0, -vh],
            opacity: [1, 0],
            scale: [1, 0.8]
          },
          {
            duration: FLYING_UP_DURATION / 1000,
            ease: 'easeIn'
          }
        );

        const frontAnim = animate(
          front,
          { rotateY: [0, 180] },
          {
            duration: FLYING_UP_DURATION / 1000,
            ease: 'easeIn'
          }
        );

        const backAnim = animate(
          back,
          { rotateY: [180, 360] },
          {
            duration: FLYING_UP_DURATION / 1000,
            ease: 'easeIn'
          }
        );

        activeAnimationsRef.current.push(containerAnim, frontAnim, backAnim);
        break;
      }

      case 'waiting':
      case 'light-beam': {
        // 화면 밖에서 대기 (뒤집힌 상태 유지)
        container.style.transform = `translateY(-${vh}px) scale(0.8)`;
        container.style.opacity = '0';
        front.style.transform = 'rotateY(180deg)';
        back.style.transform = 'rotateY(360deg)';
        break;
      }

      case 'descending': {
        // 카드가 내려오기 (뒤집힌 상태 유지)
        const containerAnim = animate(
          container,
          {
            y: [-vh, 0],
            opacity: [0, 1],
            scale: [0.8, 1]
          },
          {
            duration: DESCENDING_DURATION / 1000,
            ease: [0.16, 1, 0.3, 1] // easeOutExpo
          }
        );

        // 뒤집힌 상태 유지
        front.style.transform = 'rotateY(180deg)';
        back.style.transform = 'rotateY(360deg)';

        activeAnimationsRef.current.push(containerAnim);
        break;
      }

      case 'flip': {
        // 카드 뒤집어서 결과 보여주기
        container.style.transform = 'translateY(0) scale(1)';
        container.style.opacity = '1';

        const frontAnim = animate(
          front,
          { rotateY: [180, 0] },
          {
            duration: FLIP_DURATION / 1000,
            ease: 'easeOut'
          }
        );

        const backAnim = animate(
          back,
          { rotateY: [360, 180] },
          {
            duration: FLIP_DURATION / 1000,
            ease: 'easeOut'
          }
        );

        activeAnimationsRef.current.push(frontAnim, backAnim);
        break;
      }

      case 'landed': {
        // 결과 표시 상태 유지
        container.style.transform = 'translateY(0) scale(1)';
        container.style.opacity = '1';
        front.style.transform = 'rotateY(0deg)';
        back.style.transform = 'rotateY(180deg)';
        break;
      }
    }

    return () => {
      cancelActiveAnimations();
    };
  }, [phase, cancelActiveAnimations]);

  return {
    containerRef,
    frontRef,
    backRef
  };
};
