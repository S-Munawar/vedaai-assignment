'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { getApiUrl } from '@/lib/api-base';
import { getFirebaseAuthClient, getGoogleProvider } from '@/lib/firebase';

const SCHOOL_OPTIONS = ['Delhi Public Schoool'];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [schoolName, setSchoolName] = useState(SCHOOL_OPTIONS[0]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, schoolName, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setIsLoading(true);

    try {
      const auth = getFirebaseAuthClient();
      const provider = getGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const pendingRegistration = {
        idToken,
        email: result.user.email || '',
        username: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
      };

      sessionStorage.setItem('pendingGoogleRegistration', JSON.stringify(pendingRegistration));
      router.push('/complete-registration');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Login</h1>
        <p className="text-sm text-slate-600 mb-6">Sign in with credentials or Google.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-slate-500">OR</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
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
