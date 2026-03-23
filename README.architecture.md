# Architecture Overview

This document describes the current implemented architecture of the VedaAI monorepo.

## 1. System Topology

```text
Next.js Web App (apps/web)
  |
  | HTTP (fetch with credentials)
  v
Express API (apps/api)
  |
  | Mongoose
  v
MongoDB

Next.js Web App (apps/web)
  |
  | Socket.IO client (cookie-authenticated)
  v
Socket.IO Server (initialized inside apps/api HTTP server)
```

## 2. Monorepo Structure

```text
apps/
  web/   -> UI, routes, Zustand stores, hooks, API/realtime clients
  api/   -> routes, controllers, services, models, realtime server
  docs/  -> docs site scaffold
packages/
  shared/            -> Zod schemas and shared API contracts
  ui/                -> shared React components
  eslint-config/     -> lint presets
  typescript-config/ -> shared TypeScript configs
```

## 3. Backend Architecture (apps/api)

### 3.1 Entry and Boot

- `src/server.ts`
  - Connects MongoDB via `connectToDatabase()`.
  - Creates HTTP server from Express app.
  - Initializes Socket.IO via `initializeRealtimeServer()`.
- `src/app.ts`
  - Applies CORS and JSON middleware.
  - Registers route modules.

### 3.2 Route Modules

- `/health` -> health checks
- `/auth` -> register/login/google/logout/me
- `/assignments` -> create/list/get/delete assignment records
- `/notifications` -> list/read/delete/clear notifications
- `/schools` -> list/get/create schools

### 3.3 Auth Model

- Cookie-based auth token (`vedaai_auth_token`).
- Most protected handlers call a local `requireAuthenticatedUser` helper.
- Token verification path:
  - parse cookie -> verify JWT -> fetch user in MongoDB.

### 3.4 Assignment Generation Path

Current implementation:
1. `POST /assignments/intake` validates payload with shared Zod schema.
2. Controller calls `generateAssignmentFromLlm(payload)`.
3. LLM output is parsed/normalized/validated in service.
4. Assignment document is persisted with `generatedContent`.
5. Realtime event `assignment:created` is emitted to school room.
6. Notification records are created for school users.

Important note:
- Assignment generation is currently synchronous in request lifecycle.
- A queue/worker architecture (BullMQ) is documented in planning docs but not yet wired in this code path.

### 3.5 Realtime Architecture

- Socket.IO server initialized with CORS credentials enabled.
- Socket authentication uses auth cookie and JWT verification.
- On connect, socket joins:
  - `school:{schoolId}` room
  - `user:{userId}` room
- Event emitters are centralized in `src/socket/realtime.context.ts`.

Supported event channels:
- Assignment:
  - `assignment:created`
  - `assignment:deleted`
- Notification:
  - `notification:created`
  - `notification:deleted`
  - `notification:read`
  - `notifications:cleared`

### 3.6 Data and Validation

- MongoDB models under `src/models`.
- Shared request/response/event validation via `@repo/shared` Zod schemas.
- Controllers parse and validate before business logic.

## 4. Frontend Architecture (apps/web)

### 4.1 App Layer

- Next.js App Router pages under `src/app`.
- Feature pages include auth flows, assignments, notifications, and admin school views.

### 4.2 State Management

- Zustand stores in `src/store`.
- Hooks in `src/hooks` expose selector-based reads/actions.
- Store split by concern:
  - `auth.store.ts`
  - `assignment.store.ts`
  - `assignments-list.store.ts`
  - `notifications.store.ts`
  - `schools.store.ts`

### 4.3 API Client Strategy

- `src/lib/api-base.ts` builds API and WS base URLs from env.
- Stores call backend with `fetch(..., { credentials: 'include' })`.
- Response payloads are validated with shared Zod schemas.

### 4.4 Realtime Client Strategy

- Singleton Socket.IO client in `src/lib/realtime.ts`.
- Socket connects using `withCredentials: true`.
- Store actions are designed to merge realtime updates into local state.

## 5. Shared Contracts (packages/shared)

- Domain modules:
  - `assignment.ts`
  - `auth.ts`
  - `notification.ts`
  - `schools.ts`
- Contains:
  - request schemas
  - response schemas
  - event payload schemas
  - common TS types inferred from Zod

This creates a single source of truth across web and API boundaries.

## 6. Configuration and Runtime Dependencies

### Backend env highlights

- `MONGODB_URI`, `JWT_SECRET`, `WEB_ORIGIN`
- Firebase Admin keys for Google token verification
- LLM API config (`LLM_API_KEY`, `LLM_MODEL`, `LLM_API_BASE_URL`)

### Frontend env highlights

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_URL`
- Firebase web SDK keys

## 7. Architectural Strengths

- Shared Zod contracts reduce drift between frontend and backend.
- Centralized realtime event emitters provide consistent payload shape.
- Zustand + selectors keeps state modular and explicit.
- Clear separation of controller/service/model concerns in API.

## 8. Current Gaps and Next Architectural Step

- Introduce queue-backed async generation (BullMQ + Redis) for long-running LLM tasks.
- Add explicit assignment statuses (`pending`, `processing`, `completed`, `failed`) in active flow.
- Add retry and observability around generation jobs.
