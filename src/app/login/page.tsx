'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api, API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/auth/AuthShell';
import { GoogleIcon } from '@/app/login/GoogleIcon';
import { Button, Field, Input, Toast } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

/** Honest explanation for every ?google= reason the server can redirect back with. */
const GOOGLE_ERRORS: Record<string, string> = {
  not_configured: 'Sign in with Google is not configured on this server yet (missing GOOGLE_CLIENT_ID / SECRET in the backend settings).',
  invalid_state: 'The Google sign-in session expired or was replayed. Please try again.',
  token_exchange_failed: 'Google rejected the sign-in exchange. No account was changed — please try again.',
  token_missing: 'Google did not return a usable sign-in token. Please try again.',
  profile_failed: 'Google did not share your profile. Please try again or use email sign-in.',
  no_email: 'Your Google account has no verified email we can use.',
  email_unverified: 'Your Google email is not verified, so we cannot trust it for sign-in.',
  failed: 'Google sign-in failed unexpectedly. Please try again or use email sign-in.',
};

function LoginForm() {
  const { refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Surface the honest reason Google sign-in failed, if the server redirected back.
  const googleReason = params.get('google');
  const googleError = googleReason ? GOOGLE_ERRORS[googleReason] ?? 'Google sign-in failed. Please try again.' : null;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post('/auth/login', values);
      await refresh();
      router.push(params.get('next') ?? '/dashboard');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not sign in. Check your connection.');
    }
  }

  return (
    <div className="space-y-4">
      {serverError ? <Toast kind="error" message={serverError} /> : null}
      {googleError ? <Toast kind="error" message={googleError} /> : null}

      <a
        href={`${API_URL}/auth/google`}
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-sf-border-gray bg-sf-white text-sm font-semibold text-sf-charcoal transition-colors hover:bg-sf-cream"
      >
        <GoogleIcon />
        Sign in with Google
      </a>
      <div className="flex items-center gap-3 text-xs text-sf-muted-gray" aria-hidden>
        <span className="h-px flex-1 bg-sf-border-gray" />
        or continue with email
        <span className="h-px flex-1 bg-sf-border-gray" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-sf-deep-orange hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your family space."
      footer={
        <>
          New to Smart Family?{' '}
          <Link href="/signup" className="text-white font-semibold underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-sf-muted-gray">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
