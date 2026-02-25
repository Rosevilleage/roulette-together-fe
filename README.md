# 당첨?당첨! — 실시간 다인 랜덤 뽑기

친구나 팀원과 함께 실시간으로 랜덤 뽑기를 할 수 있는 웹 애플리케이션입니다.  
방장이 방을 생성하고, 참가자들이 QR 코드나 링크로 입장한 뒤, 방장이 뽑기를 실행하면 결과가 모두에게 동시에 전달됩니다.

**배포:** https://roulette-together.com
**백엔드 저장소:** (Socket.IO 기반 Node.js 서버)

---

## 주요 기능

| 기능                    | 설명                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| **실시간 멀티플레이**   | Socket.IO WebSocket으로 방장·참가자 간 이벤트를 실시간 동기화                   |
| **역할 기반 화면**      | 방장(Owner)과 참가자(Participant)에게 서로 다른 UI 제공                         |
| **QR 코드 초대**        | 방 링크를 QR로 생성, ZXing 라이브러리로 카메라 스캔 입장 지원                   |
| **카드 애니메이션**     | Framer Motion 기반 카드 플립·모임·결과 공개 애니메이션, GSAP로 텍스트 셔플 효과 |
| **방 설정 실시간 반영** | 당첨자 수, 당첨/미당첨 감정 설정을 방 안에서 실시간 변경                        |
| **참가 기록 관리**      | LocalStorage로 최근 참가한 방 목록 유지, 빠른 재입장 지원                       |
| **혼자 뽑기 모드**      | 서버 없이 SessionStorage만으로 동작하는 싱글 플레이 모드                        |

---

## 기술 스택

| 분류          | 기술                           | 선택 이유                                                                     |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| **Framework** | Next.js 16 (App Router)        | 파일 기반 라우팅, `Metadata` API, `dynamic` 코드 스플리팅, Vercel 배포 최적화 |
| **Language**  | TypeScript (strict)            | 컴파일 타임 타입 안전성, WebSocket 페이로드 타입 강제                         |
| **Styling**   | Tailwind CSS 4                 | 유틸리티 기반으로 빠른 반응형 UI 구현                                         |
| **UI**        | shadcn/ui                      | Headless 기반 컴포넌트로 접근성 + 커스텀 스타일 자유도 확보                   |
| **State**     | Zustand 5                      | 경량 전역 스토어, WebSocket 이벤트 → 스토어 업데이트 패턴에 적합              |
| **Real-time** | Socket.IO Client 4             | WebSocket 전용 트랜스포트, 자동 재연결, 이벤트 기반 API                       |
| **Animation** | Framer Motion (motion), GSAP 3 | 카드 시퀀스 애니메이션(motion) + 텍스트 셔플 효과(GSAP) 역할 분리             |
| **QR**        | qrcode.react, @zxing/browser   | 생성(React 컴포넌트)·스캔(카메라 스트림) 각 목적별 라이브러리                 |
| **Package**   | pnpm                           | 디스크 효율, 엄격한 의존성 격리                                               |

---

## 아키텍처

### FSD (Feature-Sliced Design)

레이어 간 단방향 의존성을 강제하여 기능 추가·변경 시 영향 범위를 명확히 합니다.

```
app → page-components → widgets → features → entities → shared
```

```
src/
├── app/                        # Next.js App Router (라우팅 전용)
│   ├── page.tsx
│   ├── join/page.tsx
│   ├── solo/page.tsx
│   └── room/[roomId]/page.tsx
├── page-components/            # 페이지 조합 컴포넌트
│   ├── HomePage.tsx
│   └── RoomPage.tsx
├── widgets/                    # 독립적 UI 블록
│   └── MainHero.tsx
├── features/                   # 기능 단위 컴포넌트
│   ├── room/
│   │   ├── create-room/        # 방 생성 플로우
│   │   ├── join-room/          # 방 참가 (QR 스캔, 링크 입력)
│   │   └── room-waiting/       # 방 대기실 (owner/participant 뷰 분리)
│   └── solo/                   # 싱글 플레이 뽑기
├── entities/
│   └── room/
│       ├── api/                # REST API 함수
│       ├── hooks/              # useRoomEvents (WebSocket 이벤트 핸들러)
│       ├── lib/                # room_storage (LocalStorage 유틸)
│       └── model/              # room.store.ts, websocket.types.ts, room.types.ts
└── shared/
    ├── api/                    # axios 클라이언트
    ├── hooks/                  # useSocket
    ├── store/                  # alert.store.ts
    ├── lib/                    # logger, utils
    ├── types/
    └── ui/                     # 공통 컴포넌트 (Button, Dialog, Card 등)
```

### 실시간 통신 흐름

