# 방장 페이지 룰렛 애니메이션 구현 계획

## 요구사항 요약

1. 룰렛 돌리기 시작 시 백드롭이 생기고 참가자 카드들이 화면 중앙으로 겹쳐짐
2. 설정된 최소 시간 동안 LightRays 두 개가 좌우에서 빠르게 불빛을 비춤
3. 결과가 결정되면 가운데 겹쳐진 카드들 중 맨 위 카드를 뒤집음
4. 맨 위 카드는 몰래 추가된 결과 카드이며, 당첨자 이름을 표시
5. 당첨자가 여러 명인 경우 리스트 형태로 렌더링하고 스크롤 지원
6. 당첨된 참가자 카드들은 visibility hidden으로 숨김
7. 결과 공개 후 모든 카드를 원위치
8. 백드롭 클릭 시 결과 카드가 사라지고 숨겨진 카드들이 서서히 보임

---

## 애니메이션 페이즈 정의

| 페이즈       | 설명                                | 지속 시간  |
| ------------ | ----------------------------------- | ---------- |
| idle         | 초기 상태 (카드 그리드 표시)        | -          |
| gathering    | 카드들이 중앙으로 모임              | 600ms      |
| stacked      | 중앙에 겹쳐진 상태 + LightRays 표시 | durationMs |
| reveal-flip  | 결과 카드 뒤집기                    | 600ms      |
| result-shown | 결과 표시 상태 (백드롭 클릭 대기)   | -          |
| dispersing   | 카드들이 원위치로 돌아감            | 800ms      |

### 페이즈 흐름도

```
idle (초기 상태)
  │
  │ spin:request 전송
  ▼
gathering (카드 모으기) ─── 600ms
  │
  ▼
stacked (카드 스택 + 라이트빔) ─── durationMs 대기 + spin:result 수신
  │
  ▼
reveal-flip (결과 카드 뒤집기) ─── 600ms
  │
  ▼
result-shown (결과 표시) ─── 백드롭 클릭 대기
  │
  ▼
dispersing (원위치 복귀) ─── 800ms
  │
  ▼
idle (초기 상태)
```

---

## 파일 변경 계획

### 신규 생성 파일

#### 1. useOwnerCardAnimation.ts

**경로:** `src/features/room/room-waiting/hooks/useOwnerCardAnimation.ts`

**역할:** 방장용 애니메이션 상태 관리 훅

**주요 기능:**

- 애니메이션 페이즈 상태 관리
- spin.isSpinning 감지하여 gathering 페이즈 시작
- spin.allOutcomes 수신 및 대기시간 충족 후 reveal-flip 진입
- 백드롭 클릭 시 dispersing에서 idle로 전환
- 당첨자 닉네임 목록 계산 (visibility hidden 처리용)

**반환 값:**

- phase: 현재 애니메이션 페이즈
- showBackdrop: 백드롭 표시 여부
- showLightBeams: LightRays 표시 여부
- showResultCard: 결과 카드 표시 여부
- isFlipped: 결과 카드 뒤집힘 여부
- hiddenNicknames: 숨길 참가자 닉네임 배열
- winners: 당첨자 목록
- dismissBackdrop: 백드롭 닫기 함수

---

#### 2. OwnerAnimationOverlay.tsx

**경로:** `src/features/room/room-waiting/ui/owner/OwnerAnimationOverlay.tsx`

**역할:** 백드롭과 좌우 LightRays 오버레이 컴포넌트

**구현 내용:**

- AnimatePresence와 motion.div를 사용한 백드롭 (opacity 애니메이션)
- LightRays 두 개 배치: raysOrigin="left"와 raysOrigin="right"
- 빠른 속도 설정: raysSpeed={6}
- 노란색 계열 색상: raysColor="#fef08a"

---

#### 3. ResultCard.tsx

**경로:** `src/features/room/room-waiting/ui/owner/ResultCard.tsx`

**역할:** 뒤집히는 결과 카드 컴포넌트

**구현 내용:**

- Framer Motion을 사용한 3D 뒤집기 (rotateY)
- 앞면: PixelCard + 물음표 아이콘 (추첨 중... 텍스트)
- 뒷면: PixelCard(yellow variant) + 당첨자 목록
- 여러 명일 경우 max-h-48 overflow-y-auto로 스크롤 지원

