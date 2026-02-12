# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time multiplayer roulette application built with Next.js 16. The app supports creating rooms where an owner can spin a roulette to select winners from participants, with real-time WebSocket communication.

**Language**: Korean (UI, comments, commit messages are in Korean)

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build and start
pnpm build
pnpm start

# Linting
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues (includes removing unused imports)

# Code formatting
pnpm format        # Format all files
pnpm format:check  # Check formatting without changes

# Commits (uses Commitizen with Korean prompts)
pnpm commit        # Interactive commit wizard with emoji prefixes
```

## Environment Variables

### Development (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Production (Vercel Dashboard)

**IMPORTANT**: Never commit production environment variables to the repository. Set them in Vercel Dashboard (Settings > Environment Variables):

```env
NEXT_PUBLIC_API_URL=<your-production-api-url>
NEXT_PUBLIC_WS_URL=<your-production-ws-url>
NEXT_PUBLIC_FRONTEND_URL=<your-vercel-app-url>
```

## Architecture

### FSD (Feature-Sliced Design) Structure

The codebase follows Feature-Sliced Design methodology:

- **`src/app/`** - Next.js App Router (routing only, renders page components)
- **`src/pages/`** - Page-level components that compose widgets/features (e.g., `HomePage.tsx`, `RoomPage.tsx`)
- **`src/widgets/`** - Reusable independent UI blocks (e.g., `MainHero.tsx`)
- **`src/features/`** - Feature-specific components (e.g., room creation, nickname dialogs)
- **`src/entities/`** - Domain models and business entities
  - `room/` - Room domain with api, lib, model, hooks
- **`src/shared/`** - Shared resources across layers
  - `api/` - API client functions
  - `hooks/` - Reusable React hooks
  - `store/` - Zustand state management (global stores like `alert.store.ts`)
  - `types/` - TypeScript type definitions
  - `ui/` - UI components (shadcn/ui based)
  - `lib/` - Utility functions

**FSD Layer Dependencies:**

```
app → pages → widgets → features → entities → shared
```

### Path Aliases

Configured in `tsconfig.json`:

- `@/*` - `./src/*`
- `@/app/*` - `./src/app/*`
- `@/pages/*` - `./src/pages/*`
- `@/widgets/*` - `./src/widgets/*`
- `@/features/*` - `./src/features/*`
- `@/entities/*` - `./src/entities/*`
- `@/shared/*` - `./src/shared/*`

### Real-time Communication Architecture

**WebSocket Pattern:**

1. **Connection Management**: `useSocket` hook (in [src/shared/hooks/useSocket.ts](src/shared/hooks/useSocket.ts))
   - Single Socket.IO connection per client
   - Auto-reconnection with 5 attempts
   - WebSocket-only transport (no polling fallback)
   - Connection lifecycle logging

2. **Event Handling**: `useRoomEvents` hook (in [src/entities/room/hooks/useRoomEvents.ts](src/entities/room/hooks/useRoomEvents.ts))
   - Centralized WebSocket event listener registration
   - Automatic cleanup on unmount
   - Direct integration with Zustand store

3. **State Management**: Zustand store (in [src/entities/room/model/room.store.ts](src/entities/room/model/room.store.ts))
   - Single source of truth for room state
   - Separated concerns: room info, config, participants, spin state
   - Owner vs Participant role distinction

4. **Event Types**: Defined in [src/entities/room/model/websocket.types.ts](src/entities/room/model/websocket.types.ts)
   - Client → Server events: `ROOM_JOIN`, `ROOM_CONFIG_SET`, `SPIN_REQUEST`, etc.
   - Server → Client events: `ROOM_JOINED`, `ROOM_PARTICIPANTS`, `SPIN_RESOLVED`, etc.
   - All payloads are strongly typed

### Key Routing Patterns

- `/` - Main menu
- `/join` - Room joining (QR scan or link input)
- `/solo` - Single-player roulette (uses SessionStorage)
- `/room/[roomId]` - Room page with query parameters:
  - `role`: `'owner' | 'participant'` (required)
  - `token`: Owner authentication token (required when `role=owner`)
  - `nickname`: Initial nickname (optional)

### Role-Based Views

The room page renders different views based on role:

- **Owner View**: Shows all participants, ready states, room config, and spin button
- **Participant View**: Shows ready toggle, nickname change, waiting for owner to spin

## Code Quality Standards

### File & Folder Naming Conventions

| Category             | Convention   | Example                                |
| -------------------- | ------------ | -------------------------------------- |
| **React Components** | PascalCase   | `RoomHeader.tsx`, `CreateRoomForm.tsx` |
| **Custom Hooks**     | camelCase    | `useSocket.ts`, `useRoomEvents.ts`     |
| **Type Definitions** | dot notation | `room.types.ts`, `websocket.types.ts`  |
| **Constants/Config** | snake_case   | `query_keys.ts`, `api_config.ts`       |
| **Utilities**        | snake_case   | `room_storage.ts`, `format_utils.ts`   |
| **Folders**          | kebab-case   | `create-room/`, `join-room/`           |

**Additional Rules:**

- **Barrel files (index.ts)**: Not used - import directly from file paths
- **Test files**: Target filename + `.test.ts` or `.spec.ts`

### TypeScript Rules

- **Strict mode enabled**: All code must pass strict TypeScript checks
- **Explicit return types**: All functions and hooks must define return types
- **No `any` type**: Use proper types or `unknown` if type is truly unknown
- **Props/API types**: All component props and API responses must have interface/type definitions

### Code Style

- **Immutability**: Prefer `const` over `let`
- **Named exports**: Components use named exports (not default exports)
- **Import organization**: Unused imports are auto-removed by ESLint on save

### Linting & Formatting

- **ESLint**: Enforces Next.js, React, and TypeScript best practices
- **Prettier**: Code formatting (integrated with ESLint)
- **Pre-commit hooks**: Husky + lint-staged runs prettier and eslint on staged files
- **Auto-fix on save**: Configured in `.vscode/settings.json`

### Commit Convention

Uses Commitizen with Korean prompts and emoji prefixes:

- ✨ feat - 새로운 기능 추가
- 🐛 fix - 버그 수정
- 📝 docs - 문서 수정
- 💄 style - 코드 포맷팅
- ♻️ refactor - 코드 리팩토링
- ⚡ perf - 성능 개선
- 🧪 test - 테스트 추가/수정
- 🔧 chore - 빌드/설정 변경
- 👷 ci - CI 설정

**Scopes**: components, pages, hooks, utils, styles, config, deps

Use `pnpm commit` to create properly formatted commits.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, @base-ui/react, @react-bits
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Animation**: Framer Motion (`motion`), GSAP
- **QR Codes**: qrcode.react
- **Package Manager**: pnpm

## Development Notes

### WebSocket Connection

- Connection URL from `NEXT_PUBLIC_WS_URL` environment variable
- Single socket instance shared across room components
- Socket connects on component mount, disconnects on unmount
- All room events flow through `useRoomEvents` → Zustand store → React components

### State Flow

```
User Action → Socket Emit → Server Processing → Socket Event → useRoomEvents → Zustand Store Update → React Re-render
```

### Solo Mode

- Uses `sessionStorage` for persistence (not server-connected)
- Managed by `useSoloRoulette` hook (in [src/features/solo/hooks/useSoloRoulette.ts](src/features/solo/hooks/useSoloRoulette.ts))
- Independent from multiplayer room functionality

### Adding New WebSocket Events

1. Define event payload types in [src/entities/room/model/websocket.types.ts](src/entities/room/model/websocket.types.ts)
2. Add event name constant to `SOCKET_EVENTS`
3. Add handler in [src/entities/room/hooks/useRoomEvents.ts](src/entities/room/hooks/useRoomEvents.ts)
4. Update Zustand store if needed ([src/entities/room/model/room.store.ts](src/entities/room/model/room.store.ts))
5. Emit from components using `socket.emit(SOCKET_EVENTS.EVENT_NAME, payload)`

## Deployment

### Vercel Deployment

This project is configured for deployment on Vercel via the `deploy` branch.

**Key Files:**

- `vercel.json` - Vercel configuration (build commands, regions, headers)
- `.env.example` - Environment variables guide (includes production reference)

**Deployment Setup:**

1. **Connect GitHub Repository** to Vercel
2. **Select `deploy` branch** for production deployments
3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL`: Your production API server URL
   - `NEXT_PUBLIC_WS_URL`: Your production WebSocket server URL
   - `NEXT_PUBLIC_FRONTEND_URL`: Your Vercel app URL (e.g., `https://roulette-together.vercel.app`)
4. **Deploy**

**Build Configuration:**

- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Output Directory: `.next`
- Node.js Version: 20.x
- Region: Seoul (icn1)

**Post-Deployment Checklist:**

- [ ] Test WebSocket connection to backend
- [ ] Verify room creation and joining flow
- [ ] Check QR code and share link generation
- [ ] Confirm real-time participant updates work
