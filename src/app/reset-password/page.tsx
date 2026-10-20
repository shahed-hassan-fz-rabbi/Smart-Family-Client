'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { Button, Field, Input, Toast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (token.trim().length < 16) {
      setError('Paste the full reset token you received.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: token.trim(), password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed. The token may have expired.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <Toast kind="success" message="Password updated. You can sign in now." />
        <Link href="/login">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Toast kind="error" message={error} /> : null}
      <Field label="Reset token">
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" loading={loading}>
        Set new password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set a new password" subtitle="Tokens expire after one hour and can be used once.">
      <Suspense fallback={<p className="text-sm text-sf-muted-gray">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
