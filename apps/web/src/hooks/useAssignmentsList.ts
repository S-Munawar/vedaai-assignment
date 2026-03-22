'use client';

import { useAssignmentsListStore } from '@/store/assignments-list.store';

export function useAssignmentsList() {
  const assignments = useAssignmentsListStore((state) => state.assignments);
  const isLoading = useAssignmentsListStore((state) => state.isLoading);
  const errorMessage = useAssignmentsListStore((state) => state.errorMessage);
  const deletingIds = useAssignmentsListStore((state) => state.deletingIds);
  const searchQuery = useAssignmentsListStore((state) => state.searchQuery);
  const selectedClass = useAssignmentsListStore((state) => state.selectedClass);
  const selectedSubject = useAssignmentsListStore((state) => state.selectedSubject);
  const selectedCreator = useAssignmentsListStore((state) => state.selectedCreator);
  const isFiltersOpen = useAssignmentsListStore((state) => state.isFiltersOpen);
  const realtimeStatus = useAssignmentsListStore((state) => state.realtimeStatus);

  const loadAssignments = useAssignmentsListStore((state) => state.loadAssignments);
  const deleteAssignment = useAssignmentsListStore((state) => state.deleteAssignment);
  const setSearchQuery = useAssignmentsListStore((state) => state.setSearchQuery);
  const setSelectedClass = useAssignmentsListStore((state) => state.setSelectedClass);
  const setSelectedSubject = useAssignmentsListStore((state) => state.setSelectedSubject);
  const setSelectedCreator = useAssignmentsListStore((state) => state.setSelectedCreator);
  const setIsFiltersOpen = useAssignmentsListStore((state) => state.setIsFiltersOpen);
  const setRealtimeStatus = useAssignmentsListStore((state) => state.setRealtimeStatus);
  const onRealtimeCreated = useAssignmentsListStore((state) => state.onRealtimeCreated);
  const onRealtimeDeleted = useAssignmentsListStore((state) => state.onRealtimeDeleted);
  const resetFilters = useAssignmentsListStore((state) => state.resetFilters);
  const clearError = useAssignmentsListStore((state) => state.clearError);

  return {
    assignments,
    isLoading,
    errorMessage,
    deletingIds,
    searchQuery,
    selectedClass,
    selectedSubject,
    selectedCreator,
    isFiltersOpen,
    realtimeStatus,
    loadAssignments,
    deleteAssignment,
    setSearchQuery,
    setSelectedClass,
    setSelectedSubject,
    setSelectedCreator,
    setIsFiltersOpen,
    setRealtimeStatus,
    onRealtimeCreated,
    onRealtimeDeleted,
    resetFilters,
    clearError,
  };
}
