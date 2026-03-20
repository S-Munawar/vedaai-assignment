import {
  assignmentGeneratedDraftSchema,
  type AssignmentGeneratedContent,
  type AssignmentGeneratedDraft,
  type AssignmentIntakeRequest,
} from '@repo/shared/assignment';
import { env } from '@/config/env';

type OpenAICompatibleResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      reasoning_content?: string;
    };
    text?: string;
  }>;
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
  response?: string;
  output_text?: string;
  error?: {
    message?: string;
  };
};

type RawAssignmentGeneratedDraft = {
  title: string;
  overview: string;
  questions: Array<{
    id: number;
    type: string;
    marks: number;
    prompt: string;
  }>;
  answerKey: Array<{
    questionId: number;
    answer: string;
  }>;
};

const MISSING_ANSWER_PREFIX = '__MISSING_ANSWER__';

function toInteger(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Number.NaN;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : Number.NaN;
  }

  return Number.NaN;
}

function extractObjectString(value: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

function extractAnswerRows(draft: Record<string, unknown>) {
  const arrayCandidates = [
    draft.answerKey,
    draft.answers,
    draft.answer_key,
    draft.solutions,
  ];

  const arrayRows = arrayCandidates.find((candidate) => Array.isArray(candidate));
  if (Array.isArray(arrayRows)) {
    return arrayRows;
  }

  const mapCandidates = [draft.answers, draft.answerKey, draft.answer_key, draft.solutions];
  const answerMap = mapCandidates.find(
    (candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate),
  ) as Record<string, unknown> | undefined;

  if (!answerMap) {
    return [] as unknown[];
  }

  return Object.entries(answerMap).map(([questionId, answer]) => ({ questionId, answer }));
}

function extractQuestionRows(draft: Record<string, unknown>): Array<Record<string, unknown>> {
  const directCandidates = [draft.questions, draft.questionList, draft.items, draft.question_set];
  const directArray = directCandidates.find((candidate) => Array.isArray(candidate));

  if (Array.isArray(directArray)) {
    return directArray.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    );
  }

  const nestedDraftCandidates = [draft.assignment, draft.paper, draft.result, draft.data];
  for (const nestedCandidate of nestedDraftCandidates) {
    if (!nestedCandidate || typeof nestedCandidate !== 'object' || Array.isArray(nestedCandidate)) {
      continue;
    }

    const nestedDraft = nestedCandidate as Record<string, unknown>;
    const nestedRows = extractQuestionRows(nestedDraft);
    if (nestedRows.length > 0) {
      return nestedRows;
    }
  }

  const sections = Array.isArray(draft.sections) ? draft.sections : [];
  const flattened: Array<Record<string, unknown>> = [];

  for (const section of sections) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      continue;
    }

    const sectionRow = section as Record<string, unknown>;
    const sectionType = extractObjectString(sectionRow, ['type', 'name', 'title', 'section']);
    const sectionQuestions = Array.isArray(sectionRow.questions)
      ? sectionRow.questions
      : Array.isArray(sectionRow.items)
        ? sectionRow.items
        : [];

    for (const question of sectionQuestions) {
      if (typeof question === 'string' && question.trim()) {
        flattened.push({
          prompt: question.trim(),
          questionType: sectionType || 'Question',
          type: sectionType || 'Question',
        });
        continue;
      }

      if (!question || typeof question !== 'object' || Array.isArray(question)) {
        continue;
      }

      const questionRow = question as Record<string, unknown>;
      flattened.push({
        ...questionRow,
        questionType: questionRow.questionType ?? sectionType,
        type: questionRow.type ?? sectionType,
      });
    }
  }

  if (flattened.length > 0) {
    return flattened;
  }

  // Final fallback: discover any arrays in the payload that look like question collections.
  for (const [key, value] of Object.entries(draft)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const keyType = key.replace(/[_-]/g, ' ').trim();
    const rows: Array<Record<string, unknown>> = [];

    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        rows.push({
          prompt: item.trim(),
          questionType: keyType || 'Question',
          type: keyType || 'Question',
        });
        continue;
      }

      if (item && typeof item === 'object' && !Array.isArray(item)) {
        rows.push(item as Record<string, unknown>);
      }
    }

    if (rows.length > 0) {
      return rows;
    }
  }

  return flattened;
}

