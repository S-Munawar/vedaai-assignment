import { z } from 'zod';

export const llmMessagePartSchema = z.object({
  type: z.string().optional(),
  text: z.string().optional(),
});

export const llmContentSchema = z.union([z.string(), z.array(llmMessagePartSchema)]);

export const llmProviderPayloadSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().optional(),
        message: z
          .object({
            content: llmContentSchema.optional(),
            reasoning_content: z.string().optional(),
          })
          .optional(),
        text: z.string().optional(),
      }),
    )
    .optional(),
  message: z
    .object({
      content: llmContentSchema.optional(),
    })
    .optional(),
  response: z.string().optional(),
  output_text: z.string().optional(),
  error: z
    .object({
      message: z.string().optional(),
    })
    .optional(),
});

export type OpenAICompatibleResponse = z.infer<typeof llmProviderPayloadSchema>;
export type LlmContent = z.infer<typeof llmContentSchema>;

export type RawAssignmentGeneratedDraft = {
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
