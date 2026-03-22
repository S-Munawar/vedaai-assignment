'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { type School } from '@repo/shared/schools';
import { useAuth } from '@/hooks/useAuth';
import { getSchoolLabel } from '@/constants/schools.constants';
import { useSchools } from '@/hooks/useSchools';

export default function RegisterPage() {
  const router = useRouter();
  const { registerForm, error, isSubmitting, setRegisterField, register, clearError } = useAuth();
  const { schools, schoolError, loadSchools } = useSchools();
  const [schoolOptions, setSchoolOptions] = useState<School[]>(schools);

  useEffect(() => {
    async function hydrateSchools() {
      const loadedSchools = await loadSchools();
      setSchoolOptions(loadedSchools);

      const firstSchool = loadedSchools[0];

      if (firstSchool) {
        setRegisterField('schoolName', firstSchool.name);
      }
    }

    void hydrateSchools();
  }, [loadSchools, setRegisterField]);

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
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/70 p-8 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-primary">Register</h1>
          <p className="text-sm text-muted">Create your account to continue.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">Username</label>
            <input
              value={registerForm.username}
              onChange={(e) => setRegisterField('username', e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-primary outline-none transition focus:border-primary-orange"
              placeholder="Choose username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">School Name</label>
            <div className="relative">
              <select
                value={registerForm.schoolName}
                onChange={(e) => setRegisterField('schoolName', e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-4 pr-10 text-sm text-primary outline-none transition focus:border-primary-orange"
              >
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.name}>
                    {getSchoolLabel(school)}
                  </option>
                ))}
              </select>
              <Image
                src="/icons/Chevron.svg"
                alt=""
                aria-hidden="true"
                width={10}
                height={6}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>
            {schoolError ? <p className="mt-1 text-xs text-error">{schoolError}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterField('password', e.target.value)}
              required
              minLength={6}
              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-primary outline-none transition focus:border-primary-orange"
              placeholder="At least 6 characters"
            />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary-orange disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-sm text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-orange">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