function parseRawDraft(input: unknown): RawAssignmentGeneratedDraft {
  if (!input || typeof input !== 'object') {
    throw new Error('LLM draft must be an object');
  }

  const draft = input as Record<string, unknown>;
  const title = extractObjectString(draft, ['title', 'assignmentTitle', 'name']);
  const overview = typeof draft.overview === 'string' ? draft.overview : '';

  if (!title) {
    throw new Error('LLM draft missing title');
  }

  const rawQuestions = extractQuestionRows(draft);

  if (rawQuestions.length === 0) {
    throw new Error('LLM draft missing questions');
  }

  const questions = rawQuestions.map((question, index) => {
    if (!question || typeof question !== 'object') {
      throw new Error(`Invalid question at index ${index}`);
    }

    const row = question as Record<string, unknown>;
    const rawId = toInteger(row.id ?? row.questionId ?? row.qid ?? row.number ?? row.no);
    const id = Number.isFinite(rawId) && rawId > 0 ? rawId : index + 1;
    const type =
      extractObjectString(row, ['type', 'questionType', 'sectionType', 'category']) || 'Question';
    const rawMarks = toInteger(row.marks ?? row.mark ?? row.points ?? row.score);
    const marks = Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1;
    const prompt = extractObjectString(row, ['prompt', 'question', 'text', 'questionText']);

    if (!prompt) {
      throw new Error(`Invalid question prompt at index ${index}`);
    }

    return { id, type, marks, prompt };
  });

  const rawAnswerRows = extractAnswerRows(draft);

  const parsedAnswerKey = rawAnswerRows.map((answerRow, index) => {
    if (!answerRow || typeof answerRow !== 'object') {
      throw new Error(`Invalid answer at index ${index}`);
    }

    const row = answerRow as Record<string, unknown>;
    const questionId = toInteger(row.questionId ?? row.id ?? row.qid ?? row.question);
    const answer = extractObjectString(row, [
      'answer',
      'solution',
      'expectedAnswer',
      'correctAnswer',
      'text',
    ]);

    if (!Number.isFinite(questionId) || questionId <= 0 || !Number.isInteger(questionId)) {
      throw new Error(`Invalid answer questionId at index ${index}`);
    }

    if (!answer) {
      throw new Error(`Invalid answer text at index ${index}`);
    }

    return { questionId, answer };
  });

  // Some models attach answer text directly on each question row.
  const fallbackAnswerKey = questions
    .map((question, index) => {
      const row = rawQuestions[index];
      const answerText =
        (typeof row.answer === 'string' ? row.answer : '') ||
        (typeof row.expectedAnswer === 'string' ? row.expectedAnswer : '') ||
        (typeof row.solution === 'string' ? row.solution : '') ||
        (typeof row.correctAnswer === 'string' ? row.correctAnswer : '');

      const trimmed = answerText.trim();
      if (!trimmed) {
        return null;
      }

      return {
        questionId: question.id,
        answer: trimmed,
      };
    })
    .filter((item): item is { questionId: number; answer: string } => item !== null);

  const answerKey = parsedAnswerKey.length > 0 ? parsedAnswerKey : fallbackAnswerKey;

  if (answerKey.length === 0) {
    throw new Error('LLM draft missing answerKey');
  }

  return {
    title,
    overview,
    questions,
    answerKey,
  };
}

function getLlmRequestPayload(
  input: AssignmentIntakeRequest,
  options?: { useJsonResponseFormat?: boolean; maxTokens?: number },
) {
  const useJsonResponseFormat = options?.useJsonResponseFormat ?? true;
  const maxTokens = options?.maxTokens ?? 1800;

  return {
    model: env.llmModel,
    temperature: 0.2,
    max_tokens: maxTokens,
    ...(useJsonResponseFormat ? { response_format: { type: 'json_object' as const } } : {}),
    messages: [
      {
        role: 'system',
        content:
          'You are an expert school assessment generator. Return only strict JSON that matches the user-provided schema hints and constraints.',
      },
      {
        role: 'user',
        content: JSON.stringify(buildPrompt(input)),
      },
    ],
  };
}

function getNetworkErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown network error';
  }

  const errorWithCause = error as Error & { cause?: { code?: string; message?: string } };
  const code = errorWithCause.cause?.code;
  const causeMessage = errorWithCause.cause?.message;

  if (code) {
    return causeMessage ? `${code}: ${causeMessage}` : code;
  }

  return error.message;
}

function normalizeMessageContent(
  value: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((item) => (typeof item?.text === 'string' ? item.text.trim() : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

function extractLlmContent(payload: OpenAICompatibleResponse): string {
  const choice = payload.choices?.[0];
  const fromChoiceMessage = normalizeMessageContent(choice?.message?.content);
  if (fromChoiceMessage) {
    return fromChoiceMessage;
  }

  if (typeof choice?.text === 'string' && choice.text.trim()) {
    return choice.text.trim();
  }

  if (typeof choice?.message?.reasoning_content === 'string' && choice.message.reasoning_content.trim()) {
    return choice.message.reasoning_content.trim();
  }

  const fromRootMessage = normalizeMessageContent(payload.message?.content);
  if (fromRootMessage) {
    return fromRootMessage;
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (typeof payload.response === 'string' && payload.response.trim()) {
    return payload.response.trim();
  }

  return '';
}

async function fetchLlmResponse(input: AssignmentIntakeRequest, signal: AbortSignal) {
  const endpoint = `${env.llmApiBaseUrl}/chat/completions`;
  const payload = JSON.stringify(getLlmRequestPayload(input, { useJsonResponseFormat: true }));

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.llmApiKey}`,
    },
    body: payload,
    signal,
  };

  try {
    return await fetch(endpoint, requestInit);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    // Node may resolve localhost to ::1 while Ollama listens on 127.0.0.1 only.
    const fallbackEndpoint = endpoint.replace('://localhost', '://127.0.0.1');
    if (fallbackEndpoint !== endpoint) {
      return await fetch(fallbackEndpoint, requestInit);
    }

    throw error;
  }
}

async function fetchLlmResponseWithOptions(
  input: AssignmentIntakeRequest,
  signal: AbortSignal,
  options?: { useJsonResponseFormat?: boolean; maxTokens?: number },
) {
  const endpoint = `${env.llmApiBaseUrl}/chat/completions`;
  const payload = JSON.stringify(getLlmRequestPayload(input, options));

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.llmApiKey}`,
    },
    body: payload,
    signal,
  };

  try {
    return await fetch(endpoint, requestInit);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    const fallbackEndpoint = endpoint.replace('://localhost', '://127.0.0.1');
    if (fallbackEndpoint !== endpoint) {
      return await fetch(fallbackEndpoint, requestInit);
    }

    throw error;
  }
}

function buildPrompt(input: AssignmentIntakeRequest) {
  return {
    task: 'Generate a school assignment in JSON with exact constraints.',
    language: 'English',
    input: {
      classLevel: input.classLevel,
      subject: input.subject,
      chapterName: input.chapterName,
      dueDate: input.dueDate,
      additionalInfo: input.additionalInfo,
      totals: input.totals,
      questionTypes: input.questionTypes,
    },
    rules: [
      'Return valid JSON only. No markdown or extra text.',
      'questions array length must equal totals.totalQuestions.',
      'Sum of question marks must equal totals.totalMarks.',
      'Use only allowed question types from input.questionTypes.',
      'Each generated question must include: id, type, marks, prompt.',
      'id values must start from 1 and increment by 1.',
      'Questions with the same type should be sequential (group by type).',
      'answerKey should include concise answers using questionId, in the same order as questions.',
      'title should be clear and exam-ready.',
    ],
    formatHint: 'The formatted assignment will have: (1) Metadata at top (title, chapter, due date, marks), (2) Sections grouped by question type (Section A, B, C for different types), (3) Answer key at end in the same order as questions.',
    outputSchemaHint: {
      title: 'string',
      overview: 'string',
      questions: [{ id: 'number', type: 'string', marks: 'number', prompt: 'string' }],
      answerKey: [{ questionId: 'number', answer: 'string' }],
    },
  };
}

function parseLlmPayload(bodyText: string) {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return { payload: null as OpenAICompatibleResponse | null, rawContent: '' };
  }

  try {
    const payload = JSON.parse(trimmed) as OpenAICompatibleResponse;
    return {
      payload,
      rawContent: '',
    };
  } catch {
    // Some providers may return plain text even on /chat/completions.
    return {
      payload: null as OpenAICompatibleResponse | null,
      rawContent: trimmed,
    };
  }
}

