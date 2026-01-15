'use client';

import { useRef, useCallback } from 'react';
import { animate } from 'motion';
import type { DOMKeyframesDefinition, AnimationPlaybackControlsWithThen } from 'motion-dom';
import type { OwnerAnimationPhase } from './useOwnerCardAnimation';

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseCardDomAnimationReturn {
  setCardRef: (rid: string) => (el: HTMLDivElement | null) => void;
  getCardElement: (rid: string) => HTMLDivElement | null;
  getFirstCardSize: () => { width: number; height: number } | null;
  animatePhase: (
    phase: OwnerAnimationPhase,
    participants: Array<{ rid: string; nickname: string }>,
    winnerNicknames: Set<string>
  ) => void;
}

export const useCardDomAnimation = (): UseCardDomAnimationReturn => {
  // 각 카드의 DOM 참조
  const cardRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // 캡처된 카드 위치 (gathering 시작 시 저장)
  const cardPositionsRef = useRef<Map<string, CardPosition>>(new Map());

  // 현재 진행 중인 애니메이션 컨트롤러
  const activeAnimationsRef = useRef<AnimationPlaybackControlsWithThen[]>([]);

  // 화면 중앙 좌표
  const getCenterCoords = (): { centerX: number; centerY: number } => {
    return {
      centerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
      centerY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
    };
  };

  // 스택 오프셋 계산
  const getStackOffset = (index: number): { rotate: number; y: number } => {
    const direction = index % 2 === 0 ? 1 : -1;
    const rotate = direction * (index * 2);
    const y = -index * 2;
    return { rotate, y };
  };

  // 카드 위치 캡처
  const captureCardPositions = useCallback((): void => {
    const positions = new Map<string, CardPosition>();

    cardRefsMap.current.forEach((el, rid) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        positions.set(rid, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        });
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
    (rid: string) =>
      (el: HTMLDivElement | null): void => {
        cardRefsMap.current.set(rid, el);
      },
    []
  );

  // 카드 요소 가져오기 (이벤트 핸들러/effect에서 사용)
  const getCardElement = useCallback((rid: string): HTMLDivElement | null => {
    return cardRefsMap.current.get(rid) ?? null;
  }, []);

  // 첫 번째 카드 크기 가져오기 (이벤트 핸들러/effect에서 사용)
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
    (
      phase: OwnerAnimationPhase,
      participants: Array<{ rid: string; nickname: string }>,
      winnerNicknames: Set<string>
    ): void => {
      const { centerX, centerY } = getCenterCoords();
      const cards = participants
        .map(p => ({
          el: cardRefsMap.current.get(p.rid),
          rid: p.rid,
          nickname: p.nickname
        }))
        .filter((c): c is { el: HTMLDivElement; rid: string; nickname: string } => c.el !== null);

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
          cards.forEach(({ el, rid }, index) => {
            const cardPos = cardPositionsRef.current.get(rid);
            if (!cardPos) return;

            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y;

            el.style.zIndex = String(participants.length - index + 50);

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
          // 스택 형태로 정렬 - 모든 카드가 정확히 화면 중앙에 위치
          cards.forEach(({ el, rid }, index) => {
            const cardPos = cardPositionsRef.current.get(rid);
            if (!cardPos) return;

            const { rotate, y: stackY } = getStackOffset(index);
            // 카드 중심이 화면 중앙에 오도록 계산
            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y + stackY;

            el.style.zIndex = String(participants.length - index + 50);

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
          // ResultCard가 뒤집히는 동안 스택 위치 유지 (움직이지 않음)
          // 당첨자 카드만 투명하게 처리
          cards.forEach(({ el, rid, nickname }, index) => {
            const cardPos = cardPositionsRef.current.get(rid);
            if (!cardPos) return;

            const isWinner = winnerNicknames.has(nickname);
            const { rotate, y: stackY } = getStackOffset(index);
            const offsetX = centerX - cardPos.x;
            const offsetY = centerY - cardPos.y + stackY;

            // 스택 위치 유지, 당첨자만 투명하게
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
          // 원위치로 복귀, 당첨자는 투명 유지, z-index를 백드롭(z-40) 아래로
          cards.forEach(({ el, nickname }) => {
            const isWinner = winnerNicknames.has(nickname);

            // z-index를 백드롭 아래로 낮춤
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
