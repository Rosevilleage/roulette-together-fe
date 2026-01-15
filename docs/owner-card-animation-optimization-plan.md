# Owner View 카드 애니메이션 성능 최적화 계획

## 📋 개요

**목표**: 모바일 브라우저에서 카드 모이는 애니메이션의 성능을 개선하여 버벅거림 없는 60fps 애니메이션 달성

**방향**: 시각 효과를 최대한 유지하면서 기술적 최적화만 적용 (균형적 최적화)

---

## 🔍 현재 상태 분석

### 관련 파일

| 파일                                                                                              | 역할                                       | 성능 영향 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------- |
| [OwnerView.tsx](../src/features/room/room-waiting/ui/owner/OwnerView.tsx)                         | 카드 위치 캡처 및 Framer Motion 애니메이션 | 🔴 높음   |
| [PixelCard.tsx](../src/shared/ui/PixelCard.tsx)                                                   | Canvas 기반 픽셀 애니메이션                | 🔴 높음   |
| [LightRays.tsx](../src/shared/ui/LightRays.tsx)                                                   | WebGL 광선 효과                            | 🟡 중간   |
| [OwnerAnimationOverlay.tsx](../src/features/room/room-waiting/ui/owner/OwnerAnimationOverlay.tsx) | 배경 효과 오버레이                         | 🟡 중간   |
| [useOwnerCardAnimation.ts](../src/features/room/room-waiting/hooks/useOwnerCardAnimation.ts)      | 애니메이션 상태 관리                       | 🟢 낮음   |

### 현재 애니메이션 플로우

```
idle → gathering → stacked → reveal-flip → result-shown → dispersing
       (600ms)     (대기)     (600ms)       (클릭 대기)    (800ms)
```

### 주요 성능 병목

1. **PixelCard Canvas 애니메이션** (🔴 가장 심각)
   - 카드당 약 2,400픽셀 (200×300px ÷ 5px gap)
   - 20명 참가자 = 48,000픽셀 동시 애니메이션
   - 매 프레임마다 모든 픽셀 순회 및 업데이트

2. **getBoundingClientRect 반복 호출** (🔴 높음)
   - `gathering` 시작 시 모든 카드의 위치를 DOM에서 계산
   - Synchronous Layout Thrashing 발생

3. **WebGL LightRays 중복 렌더링** (🟡 중간)
   - 좌우 2개의 독립적인 WebGL 컨텍스트 동시 실행
   - 각각의 렌더링 루프가 별도로 동작

4. **ResizeObserver 과다 인스턴스** (🟡 중간)
   - 각 PixelCard마다 개별 ResizeObserver 생성
   - 20개 카드 = 20개 ResizeObserver

---

## 🎯 최적화 계획

### 1단계: PixelCard 최적화 (높은 영향도)

#### 1.1 픽셀 밀도 동적 조절

**현재 문제**: gap이 5px로 고정되어 픽셀 수가 너무 많음

**해결 방안**:

- 디바이스 성능에 따라 gap 동적 조절
- 모바일: gap 8-10px, 데스크톱: gap 5-6px
- `navigator.hardwareConcurrency` 또는 `navigator.deviceMemory`로 감지

```typescript
// 예시 코드
const getOptimalGap = (): number => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;

  if (isMobile || cores <= 4) return 10;
  if (cores <= 8) return 7;
  return 5;
};
```

#### 1.2 requestAnimationFrame 최적화

**현재 문제**: 매 프레임마다 모든 픽셀 업데이트

**해결 방안**:

- Idle 상태인 픽셀은 스킵
- 프레임 스킵 로직 추가 (저사양 기기에서 2프레임마다 업데이트)

```typescript
// 예시: 프레임 스킵
let frameCount = 0;
const shouldSkipFrame = isMobile && frameCount++ % 2 === 0;
if (shouldSkipFrame) return;
```

#### 1.3 Canvas 오프스크린 렌더링 고려

**해결 방안**:

- `OffscreenCanvas` 사용하여 Web Worker에서 렌더링
- 메인 스레드 부하 감소

---

### 2단계: DOM 레이아웃 최적화 (높은 영향도)

#### 2.1 getBoundingClientRect 호출 배치 처리

**현재 문제**: 개별적으로 getBoundingClientRect 호출 시 매번 reflow 발생

**해결 방안**:

- 모든 요소의 rect를 한 번에 읽어서 캐싱
- `requestAnimationFrame` 내에서 일괄 처리

```typescript
// 예시: 배치 읽기
const capturePositions = (): void => {
  requestAnimationFrame(() => {
    const rects = new Map<string, DOMRect>();

    // 읽기 작업만 배치 처리
    cardRefsMap.current.forEach((el, rid) => {
      if (el) rects.set(rid, el.getBoundingClientRect());
    });

    // 상태 업데이트는 읽기 완료 후
    const positions = new Map<string, CardPosition>();
    rects.forEach((rect, rid) => {
      positions.set(rid, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      });
    });

    setCardPositions(positions);
  });
};
```

#### 2.2 CSS `will-change` 적용

**해결 방안**:

- 애니메이션 시작 전 `will-change: transform, opacity` 설정
- 애니메이션 종료 후 제거 (메모리 절약)

```typescript
// gathering 시작 시
style={{ willChange: phase === 'gathering' ? 'transform, opacity' : 'auto' }}
```

---

### 3단계: WebGL/Canvas 최적화 (중간 영향도)

#### 3.1 LightRays 단일 인스턴스화

**현재 문제**: 좌우 LightRays가 각각 독립적인 WebGL 컨텍스트 사용

**해결 방안**:

- 하나의 Canvas에서 양쪽 광선 모두 렌더링
- props로 방향(좌/우)만 전달받아 셰이더에서 처리

