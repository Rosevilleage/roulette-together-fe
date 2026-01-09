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
│   └── solo/              # 혼자 룰렛 페이지
├── entities/              # 엔티티 (도메인 모델)
├── features/              # 기능 단위 컴포넌트
│   └── room/
│       ├── create-room-form.tsx
│       └── create-room-stepper.tsx
├── shared/                # 공유 리소스
│   ├── api/              # API 함수
│   ├── hooks/            # 커스텀 훅
│   ├── lib/              # 유틸리티
│   ├── types/            # 타입 정의
│   └── ui/               # UI 컴포넌트
└── widgets/               # 페이지 레벨 컴포넌트
    └── main-menu.tsx
```

## 개발 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
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
- `/room/:roomId` - 방 화면 (추후 구현 예정)

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

## 다음 개발 예정

- [ ] WebSocket 연결 및 실시간 방 기능
- [ ] 방 화면 UI 구현
- [ ] 참가자 준비 상태 시스템
- [ ] 룰렛 애니메이션
- [ ] QR 코드 스캔 기능 구현
- [ ] 방장/참가자 역할 관리

## 참고 문서

- [개발 계획서](./docs/plans/ROULETTE_first_plan.md)
