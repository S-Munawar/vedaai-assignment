# VedaAI Assignment

VedaAI is a full-stack monorepo for creating and managing AI-assisted school assignments.

Core apps:
- `apps/web`: Next.js frontend for teachers/admins.
- `apps/api`: Express + MongoDB backend with auth, assignment generation, notifications, and realtime updates.
- `apps/docs`: docs app (currently scaffolded).

Shared packages:
- `packages/shared`: Zod schemas + shared types/contracts.
- `packages/ui`: shared UI components.
- `packages/eslint-config`: lint rules.
- `packages/typescript-config`: shared TS configs.

## Documentation Hub

- Setup instructions: [README.setup.md](README.setup.md)
- Architecture overview: [README.architecture.md](README.architecture.md)
- Engineering approach: [README.approach.md](README.approach.md)

## Quick Start

```bash
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:3000` and API on `http://localhost:4000` (with default configuration).

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

## Monorepo Layout

```text
apps/
	api/
	web/
	docs/
packages/
	shared/
	ui/
	eslint-config/
	typescript-config/
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, socket.io-client
- Backend: Express 5, TypeScript, Mongoose, Firebase Admin, Socket.IO
- Shared validation: Zod via `@repo/shared`
- Build orchestration: Turborepo
- Package manager: pnpm 9

## Notes

- Node.js `>=18` is required.
- `pnpm-workspace.yaml` and `turbo.json` control workspace task execution.
- Shared contracts in `packages/shared` are consumed by both frontend and backend.