function getFinishReason(payload: OpenAICompatibleResponse | null): string {
  const reason = payload?.choices?.[0]?.finish_reason;
  return typeof reason === 'string' ? reason.trim().toLowerCase() : '';
}

function computeMaxTokens(input: AssignmentIntakeRequest): number {
  const questionBudget = input.totals.totalQuestions * 160;
  const answerBudget = input.totals.totalQuestions * 90;
  const overhead = 700;
  const computed = questionBudget + answerBudget + overhead;

  return Math.max(1800, Math.min(6000, computed));
}

function validateAgainstInput(input: AssignmentIntakeRequest, draft: AssignmentGeneratedDraft) {
  const totalQuestions = draft.questions.length;
  const totalMarks = draft.questions.reduce((sum, question) => sum + question.marks, 0);

  if (totalQuestions !== input.totals.totalQuestions) {
    throw new Error('LLM output has invalid totalQuestions');
  }

  if (totalMarks !== input.totals.totalMarks) {
    throw new Error('LLM output has invalid totalMarks');
  }

  for (const row of input.questionTypes) {
    const matchingQuestions = draft.questions.filter((question) => question.type === row.type);

    if (matchingQuestions.length !== row.questions) {
      throw new Error(`LLM output has invalid question count for type: ${row.type}`);
    }

    if (matchingQuestions.some((question) => question.marks !== row.marks)) {
      throw new Error(`LLM output has invalid marks for type: ${row.type}`);
    }
  }
}

function buildExpectedQuestions(input: AssignmentIntakeRequest) {
  const expected: Array<{
    id: number;
    type: AssignmentGeneratedDraft['questions'][number]['type'];
    marks: number;
  }> = [];
  let questionId = 1;

  for (const row of input.questionTypes) {
    for (let i = 0; i < row.questions; i++) {
      expected.push({
        id: questionId,
        type: row.type,
        marks: row.marks,
      });
      questionId += 1;
    }
  }

  return expected;
}

function buildMissingQuestionPrompt(
  input: AssignmentIntakeRequest,
  questionType: AssignmentGeneratedDraft['questions'][number]['type'],
  questionId: number,
) {
  return `Create a ${questionType} question from chapter "${input.chapterName}" for class ${input.classLevel}. (Q${questionId})`;
}

function buildMissingAnswer(
  _input: AssignmentIntakeRequest,
  _questionType: AssignmentGeneratedDraft['questions'][number]['type'],
  questionId: number,
) {
  return `${MISSING_ANSWER_PREFIX}:${questionId}`;
}

function isMissingAnswer(answer: string) {
  return answer.startsWith(MISSING_ANSWER_PREFIX);
}

function getMissingAnswersPrompt(
  input: AssignmentIntakeRequest,
  missingQuestions: AssignmentGeneratedDraft['questions'],
) {
  return {
    task: 'Provide concise answer key entries for missing assignment questions.',
    language: 'English',
    input: {
      classLevel: input.classLevel,
      subject: input.subject,
      chapterName: input.chapterName,
      additionalInfo: input.additionalInfo,
      missingQuestions: missingQuestions.map((question) => ({
        id: question.id,
        type: question.type,
        marks: question.marks,
        prompt: question.prompt,
      })),
    },
    rules: [
      'Return valid JSON only.',
      'Do not include markdown.',
      'Return only the missing answers.',
      'Each answer should be concise and exam-appropriate.',
    ],
    outputSchemaHint: {
      answers: [{ questionId: 'number', answer: 'string' }],
    },
  };
}