#### 3.2 LightRays 렌더링 조건 최적화

**해결 방안**:

- `gathering` phase에서는 LightRays 비활성화
- `stacked` 이후 phase에서만 활성화

```typescript
const showLightBeams = ['stacked', 'reveal-flip', 'result-shown'].includes(phase);
```

---

### 4단계: 메모리 및 인스턴스 최적화 (중간 영향도)

#### 4.1 ResizeObserver 통합

**현재 문제**: 각 PixelCard가 개별 ResizeObserver 보유

**해결 방안**:

- 부모 컴포넌트에서 단일 ResizeObserver 사용
- Context 또는 callback으로 자식에게 크기 변경 알림

```typescript
// 부모 레벨에서 관리
const sharedResizeObserver = useMemo(() => {
  return new ResizeObserver(entries => {
    entries.forEach(entry => {
      const callback = resizeCallbacks.get(entry.target);
      callback?.(entry.contentRect);
    });
  });
}, []);
```

#### 4.2 애니메이션 중 불필요한 렌더링 방지

**해결 방안**:

- `React.memo` 적극 활용
- 애니메이션 상태와 관련 없는 컴포넌트는 리렌더링 방지

---

### 5단계: Framer Motion 최적화 (낮은 영향도)

#### 5.1 GPU 가속 강제 적용

**해결 방안**:

- `translateZ(0)` 또는 `translate3d` 사용으로 GPU 레이어 생성

```typescript
style={{
  transform: 'translateZ(0)', // GPU 레이어 강제 생성
  zIndex: animState.zIndex
}}
```

#### 5.2 애니메이션 spring 대신 tween 사용

**현재**: `ease: 'easeOut'` (이미 tween 사용 중)

**확인 필요**: 불필요한 spring 애니메이션이 있다면 tween으로 변경

---

## 📊 예상 효과

| 최적화 항목                     | 예상 성능 향상  | 구현 난이도 |
| ------------------------------- | --------------- | ----------- |
| PixelCard gap 동적 조절         | 30-40%          | 낮음        |
| getBoundingClientRect 배치 처리 | 10-15%          | 낮음        |
| will-change 적용                | 5-10%           | 매우 낮음   |
| LightRays 단일 인스턴스         | 10-15%          | 중간        |
| ResizeObserver 통합             | 5-10%           | 중간        |
| RAF 프레임 스킵                 | 20-30% (저사양) | 낮음        |

**총 예상 개선**: 저사양 모바일 기준 40-60% 성능 향상

---

## 🔧 구현 우선순위

### Phase 1 (즉시 적용 가능)

1. PixelCard gap 동적 조절
2. `will-change` CSS 속성 적용
3. getBoundingClientRect 배치 처리

### Phase 2 (약간의 리팩토링 필요)

4. RAF 프레임 스킵 로직 추가
5. LightRays 조건부 렌더링 최적화

### Phase 3 (구조적 변경 필요)

6. ResizeObserver 통합
7. LightRays 단일 인스턴스화
8. OffscreenCanvas 적용 (선택적)

---

## 📝 테스트 계획

### 성능 측정 방법

1. Chrome DevTools Performance 탭에서 프로파일링
2. `gathering` phase 시작부터 `stacked` phase까지 측정
3. FPS, Main thread 사용률, Layout Shift 확인

### 테스트 기기

- iOS Safari (iPhone 12 이하)
- Android Chrome (중저가 기기)
- 데스크톱 Chrome (저사양 모드: CPU 6x slowdown)

### 성공 기준

- 모바일에서 45fps 이상 유지
- 눈에 띄는 프레임 드롭 없음
- 시각적 품질 저하 최소화

---

## ⚠️ 주의사항

1. **PixelCard 효과 유지**: gap을 너무 크게 하면 픽셀 효과가 티나지 않을 수 있음
2. **LightRays 타이밍**: 광선 효과가 갑자기 나타나지 않도록 fade-in 유지
3. **테스트 필수**: 각 최적화 단계마다 실제 기기에서 테스트 필요
4. **점진적 적용**: 한 번에 모든 최적화를 적용하지 말고 단계별로 진행

---

## ✅ 구현 완료 (2026-01-15)

### 적용된 최적화

| 항목                            | 파일                                                    | 변경 내용                                                         |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| PixelCard gap 동적 조절         | `src/shared/ui/PixelCard.tsx`                           | 디바이스 성능 감지 후 gap 배율 적용 (저사양: 2배, 중간: 1.5배)    |
| will-change CSS 적용            | `src/features/room/room-waiting/ui/owner/OwnerView.tsx` | 애니메이션 중 `will-change: transform, opacity` + `translateZ(0)` |
| getBoundingClientRect 배치 처리 | `src/features/room/room-waiting/ui/owner/OwnerView.tsx` | 읽기 작업 일괄 처리 후 상태 업데이트 분리                         |
| RAF 프레임 스킵                 | `src/shared/ui/PixelCard.tsx`                           | 저사양 30fps 제한 + shimmer 단계 2프레임마다 실행                 |
| Idle 픽셀 스킵                  | `src/shared/ui/PixelCard.tsx`                           | disappear 시 idle 상태 픽셀 업데이트 스킵                         |

### 성능 개선 예상치

- **저사양 모바일**: 40-60% 개선 (픽셀 수 75% 감소 + 프레임 스킵)
- **중간 사양**: 20-30% 개선 (픽셀 수 56% 감소)
- **고사양**: 동일 (원본 유지)

---

## 📅 작성 정보

- **작성일**: 2026-01-15
- **구현일**: 2026-01-15
- **분석 대상**: Owner View 카드 모이기 애니메이션
- **최적화 방향**: 균형적 최적화 (시각 효과 유지 + 기술적 최적화)
