'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api-base';

type PendingGoogleRegistration = {
  idToken: string;
  email: string;
  username: string;
};

const SCHOOL_OPTIONS = ['Delhi Public Schoool'];

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingGoogleRegistration | null>(null);
  const [schoolName, setSchoolName] = useState(SCHOOL_OPTIONS[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingGoogleRegistration');

    if (!raw) {
      setError('Google sign-in session not found. Please try again.');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PendingGoogleRegistration;
      setPending(parsed);
    } catch {
      setError('Invalid Google sign-in session. Please try again.');
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pending) {
      setError('Google sign-in session not found. Please login again.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/google'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: pending.idToken, schoolName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not complete registration');
      }

      sessionStorage.removeItem('pendingGoogleRegistration');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete registration');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Registration</h1>
        <p className="text-sm text-slate-600 mb-6">Google sign-in successful. Select your school name to finish setup.</p>

        {pending ? (
          <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-800">{pending.email}</p>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
            <select
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SCHOOL_OPTIONS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading || !pending}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'Please wait...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
