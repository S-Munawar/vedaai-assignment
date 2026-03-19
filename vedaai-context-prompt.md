# VedaAI – AI Assessment Creator: Full Project Context Prompt

> Paste this at the start of any AI conversation to give the assistant complete context about this project.

---

## 1. What This Project Is

**VedaAI** is a full-stack **AI Assessment Creator** web application. It allows a teacher to:
1. Fill out an assignment creation form (subject, topic, question types, marks, difficulty, optional PDF upload)
2. Submit → trigger an AI-powered question paper generation job in the background
3. Watch real-time progress via WebSocket
4. View a structured, exam-style question paper output
5. (Bonus) Download the paper as a properly formatted PDF

This is a timed engineering assignment (deadline: 21 March, 11:59 PM). The developer is building it **incrementally and deliberately** — not vibe-coding. Every decision should be explained, justified, and correct. The AI assistant's role is to:
- Correct architectural decisions before they become technical debt
- Guide feature implementation step by step
- Review and debug code with full project context
- Enforce consistent conventions and patterns throughout

---

## 2. Tech Stack (Non-Negotiable)

### Frontend
| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| State management | Zustand (preferred over Redux for this scale) |
| Styling | Tailwind CSS |
| Real-time | Native WebSocket API (or `socket.io-client` if backend uses socket.io) |
| PDF export | `@react-pdf/renderer` or `html2pdf.js` (decide before implementing) |
| Forms | React Hook Form + Zod for validation |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js + Express, TypeScript |
| Database | MongoDB (via Mongoose) |
| Cache / job state | Redis |
| Job queue | BullMQ (backed by Redis) |
| Real-time | `socket.io` (server-side) |
| AI | OpenAI GPT-4o or Claude Sonnet (one consistent choice — do not mix) |
| File parsing | `pdf-parse` for PDF uploads |

### Infrastructure
- MongoDB: local or Atlas
- Redis: local or Upstash
- Both frontend and backend deployed (Vercel + Railway / Render / EC2)

---

## 3. Architecture Overview

```
Browser (Next.js)
  │
  ├── POST /api/assignments        → Express API
  │       │
  │       └── BullMQ: enqueue job → Worker (async)
  │                                    │
  │                                    ├── Parse PDF (if uploaded)
  │                                    ├── Build structured prompt
  │                                    ├── Call LLM API
  │                                    ├── Parse & validate LLM response
  │                                    ├── Store result in MongoDB
  │                                    └── Emit WebSocket event → Browser
  │
  └── WebSocket connection         → socket.io server
        (listens for job:progress, job:complete, job:error)
```

**Key principle:** The frontend never directly calls the LLM. All AI generation is done in a BullMQ worker on the backend. The frontend only receives the final structured result.

---

## 4. Data Models

### Assignment (MongoDB)
```typescript
interface Assignment {
  _id: ObjectId;
  title: string;
  subject: string;
  topic: string;
  dueDate: Date;
  questionTypes: Array<'mcq' | 'short-answer' | 'long-answer' | 'true-false'>;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: {
    easy: number;    // percentage
    medium: number;
    hard: number;
  };
  additionalInstructions?: string;
  uploadedFileText?: string; // extracted text from PDF
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;   // BullMQ job ID
  resultId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### QuestionPaper (MongoDB)
```typescript
interface QuestionPaper {
  _id: ObjectId;
  assignmentId: ObjectId;
  sections: Section[];
  metadata: {
    totalMarks: number;
    totalQuestions: number;
    generatedAt: Date;
  };
}

interface Section {
  id: string;          // "A", "B", "C"
  title: string;       // e.g., "Section A – Multiple Choice"
  instruction: string; // e.g., "Attempt all questions. Each carries 1 mark."
  questions: Question[];
}

interface Question {
  id: number;
  text: string;
  type: 'mcq' | 'short-answer' | 'long-answer' | 'true-false';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[]; // for MCQ only
  answer?: string;    // optional, for teacher's key
}
```

---

## 5. API Contract

### POST `/api/assignments`
Create an assignment and enqueue AI generation job.

**Request body** (multipart/form-data):
```json
{
  "title": "Mid-Term Science Paper",
  "subject": "Physics",
  "topic": "Kinematics",
  "dueDate": "2025-03-25T00:00:00Z",
  "questionTypes": ["mcq", "short-answer"],
  "totalQuestions": 20,
  "totalMarks": 50,
  "difficultyDistribution": { "easy": 40, "medium": 40, "hard": 20 },
  "additionalInstructions": "Focus on real-world examples",
  "file": "<optional PDF binary>"
}
```

**Response 201**:
```json
{
  "assignmentId": "abc123",
  "jobId": "bullmq-job-id-xyz",
  "status": "pending"
}
```

### GET `/api/assignments/:id`
Fetch assignment + its status.

### GET `/api/assignments/:id/result`
Fetch the generated QuestionPaper for a completed assignment.

### POST `/api/assignments/:id/regenerate`
Re-enqueue generation for an existing assignment (clears old result).

---

## 6. WebSocket Events

The frontend connects via socket.io immediately after assignment creation. It joins a room named by `assignmentId`.

### Server → Client events:
```typescript
// Job picked up by worker
socket.emit('job:started', { assignmentId, jobId });

