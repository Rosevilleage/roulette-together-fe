# API 호출 최적화 플랜

## Axios + TanStack Query 마이그레이션 가이드

---

## 1. 현재 상태 분석

### 1.1 현재 API 구조

| 항목            | 현재 상태             |
| --------------- | --------------------- |
| HTTP 클라이언트 | Native Fetch API      |
| 상태 관리       | useState (컴포넌트별) |
| 캐싱            | 없음                  |
| 재시도 로직     | 없음                  |
| 에러 처리       | 단순 try-catch        |

### 1.2 기존 API 엔드포인트

```typescript
// src/shared/api/room.api.ts
POST /rooms  → createRoom()   // 방 생성
GET  /rooms  → getRooms()     // 방 목록 조회
```

### 1.3 API 사용 컴포넌트

| 컴포넌트            | API 함수     | 현재 상태 관리                     |
| ------------------- | ------------ | ---------------------------------- |
| `CreateRoomForm`    | `createRoom` | useState (isLoading, error)        |
| `CreateRoomStepper` | `createRoom` | useState (isCreating, error)       |
| `RoomList`          | `getRooms`   | useState (rooms, isLoading, error) |

---

## 2. 마이그레이션 목표

### 2.1 기대 효과

- **자동 캐싱**: 불필요한 API 호출 감소
- **로딩/에러 상태 통합**: 보일러플레이트 코드 제거
- **자동 재시도**: 네트워크 오류 시 자동 복구
- **낙관적 업데이트**: UX 향상
- **DevTools 지원**: 디버깅 용이성

### 2.2 마이그레이션 범위

```
✅ 마이그레이션 대상:
├── HTTP API 호출 (createRoom, getRooms)
├── 로딩/에러 상태 관리
└── API 캐싱 전략

❌ 유지 (변경 없음):
├── WebSocket 통신 (Socket.IO)
├── Zustand 전역 상태 (실시간 데이터)
└── localStorage 관리
```

---

## 3. 구현 단계

### Phase 1: 패키지 설치 및 기초 설정

#### 3.1.1 패키지 설치

