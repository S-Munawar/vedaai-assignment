/**
 * Central export point for all Zustand stores.
 * This file exports both store instances and their corresponding hooks.
 */

// Store instances
export { useAuthStore } from './auth.store';
export { useAssignmentStore } from './assignment.store';
export { useSchoolsStore } from './schools.store';
export { useNotificationsStore } from './notifications.store';
export { useAssignmentsListStore } from './assignments-list.store';

// Types
export type { AuthStore } from '@/types/auth-store.types';
export type { AssignmentStore } from '@/types/assignment-store.types';
export type { SchoolStore } from '@/types/schools-store.types';
export type { NotificationsStore } from '@/types/notifications-store.types';
export type { AssignmentsListStore } from '@/types/assignments-list-store.types';
