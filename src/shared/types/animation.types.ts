/**
 * 카드 애니메이션 관련 공통 타입 정의
 *
 * Solo 모드와 Owner View에서 공유하는 애니메이션 타입입니다.
 */

/**
 * 카드 애니메이션 Phase
 *
 * - idle: 초기 상태, 카드가 원래 위치에 있음
 * - gathering: 카드들이 화면 중앙으로 모이는 중
 * - stacked: 카드들이 중앙에 스택 형태로 모여있음
 * - reveal-flip: 결과 카드가 뒤집히는 중
 * - result-shown: 결과가 표시되고 카드들이 원위치로 복귀
 * - dispersing: 애니메이션 종료, 배경 사라지는 중
 */
export type CardAnimationPhase = 'idle' | 'gathering' | 'stacked' | 'reveal-flip' | 'result-shown' | 'dispersing';

/**
 * 카드 위치 정보
 */
export interface CardPosition {
  /** 카드 중심의 X 좌표 (px) */
  x: number;
  /** 카드 중심의 Y 좌표 (px) */
  y: number;
  /** 카드 너비 (px) */
  width: number;
  /** 카드 높이 (px) */
  height: number;
}

/**
 * 카드 크기 정보
 */
export interface CardSize {
  /** 카드 너비 (px) */
  width: number;
  /** 카드 높이 (px) */
  height: number;
}

/**
 * 스택 오프셋 정보
 */
export interface StackOffset {
  /** 회전 각도 (deg) */
  rotate: number;
  /** Y축 오프셋 (px) */
  y: number;
}