function parseMissingAnswers(content: string) {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return new Map<number, string>();
    }

    const root = parsed as Record<string, unknown>;
    const candidates = [root.answers, root.answerKey, root.answer_key];
    const answerRows = candidates.find((value) => Array.isArray(value));
    if (Array.isArray(answerRows)) {
      const mapped = answerRows
        .map((row) => {
          if (!row || typeof row !== 'object') {
            return null;
          }

          const record = row as Record<string, unknown>;
          const questionId = toInteger(record.questionId ?? record.id ?? record.qid ?? record.question);
          const answer = extractObjectString(record, ['answer', 'solution', 'text', 'expectedAnswer']);
          if (!Number.isFinite(questionId) || !answer) {
            return null;
          }

          return [questionId, answer] as const;
        })
        .filter((entry): entry is readonly [number, string] => entry !== null);

      return new Map<number, string>(mapped);
    }

    const answerMapCandidate = [root.answers, root.answerKey, root.answer_key].find(
      (value) => value && typeof value === 'object' && !Array.isArray(value),
    ) as Record<string, unknown> | undefined;

    if (answerMapCandidate) {
      return new Map<number, string>(
        Object.entries(answerMapCandidate)
          .map(([key, value]) => {
            const id = toInteger(key);
            const answer = typeof value === 'string' ? value.trim() : '';
            if (!Number.isFinite(id) || !answer) {
              return null;
            }
            return [id, answer] as const;
          })
          .filter((entry): entry is readonly [number, string] => entry !== null),
      );
    }
  } catch {
    // Fall through to regex parse.
  }

  // Fallback for text responses such as: Q6: ...
  const map = new Map<number, string>();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*Q?(\d+)\s*[:.-]\s*(.+)$/i);
    if (!match) {
      continue;
    }

    const id = toInteger(match[1]);
    const answer = match[2]?.trim() || '';
    if (Number.isFinite(id) && answer) {
      map.set(id, answer);
    }
  }

  return map;
}

async function fillMissingAnswersWithLlm(
  input: AssignmentIntakeRequest,
  draft: AssignmentGeneratedDraft,
  signal: AbortSignal,
) {
  const missingQuestions = draft.questions.filter((question) => {
    const currentAnswer = draft.answerKey.find((answer) => answer.questionId === question.id)?.answer || '';
    return isMissingAnswer(currentAnswer);
  });

  if (missingQuestions.length === 0) {
    return draft;
  }

  const payload = {
    model: env.llmModel,
    temperature: 0.1,
    max_tokens: Math.min(2500, Math.max(700, missingQuestions.length * 180)),
    response_format: { type: 'json_object' as const },
    messages: [
      {
        role: 'system',
        content: 'You are an expert teacher. Return only JSON with concise answer key entries.',
      },
      {
        role: 'user',
        content: JSON.stringify(getMissingAnswersPrompt(input, missingQuestions)),
      },
    ],
  };

  const endpoint = `${env.llmApiBaseUrl}/chat/completions`;
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.llmApiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  };

  let response: Response;
  try {
    response = await fetch(endpoint, requestInit);
  } catch {
    return {
      ...draft,
      answerKey: draft.answerKey.map((answer) =>
        isMissingAnswer(answer.answer)
          ? {
              ...answer,
              answer: 'Answer not available.',
            }
          : answer,
      ),
    };
  }

  if (!response.ok) {
    return {
      ...draft,
      answerKey: draft.answerKey.map((answer) =>
        isMissingAnswer(answer.answer)
          ? {
              ...answer,
              answer: 'Answer not available.',
            }
          : answer,
      ),
    };
  }

  const bodyText = await response.text();
  const parsed = parseLlmPayload(bodyText);
  const content = parsed.payload ? extractLlmContent(parsed.payload) : parsed.rawContent;
  const answers = content ? parseMissingAnswers(content) : new Map<number, string>();

  return {
    ...draft,
    answerKey: draft.answerKey.map((answer) => {
      if (!isMissingAnswer(answer.answer)) {
        return answer;
      }

      const filled = answers.get(answer.questionId)?.trim() || '';
      return {
        ...answer,
        answer: filled || 'Answer not available.',
      };
    }),
  };
}