// Progress updates (optional but good UX)
socket.emit('job:progress', { assignmentId, step: 'Parsing PDF...' | 'Calling AI...' | 'Structuring response...' });

// Success
socket.emit('job:complete', { assignmentId, resultId });

// Failure
socket.emit('job:error', { assignmentId, error: 'string message' });
```

### Client behavior:
- On `job:complete` → navigate to `/assignments/:id/result` or fetch result and display in-page
- On `job:error` → show error toast with retry button
- Always disconnect socket cleanly on component unmount

---

## 7. BullMQ Job Design

### Queue name: `question-generation`

### Job data payload:
```typescript
{
  assignmentId: string;
  promptConfig: {
    subject: string;
    topic: string;
    questionTypes: string[];
    totalQuestions: number;
    totalMarks: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
    additionalInstructions?: string;
    fileText?: string;
  }
}
```

### Worker steps (in order):
1. Update assignment `status → 'processing'` in MongoDB
2. Emit `job:started` via socket.io
3. Build the structured LLM prompt (see Section 8)
4. Call LLM API (with retry on rate limit)
5. Parse and validate the JSON response
6. Save `QuestionPaper` document to MongoDB
7. Update assignment `status → 'completed'`, set `resultId`
8. Emit `job:complete` via socket.io
9. On any failure: update status → `'failed'`, emit `job:error`

### Redis usage:
- BullMQ uses Redis internally for job state
- Additionally cache: `questionPaper:{assignmentId}` with TTL 1 hour to avoid re-fetching MongoDB on every result page load

---

## 8. AI Prompt Strategy

**Critical rule:** Never render raw LLM output. Always parse into the `QuestionPaper` schema before storing or displaying.

### Prompt structure (system message):
```
You are an expert exam paper creator. Generate a structured question paper in valid JSON only.
Do not include any text outside the JSON. Do not use markdown code fences.
Follow this exact schema: [paste QuestionPaper schema here]
```

### User message construction:
```
Subject: {subject}
Topic: {topic}
Total Questions: {totalQuestions}
Total Marks: {totalMarks}
Question Types: {questionTypes.join(', ')}
Difficulty: {easy}% easy, {medium}% medium, {hard}% hard
Additional Instructions: {additionalInstructions}
Reference Material: {fileText if provided}

Group questions into logical sections (A, B, C...) by question type.
Each section must have a title, instruction, and list of questions.
Every question must include: id, text, type, difficulty, marks{, options if MCQ}.
Marks per question must sum to exactly {totalMarks}.
```

### Response parsing:
```typescript
// Safely parse LLM output
function parseLLMResponse(raw: string): QuestionPaper {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  // Validate against Zod schema before returning
  return QuestionPaperSchema.parse(parsed);
}
```

---

## 9. Frontend Page Structure

```
app/
├── page.tsx                        # Landing / redirect to /create
├── assignments/
│   ├── create/
│   │   └── page.tsx                # Assignment creation form
│   └── [id]/
│       ├── page.tsx                # Status page (WebSocket listener, progress)
│       └── result/
│           └── page.tsx            # Question paper output
```

### Zustand store shape:
```typescript
interface AssignmentStore {
  // Form state
  formData: AssignmentFormData;
  setFormData: (data: Partial<AssignmentFormData>) => void;
  resetForm: () => void;

  // Submission state
  currentAssignmentId: string | null;
  jobStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  progressMessage: string;
  setJobStatus: (status: JobStatus, message?: string) => void;

  // Result
  questionPaper: QuestionPaper | null;
  setQuestionPaper: (paper: QuestionPaper) => void;
}
```

---

## 10. Output Page Requirements

The result page must look like a **real exam paper**, not a data dump.

### Layout:
```
┌─────────────────────────────────────────────────┐
│  [School/Institution Name]          [Logo area] │
│  Subject: Physics    Date: ___   Time: ___      │
│  Max Marks: 50       Topic: Kinematics          │
├─────────────────────────────────────────────────┤
│  Name: ________________  Roll No: _____________  │
│  Section: _____________                         │
├─────────────────────────────────────────────────┤
│  SECTION A – Multiple Choice Questions          │
│  Instruction: Attempt all. Each carries 1 mark. │
│                                                 │
│  1. [Question text]              [Easy] [1M]   │
│     (a) Option 1  (b) Option 2                  │
│     (c) Option 3  (d) Option 4                  │
│                                                 │
│  2. [Question text]            [Medium] [1M]   │
│     ...                                         │
├─────────────────────────────────────────────────┤
│  SECTION B – Short Answer Questions             │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

