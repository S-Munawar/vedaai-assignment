'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { listSchoolsResponseSchema, schoolsErrorResponseSchema, type School } from '@repo/shared/schools';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/lib/api-base';

function getSchoolLabel(school: School) {
  const city = school.location.city ? ` - ${school.location.city}` : '';
  return `${school.name}${city} (${school.board})`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { registerForm, error, isSubmitting, setRegisterField, register, clearError } = useAuth();
  const [schoolOptions, setSchoolOptions] = useState<School[]>([]);
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
          setRegisterField('schoolName', firstSchool.name);
        }
      } catch {
        setSchoolLoadError('Could not reach backend endpoint.');
      }
    }

    void loadSchools();
  }, [setRegisterField]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    const success = await register();

    if (success) {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Register</h1>
        <p className="text-sm text-slate-600 mb-6">Create your account to continue.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              value={registerForm.username}
              onChange={(e) => setRegisterField('username', e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
            <select
              value={registerForm.schoolName}
              onChange={(e) => setRegisterField('schoolName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.name}>
                  {getSchoolLabel(school)}
                </option>
              ))}
            </select>
            {schoolLoadError ? <p className="mt-1 text-xs text-red-600">{schoolLoadError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterField('password', e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