function normalizeDraftAgainstInput(
  input: AssignmentIntakeRequest,
  draft: RawAssignmentGeneratedDraft,
): AssignmentGeneratedDraft {
  const expectedQuestions = buildExpectedQuestions(input);
  const llmQuestions = [...draft.questions].sort((a, b) => a.id - b.id);

  // Keep LLM-authored prompts, but enforce app-required ids/types/marks blueprint.
  const normalizedQuestions = expectedQuestions.map((expected, index) => {
    const llmPrompt = llmQuestions[index]?.prompt?.trim() || '';
    const prompt = llmPrompt || buildMissingQuestionPrompt(input, expected.type, expected.id);

    return {
      id: expected.id,
      type: expected.type,
      marks: expected.marks,
      prompt,
    };
  });

  const answerByQuestionId = new Map(
    draft.answerKey.map((item: RawAssignmentGeneratedDraft['answerKey'][number]) => [
      item.questionId,
      item.answer?.trim() || '',
    ]),
  );

  // Prefer exact id match; fall back to sequential answer ordering if ids are off.
  const normalizedAnswerKey = normalizedQuestions.map((question, index) => {
    const exactAnswer = answerByQuestionId.get(question.id) || '';
    const sequentialAnswer = draft.answerKey[index]?.answer?.trim() || '';
    const answer =
      (exactAnswer || sequentialAnswer).trim() ||
      buildMissingAnswer(input, question.type, question.id);

    return {
      questionId: question.id,
      answer,
    };
  });

  return {
    ...draft,
    questions: normalizedQuestions,
    answerKey: normalizedAnswerKey,
  };
}

