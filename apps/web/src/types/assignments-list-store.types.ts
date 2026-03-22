import type { AssignmentListItem } from '@repo/shared/assignment';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface AssignmentsListStore {
  assignments: AssignmentListItem[];
  isLoading: boolean;
  errorMessage: string;
  deletingIds: Set<string>;
  searchQuery: string;
  selectedClass: string;
  selectedSubject: string;
  selectedCreator: string;
  isFiltersOpen: boolean;
  realtimeStatus: RealtimeStatus;

  // Actions
  loadAssignments: () => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedClass: (classLevel: string) => void;
  setSelectedSubject: (subject: string) => void;
  setSelectedCreator: (creator: string) => void;
  setIsFiltersOpen: (open: boolean) => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  onRealtimeCreated: (assignment: AssignmentListItem) => void;
  onRealtimeDeleted: (assignmentId: string) => void;
  resetFilters: () => void;
  clearError: () => void;
}
