import type { AssignmentQuestionRow } from '@repo/shared/assignment';

export type QuestionRow = AssignmentQuestionRow;

export interface AssignmentStore {
  rows: QuestionRow[];
  additionalInfo: string;
  subject: string;
  classLevel: string;
  chapterName: string;
  dueDate: string;
  selectedFile: File | null;
  isSubmitting: boolean;
  updateRow: (id: number, updates: Partial<QuestionRow>) => void;
  removeRow: (id: number) => void;
  addQuestionType: () => void;
  setAdditionalInfo: (info: string) => void;
  setSubject: (subject: string) => void;
  setClassLevel: (classLevel: string) => void;
  setChapterName: (name: string) => void;
  setDueDate: (date: string) => void;
  setSelectedFile: (file: File | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
}
