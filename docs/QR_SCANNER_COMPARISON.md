# QR 코드 스캔 구현 가이드

> 최종 업데이트: 2026-01
> 대상 환경: Next.js 16 + React 19, 모바일 웹 포함

## 개요

웹 브라우저에서 QR 코드 스캔 기능을 구현하기 위한 기술 비교 및 의사결정 가이드입니다.

---

## 의사결정 트리

```
┌─────────────────────────────────────────────────────────┐
│         타겟 브라우저에 iOS Safari 포함?                  │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
       Yes                      No
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────────────┐
│ ZXing 계열    │       │ BarcodeDetector 기반  │
│ (@zxing/      │       │ 라이브러리 사용 가능   │
│  browser)     │       │                       │
│ 권장          │       │ (@yudiel/react-qr-    │
└───────────────┘       │  scanner 등)          │
        │               └───────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────┐
│              파일 업로드 스캔도 필요?                     │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
       Yes                      No
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ html5-qrcode  │       │ 카메라 전용   │
│ (릴리즈 오래됨│       │ 라이브러리    │
│  리스크 감안) │       │               │
└───────────────┘       └───────────────┘
```

---

## 1. 네이티브 API: BarcodeDetector

### 브라우저 지원 현황 (2026-01 기준)

| 브라우저                 | 지원 여부 | 비고                            |
| ------------------------ | --------- | ------------------------------- |
| Chrome (Desktop/Android) | ✅ 지원   | v83+                            |
| Edge                     | ✅ 지원   | Chromium 기반                   |
| Opera                    | ✅ 지원   | Chromium 기반                   |
| Samsung Internet         | ✅ 지원   | Chromium 기반                   |
| Safari (macOS)           | ❌ 미지원 | -                               |
| Safari (iOS)             | ❌ 미지원 | 기기/버전별 들쭉날쭉, 신뢰 불가 |
| Firefox                  | ❌ 미지원 | -                               |

### 장단점

**장점:**

- 번들 크기 0KB (네이티브)
- 브라우저 내장 디코더로 성능/배터리 효율 우수
- 별도 의존성 없음

**단점:**

- **iOS Safari 미지원이 치명적** (모바일 웹 사용자 상당수 커버 불가)
- Firefox 미지원
- 단독 채택은 프로덕션 부적합

### 결론

> **"단독 채택은 부적합. 그러나 fallback 조합 시 1차 시도 옵션으로 가치 있음"**

지원 브라우저에서는 성능 이점이 있으므로, ZXing 등 폴백 라이브러리와 조합하여 "가속 옵션"으로 활용 권장.

### 구현 예시 (가속 옵션용)

```typescript
async function tryNativeBarcodeDetector(
  video: HTMLVideoElement,
  onResult: (text: string) => void
): Promise<(() => void) | null> {
  // 지원 여부 체크
  if (!('BarcodeDetector' in window)) {
    return null;
  }

  try {
    // @ts-expect-error BarcodeDetector 타입 정의 미포함
    const formats = await BarcodeDetector.getSupportedFormats();
    if (!formats.includes('qr_code')) {
      return null;
    }
  } catch {
    return null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false
  });

  video.srcObject = stream;
  await video.play();

  // @ts-expect-error BarcodeDetector 타입 정의 미포함
  const detector = new BarcodeDetector({ formats: ['qr_code'] });

  let raf = 0;
  let stopped = false;

  const loop = async (): Promise<void> => {
    if (stopped) return;
    try {
      const barcodes = await detector.detect(video);
      if (barcodes?.length) {
        const value = barcodes[0].rawValue;
        if (value) {
          stop();
          onResult(value);
          return;
        }
      }
    } catch {
      // detect 중 오류는 무시하고 계속 시도
    }
    raf = requestAnimationFrame(loop);
  };

  const stop = (): void => {
    stopped = true;
    cancelAnimationFrame(raf);
    stream.getTracks().forEach(t => t.stop());
  };

  loop();
  return stop;
}
```

---

## 2. 라이브러리 비교

### 비교표

| 라이브러리                   | 주간 다운로드 | 번들 크기 (min+gzip) | iOS Safari       | React 지원 | 마지막 릴리즈 | 상태      |
| ---------------------------- | ------------- | -------------------- | ---------------- | ---------- | ------------- | --------- |
| **@zxing/browser**           | ~150k         | ~45KB                | ✅ 지원          | 래퍼 필요  | 활발          | **권장**  |
| **@yudiel/react-qr-scanner** | ~80k          | ~30KB                | ⚠️ 미지원 가능성 | 네이티브   | 2025-12       | 조건부    |
| **html5-qrcode**             | ~200k         | ~50KB                | ✅ 지원          | 래퍼 필요  | 2023-04       | 성숙/안정 |
| react-qr-reader              | ~150k         | ~25KB                | -                | 네이티브   | 2022          | ⛔ 중단   |
| jsQR                         | ~500k         | ~55KB                | ✅ 지원          | 래퍼 필요  | 2020          | ⛔ 중단   |