```
사용자 액션
    │
    ▼
socket.emit(SOCKET_EVENTS.*, payload)
    │
    ▼ (Socket.IO WebSocket)
서버 처리
    │
    ▼
socket.on(SOCKET_EVENTS.*, handler)  ← useRoomEvents hook
    │
    ▼
Zustand Store 업데이트
    │
    ▼
React 리렌더링
```

**소켓 싱글턴 패턴**

컴포넌트가 여러 번 마운트되어도 소켓 연결이 중복 생성되지 않도록 모듈 스코프의 전역 인스턴스를 관리합니다.

```ts
// src/shared/hooks/useSocket.ts
let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(WS_URL, { transports: ['websocket'], autoConnect: false });
  }
  if (!globalSocket.connected) globalSocket.connect();
  return globalSocket;
}
```

SSR Hydration 불일치를 방지하기 위해 소켓 초기화는 `useEffect` + `queueMicrotask` 조합으로 클라이언트에서만 실행합니다.

### 역할 기반 뷰 (단일 URL, 두 가지 화면)

`/room/[roomId]?role=owner|participant` 쿼리 파라미터 하나로 방장과 참가자에게 완전히 다른 UI를 제공합니다.

- **방장**: 참가자 목록·준비 현황 실시간 조회, 뽑기 실행, 방 설정 변경, QR 공유
- **참가자**: 준비 상태 토글, 닉네임 변경, 결과 카드 애니메이션

방장 인증은 방 생성 시 서버가 발급한 토큰을 쿠키(`withCredentials: true`)로 전달하는 방식으로 처리합니다.

---

## 기술적 고민

### WebSocket 이벤트 타입 안전성

모든 이벤트 페이로드에 TypeScript 인터페이스를 정의하고 `SOCKET_EVENTS` 상수 객체로 이벤트 이름을 관리합니다. 오타나 누락된 핸들러를 컴파일 타임에 잡아냅니다.

```ts
// entities/room/model/websocket.types.ts
export interface SpinResolvedPayload {
  roomId: string;
  spinId: string;
  winnersCount: number;
  animation: { revealAt: number; durationMs: number };
  // ...
}

export const SOCKET_EVENTS = {
  SPIN_RESOLVED: 'spin:resolved',
  SPIN_OUTCOME: 'spin:outcome'
  // ...
} as const;
```

### 애니메이션 타이밍 동기화

서버에서 `spin:resolved` 이벤트로 `animation.durationMs`를 함께 전달합니다. 클라이언트는 이 값을 기준으로 카드 모임 → 플립 → 결과 공개 애니메이션 타이밍을 동기화합니다. 서버가 주도하는 타이밍 덕분에 클라이언트 측 임의 지연 없이 일관된 애니메이션 흐름을 보장합니다.

### Hydration-safe 소켓 초기화

Next.js App Router 환경에서 `window`, `document`에 의존하는 Socket.IO를 SSR 단계에서 실행하면 Hydration mismatch가 발생합니다. `useEffect` 안에서만 소켓을 초기화하고, `useState(null)`로 초기값을 null로 유지해 서버·클라이언트 렌더링 결과를 일치시킵니다.

### 방장 부재 처리

방장이 페이지를 떠났을 때 서버는 `room:owner:left` 이벤트를 참가자에게 전송합니다. 클라이언트는 `ownerPresent` 상태를 `false`로 변경해 "방장 부재" 배너를 표시하고, 방장이 재접속하면 `room:joined` 이벤트에서 `ownerPresent: true`로 복원합니다.

---

## 로컬 실행

### 환경 변수

`.env.local` 파일을 생성합니다:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

| 명령어          | 설명                                       |
| --------------- | ------------------------------------------ |
| `pnpm dev`      | 개발 서버 실행                             |
| `pnpm build`    | 프로덕션 빌드                              |
| `pnpm lint`     | ESLint 검사                                |
| `pnpm lint:fix` | ESLint 자동 수정                           |
| `pnpm format`   | Prettier 포맷팅                            |
| `pnpm commit`   | Commitizen 커밋 (이모지 + 한국어 프롬프트) |

---

## 코드 품질

- **TypeScript strict mode**: 모든 함수·훅에 명시적 반환 타입, `any` 금지
- **ESLint + Prettier**: 저장 시 자동 포맷팅, 미사용 import 자동 제거
- **Husky + lint-staged**: 커밋 전 staged 파일 자동 lint·format
- **Commitizen**: 이모지 prefix + 한국어 스코프 기반 커밋 컨벤션 강제

---

## 배포

Vercel의 `deploy` 브랜치만 프로덕션 배포되도록 `vercel.json`에서 설정합니다.

```json
"git": { "deploymentEnabled": { "*": false, "deploy": true } }
```

Vercel Dashboard > Settings > Environment Variables에서 프로덕션 환경 변수를 관리합니다. 소스 코드에는 실제 URL이 포함되지 않습니다.