---

#### 4. CardStack.tsx

**경로:** `src/features/room/room-waiting/ui/owner/CardStack.tsx`

**역할:** 중앙에 겹쳐진 카드 스택 컴포넌트

**구현 내용:**

- fixed inset-0으로 화면 중앙 배치
- 각 카드에 미세한 rotate와 y offset 적용 (자연스러운 스택 효과)
- 맨 위에 ResultCard 배치
- AnimatePresence로 진입/퇴장 애니메이션
- 모든 카드가 동시에 중앙으로 이동
- 원본 참가자 카드 정보(닉네임 + 상태 이모지) 표시

---

### 수정 파일

#### 1. room.store.ts

**경로:** `src/entities/room/model/room.store.ts`

**수정 내용:**

- SpinState 인터페이스에 animationDuration 필드 추가
- startSpin 액션에 duration 파라미터 추가

---

#### 2. useRoomEvents.ts

**경로:** `src/entities/room/hooks/useRoomEvents.ts`

**수정 내용:**

- handleSpinResolved에서 animation.durationMs를 startSpin에 전달

---

#### 3. OwnerView.tsx

**경로:** `src/features/room/room-waiting/ui/owner/OwnerView.tsx`

**수정 내용:**

- useOwnerCardAnimation 훅 사용
- OwnerAnimationOverlay 컴포넌트 렌더링 추가
- 참가자 카드에 visibility 조건부 적용 (당첨자 숨김)
- 애니메이션 중(gathering~dispersing) CardStack 표시

---

## 세부 구현 사항

### 카드 스택 레이아웃

**모임 방식:** 모든 카드가 동시에 중앙으로 이동 (duration: 0.6s, ease: easeOut)

**스택 카드 표시:** 원본 참가자 카드 복사 (닉네임 + 준비상태 이모지)

**스택 효과:**

- 각 카드에 인덱스 기반 회전 적용: (i % 2 === 0 ? 1 : -1) _ (i _ 2)도
- 각 카드에 인덱스 기반 y 오프셋: -i \* 2px (살짝 위로 쌓임)
- z-index로 카드 깊이 표현

---

### LightRays 좌우 배치

**왼쪽 LightRays:**

- raysOrigin: "left"
- raysColor: "#fef08a" (노란색)
- raysSpeed: 6
- lightSpread: 0.4
- rayLength: 150
- pulsating: true

**오른쪽 LightRays:**

- raysOrigin: "right"
- 나머지 설정은 왼쪽과 동일

---

### 결과 카드 당첨자 목록

**레이아웃:**

- 상단: 축하 이모지
- 중앙: "당첨!" 제목
- 하단: 당첨자 닉네임 리스트

**스크롤 처리:**

- max-h-48로 최대 높이 제한
- overflow-y-auto로 초과 시 스크롤
- 각 닉네임은 border-b로 구분

---

## 구현 순서

1. room.store.ts - animationDuration 필드 추가
2. useRoomEvents.ts - startSpin에 duration 전달
3. useOwnerCardAnimation.ts - 방장용 애니메이션 훅 생성
4. OwnerAnimationOverlay.tsx - 백드롭 + LightRays 컴포넌트 생성
5. ResultCard.tsx - 뒤집히는 결과 카드 컴포넌트 생성
6. CardStack.tsx - 카드 스택 컴포넌트 생성
7. OwnerView.tsx - 전체 통합

---

## 검증 방법

1. 개발 서버 실행: pnpm dev
2. 방 생성 후 참가자 2~3명 입장
3. 모든 참가자 준비 완료
4. 룰렛 돌리기 버튼 클릭

### 확인 사항

- [ ] 백드롭이 표시되는가
- [ ] 카드들이 중앙으로 동시에 모이는가
- [ ] 좌우 LightRays가 빠르게 표시되는가
- [ ] 결과 카드가 자연스럽게 뒤집히는가
- [ ] 당첨자 목록이 올바르게 표시되는가
- [ ] 당첨자 원본 카드가 숨겨지는가
- [ ] 백드롭 클릭 시 모든 것이 원위치되는가
- [ ] 숨겨진 카드들이 서서히 다시 나타나는가