> **번들 크기 측정 기준**: minified + gzip 압축 후 크기. 실제 영향은 Next.js 빌드 시 해당 페이지 chunk 증가량으로 확인 권장.

### 상세 분석

#### @zxing/browser (권장)

ZXing("Zebra Crossing") 라이브러리의 브라우저 전용 패키지입니다.

**장점:**

- **iOS Safari 포함 전 브라우저 지원** (JS 기반 디코딩)
- 높은 인식 정확도
- 다양한 바코드 포맷 지원
- 활발한 유지보수

**단점:**

- React 래퍼 컴포넌트 작성 필요
- 번들 크기 중간 (~45KB min+gzip)
- Tree-shaking 설정 시 주의 필요

**사용 예시:**

```typescript
import { BrowserQRCodeReader } from '@zxing/browser';

const codeReader = new BrowserQRCodeReader();

// 카메라 스캔 시작
const controls = await codeReader.decodeFromVideoDevice(
  undefined, // 기본 카메라
  videoElement,
  (result, error) => {
    if (result) {
      console.log('스캔 결과:', result.getText());
      controls.stop();
    }
  }
);

// 정리
controls.stop();
```

#### @yudiel/react-qr-scanner (조건부 권장)

**중요: 이 라이브러리는 Barcode Detection API 기반입니다.**

**장점:**

- React 네이티브 지원
- 번들 크기 작음 (~30KB)
- TypeScript 타입 정의 내장
- 사용이 매우 간단

**단점:**

- **iOS Safari에서 동작하지 않을 가능성 높음** (BarcodeDetector 의존)
- 폴백 메커니즘 직접 확인 필요

**권장 사용 케이스:**

- 내부 도구 / 관리자 페이지 (Chrome 한정)
- 키오스크 / 디지털 사이니지
- Android WebView 앱

**사용 예시:**

```typescript
import { Scanner } from '@yudiel/react-qr-scanner';

const QrScanner = (): JSX.Element => {
  return (
    <Scanner
      onScan={(result) => console.log('스캔 결과:', result)}
      onError={(error) => console.error('에러:', error)}
    />
  );
};
```

#### html5-qrcode (파일 업로드 필요 시)

**장점:**

- 카메라 스캔 + **파일 업로드 모두 내장**
- iOS Safari 지원 (JS 기반 디코딩)
- 다양한 바코드 포맷 지원
- 문서화 우수

**단점:**

- **마지막 릴리즈 2023-04** (장기 유지보수 리스크)
- React 래퍼 필요
- 번들 크기 중간 (~50KB)

**권장 사용 케이스:**

- 파일 업로드 스캔이 반드시 필요한 경우
- 접근성 대안 제공 필요 시

**사용 예시:**

```typescript
import { Html5Qrcode } from 'html5-qrcode';

const scanner = new Html5Qrcode('reader');

// 카메라 스캔
await scanner.start(
  { facingMode: 'environment' },
  { fps: 10, qrbox: { width: 250, height: 250 } },
  decodedText => console.log('스캔:', decodedText),
  errorMessage => {} // 스캔 실패는 무시
);

// 파일 스캔
await scanner.scanFile(file, true);
```

#### react-qr-reader / jsQR (비권장)

- **react-qr-reader**: 2022년 이후 업데이트 중단, React 18+ 호환성 문제 가능
- **jsQR**: 2020년 이후 업데이트 중단, 카메라 스트림 직접 구현 필요

> 신규 프로젝트에서 사용 비권장

---

## 3. 권장 구현 전략

### Safari 포함 모바일 웹 (일반적인 케이스)

```
1차: BarcodeDetector 시도 (지원 시 성능 이점)
    ↓ 미지원 시
2차: @zxing/browser로 폴백
    ↓ 카메라 권한 거부 시
3차: 링크 직접 입력 UI 제공
```

**구현 예시:**

```typescript
// lib/qr-scanner.ts
import { BrowserQRCodeReader } from '@zxing/browser';

export async function createQrScanner(
  video: HTMLVideoElement,
  onResult: (text: string) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  // 1차: 네이티브 BarcodeDetector 시도
  const nativeStop = await tryNativeBarcodeDetector(video, onResult);
  if (nativeStop) {
    return nativeStop;
  }

  // 2차: ZXing 폴백
  try {
    const codeReader = new BrowserQRCodeReader();
    const controls = await codeReader.decodeFromVideoDevice(undefined, video, (result, error) => {
      if (result) {
        onResult(result.getText());
      }
    });
    return () => controls.stop();
  } catch (error) {
    onError(error as Error);
    throw error;
  }
}
```

### Next.js 동적 import 전략

QR 스캐너는 특정 페이지에서만 사용되므로, 동적 import로 번들 분리 권장:

```typescript
// pages/join/page.tsx
import dynamic from 'next/dynamic';

const QrScannerModal = dynamic(
  () => import('@/features/join-room/ui/QrScannerModal'),
  {
    loading: () => <ScannerSkeleton />,
    ssr: false, // 카메라 API는 서버에서 사용 불가
  }
);
```

