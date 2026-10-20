'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, PhoneCall, Video, Users, ArrowRight, CircleAlert } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, EmptyState, ErrorState, LoadingState, Toast } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { useAuth } from '@/context/AuthContext';
import { relativeTime } from '@/lib/format';
import type { CallSummary } from '@/lib/types';

function CallsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { family, members } = useFamilyData();
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'audio' | 'video'>(params.get('type') === 'video' ? 'video' : 'audio');
  const [selected, setSelected] = useState<string[]>(() => (params.get('members') ?? '').split(',').filter(Boolean));
  const [starting, setStarting] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const res = await api.get<{ calls: CallSummary[] }>(`/calls?familyId=${family.id}`);
      setCalls(res.calls);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load call history');
    }
  }, [family]);

  useEffect(() => {
    void load();
  }, [load]);

  async function startCall() {
    if (!family) return;
    const participantIds = selected.filter((id) => id !== user?.id);
    if (participantIds.length < 1) {
      setToast({ kind: 'error', message: 'Choose at least one family member to call.' });
      return;
    }
    setStarting(true);
    try {
      const res = await api.post<{ call: { id: string } }>('/calls', {
        familyId: family.id,
        mode,
        participantIds,
        conversationId: params.get('conversationId') ?? undefined,
      });
      router.push(`/calls/${res.call.id}?mode=${mode}`);
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not start the call' });
      setStarting(false);
    }
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Calls" />
        <Card><ErrorState message="Join a family to make calls." /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Calls"
        subtitle="Real audio and video over WebRTC (LiveKit). Calls are not recorded."
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} /></Card> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-sf-midnight mb-4">Start a call</h2>
          <div className="flex gap-2 mb-4">
            <Button variant={mode === 'audio' ? 'primary' : 'outline'} onClick={() => setMode('audio')}>
              <Phone className="h-4 w-4" /> Audio
            </Button>
            <Button variant={mode === 'video' ? 'primary' : 'outline'} onClick={() => setMode('video')}>
              <Video className="h-4 w-4" /> Video
            </Button>
          </div>
          <p className="text-sm font-medium text-sf-charcoal mb-2">Who are we calling?</p>
          <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
            {members.filter((m) => m.userId !== user?.id).map((m) => {
              const checked = selected.includes(m.userId);
              return (
                <label
                  key={m.userId}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    checked ? 'border-sf-deep-orange bg-sf-light-orange text-sf-deep-orange font-medium' : 'border-sf-border-gray'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#C2410C]"
                      checked={checked}
                      onChange={() => setSelected((prev) => (checked ? prev.filter((x) => x !== m.userId) : [...prev, m.userId]))}
                    />
                    {m.name}
                  </span>
                </label>
              );
            })}
          </div>
          <Button className="w-full" loading={starting} onClick={startCall}>
            {mode === 'video' ? 'Start video call' : 'Start audio call'}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-sf-midnight mb-4">Recent calls</h2>
          {calls === null ? (
            <LoadingState label="Loading history…" />
          ) : calls.length === 0 ? (
            <EmptyState icon={<PhoneCall className="h-10 w-10" />} title="No calls yet" description="Your call history appears here after your first call attempt." />
          ) : (
            <ul className="space-y-2">
              {calls.map((c) => (
                <li key={c.id}>
                  <Link href={`/calls/${c.id}`} className="flex items-center gap-3 rounded-lg border border-sf-border-gray px-3 py-2.5 hover:border-sf-orange transition-colors">
                    {c.mode === 'video' ? <Video className="h-4 w-4 text-sf-deep-orange" /> : <Phone className="h-4 w-4 text-sf-deep-orange" />}
                    <span className="flex-1 text-sm text-sf-charcoal">
                      {formatCallTitle(c, user?.id)}
                      <span className="block text-xs text-sf-muted-gray">{relativeTime(c.startedAt)}{c.endedAt ? ` · ended ${relativeTime(c.endedAt)}` : ''}</span>
                    </span>
                    <Badge color={c.status === 'active' ? 'green' : c.status === 'ended' ? 'gray' : c.status === 'declined' || c.status === 'missed' ? 'red' : 'amber'}>
                      {c.status}
                    </Badge>
                    <span className="text-xs text-sf-muted-gray"><Users className="inline h-3 w-3 mr-0.5" />{c.participantCount}</span>
                    <ArrowRight className="h-4 w-4 text-sf-border-gray" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatCallTitle(c: CallSummary, myId?: string): string {
  const who = c.isInitiator ? 'Outgoing' : 'Incoming';
  return `${who} ${c.mode} call`;
}

export default function CallsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl"><LoadingState /></div>}>
      <CallsInner />
    </Suspense>
  );
}
