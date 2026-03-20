import type { PendingGoogleRegistration, SchoolName } from '@repo/shared/auth';

export type AuthStore = {
  loginForm: {
    username: string;
    schoolName: SchoolName;
    password: string;
  };
  registerForm: {
    username: string;
    schoolName: SchoolName;
    password: string;
  };
  completeRegistrationForm: {
    schoolName: SchoolName;
  };
  pendingGoogleRegistration: PendingGoogleRegistration | null;
  error: string;
  isSubmitting: boolean;
  isLoggingOut: boolean;
  setError: (error: string) => void;
  clearError: () => void;
  setLoginField: (field: 'username' | 'password' | 'schoolName', value: string) => void;
  setRegisterField: (field: 'username' | 'password' | 'schoolName', value: string) => void;
  setCompleteSchoolName: (schoolName: SchoolName) => void;
  loadPendingGoogleRegistration: () => void;
  login: () => Promise<boolean>;
  register: () => Promise<boolean>;
  startGoogleRegistration: () => Promise<boolean>;
  completeGoogleRegistration: () => Promise<boolean>;
  logout: () => Promise<void>;
};