이렇게 하면 메인 번들에 스캐너 코드가 포함되지 않고, 해당 컴포넌트 사용 시에만 별도 chunk로 로드됩니다.

---

## 4. 보안 체크리스트

QR 코드로 URL을 스캔하여 리다이렉트하는 경우, **오픈 리다이렉트 취약점** 방지가 필수입니다.

### 필수 검증 항목

```typescript
// lib/qr-url-validator.ts

const ALLOWED_DOMAINS = [
  'roulette-together.com',
  'www.roulette-together.com',
  // 개발 환경
  'localhost'
];

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:', 'intent:'];

export function validateQrUrl(scannedUrl: string): {
  isValid: boolean;
  reason?: string;
  sanitizedUrl?: string;
} {
  let url: URL;

  try {
    url = new URL(scannedUrl);
  } catch {
    return { isValid: false, reason: '유효하지 않은 URL 형식입니다.' };
  }

  // 1. 위험한 스킴 차단
  const scheme = url.protocol.toLowerCase();
  if (BLOCKED_SCHEMES.some(blocked => scheme.startsWith(blocked))) {
    return { isValid: false, reason: '허용되지 않은 URL 형식입니다.' };
  }

  // 2. HTTPS만 허용 (개발 환경 제외)
  if (url.hostname !== 'localhost' && url.protocol !== 'https:') {
    return { isValid: false, reason: '보안 연결(HTTPS)만 허용됩니다.' };
  }

  // 3. 도메인 화이트리스트 검증
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    return {
      isValid: false,
      reason: `허용되지 않은 도메인입니다: ${url.hostname}`
    };
  }

  // 4. 경로 정규화 (path traversal 방지)
  const sanitizedUrl = url.origin + url.pathname + url.search;

  return { isValid: true, sanitizedUrl };
}
```

### 사용 예시

```typescript
const handleQrScan = (scannedText: string): void => {
  const validation = validateQrUrl(scannedText);

  if (!validation.isValid) {
    showError(validation.reason);
    return;
  }

  // 안전한 리다이렉트
  router.push(validation.sanitizedUrl);
};
```

### 추가 권장 사항

| 항목          | 설명                                                   |
| ------------- | ------------------------------------------------------ |
| 서명된 URL    | 가능하면 JWT 등으로 서명된 토큰 URL 사용 (위변조 방지) |
| Rate Limiting | 스캔 시도 횟수 제한 (브루트포스 방지)                  |
| 로깅          | 스캔된 URL 로깅 (보안 감사용, 개인정보 주의)           |
| CSP           | Content-Security-Policy 헤더로 리다이렉트 대상 제한    |

---

## 5. 구현 시 고려사항

### 필수 요구사항

1. **HTTPS 필수**
   - 카메라 접근은 보안 컨텍스트(HTTPS 또는 localhost)에서만 가능
   - HTTP에서는 `getUserMedia` API 호출 불가

2. **권한 요청 UX**
   - 카메라 권한 요청 전 사용자에게 목적 설명
   - 권한 거부 시 대체 UI(링크 입력) 즉시 제공
   - "다시 묻지 않기" 선택 시 설정 안내

3. **모바일 최적화**
   - 후면 카메라 우선: `facingMode: { ideal: 'environment' }`
   - 가로/세로 모드 대응
   - 저사양 기기 고려 (프레임 레이트 조절)

### 접근성

- 시각 장애 사용자를 위한 대체 입력 방법 필수 제공
- 스캔 성공/실패 시 음성 또는 진동 피드백 고려

---

## 6. 설치 방법

### 권장 구성 (Safari 포함)

```bash
pnpm add @zxing/browser @zxing/library
```

### Chrome 전용 환경

```bash
pnpm add @yudiel/react-qr-scanner
```

### 파일 업로드 필요 시

```bash
pnpm add html5-qrcode
```

---

## 7. 결론

### 프로젝트별 권장 선택

| 타겟 환경                 | 권장 라이브러리          | 비고                                 |
| ------------------------- | ------------------------ | ------------------------------------ |
| 일반 모바일 웹 (iOS 포함) | **@zxing/browser**       | BarcodeDetector를 가속 옵션으로 병용 |
| Chrome/Android 전용       | @yudiel/react-qr-scanner | 번들 크기 최소화                     |
| 파일 업로드 필수          | html5-qrcode             | 릴리즈 오래됨 리스크 감안            |
| 내부 도구/키오스크        | BarcodeDetector 단독     | 브라우저 통제 가능 시                |

### 현재 프로젝트(roulette-together-fe) 권장 전략

모바일 웹 사용자(iOS Safari 포함)를 타겟으로 하므로:

1. **@zxing/browser** 메인 채택
2. BarcodeDetector를 1차 시도로 활용 (지원 시 성능 이점)
3. Next.js dynamic import로 번들 분리
4. URL 보안 검증 로직 필수 적용
5. 링크 직접 입력 UI를 항상 제공 (최종 폴백)