function formatGeneratedBody(input: AssignmentIntakeRequest, draft: AssignmentGeneratedDraft) {
  const lines: string[] = [];

  // Group questions by type
  const questionsByType: Record<string, typeof draft.questions> = {};
  for (const question of draft.questions) {
    if (!questionsByType[question.type]) {
      questionsByType[question.type] = [];
    }
    questionsByType[question.type].push(question);
  }

  // Create sections for each question type
  const typeOrder = input.questionTypes.map((row) => row.type);
  let sectionLetter = 65; // ASCII 'A'
  
  for (const type of typeOrder) {
    const questions = questionsByType[type] || [];
    if (questions.length === 0) continue;

    const sectionName = String.fromCharCode(sectionLetter);
    lines.push(`SECTION ${sectionName}: ${type}`);
    lines.push('');

    for (const question of questions) {
      lines.push(`Q${question.id}. (${question.marks} marks)`);
      lines.push(question.prompt);
      lines.push('');
    }

    sectionLetter++;
  }

  // Answer key section
  if (draft.answerKey.length > 0) {
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('ANSWER KEY');
    lines.push('='.repeat(60));
    lines.push('');

    let currentSection: string | null = null;
    let sectionLetter = 65;

    for (const answer of draft.answerKey) {
      const question = draft.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      // Check if we need to print a new section header
      const typeIndex = typeOrder.indexOf(question.type);
      if (typeIndex >= 0 && String.fromCharCode(65 + typeIndex) !== currentSection) {
        currentSection = String.fromCharCode(65 + typeIndex);
        lines.push(`SECTION ${currentSection}: ${question.type}`);
        lines.push('');
      }

      lines.push(`Q${answer.questionId}: ${answer.answer}`);
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

function buildFallbackGeneratedContent(input: AssignmentIntakeRequest): AssignmentGeneratedContent {
  const lines: string[] = [];

  const title = `${input.chapterName} - Generated Assignment`;
  // Create sections for each question type
  let questionCounter = 1;
  let sectionLetter = 65; // ASCII 'A'

  for (const row of input.questionTypes) {
    const sectionName = String.fromCharCode(sectionLetter);
    lines.push(`SECTION ${sectionName}: ${row.type}`);
    lines.push('');

    for (let i = 0; i < row.questions; i++) {
      lines.push(`Q${questionCounter}. (${row.marks} marks)`);
      lines.push(`Write your answer for ${row.type.toLowerCase()} question ${i + 1}.`);
      lines.push('');
      questionCounter++;
    }

    sectionLetter++;
  }

  // Answer key section (placeholder)
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('ANSWER KEY');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('Answer key generation requires LLM configuration. Answers will be provided here.');
  lines.push('');

  const body = lines.join('\n').trim();

  return {
    title,
    body,
  };
}

async function requestLlmDraft(input: AssignmentIntakeRequest): Promise<AssignmentGeneratedDraft> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, env.llmTimeoutMs));
  const initialMaxTokens = computeMaxTokens(input);
  const retryMaxTokens = Math.min(7000, Math.floor(initialMaxTokens * 1.75));

  try {
    let response: Response;

    try {
      response = await fetchLlmResponseWithOptions(input, controller.signal, {
        useJsonResponseFormat: true,
        maxTokens: initialMaxTokens,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `LLM request timed out after ${env.llmTimeoutMs}ms. Increase LLM_TIMEOUT_MS for local models.`,
        );
      }

      const networkDetails = getNetworkErrorDetails(error);
      throw new Error(`Could not reach LLM endpoint at ${env.llmApiBaseUrl}. ${networkDetails}`);
    }

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const primaryBodyText = await response.text();
    const primaryParsed = parseLlmPayload(primaryBodyText);
    let payload = primaryParsed.payload;
    let content = payload ? extractLlmContent(payload) : primaryParsed.rawContent;
    const primaryFinishReason = getFinishReason(payload);

    if (!content || primaryFinishReason === 'length') {
      const providerError = payload?.error?.message?.trim();
      if (providerError) {
        throw new Error(`LLM provider returned an error: ${providerError}`);
      }

      // Retry once without strict JSON mode and with larger token budget.
      let retryResponse: Response;
      try {
        retryResponse = await fetchLlmResponseWithOptions(input, controller.signal, {
          useJsonResponseFormat: false,
          maxTokens: retryMaxTokens,
        });
      } catch (retryError) {
        if (retryError instanceof Error && retryError.name === 'AbortError') {
          throw new Error(
            `LLM request timed out after ${env.llmTimeoutMs}ms. Increase LLM_TIMEOUT_MS for local models.`,
          );
        }

        const networkDetails = getNetworkErrorDetails(retryError);
        throw new Error(
          `Could not reach LLM endpoint at ${env.llmApiBaseUrl} during retry. ${networkDetails}`,
        );
      }

      if (!retryResponse.ok) {
        throw new Error(`LLM retry request failed with status ${retryResponse.status}`);
      }

      const retryBodyText = await retryResponse.text();
      const retryParsed = parseLlmPayload(retryBodyText);
      payload = retryParsed.payload;
      content = payload ? extractLlmContent(payload) : retryParsed.rawContent;
      const retryFinishReason = getFinishReason(payload);

      if (!content) {
        const retryProviderError = payload?.error?.message?.trim();
        if (retryProviderError) {
          throw new Error(`LLM provider returned an error: ${retryProviderError}`);
        }

        throw new Error(
          'LLM response did not include content (no text in choices/message/response fields), including retry without json_object mode',
        );
      }

      if (retryFinishReason === 'length') {
        throw new Error(
          `LLM output was truncated by token limit even after retry (max_tokens=${retryMaxTokens}). Reduce assignment size or use a larger/faster model.`,
        );
      }
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content) as unknown;
    } catch {
      throw new Error(
        `LLM returned non-JSON or truncated JSON content (max_tokens=${initialMaxTokens}, finish_reason=${primaryFinishReason || 'unknown'}).`,
      );
    }
    const parsedDraft = parseRawDraft(parsedContent);
    const normalizedDraft = normalizeDraftAgainstInput(input, parsedDraft);
    const completedDraft = await fillMissingAnswersWithLlm(input, normalizedDraft, controller.signal);
    const strictDraft = assignmentGeneratedDraftSchema.safeParse(completedDraft);

    if (!strictDraft.success) {
      throw new Error(
        strictDraft.error.issues[0]?.message || 'Normalized LLM draft failed schema validation',
      );
    }

    validateAgainstInput(input, strictDraft.data);
    return strictDraft.data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAssignmentFromLlm(
  input: AssignmentIntakeRequest,
): Promise<AssignmentGeneratedContent> {
  if (!env.llmApiKey) {
    throw new Error('LLM API key not configured. Please set LLM_API_KEY environment variable.');
  }

  try {
    const draft = await requestLlmDraft(input);

    return {
      title: draft.title,
      body: formatGeneratedBody(input, draft),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`LLM generation failed: ${errorMessage}`);
  }
}