### Difficulty badge colors:
- Easy → green badge
- Medium → amber/yellow badge
- Hard → red badge

### Action bar (sticky top or bottom):
- `[Download PDF]` `[Regenerate]` `[Back to assignments]`

---

## 11. Validation Rules

### Frontend (Zod + React Hook Form):
- Title, subject, topic: required, non-empty strings
- Due date: required, must be in the future
- Question types: at least one selected
- Total questions: integer, min 1, max 100
- Total marks: integer, min 1
- Difficulty distribution: easy + medium + hard = 100%
- File: optional, PDF only, max 5MB

### Backend:
- Re-validate all inputs on the API layer (never trust frontend alone)
- If file is present, extract text — if extraction yields < 50 chars, reject with clear error

---

## 12. Error Handling Patterns

- All API routes return `{ success: boolean, data?: any, error?: string }`
- BullMQ jobs: use `job.moveToFailed()` with meaningful reason stored in MongoDB
- Frontend: toast notifications for all error states; never silent failures
- WebSocket disconnections: frontend auto-reconnects with exponential backoff (max 5 attempts)

---

## 13. What to Avoid (Strictly)

- **Never render raw LLM response** — always parse → validate → store → render from schema
- **No synchronous AI calls** in the Express route handler — always use BullMQ
- **No prop drilling** — use Zustand for any state shared across more than 2 components
- **No `any` types** in TypeScript — define all interfaces explicitly
- **No hardcoded API keys** — use `.env` with `process.env` validation at startup (`zod` + `dotenv`)
- **No single-block text output** on the result page — always structured sections/questions
- **No layout shifts** on the result page — skeleton loading states while fetching

---

## 14. Environment Variables

### Backend `.env`:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...          # or ANTHROPIC_API_KEY
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 15. Project Folder Structure

```
vedaai/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── assignment/         # Form components
│   │   │   ├── paper/              # Question paper display
│   │   │   └── ui/                 # Shared UI (badges, buttons, etc.)
│   │   ├── store/                  # Zustand stores
│   │   ├── hooks/                  # useWebSocket, useAssignment, etc.
│   │   ├── lib/                    # API client, validators
│   │   └── types/                  # Shared TypeScript interfaces
│   │
│   └── api/                        # Express backend
│       ├── src/
│       │   ├── routes/             # Express routers
│       │   ├── controllers/        # Route handlers
│       │   ├── services/           # Business logic (AI, PDF, etc.)
│       │   ├── workers/            # BullMQ workers
│       │   ├── queues/             # BullMQ queue definitions
│       │   ├── models/             # Mongoose schemas
│       │   ├── socket/             # socket.io setup & event emitters
│       │   ├── lib/                # Redis client, DB connection
│       │   └── types/              # Shared TypeScript interfaces
│       └── tsconfig.json
│
├── packages/
│   └── types/                      # Shared types between web & api (optional monorepo)
│
├── docker-compose.yml              # MongoDB + Redis for local dev
├── README.md
└── package.json                    # Monorepo root (turborepo or npm workspaces)
```

---

## 16. Development Order (Recommended)

Build in this sequence to avoid rework:

1. **Shared types** — Define all TypeScript interfaces (`Assignment`, `QuestionPaper`, `Question`, etc.) first. Everything depends on these.
2. **Backend scaffolding** — Express server, MongoDB connection, Redis connection, health check route.
3. **MongoDB models** — Mongoose schemas matching the interfaces above.
4. **BullMQ queue + worker** — Wire up the queue, write the worker stub (no AI yet), test with a dummy job.
5. **AI service** — Prompt builder + LLM caller + response parser. Test in isolation.
6. **WebSocket setup** — socket.io server, room joining, event emitters from worker.
7. **API routes** — POST `/assignments`, GET `/assignments/:id`, GET `/assignments/:id/result`.
8. **Frontend: Zustand store** — Define the store before building any components.
9. **Frontend: Assignment creation form** — With full validation.
10. **Frontend: Status/progress page** — WebSocket listener, progress UI.
11. **Frontend: Result/output page** — Question paper display, difficulty badges, student info fields.
12. **Bonus: PDF export** — Add last, after core is stable.

---

## 17. How to Use This Prompt

When starting a new AI conversation for this project:
1. Paste this entire document as your first message (or attach it as context)
2. Then describe exactly what you're building in that session (e.g., "I'm now implementing step 4 — the BullMQ worker")
3. Share relevant existing code snippets so the AI can maintain consistency
4. Ask the AI to flag any deviation from the architecture described here before suggesting code

The AI should **correct you** if you propose something that conflicts with this spec — don't just go along with whatever you suggest.
