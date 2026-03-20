export const MISSING_ANSWER_PREFIX = '__MISSING_ANSWER__';
export const MISSING_ANSWER_FALLBACK = 'Answer not available.';

export const LLM_DEFAULT_MAX_TOKENS = 1800;
export const LLM_MAX_TOKEN_CAP = 6000;
export const LLM_RETRY_TOKEN_CAP = 7000;

export const LLM_REQUEST_SYSTEM_PROMPT =
  'You are an expert school assessment generator. Return only strict JSON that matches the user-provided schema hints and constraints.';

export const MISSING_ANSWERS_SYSTEM_PROMPT =
  'You are an expert teacher. Return only JSON with concise answer key entries.';

export const ASSIGNMENT_PROMPT_RULES = [
  'Return valid JSON only. No markdown or extra text.',
  'questions array length must equal totals.totalQuestions.',
  'Sum of question marks must equal totals.totalMarks.',
  'Use only allowed question types from input.questionTypes.',
  'Each generated question must include: id, type, marks, prompt.',
  'id values must start from 1 and increment by 1.',
  'Questions with the same type should be sequential (group by type).',
  'answerKey should include concise answers using questionId, in the same order as questions.',
  'title should be clear and exam-ready.',
] as const;

export const ASSIGNMENT_PROMPT_FORMAT_HINT =
  'The formatted assignment will have: (1) Metadata at top (title, chapter, due date, marks), (2) Sections grouped by question type (Section A, B, C for different types), (3) Answer key at end in the same order as questions.';

export const MISSING_ANSWERS_PROMPT_RULES = [
  'Return valid JSON only.',
  'Do not include markdown.',
  'Return only the missing answers.',
  'Each answer should be concise and exam-appropriate.',
] as const;
