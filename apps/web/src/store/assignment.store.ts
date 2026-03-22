import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { QUESTION_TYPE_OPTIONS } from "@repo/shared/assignment";
import type { AssignmentStore, QuestionRow } from "@/types/assignment-store.types";

export type { QuestionRow } from "@/types/assignment-store.types";

const INITIAL_ROWS: QuestionRow[] = [
  { id: 1, type: "Multiple Choice Questions", questions: 4, marks: 1 },
  { id: 2, type: "Short Questions", questions: 3, marks: 2 },
  { id: 3, type: "Diagram/Graph-Based Questions", questions: 5, marks: 5 },
  { id: 4, type: "Numerical Problems", questions: 5, marks: 5 },
];

const getDefaultDate = (): string => new Date().toISOString().split("T")[0] ?? "";

export const useAssignmentStore = create<
  AssignmentStore,
  [['zustand/devtools', never]]
>(
  devtools((set) => ({
  rows: INITIAL_ROWS,
  additionalInfo: "",
  subject: "",
  classLevel: "",
  chapterName: "",
  dueDate: getDefaultDate(),
  selectedFile: null,
  isSubmitting: false,
  submitMessage: "",

  updateRow: (id: number, updates: Partial<QuestionRow>) => {
    set((state) => ({
      rows: state.rows.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      ),
    }));
  },

  removeRow: (id: number) => {
    set((state) => ({
      rows: state.rows.filter((row) => row.id !== id),
    }));
  },

  addQuestionType: () => {
    set((state) => {
      const nextId =
        state.rows.length > 0
          ? Math.max(...state.rows.map((row) => row.id)) + 1
          : 1;

      return {
        rows: [
          ...state.rows,
          {
            id: nextId,
            type: QUESTION_TYPE_OPTIONS[0] ?? "Multiple Choice Questions",
            questions: 1,
            marks: 1,
          },
        ],
      };
    });
  },

  setAdditionalInfo: (info: string) => set({ additionalInfo: info }),
  setSubject: (subject: string) => set({ subject }),
  setClassLevel: (classLevel: string) => set({ classLevel }),
  setChapterName: (name: string) => set({ chapterName: name }),
  setDueDate: (date: string) => set({ dueDate: date }),
  setSelectedFile: (file: File | null) => set({ selectedFile: file }),
  setIsSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),
  setSubmitMessage: (message: string) => set({ submitMessage: message }),

  resetForm: () => {
    set({
      rows: INITIAL_ROWS,
      additionalInfo: "",
      subject: "",
      classLevel: "",
      chapterName: "",
      dueDate: getDefaultDate(),
      selectedFile: null,
      isSubmitting: false,
      submitMessage: "",
    });
  },
  }), { name: 'AssignmentStore' }),
);

