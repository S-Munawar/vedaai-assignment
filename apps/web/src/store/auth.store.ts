'use client';

import { signInWithPopup } from 'firebase/auth';
import { create } from 'zustand';
import {
  ALLOWED_SCHOOLS,
  authErrorResponseSchema,
  authSuccessResponseSchema,
  googleAuthRequestSchema,
  loginRequestSchema,
  pendingGoogleRegistrationSchema,
  registerRequestSchema,
  schoolNameSchema,
  type PendingGoogleRegistration,
  type SchoolName,
} from '@repo/shared/auth';
import { getApiUrl } from '@/lib/api-base';
import { getFirebaseAuthClient, getGoogleProvider } from '@/lib/firebase';

type AuthStore = {
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

const DEFAULT_SCHOOL = ALLOWED_SCHOOLS[0];

export const useAuthStore = create<AuthStore>((set, get) => ({
  loginForm: {
    username: '',
    schoolName: DEFAULT_SCHOOL,
    password: '',
  },
  registerForm: {
    username: '',
    schoolName: DEFAULT_SCHOOL,
    password: '',
  },
  completeRegistrationForm: {
    schoolName: DEFAULT_SCHOOL,
  },
  pendingGoogleRegistration: null,
  error: '',
  isSubmitting: false,
  isLoggingOut: false,
  setError: (error) => set({ error }),
  clearError: () => set({ error: '' }),
  setLoginField: (field, value) => {
    if (field === 'schoolName') {
      const parsedSchool = schoolNameSchema.safeParse(value);

      if (!parsedSchool.success) {
        return;
      }

      set((state) => ({
        loginForm: {
          ...state.loginForm,
          schoolName: parsedSchool.data,
        },
      }));
      return;
    }

    set((state) => ({
      loginForm: {
        ...state.loginForm,
        [field]: value,
      },
    }));
  },
  setRegisterField: (field, value) => {
    if (field === 'schoolName') {
      const parsedSchool = schoolNameSchema.safeParse(value);

      if (!parsedSchool.success) {
        return;
      }

      set((state) => ({
        registerForm: {
          ...state.registerForm,
          schoolName: parsedSchool.data,
        },
      }));
      return;
    }

    set((state) => ({
      registerForm: {
        ...state.registerForm,
        [field]: value,
      },
    }));
  },
  setCompleteSchoolName: (schoolName) =>
    set({
      completeRegistrationForm: {
        schoolName,
      },
    }),
  loadPendingGoogleRegistration: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = sessionStorage.getItem('pendingGoogleRegistration');

    if (!raw) {
      set({ pendingGoogleRegistration: null, error: 'Google sign-in session not found. Please try again.' });
      return;
    }

    try {
      const parsed = pendingGoogleRegistrationSchema.safeParse(JSON.parse(raw));

      if (!parsed.success) {
        set({
          pendingGoogleRegistration: null,
          error: parsed.error.issues[0]?.message || 'Invalid Google sign-in session. Please try again.',
        });
        return;
      }

      set({ pendingGoogleRegistration: parsed.data, error: '' });
    } catch {
      set({ pendingGoogleRegistration: null, error: 'Invalid Google sign-in session. Please try again.' });
    }
  },
  login: async () => {
    set({ isSubmitting: true, error: '' });

    try {
      const parsed = loginRequestSchema.safeParse(get().loginForm);

      if (!parsed.success) {
        set({ error: parsed.error.issues[0]?.message || 'Invalid input' });
        return false;
      }

      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = authErrorResponseSchema.safeParse(await response.json());
        set({ error: data.success ? data.data.error : 'Login failed' });
        return false;
      }

      const success = authSuccessResponseSchema.safeParse(await response.json());

      if (!success.success) {
        set({ error: 'Unexpected login response' });
        return false;
      }

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  register: async () => {
    set({ isSubmitting: true, error: '' });

    try {
      const parsed = registerRequestSchema.safeParse(get().registerForm);

      if (!parsed.success) {
        set({ error: parsed.error.issues[0]?.message || 'Invalid input' });
        return false;
      }

      const response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = authErrorResponseSchema.safeParse(await response.json());
        set({ error: data.success ? data.data.error : 'Registration failed' });
        return false;
      }

      const success = authSuccessResponseSchema.safeParse(await response.json());

      if (!success.success) {
        set({ error: 'Unexpected registration response' });
        return false;
      }

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Registration failed' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  startGoogleRegistration: async () => {
    set({ isSubmitting: true, error: '' });

    try {
      const auth = getFirebaseAuthClient();
      const provider = getGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      const pendingRegistration = {
        idToken: await result.user.getIdToken(),
        email: result.user.email || '',
        username: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
      };
      const parsed = pendingGoogleRegistrationSchema.safeParse(pendingRegistration);

      if (!parsed.success) {
        set({ error: parsed.error.issues[0]?.message || 'Invalid Google sign-in response' });
        return false;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingGoogleRegistration', JSON.stringify(parsed.data));
      }

      set({ pendingGoogleRegistration: parsed.data });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Google sign-in failed' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  completeGoogleRegistration: async () => {
    const { pendingGoogleRegistration, completeRegistrationForm } = get();

    if (!pendingGoogleRegistration) {
      set({ error: 'Google sign-in session not found. Please login again.' });
      return false;
    }

    set({ isSubmitting: true, error: '' });

    try {
      const parsed = googleAuthRequestSchema.safeParse({
        idToken: pendingGoogleRegistration.idToken,
        schoolName: completeRegistrationForm.schoolName,
      });

      if (!parsed.success) {
        set({ error: parsed.error.issues[0]?.message || 'Invalid input' });
        return false;
      }

      const response = await fetch(getApiUrl('/auth/google'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = authErrorResponseSchema.safeParse(await response.json());
        set({ error: data.success ? data.data.error : 'Could not complete registration' });
        return false;
      }

      const success = authSuccessResponseSchema.safeParse(await response.json());

      if (!success.success) {
        set({ error: 'Unexpected Google auth response' });
        return false;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingGoogleRegistration');
      }

      set({ pendingGoogleRegistration: null });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not complete registration' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
  logout: async () => {
    set({ isLoggingOut: true });

    try {
      await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingGoogleRegistration');
      }

      set({
        isLoggingOut: false,
        pendingGoogleRegistration: null,
        error: '',
        loginForm: {
          username: '',
          schoolName: DEFAULT_SCHOOL,
          password: '',
        },
        registerForm: {
          username: '',
          schoolName: DEFAULT_SCHOOL,
          password: '',
        },
        completeRegistrationForm: {
          schoolName: DEFAULT_SCHOOL,
        },
      });
    }
  },
}));
