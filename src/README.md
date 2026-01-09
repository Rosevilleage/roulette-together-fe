# Feature-Sliced Design (FSD) Architecture

이 프로젝트는 FSD(Feature-Sliced Design) 아키텍처를 따릅니다.

## 폴더 구조

```
src/
├── app/                    # Next.js App Router & 앱 레벨 설정
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 페이지
├── widgets/               # 큰 독립적인 UI 블록 (여러 features/entities 조합)
├── features/              # 사용자 기능 및 시나리오
├── entities/              # 비즈니스 엔티티 (도메인 모델)
└── shared/                # 공용 재사용 가능한 코드
    ├── ui/               # UI 컴포넌트 (shadcn/ui 등)
    ├── lib/              # 유틸리티 함수
    ├── api/              # API 클라이언트
    ├── config/           # 설정 파일
    ├── types/            # 공용 타입 정의
    └── hooks/            # 공용 훅
```

## 레이어 설명

### 1. App Layer (`app/`)
- Next.js App Router 관련 파일
- 전역 프로바이더, 라우팅, 전역 스타일
- 다른 모든 레이어를 사용할 수 있음

### 2. Widgets Layer (`widgets/`)
- 독립적으로 동작하는 큰 UI 블록
- Features와 Entities를 조합하여 구성
- 예: Header, Footer, Sidebar 등

### 3. Features Layer (`features/`)
- 사용자 시나리오와 기능
- 비즈니스 로직 포함
- 예: 로그인, 회원가입, 검색 등

### 4. Entities Layer (`entities/`)
- 비즈니스 엔티티와 도메인 모델
- UI와 비즈니스 로직 분리
- 예: User, Product, Order 등

### 5. Shared Layer (`shared/`)
- 프로젝트 전반에서 재사용되는 코드
- 비즈니스 로직 없음
- 다른 레이어에 의존하지 않음

## Import 규칙

```typescript
// ✅ 올바른 import 예시
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { UserCard } from "@/entities/user";
import { LoginForm } from "@/features/auth";
import { Header } from "@/widgets/header";

// ❌ 잘못된 import 예시
// shared에서 features/entities/widgets import 불가
import { LoginForm } from "@/features/auth"; // in shared layer

// 같은 레벨의 다른 모듈 import 최소화
import { UserCard } from "@/features/user"; // in features/auth
```

## 레이어 의존성 규칙

상위 레이어는 하위 레이어만 import 가능합니다:

```
app → widgets → features → entities → shared
```

- **app**: 모든 레이어 사용 가능
- **widgets**: features, entities, shared 사용 가능
- **features**: entities, shared 사용 가능
- **entities**: shared만 사용 가능
- **shared**: 다른 레이어 사용 불가

## 모듈 구조 예시

각 모듈은 public API를 통해 export합니다:

```
features/
└── auth/
    ├── ui/              # UI 컴포넌트
    │   ├── login-form.tsx
    │   └── signup-form.tsx
    ├── model/           # 비즈니스 로직, 상태 관리
    │   ├── use-auth.ts
    │   └── auth-store.ts
    ├── api/             # API 호출
    │   └── auth-api.ts
    └── index.ts         # Public API
```

## 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD 한국어 가이드](https://feature-sliced.design/kr/)
