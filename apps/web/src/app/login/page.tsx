'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { listSchoolsResponseSchema, schoolsErrorResponseSchema } from '@repo/shared/schools';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/lib/api-base';

type SchoolOption = {
  id: string;
  name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { loginForm, error, isSubmitting, setLoginField, login, startGoogleRegistration, clearError } = useAuth();
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [schoolLoadError, setSchoolLoadError] = useState('');

  useEffect(() => {
    async function loadSchools() {
      setSchoolLoadError('');

      try {
        const response = await fetch(getApiUrl('/schools'));

        if (!response.ok) {
          const rawError = await response.json().catch(() => null);
          const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
          setSchoolLoadError(parsedError.success ? parsedError.data.error : 'Failed to load schools');
          return;
        }

        const raw = await response.json().catch(() => null);
        const parsed = listSchoolsResponseSchema.safeParse(raw);

        if (!parsed.success) {
          setSchoolLoadError('Unexpected schools response');
          return;
        }

        setSchoolOptions(parsed.data.schools);

        const firstSchool = parsed.data.schools[0];

        if (firstSchool) {
          setLoginField('schoolName', firstSchool.name);
        }
      } catch {
        setSchoolLoadError('Could not reach backend endpoint.');
      }
    }

    void loadSchools();
  }, [setLoginField]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    const success = await login();

    if (success) {
      router.push('/');
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    clearError();
    const success = await startGoogleRegistration();

    if (success) {
      router.push('/complete-registration');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Login</h1>
        <p className="text-sm text-slate-600 mb-6">Sign in with credentials or Google.</p>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Demo Credentials</p>
          <p className="mt-1 text-sm text-blue-900">
            Username: <span className="font-semibold">Demo1</span>
          </p>
          <p className="text-sm text-blue-900">
            Password: <span className="font-semibold">Password@123</span>
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              value={loginForm.username}
              onChange={(e) => setLoginField('username', e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
            <select
              value={loginForm.schoolName}
              onChange={(e) => setLoginField('schoolName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.name}>
                  {school.name}
                </option>
              ))}
            </select>
            {schoolLoadError ? <p className="mt-1 text-xs text-red-600">{schoolLoadError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginField('password', e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-slate-500">OR</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-slate-600">
          New here?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
