import { z } from 'zod';

export const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False Questions',
  'Long Answer Questions',
] as const;

export const ALLOWED_ASSIGNMENT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export const MAX_ASSIGNMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const questionTypeOptionSchema = z.enum(QUESTION_TYPE_OPTIONS);
export const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const assignmentQuestionRowSchema = z.object({
  id: z.number().int().positive(),
  type: questionTypeOptionSchema,
  questions: z.number().int().min(1, 'Each row must have at least 1 question'),
  marks: z.number().int().min(1, 'Each row must have at least 1 mark'),
});

export const assignmentFileMetaSchema = z.object({
  name: z.string().trim().min(1, 'File name is required'),
  size: z
    .number()
    .int()
    .positive('File is required')
    .max(MAX_ASSIGNMENT_FILE_SIZE_BYTES, 'File must be 10MB or smaller'),
  type: z.enum(ALLOWED_ASSIGNMENT_FILE_TYPES, {
    error: 'Only JPEG, PNG, or PDF files are allowed',
  }),
});

export const assignmentIntakeRequestSchema = z
  .object({
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    chapterName: z.string().trim().min(1, 'Chapter Name is required'),
    additionalInfo: z.string().trim().max(2000).optional().default(''),
    questionTypes: z.array(assignmentQuestionRowSchema).min(1, 'At least one Question Type is required'),
    totals: z.object({
      totalQuestions: z.number().int().min(1),
      totalMarks: z.number().int().min(1),
    }),
    file: assignmentFileMetaSchema,
  })
  .superRefine((data, ctx) => {
    const calculatedQuestions = data.questionTypes.reduce((sum, row) => sum + row.questions, 0);
    const calculatedMarks = data.questionTypes.reduce(
      (sum, row) => sum + row.questions * row.marks,
      0,
    );

    if (data.totals.totalQuestions !== calculatedQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totals', 'totalQuestions'],
        message: 'Total questions does not match question type rows',
      });
    }

    if (data.totals.totalMarks !== calculatedMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totals', 'totalMarks'],
        message: 'Total marks does not match question type rows',
      });
    }
  });

export const assignmentIntakeSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignmentId: z.string(),
  receivedData: z.object({
    dueDate: z.string(),
    chapterName: z.string(),
    totalQuestions: z.number(),
    totalMarks: z.number(),
    questionsCount: z.number(),
    hasFile: z.boolean(),
  }),
});

export const assignmentIntakeErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
});

export const assignmentGeneratedContentSchema = z.object({
  title: z.string(),
  body: z.string(),
});

export const assignmentListItemSchema = z.object({
  id: mongoIdSchema,
  chapterName: z.string(),
  dueDate: z.string(),
  totalQuestions: z.number().int().min(1),
  totalMarks: z.number().int().min(1),
  questionTypeCount: z.number().int().min(1),
  createdBy: z.object({
    id: mongoIdSchema,
    username: z.string(),
  }),
  createdAt: z.string(),
});

export const assignmentDetailsSchema = z.object({
  id: mongoIdSchema,
  chapterName: z.string(),
  dueDate: z.string(),
  additionalInfo: z.string(),
  totals: z.object({
    totalQuestions: z.number().int().min(1),
    totalMarks: z.number().int().min(1),
  }),
  questionTypes: z.array(assignmentQuestionRowSchema),
  file: assignmentFileMetaSchema,
  generatedContent: assignmentGeneratedContentSchema,
  schoolId: mongoIdSchema,
  createdBy: z.object({
    id: mongoIdSchema,
    username: z.string(),
  }),
  createdAt: z.string(),
});

export const assignmentListResponseSchema = z.object({
  success: z.literal(true),
  assignments: z.array(assignmentListItemSchema),
});

export const assignmentDetailsResponseSchema = z.object({
  success: z.literal(true),
  assignment: assignmentDetailsSchema,
});

export type QuestionTypeOption = z.infer<typeof questionTypeOptionSchema>;
export type AssignmentQuestionRow = z.infer<typeof assignmentQuestionRowSchema>;
export type AssignmentFileMeta = z.infer<typeof assignmentFileMetaSchema>;
export type AssignmentIntakeRequest = z.infer<typeof assignmentIntakeRequestSchema>;
export type AssignmentIntakeSuccessResponse = z.infer<typeof assignmentIntakeSuccessResponseSchema>;
export type AssignmentIntakeErrorResponse = z.infer<typeof assignmentIntakeErrorResponseSchema>;
export type AssignmentGeneratedContent = z.infer<typeof assignmentGeneratedContentSchema>;
export type AssignmentListItem = z.infer<typeof assignmentListItemSchema>;
export type AssignmentDetails = z.infer<typeof assignmentDetailsSchema>;
export type AssignmentListResponse = z.infer<typeof assignmentListResponseSchema>;
export type AssignmentDetailsResponse = z.infer<typeof assignmentDetailsResponseSchema>;
