import type { CardPosition, StackOffset } from '@/shared/types/animation.types';

/**
 * 화면 중앙 좌표 계산
 *
 * @returns 화면 중앙의 X, Y 좌표
 */
export const getCenterCoords = (): { centerX: number; centerY: number } => ({
  centerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  centerY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
});

/**
 * 스택 오프셋 계산
 *
 * 카드들이 스택 형태로 쌓일 때 각 카드의 회전 각도와 Y 오프셋을 계산합니다.
 * 홀수/짝수 인덱스에 따라 좌우로 번갈아 회전합니다.
 *
 * @param index - 카드의 인덱스 (0부터 시작)
 * @returns 회전 각도와 Y 오프셋
 */
export const getStackOffset = (index: number): StackOffset => {
  const direction = index % 2 === 0 ? 1 : -1;
  return {
    rotate: direction * (index * 2),
    y: -index * 2
  };
};

/**
 * DOM 요소의 위치 정보 캡처
 *
 * @param element - 위치를 캡처할 DOM 요소
 * @returns 카드 위치 정보 (중심 좌표와 크기)
 */
export const captureCardPosition = (element: HTMLElement): CardPosition => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height
  };
};
