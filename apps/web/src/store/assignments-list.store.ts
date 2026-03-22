'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  assignmentIntakeErrorResponseSchema,
  assignmentListResponseSchema,
  deleteAssignmentResponseSchema,
} from '@repo/shared/assignment';
import { getApiUrl } from '@/lib/api-base';
import type { AssignmentListItem } from '@repo/shared/assignment';
import type { AssignmentsListStore } from '@/types/assignments-list-store.types';

export const useAssignmentsListStore = create<
  AssignmentsListStore,
  [['zustand/devtools', never]]
>(
  devtools((set, get) => ({
  assignments: [],
  isLoading: false,
  errorMessage: '',
  deletingIds: new Set<string>(),
  searchQuery: '',
  selectedClass: 'all',
  selectedSubject: 'all',
  selectedCreator: 'all',
  isFiltersOpen: false,
  realtimeStatus: 'connecting',

  loadAssignments: async () => {
    set({ isLoading: true, errorMessage: '' });

    try {
      const response = await fetch(getApiUrl('/assignments'), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
        set({
          errorMessage: errorParsed.success ? errorParsed.data.error : 'Failed to load assignments',
          assignments: [],
        });
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = assignmentListResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ errorMessage: 'Unexpected response while loading assignments', assignments: [] });
        return;
      }

      set({ assignments: parsed.data.assignments });
    } catch {
      set({ errorMessage: 'Could not reach backend endpoint.', assignments: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAssignment: async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    set((state) => ({
      deletingIds: new Set(state.deletingIds).add(assignmentId),
    }));

    try {
      const response = await fetch(getApiUrl(`/assignments/${assignmentId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
        const errorMsg = errorParsed.success ? errorParsed.data.error : 'Failed to delete assignment';
        set((state) => {
          const next = new Set(state.deletingIds);
          next.delete(assignmentId);
          return { errorMessage: errorMsg, deletingIds: next };
        });
        return;
      }

      const rawSuccess = await response.json().catch(() => null);
      const parsedSuccess = deleteAssignmentResponseSchema.safeParse(rawSuccess);

      if (!parsedSuccess.success) {
        set((state) => {
          const next = new Set(state.deletingIds);
          next.delete(assignmentId);
          return { errorMessage: 'Unexpected response while deleting assignment', deletingIds: next };
        });
        return;
      }

      // The real-time event will handle removing from the list
    } catch {
      set((state) => {
        const next = new Set(state.deletingIds);
        next.delete(assignmentId);
        return { errorMessage: 'Could not reach backend endpoint.', deletingIds: next };
      });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedClass: (classLevel: string) => set({ selectedClass: classLevel }),
  setSelectedSubject: (subject: string) => set({ selectedSubject: subject }),
  setSelectedCreator: (creator: string) => set({ selectedCreator: creator }),
  setIsFiltersOpen: (open: boolean) => set({ isFiltersOpen: open }),
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),

  onRealtimeCreated: (assignment: AssignmentListItem) => {
    set((state) => {
      if (state.assignments.some((a) => a.id === assignment.id)) {
        return state;
      }
      return { assignments: [assignment, ...state.assignments] };
    });
  },

  onRealtimeDeleted: (assignmentId: string) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== assignmentId),
      deletingIds: (() => {
        const next = new Set(state.deletingIds);
        next.delete(assignmentId);
        return next;
      })(),
    }));
  },

  resetFilters: () => {
    set({
      selectedClass: 'all',
      selectedSubject: 'all',
      selectedCreator: 'all',
      searchQuery: '',
    });
  },

  clearError: () => set({ errorMessage: '' }),
  }), { name: 'AssignmentsListStore' }),
);