```bash
pnpm add axios @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

#### 3.1.2 Axios 인스턴스 생성

**파일**: `src/shared/api/client.ts`

```typescript
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키 인증 유지
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 요청 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 공통 에러 처리
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.error('[API] 인증 오류');
          break;
        case 403:
          console.error('[API] 권한 없음');
          break;
        case 404:
          console.error('[API] 리소스를 찾을 수 없음');
          break;
        case 500:
          console.error('[API] 서버 오류');
          break;
      }
    } else if (error.request) {
      console.error('[API] 네트워크 오류');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 3.1.3 QueryClient 설정

**파일**: `src/shared/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분 (이전의 cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
});
```

#### 3.1.4 QueryClientProvider 설정

**파일**: `src/app/providers.tsx`

```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/shared/lib/query-client';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**파일**: `src/app/layout.tsx` (수정)

```typescript
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### Phase 2: API 레이어 리팩토링

#### 3.2.1 Query Keys 정의

**파일**: `src/shared/api/query-keys.ts`

```typescript
export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...roomKeys.lists(), filters] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (roomId: string) => [...roomKeys.details(), roomId] as const
};
```

#### 3.2.2 Room API 훅 생성

**파일**: `src/shared/api/room.queries.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { roomKeys } from './query-keys';
import type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse } from '@/shared/types/room.types';

// ============================================
// Query: 방 목록 조회
// ============================================
export function useRoomsQuery() {
  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: async (): Promise<GetRoomsResponse> => {
      const { data } = await apiClient.get<GetRoomsResponse>('/rooms');
      return data;
    },
    staleTime: 1000 * 60 * 2 // 2분
  });
}

// ============================================
// Mutation: 방 생성
// ============================================
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateRoomRequest): Promise<CreateRoomResponse> => {
      const { data } = await apiClient.post<CreateRoomResponse>('/rooms', request);
      return data;
    },
    onSuccess: () => {
      // 방 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
    onError: error => {
      console.error('방 생성 실패:', error);
    }
  });
}

// ============================================
// 타입 재export (편의성)
// ============================================
export type { CreateRoomRequest, CreateRoomResponse, GetRoomsResponse };
```

---

### Phase 3: 컴포넌트 마이그레이션

#### 3.3.1 RoomList 컴포넌트 수정

**파일**: `src/features/room/room-list.tsx`

```typescript
'use client';

import { useRoomsQuery } from '@/shared/api/room.queries';
import { RoomCard } from './room-card';

export function RoomList(): JSX.Element {
  const { data, isLoading, error, refetch } = useRoomsQuery();

  if (isLoading) {
    return <div className="text-center py-8">방 목록을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">방 목록을 불러오지 못했습니다.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const rooms = data?.rooms ?? [];

  if (rooms.length === 0) {
    return <div className="text-center py-8 text-gray-500">생성한 방이 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <RoomCard key={room.roomId} room={room} />
      ))}
    </div>
  );
}
```

#### 3.3.2 CreateRoomForm 컴포넌트 수정

**파일**: `src/features/room/create-room-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRoomMutation } from '@/shared/api/room.queries';
import { saveRoomToStorage } from '@/shared/lib/room-storage';

export function CreateRoomForm(): JSX.Element {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

  const { mutate: createRoom, isPending, error } = useCreateRoomMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createRoom(
      { nickname: nickname.trim() || undefined },
      {
        onSuccess: (data) => {
          // localStorage에 방 정보 저장
          saveRoomToStorage({
            roomId: data.roomId,
            role: 'owner',
            ownerUrl: data.ownerUrl,
            participantUrl: data.participantUrl,
          });

          // 방장 페이지로 이동
          const ownerUrl = new URL(data.ownerUrl);
          router.push(ownerUrl.pathname + ownerUrl.search);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium mb-2">
          닉네임 (선택)
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          className="w-full px-4 py-2 border rounded"
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">
          방 생성에 실패했습니다. 다시 시도해주세요.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
      >
        {isPending ? '생성 중...' : '방 만들기'}
      </button>
    </form>
  );
}
```

#### 3.3.3 CreateRoomStepper 컴포넌트 수정

**파일**: `src/features/room/create-room-stepper.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRoomMutation } from '@/shared/api/room.queries';
import type { WinSentiment } from '@/shared/types/room.types';

export function CreateRoomStepper(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [winnersCount, setWinnersCount] = useState(1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>('POSITIVE');

  const { mutate: createRoom, isPending, error } = useCreateRoomMutation();

  const handleCreate = () => {
    createRoom(
      {
        title: title.trim() || undefined,
        nickname: nickname.trim() || undefined,
        winnersCount,
        winSentiment,
      },
      {
        onSuccess: (data) => {
          // ownerUrl에서 token 추출
          const url = new URL(data.ownerUrl);
          const token = url.searchParams.get('token');

          // 방장 페이지로 이동
          router.push(`/room/${data.roomId}?role=owner&token=${token}`);
        },
      }
    );
  };

  // ... 나머지 step 렌더링 로직 (기존 유지)

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      {/* Step content */}

      {error && (
        <p className="text-red-500 text-sm text-center">
          방 생성에 실패했습니다. 다시 시도해주세요.
        </p>
      )}

      <div className="flex gap-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} disabled={isPending}>
            이전
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)}>다음</button>
        ) : (
          <button onClick={handleCreate} disabled={isPending}>
            {isPending ? '생성 중...' : '방 만들기'}
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Phase 4: 최적화

#### 3.4.1 캐싱 전략

| API          | staleTime | gcTime | 설명                       |
| ------------ | --------- | ------ | -------------------------- |
| `getRooms`   | 2분       | 30분   | 목록은 자주 변경될 수 있음 |
| `createRoom` | -         | -      | Mutation이므로 캐싱 없음   |

#### 3.4.2 Prefetching (선택적)

```typescript
// 메인 페이지에서 방 목록 미리 로드
import { useQueryClient } from '@tanstack/react-query';
import { roomKeys } from '@/shared/api/query-keys';

export function MainMenu(): JSX.Element {
  const queryClient = useQueryClient();

  const handleMyRoomsHover = () => {
    // 마우스 호버 시 prefetch
    queryClient.prefetchQuery({
      queryKey: roomKeys.lists(),
      queryFn: () => apiClient.get('/rooms').then(res => res.data),
    });
  };

  return (
    <button onMouseEnter={handleMyRoomsHover}>
      내가 만든 방
    </button>
  );
}
```

#### 3.4.3 낙관적 업데이트 (선택적)

```typescript
// 방 목록에서 새 방 추가 시 낙관적 업데이트
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateRoomRequest) => {
      const { data } = await apiClient.post<CreateRoomResponse>('/rooms', request);
      return data;
    },
    onMutate: async newRoom => {
      // 기존 쿼리 취소
      await queryClient.cancelQueries({ queryKey: roomKeys.lists() });

      // 이전 상태 스냅샷
      const previousRooms = queryClient.getQueryData(roomKeys.lists());

      // 낙관적 업데이트 (옵션)
      // queryClient.setQueryData(roomKeys.lists(), (old) => ...);

      return { previousRooms };
    },
    onError: (err, newRoom, context) => {
      // 에러 시 롤백
      if (context?.previousRooms) {
        queryClient.setQueryData(roomKeys.lists(), context.previousRooms);
      }
    },
    onSettled: () => {
      // 완료 후 캐시 무효화
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    }
  });
}
```

---

## 4. 파일 구조 변경

### 변경 전

```
src/shared/
├── api/
│   └── room.api.ts          ← Fetch API
└── types/
    └── room.types.ts
