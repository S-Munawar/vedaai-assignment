'use client';

import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const loginForm = useAuthStore((state) => state.loginForm);
  const registerForm = useAuthStore((state) => state.registerForm);
  const completeRegistrationForm = useAuthStore((state) => state.completeRegistrationForm);
  const pendingGoogleRegistration = useAuthStore((state) => state.pendingGoogleRegistration);
  const error = useAuthStore((state) => state.error);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);
  const setLoginField = useAuthStore((state) => state.setLoginField);
  const setRegisterField = useAuthStore((state) => state.setRegisterField);
  const setCompleteSchoolName = useAuthStore((state) => state.setCompleteSchoolName);
  const loadPendingGoogleRegistration = useAuthStore((state) => state.loadPendingGoogleRegistration);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const startGoogleRegistration = useAuthStore((state) => state.startGoogleRegistration);
  const completeGoogleRegistration = useAuthStore((state) => state.completeGoogleRegistration);
  const logout = useAuthStore((state) => state.logout);

  return {
    loginForm,
    registerForm,
    completeRegistrationForm,
    pendingGoogleRegistration,
    error,
    isSubmitting,
    isLoggingOut,
    setError,
    clearError,
    setLoginField,
    setRegisterField,
    setCompleteSchoolName,
    loadPendingGoogleRegistration,
    login,
    register,
    startGoogleRegistration,
    completeGoogleRegistration,
    logout,
  };
}
