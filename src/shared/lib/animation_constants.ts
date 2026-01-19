/**
 * 카드 애니메이션 타이밍 상수
 *
 * Solo 모드와 Owner View에서 공유하는 애니메이션 타이밍 상수입니다.
 * 참가자 타이밍과 동기화:
 * - 참가자: flying-up(600) → waiting(1000) → light-beam(500) → descending(1200) → flip(600) = 3900ms
 * - 방장/솔로: gathering(600) → stacked(waiting) → reveal-flip(600) → result-shown
 */

/** 카드가 중앙으로 모이는 시간 (ms) - 참가자 flying-up과 동일 */
export const GATHERING_DURATION = 600;

/** 카드가 스택 상태로 대기하는 최소 시간 (ms) - 참가자 waiting과 동일 */
export const STACKED_MIN_DURATION = 1000;

/** 결과 발표 전 라이트 빔 효과 시간 (ms) - 참가자 light-beam과 동일 */
export const LIGHT_BEAM_DELAY = 500;

/** 결과 카드가 내려오는 시간 (ms) - 참가자 descending과 동일 */
export const DESCENDING_DURATION = 1200;

/** 결과 카드 뒤집기 시간 (ms) - 참가자 flip과 동일 */
export const REVEAL_FLIP_DURATION = 600;

/** 카드가 흩어지는 시간 (ms) */
export const DISPERSING_DURATION = 800;

/**
 * 스택 상태 후 결과 발표까지의 대기 시간 (ms)
 * 참가자와 동기화: stacked 후 waiting(1000) + light-beam(500) + descending(1200) = 2700ms
 */
export const RESULT_DELAY_AFTER_STACKED = STACKED_MIN_DURATION + LIGHT_BEAM_DELAY + DESCENDING_DURATION;
