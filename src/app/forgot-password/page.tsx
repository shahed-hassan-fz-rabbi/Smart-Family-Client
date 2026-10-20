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
  const [result, setResult] = useState<{ message: string; devToken?: string } | null>(null);
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
      const res = await api.post<{ message?: string; devToken?: string }>('/auth/forgot-password', { email });
      setResult({
        message:
          res.message ??
          'If that email is registered, a reset token was generated. Email delivery is not configured on this server, so an administrator will pass it to you securely.',
        devToken: res.devToken,
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
          {result.devToken ? (
            <div className="rounded-lg bg-sf-cream border border-sf-light-orange p-3 text-sm">
              <p className="font-medium text-sf-deep-orange mb-1">Development mode token</p>
              <p className="text-sf-muted-gray mb-2">
                Email sending is not implemented on this server, so the token is shown here for local testing only. In production it is never displayed.
              </p>
              <code className="break-all text-xs">{result.devToken}</code>
              <Link
                href={`/reset-password?token=${encodeURIComponent(result.devToken)}`}
                className="mt-3 block"
              >
                <Button className="w-full">Continue to reset password</Button>
              </Link>
            </div>
          ) : null}
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