```

### 변경 후

```
src/shared/
├── api/
│   ├── client.ts            ← Axios 인스턴스 (신규)
│   ├── query-keys.ts        ← Query Key 팩토리 (신규)
│   ├── room.queries.ts      ← TanStack Query 훅 (신규)
│   └── room.api.ts          ← 기존 유지 (레거시/fallback)
├── lib/
│   └── query-client.ts      ← QueryClient 설정 (신규)
└── types/
    └── room.types.ts
```

---

## 5. 체크리스트

### Phase 1: 기초 설정

- [ ] axios 패키지 설치
- [ ] @tanstack/react-query 패키지 설치
- [ ] @tanstack/react-query-devtools 설치 (개발용)
- [ ] Axios 인스턴스 생성 (`client.ts`)
- [ ] QueryClient 설정 (`query-client.ts`)
- [ ] QueryClientProvider 추가 (`providers.tsx`)
- [ ] layout.tsx에 Providers 적용

### Phase 2: API 레이어

- [ ] Query Keys 정의 (`query-keys.ts`)
- [ ] useRoomsQuery 훅 생성
- [ ] useCreateRoomMutation 훅 생성

### Phase 3: 컴포넌트 마이그레이션

- [ ] RoomList 컴포넌트 수정
- [ ] CreateRoomForm 컴포넌트 수정
- [ ] CreateRoomStepper 컴포넌트 수정
- [ ] 기존 useState 로딩/에러 상태 제거

### Phase 4: 최적화

- [ ] 캐싱 전략 적용
- [ ] Prefetching 구현 (선택)
- [ ] 낙관적 업데이트 적용 (선택)
- [ ] DevTools로 동작 검증

### 검증

- [ ] 방 생성 기능 테스트
- [ ] 방 목록 조회 테스트
- [ ] 에러 핸들링 테스트
- [ ] 네트워크 재시도 테스트
- [ ] 캐시 동작 확인

---

## 6. 주의사항

### 6.1 쿠키 인증 유지

```typescript
// 반드시 withCredentials: true 설정
const apiClient = axios.create({
  withCredentials: true // 중요!
});
```

### 6.2 WebSocket은 유지

- Socket.IO 기반 실시간 통신은 **변경하지 않음**
- Zustand store를 통한 WebSocket 데이터 관리도 **그대로 유지**
- TanStack Query는 HTTP API만 담당

### 6.3 기존 API 파일 보존

- `room.api.ts`는 삭제하지 않고 유지
- 점진적 마이그레이션 후 제거 검토

### 6.4 SSR 고려사항

Next.js App Router 환경에서 QueryClient는 반드시 클라이언트 컴포넌트에서 생성:

```typescript
'use client';

// QueryClientProvider는 'use client' 컴포넌트에서만 사용
```

---

## 7. 예상 효과

| 지표                | 개선 예상              |
| ------------------- | ---------------------- |
| 보일러플레이트 코드 | ~40% 감소              |
| 중복 API 호출       | 캐싱으로 제거          |
| 에러 복구           | 자동 재시도            |
| 개발자 경험         | DevTools로 디버깅 용이 |
| 유지보수성          | 중앙집중식 API 관리    |

---

## 8. 참고 자료

- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Axios 공식 문서](https://axios-http.com/docs/intro)
- [Next.js App Router + React Query](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
