'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { Button, Field, Input, Toast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { z } from 'zod';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ message?: string }>('/auth/forgot-password', { email });
      setResult({
        message:
          res.message ??
          'If that email is registered, a reset token has been generated and will be delivered securely by an administrator.',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll generate a secure one-time reset token for your account."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="text-white font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      {result ? (
        <div className="space-y-4">
          <Toast kind="success" message={result.message} />
          <p className="text-xs text-sf-muted-gray">
            Reset tokens are never displayed on this page. An administrator delivers yours through a secure out-of-band channel.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <Toast kind="error" message={error} /> : null}
          <Field label="Email" error={error ?? undefined}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Generate reset token
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
