# 룰렛 투게더 프론트엔드

실시간 다인 룰렛 애플리케이션의 프론트엔드

## 기능

### 1. 방 만들기

- **Stepper UI**: 단계별 방 생성 프로세스
  - 1단계: 닉네임 입력 (선택사항)
  - 2단계: 방 생성 확인 및 생성
- 방 생성 후 자동으로 방장으로 입장

### 2. 방 참가하기

- **QR 코드 스캔**: 방장이 보여주는 QR 코드를 스캔하여 입장 (개발 예정)
- **링크 입력**: 방 URL을 직접 입력하여 참가

### 3. 혼자 룰렛 돌리기

- **후보 관리**: 후보를 추가, 수정, 삭제
- **룰렛 스핀**: 후보 중 무작위로 한 명 선택
- **당첨 기록**: 이전 당첨자 기록 확인
- **SessionStorage**: 세션 동안 데이터 유지

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, @react-bits
- **State Management**: React Hooks
- **Animation**: Framer Motion (motion)

## 프로젝트 구조 (FSD Architecture)

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 메인 페이지
│   ├── join/              # 방 참가하기 페이지
│   ├── solo/              # 혼자 룰렛 페이지
│   └── room/[roomId]/     # 방 화면 (동적 라우트)
├── entities/              # 엔티티 (도메인 모델)
├── features/              # 기능 단위 컴포넌트
│   └── room/
│       ├── create-room-form.tsx
│       ├── create-room-stepper.tsx
│       ├── nickname-input-dialog.tsx
│       ├── room-waiting.tsx
│       ├── owner-view.tsx
│       └── participant-view.tsx
├── shared/                # 공유 리소스
│   ├── api/              # API 함수
│   ├── hooks/            # 커스텀 훅
│   │   ├── use-socket.ts
│   │   └── use-room-events.ts
│   ├── lib/              # 유틸리티
│   ├── store/            # 상태 관리
│   │   └── room.store.ts
│   ├── types/            # 타입 정의
│   │   ├── room.types.ts
│   │   └── websocket.types.ts
│   └── ui/               # UI 컴포넌트
└── widgets/               # 페이지 레벨 컴포넌트
    ├── main-menu.tsx
    └── room-page.tsx
```

## 개발 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# Lint 검사
pnpm lint

# Lint 자동 수정
pnpm lint:fix
```

## 주요 페이지

- `/` - 메인 메뉴 (방 만들기, 방 참가하기, 혼자 룰렛)
- `/join` - 방 참가하기 (QR 스캔 또는 링크 입력)
- `/solo` - 혼자 룰렛 돌리기
- `/room/:roomId` - 방 화면 (방장/참가자 뷰)
  - 쿼리 파라미터:
    - `role`: 'owner' | 'participant' (필수)
    - `token`: 방장 인증 토큰 (role=owner일 때만)
    - `nickname`: 초기 닉네임 (선택)

## 개발 규칙

- 모든 함수와 훅은 명시적인 반환 타입 정의
- `any` 타입 사용 금지
- 불변성을 위해 `const` 우선 사용
- 컴포넌트는 named export 사용
- Props와 API 응답에 대한 interface/type 정의 필수

## 코드 품질

### ESLint 설정

- **자동 import 정리**: 저장 시 사용하지 않는 import 자동 제거
- **TypeScript 규칙**: strict 모드 활성화
- **React 규칙**: hooks 사용 규칙 강제

### VS Code / Cursor 설정

프로젝트에 `.vscode/settings.json`이 포함되어 있어 다음 기능이 자동으로 활성화됩니다:

- 저장 시 자동 포맷팅
- 저장 시 ESLint 자동 수정 (unused imports 제거 포함)
- TypeScript 워크스페이스 버전 사용

### Lint 명령어

```bash
# 코드 검사
pnpm lint

# 자동 수정
pnpm lint:fix
```

## 구현 완료

- [x] WebSocket 연결 및 실시간 방 기능
- [x] 방 화면 UI 구현
- [x] 참가자 준비 상태 시스템
- [x] 방장/참가자 역할 관리
- [x] 닉네임 변경 기능
- [x] 방 생성 및 입장 플로우

## 다음 개발 예정

- [ ] 룰렛 스핀 애니메이션
- [ ] 결과 화면 UI
- [ ] QR 코드 스캔 기능 구현
- [ ] 방 설정 변경 기능 (방장)
- [ ] 에러 처리 개선

## 배포

### Vercel 배포

이 프로젝트는 Vercel로 배포할 수 있습니다.

#### 배포 전 준비

1. **환경 변수 설정** (Vercel Dashboard > Settings > Environment Variables):

```env
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_WS_URL=...
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

2. **Build & Development 설정**:
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
   - Output Directory: `.next` (기본값)

#### 배포 방법

**GitHub 연동 (권장):**

1. Vercel Dashboard에서 New Project 클릭
2. GitHub 저장소 연결
3. `deploy` 브랜치 선택
4. 환경 변수 설정
5. Deploy 클릭

**Vercel CLI:**

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel --prod
```

#### 주요 설정

- **Framework**: Next.js
- **Node.js Version**: 20.x (자동)
- **Region**: Seoul (icn1)
- **Package Manager**: pnpm

#### 배포 후 확인 사항

- [ ] WebSocket 연결 동작 확인 (프로덕션 API 서버)
- [ ] 방 생성/입장 플로우 테스트
- [ ] 공유 링크 생성 및 QR 코드 확인
- [ ] 실시간 통신 기능 동작 확인

### 프로덕션 환경 변수

**중요**: 프로덕션 환경 변수는 소스 코드에 포함하지 말고, Vercel Dashboard에서 직접 설정하세요.

Vercel Dashboard > Settings > Environment Variables에서 아래 값들을 설정:

```env
# 백엔드 API
NEXT_PUBLIC_API_URL=...

# WebSocket 서버
NEXT_PUBLIC_WS_URL=...

# 프론트엔드 URL (배포 후 실제 도메인으로 변경)
NEXT_PUBLIC_FRONTEND_URL=...
```

## 참고 문서

- [개발 계획서](./docs/plans/ROULETTE_first_plan.md)
