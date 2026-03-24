# Setup Instructions

This guide explains how to set up and run the VedaAI monorepo locally.

## 1. Prerequisites

- Node.js >= 18
- pnpm 9.x
- MongoDB (local or cloud)
- Firebase project (for Google auth token verification)

Optional:
- `act` for local GitHub Actions workflow simulation

## 2. Verify Tooling

```bash
node --version
pnpm --version
```

Expected:
- Node version should be `18+`
- pnpm should be `9.x`

## 3. Install Dependencies

From repo root:

```bash
pnpm install
```

This installs dependencies for all apps and packages in the workspace.

## 4. Configure Environment Variables

Create environment files.

### Backend: `apps/api/.env`

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=change-me
MONGODB_URI=mongodb://localhost:27017/vedaai
AUTH_COOKIE_DOMAIN=

# Firebase Admin
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# LLM
LLM_API_KEY=your-llm-api-key
LLM_MODEL=gpt-4o-mini
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_TIMEOUT_MS=20000

# School admin APIs
ADMIN_API_KEY=dev-admin-key
```

Notes:
- `MONGODB_URI` is required or API startup fails.
- `FIREBASE_PRIVATE_KEY` must preserve escaped newlines (`\n`) when stored in `.env`.
- `LLM_API_KEY` is required for assignment generation.
- Set `AUTH_COOKIE_DOMAIN` in production when API and web use different subdomains (example: `.example.com`).

### Frontend: `apps/web/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000

# Firebase client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

Notes:
- `NEXT_PUBLIC_API_BASE_URL` is used by fetch clients.
- `NEXT_PUBLIC_WS_URL` is used by Socket.IO client.

## 5. Run in Development

### Run everything

From repo root:

```bash
pnpm dev
```

### Run individual apps

```bash
pnpm dev --filter=web
pnpm dev --filter=api
```

Default URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

## 6. Build and Validate

```bash
pnpm check-types
pnpm lint
pnpm build
```

## 7. Important Runtime Behavior

- Auth uses secure cookie `vedaai_auth_token` issued by API.
- API CORS allows origin from `WEB_ORIGIN` and credentials.
- Realtime connections require valid auth cookie for Socket.IO handshake.
- Assignment intake calls LLM from backend and stores generated output in MongoDB.

## 8. Troubleshooting

### `Missing MONGODB_URI`
Set `MONGODB_URI` in `apps/api/.env`.

### `Missing FIREBASE_*`
Set all Firebase Admin variables in backend `.env`.

### LLM generation fails
- Verify `LLM_API_KEY`.
- Check `LLM_API_BASE_URL` and network access.

### CORS or cookie auth issues
- Ensure `WEB_ORIGIN` matches frontend URL exactly.
- Ensure frontend requests use `credentials: include` (already implemented in stores).

### Realtime socket not connecting
- Ensure backend is running and reachable at `NEXT_PUBLIC_WS_URL`.
- Confirm auth cookie exists; socket auth depends on it.

## 9. Recommended Development Flow

1. Start MongoDB.
2. Configure backend and frontend env files.
3. Run `pnpm install`.
4. Start API and web with `pnpm dev`.
5. Validate with `pnpm check-types` before committing.
