'use client';

/**
 * URL 검증 결과 타입
 */
export interface UrlValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedPath?: string; // 예: /room/abc123?role=participant
}

/**
 * 차단할 위험 스킴 목록
 */
const BLOCKED_SCHEMES: readonly string[] = ['javascript:', 'data:', 'vbscript:', 'file:', 'intent:', 'blob:'] as const;

/**
 * 유효한 roomId 패턴 (영숫자, 하이픈, 언더스코어, 1-36자)
 */
const ROOM_ID_PATTERN = /^[\w-]{1,36}$/;

/**
 * 환경 변수에서 허용 도메인 추출
 */
function getAllowedHostnames(): string[] {
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  const hostnames: string[] = [];

  if (frontendUrl) {
    try {
      const url = new URL(frontendUrl);
      hostnames.push(url.hostname);
    } catch {
      // 환경 변수 파싱 실패 시 무시
    }
  }

  // 개발 환경에서 localhost 허용
  if (process.env.NODE_ENV === 'development') {
    hostnames.push('localhost', '127.0.0.1');
  }

  return hostnames;
}

/**
 * 방 URL 검증
 * @param input - 검증할 URL 문자열
 * @returns 검증 결과
 */
export function validateRoomUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, reason: 'URL을 입력해주세요.' };
  }

  // 1. 위험 스킴 조기 차단
  const lowerInput = trimmed.toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lowerInput.startsWith(scheme)) {
      return { isValid: false, reason: '허용되지 않은 URL 형식입니다.' };
    }
  }

  // 2. URL 파싱
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { isValid: false, reason: '올바른 URL 형식이 아닙니다.' };
  }

  // 3. 프로토콜 검증
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { isValid: false, reason: '허용되지 않은 URL 형식입니다.' };
  }

  // 4. 프로덕션에서 HTTPS 강제 (localhost 제외)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (process.env.NODE_ENV === 'production' && !isLocalhost && url.protocol !== 'https:') {
    return { isValid: false, reason: '보안 연결(HTTPS)만 허용됩니다.' };
  }

  // 5. 도메인 화이트리스트 검증
  const allowedHostnames = getAllowedHostnames();
  if (!allowedHostnames.includes(url.hostname)) {
    return { isValid: false, reason: '잘못된 URL입니다.' };
  }

  // 6. 경로 패턴 검증
  const pathname = url.pathname;
  if (!pathname.startsWith('/room/')) {
    return { isValid: false, reason: '올바른 방 링크가 아닙니다.' };
  }

  // 7. roomId 추출 및 검증
  const roomId = pathname.replace('/room/', '').split('/')[0];
  if (!roomId || !ROOM_ID_PATTERN.test(roomId)) {
    return { isValid: false, reason: '올바른 방 링크가 아닙니다.' };
  }

  // 8. 안전한 경로 생성 (role 파라미터 기본값 처리)
  const searchParams = new URLSearchParams(url.search);
  if (!searchParams.has('role')) {
    searchParams.set('role', 'participant');
  }

  const sanitizedPath = `/room/${roomId}?${searchParams.toString()}`;

  return { isValid: true, sanitizedPath };
}

/**
 * QR 코드 스캔 결과 검증 (URL 형식이 아닌 경우도 처리)
 * @param scannedText - 스캔된 텍스트
 * @returns 검증 결과
 */
export function validateQrScanResult(scannedText: string): UrlValidationResult {
  const trimmed = scannedText.trim();

  if (!trimmed) {
    return { isValid: false, reason: 'QR 코드를 인식할 수 없습니다.' };
  }

  // URL 형식이 아닌 경우 조기 반환
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, reason: '잘못된 QR 코드입니다.' };
  }

  // URL 검증 수행
  const result = validateRoomUrl(trimmed);

  // 에러 메시지를 QR 스캔 컨텍스트에 맞게 조정
  if (!result.isValid && result.reason === '잘못된 URL입니다.') {
    return { isValid: false, reason: '잘못된 QR 코드입니다.' };
  }

  return result;
}
