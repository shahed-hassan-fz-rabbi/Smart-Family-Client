'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Users, XCircle } from 'lucide-react';
import { Card, Button, LoadingState, Toast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function JoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function join() {
    if (!token) return;
    setState('joining');
    try {
      await api.post('/families/invitations/accept', { token });
      await refresh();
      setState('done');
      setTimeout(() => router.push('/family'), 1500);
    } catch (err) {
      setState('error');
      setMessage(err instanceof ApiError ? err.message : 'Could not accept this invitation.');
    }
  }

  if (!token) {
    return (
      <Card className="p-8 max-w-md mx-auto text-center">
        <Users className="h-10 w-10 text-sf-deep-orange mx-auto" aria-hidden />
        <h1 className="mt-3 font-bold text-sf-midnight">No invitation token</h1>
        <p className="mt-1 text-sm text-sf-muted-gray">
          This page is for invitation links like <code className="text-xs">/family/join?token=…</code>. Ask the family
          member who invited you to share the link again.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-sf-deep-orange hover:underline">
          Go to your dashboard
        </Link>
      </Card>
    );
  }

  if (state === 'done') {
    return (
      <Card className="p-8 max-w-md mx-auto text-center">
        <CheckCircle2 className="h-12 w-12 text-sf-success mx-auto" aria-hidden />
        <h1 className="mt-3 font-bold text-sf-midnight">You have joined the family!</h1>
        <p className="mt-1 text-sm text-sf-muted-gray">Taking you to your family space…</p>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card className="p-8 max-w-md mx-auto text-center">
        <XCircle className="h-12 w-12 text-sf-error mx-auto" aria-hidden />
        <h1 className="mt-3 font-bold text-sf-midnight">This invitation did not work</h1>
        <Toast kind="error" message={message} />
        <p className="mt-3 text-xs text-sf-muted-gray">
          Invitation links are single-use and expire after 7 days. Ask the family owner or an admin to create a new one.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-sf-deep-orange hover:underline">
          Go to your dashboard
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md mx-auto text-center">
      <Users className="h-10 w-10 text-sf-deep-orange mx-auto" aria-hidden />
      <h1 className="mt-3 font-bold text-sf-midnight">You have been invited to a family</h1>
      <p className="mt-1 text-sm text-sf-muted-gray">
        Accepting joins this Smart Family space with your current account. Invitations are single-use and expire.
      </p>
      <div className="mt-5">
        {state === 'joining' ? (
          <LoadingState label="Joining…" />
        ) : (
          <Button onClick={() => void join()}>Accept invitation</Button>
        )}
      </div>
    </Card>
  );
}

export default function FamilyJoinPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading invitation…" />}>
      <JoinInner />
    </Suspense>
  );
}
