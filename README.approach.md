# Engineering Approach

This document explains how the codebase is approached, why specific patterns are used, and how to extend the system safely.

## 1. Core Principles

1. Contract-first development
- Define and reuse schemas in `packages/shared`.
- Validate at API boundaries and parse responses in frontend.

2. Strong typing end-to-end
- Infer TypeScript types from Zod schemas whenever possible.
- Avoid `any`; preserve explicit domain models.

3. Separation of responsibilities
- Controllers: HTTP parsing + status codes.
- Services: business logic and integrations.
- Models: persistence layer.
- Stores/hooks: frontend state and orchestration.

4. Incremental delivery
- Ship vertical slices (schema -> API -> store -> UI).
- Keep working software at each step.

## 2. Backend Implementation Strategy

### Request lifecycle

1. Validate request data using shared schema.
2. Resolve authenticated user from cookie token.
3. Execute service logic.
4. Persist data.
5. Emit realtime event if relevant.
6. Return schema-consistent response.

### Error handling approach

- Differentiate user errors (`400/401/403/404`) from server errors (`500`).
- Return concise error messages to frontend.
- Keep logs on server for debugging context.

### Realtime consistency

- Emit validated event payloads only.
- Use school/user room targeting to minimize noisy broadcasts.
- Make handlers idempotent in frontend stores when possible.

## 3. Frontend Implementation Strategy

### State management pattern

- One store per domain concern.
- Use selectors in hooks to avoid broad re-renders.
- Keep side-effectful async actions inside stores.

### API interaction pattern

- Use centralized URL helpers (`getApiUrl`, `getWsBaseUrl`).
- Always use credentialed requests for auth-protected endpoints.
- Parse API responses with shared Zod schemas before state updates.

### UX strategy

- Prefer clear loading states and explicit errors.
- Reflect backend changes in real-time where events are available.
- Keep optimistic updates conservative unless event guarantees are strong.

## 4. Assignment Generation Approach

### Current behavior

- Assignment intake performs LLM generation during request handling.
- Generation service normalizes varied model output formats.
- Invalid/unexpected LLM outputs are rejected early.

### Why this approach works now

- Simpler initial integration.
- Fast iteration on prompt and parsing quality.
- Fewer moving parts while product behavior stabilizes.

### Planned evolution

- Move LLM generation to asynchronous workers.
- Track assignment status transitions explicitly.
- Add retries/backoff and richer progress events.

## 5. How to Add Features Safely

Recommended sequence:

1. Add/extend schema in `packages/shared`.
2. Update backend controller/service to use schema.
3. Add/update frontend store action.
4. Update UI components and route pages.
5. Wire realtime events if cross-user updates matter.
6. Run `pnpm check-types` and `pnpm lint`.

## 6. Quality Gates

Before merge:

- `pnpm check-types` passes across workspace.
- `pnpm lint` passes with zero warnings.
- Changed endpoints and payloads still align with shared schemas.
- Realtime handlers remain backward compatible for active clients.

## 7. Trade-offs to Keep in Mind

- Synchronous generation simplifies control flow but impacts request latency.
- Cookie-based auth improves browser ergonomics but requires strict CORS/origin setup.
- Store-centric async logic reduces component complexity but requires disciplined state boundaries.

## 8. Collaboration and Code Review Checklist

Use this quick checklist during reviews:

- Is data shape defined in `packages/shared` first?
- Is input validated before persistence/integrations?
- Are errors mapped to the right HTTP codes?
- Are realtime events emitted with validated payloads?
- Are frontend selectors narrow and stable?
- Is env/config impact documented?
