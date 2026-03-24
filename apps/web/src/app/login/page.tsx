'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { loginForm, error, isSubmitting, setLoginField, login, startGoogleRegistration, clearError } = useAuth();

  function getPostLoginPath() {
    if (typeof window === 'undefined') {
      return '/';
    }

    const redirectPath = new URLSearchParams(window.location.search).get('redirect');

    if (!redirectPath || !redirectPath.startsWith('/')) {
      return '/';
    }

    return redirectPath;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    const success = await login();

    if (success) {
      router.push(getPostLoginPath());
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    clearError();
    const result = await startGoogleRegistration();

    if (result === 'authenticated') {
      router.push(getPostLoginPath());
      router.refresh();
      return;
    }

    if (result === 'needs-completion') {
      router.push('/complete-registration');
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/70 p-8 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-primary">Login</h1>
          <p className="text-sm text-muted">Sign in with credentials or Google.</p>
        </div>

        <div className="mb-6 rounded-xl border border-primary-orange/25 bg-primary-orange/8 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-orange">Demo Credentials</p>
          <p className="mt-1 text-sm text-primary">
            Username: <span className="font-bold">Demo1</span>
          </p>
          <p className="text-sm text-primary">
            Password: <span className="font-bold">Password@123</span>
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">Username</label>
            <input
              value={loginForm.username}
              onChange={(e) => setLoginField('username', e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-primary outline-none transition focus:border-primary-orange"
              placeholder="Enter username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginField('password', e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-primary outline-none transition focus:border-primary-orange"
              placeholder="Enter password"
            />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-orange disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="my-4 text-center text-xs font-medium text-disabled">OR</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-semibold text-primary transition hover:bg-off-white-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Image src="/icons/Sparkles.svg" alt="" aria-hidden="true" width={16} height={16} />
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-secondary">
          New here?{' '}
          <Link href="/register" className="font-semibold text-primary hover:text-primary-orange">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
