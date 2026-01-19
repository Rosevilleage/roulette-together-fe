'use client';

import { useRef, useCallback } from 'react';
import { animate } from 'motion';
import type { DOMKeyframesDefinition, AnimationPlaybackControlsWithThen } from 'motion-dom';
import { getCenterCoords, getStackOffset, captureCardPosition } from '@/shared/lib/animation_utils';
import type { CardPosition } from '@/shared/types/animation.types';
import type { SoloAnimationPhase } from './useSoloCardAnimation';
import type { SoloCandidate } from '../model/solo-roulette.types';

interface UseSoloCardDomAnimationReturn {
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
  getCardElement: (id: string) => HTMLDivElement | null;
  getFirstCardSize: () => { width: number; height: number } | null;
  animatePhase: (phase: SoloAnimationPhase, candidates: SoloCandidate[], winnerIds: Set<string>) => void;
}

export const useSoloCardDomAnimation = (): UseSoloCardDomAnimationReturn => {
  // 각 카드의 DOM 참조
  const cardRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // 캡처된 카드 위치 (gathering 시작 시 저장)
  const cardPositionsRef = useRef<Map<string, CardPosition>>(new Map());

  // 현재 진행 중인 애니메이션 컨트롤러
  const activeAnimationsRef = useRef<AnimationPlaybackControlsWithThen[]>([]);

  // 카드 위치 캡처
  const captureCardPositions = useCallback((): void => {
    const positions = new Map<string, CardPosition>();

    cardRefsMap.current.forEach((el, id) => {
      if (el) {
        positions.set(id, captureCardPosition(el));
      }
    });

    cardPositionsRef.current = positions;
  }, []);

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

  // ref 설정 함수
  const setCardRef = useCallback(
    (id: string) =>
      (el: HTMLDivElement | null): void => {
        cardRefsMap.current.set(id, el);
      },
    []
  );

  // 카드 요소 가져오기
  const getCardElement = useCallback((id: string): HTMLDivElement | null => {
    return cardRefsMap.current.get(id) ?? null;
  }, []);

  // 첫 번째 카드 크기 가져오기
  const getFirstCardSize = useCallback((): { width: number; height: number } | null => {
    const firstCard = cardRefsMap.current.values().next().value;
    if (firstCard) {
      const rect = firstCard.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return null;
  }, []);

  // Phase에 따른 애니메이션 실행
  const animatePhase = useCallback(
    (phase: SoloAnimationPhase, candidates: SoloCandidate[], winnerIds: Set<string>): void => {
      const { centerX, centerY } = getCenterCoords();
      const cards = candidates
        .map(c => ({
          el: cardRefsMap.current.get(c.id),
          id: c.id
        }))
        .filter((c): c is { el: HTMLDivElement; id: string } => c.el != null);

      if (cards.length === 0) return;

      cancelActiveAnimations();

      switch (phase) {
        case 'idle': {
          // 원위치로 즉시 복귀
          cards.forEach(({ el }) => {
            el.style.transform = 'translate(0px, 0px) rotate(0deg)';
            el.style.opacity = '1';
            el.style.zIndex = '1';
          });
          break;
        }

        case 'gathering': {
          // 카드 위치 캡처
          captureCardPositions();

          // 중앙으로 모으기 애니메이션
          cards.forEach(({ el, id }, index) => {
            const cardPos = cardPositionsRef.current.get(id);
            if (!cardPos) return;

            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y;

            el.style.zIndex = String(candidates.length - index + 50);

            const keyframes: DOMKeyframesDefinition = {
              x: [0, offsetX],
              y: [0, offsetY],
              rotate: 0
            };

            const anim = animate(el, keyframes, {
              duration: 0.5,
              ease: 'easeOut',
              delay: index * 0.03
            });

            activeAnimationsRef.current.push(anim);
          });
          break;
        }

        case 'stacked': {
          // 스택 형태로 정렬
          cards.forEach(({ el, id }, index) => {
            const cardPos = cardPositionsRef.current.get(id);
            if (!cardPos) return;

            const { rotate, y: stackY } = getStackOffset(index);
            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y + stackY;

            el.style.zIndex = String(candidates.length - index + 50);

            const keyframes: DOMKeyframesDefinition = {
              x: offsetX,
              y: offsetY,
              rotate
            };

            const anim = animate(el, keyframes, {
              duration: 0.3,
              ease: 'easeOut'
            });

            activeAnimationsRef.current.push(anim);
          });
          break;
        }

        case 'reveal-flip': {
          // ResultCard가 뒤집히는 동안 스택 위치 유지
          // 당첨자 카드만 투명하게 처리
          cards.forEach(({ el, id }, index) => {
            const cardPos = cardPositionsRef.current.get(id);
            if (!cardPos) return;

            const isWinner = winnerIds.has(id);
            const { rotate, y: stackY } = getStackOffset(index);
            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y + stackY;

            const keyframes: DOMKeyframesDefinition = {
              x: offsetX,
              y: offsetY,
              rotate,
              opacity: isWinner ? 0 : 1
            };

            const anim = animate(el, keyframes, {
              duration: 0.4,
              ease: 'easeOut'
            });

            activeAnimationsRef.current.push(anim);
          });
          break;
        }

        case 'result-shown': {
          // 원위치로 복귀, 당첨자는 투명 유지
          cards.forEach(({ el, id }) => {
            const isWinner = winnerIds.has(id);

            el.style.zIndex = '1';

            const keyframes: DOMKeyframesDefinition = {
              x: 0,
              y: 0,
              rotate: 0,
              opacity: isWinner ? 0 : 1
            };

            const anim = animate(el, keyframes, {
              duration: 0.6,
              ease: 'easeOut'
            });

            activeAnimationsRef.current.push(anim);
          });
          break;
        }

        case 'dispersing': {
          // 모든 카드 원위치, 투명도 복원
          cards.forEach(({ el }) => {
            const keyframes: DOMKeyframesDefinition = {
              x: 0,
              y: 0,
              rotate: 0,
              opacity: 1
            };

            const anim = animate(el, keyframes, {
              duration: 0.8,
              ease: 'easeOut'
            });

            activeAnimationsRef.current.push(anim);
          });
          break;
        }
      }
    },
    [captureCardPositions, cancelActiveAnimations]
  );

  return {
    setCardRef,
    getCardElement,
    getFirstCardSize,
    animatePhase
  };
};
