'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, PhoneCall, Video, Users, ArrowRight } from 'lucide-react';
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
        <PageHeader title="Calls" subtitle="Audio and video calls with your family, powered by LiveKit." />
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Join a family to make calls"
            description="Create a family space — or open the invitation link a family member shared with you."
            action={<Link href="/family" className="inline-flex h-9 items-center rounded-lg bg-sf-deep-orange px-4 text-sm font-semibold text-white hover:brightness-110">Get started</Link>}
          />
        </Card>
      </div>
    );
  }

  const recipients = members.filter((m) => m.userId !== user?.id);

  return (
    <div>
      <PageHeader
        title="Calls"
        subtitle="Real audio and video over WebRTC (LiveKit). Calls are not recorded."
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-sf-ink mb-4">Start a call</h2>
          <div className="inline-flex rounded-lg border border-sf-border-gray p-0.5 mb-4" role="group" aria-label="Call type">
            <button
              type="button"
              aria-pressed={mode === 'audio'}
              onClick={() => setMode('audio')}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                mode === 'audio' ? 'bg-sf-deep-orange text-white' : 'text-sf-charcoal hover:bg-sf-cream'
              }`}
            >
              <Phone className="h-4 w-4" aria-hidden /> Audio
            </button>
            <button
              type="button"
              aria-pressed={mode === 'video'}
              onClick={() => setMode('video')}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                mode === 'video' ? 'bg-sf-deep-orange text-white' : 'text-sf-charcoal hover:bg-sf-cream'
              }`}
            >
              <Video className="h-4 w-4" aria-hidden /> Video
            </button>
          </div>
          <p className="text-sm font-medium text-sf-charcoal mb-2">Who are we calling?</p>
          <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
            {recipients.length ? (
              recipients.map((m) => {
                const checked = selected.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked ? 'border-sf-deep-orange bg-sf-light-orange text-sf-deep-orange font-medium' : 'border-sf-border-gray hover:border-sf-orange'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-[#C2410C]"
                        checked={checked}
                        onChange={() => setSelected((prev) => (checked ? prev.filter((x) => x !== m.userId) : [...prev, m.userId]))}
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sf-light-orange text-[10px] font-bold text-sf-deep-orange" aria-hidden>
                        {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className="truncate">{m.name}</span>
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-sf-muted-gray py-2">No one to call yet — invite family members first.</p>
            )}
          </div>
          <Button className="w-full" loading={starting} disabled={recipients.length === 0} onClick={startCall}>
            {selected.length > 0
              ? `${mode === 'video' ? 'Call' : 'Call'} ${selected.length} ${selected.length === 1 ? 'member' : 'members'} (${mode})`
              : mode === 'video' ? 'Start video call' : 'Start audio call'}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-sf-ink mb-4">Recent calls</h2>
          {calls === null ? (
            <LoadingState label="Loading history…" />
          ) : calls.length === 0 ? (
            <EmptyState icon={<PhoneCall className="h-8 w-8" />} title="No calls yet" description="Your call history appears here after your first call attempt." />
          ) : (
            <ul className="space-y-2">
              {calls.map((c) => (
                <li key={c.id}>
                  <Link href={`/calls/${c.id}`} className="flex items-center gap-3 rounded-lg border border-sf-border-gray px-3 py-2.5 hover:border-sf-orange transition-colors">
                    {c.mode === 'video' ? <Video className="h-4 w-4 text-sf-deep-orange" /> : <Phone className="h-4 w-4 text-sf-deep-orange" />}
                    <span className="flex-1 text-sm text-sf-charcoal">
                      {formatCallTitle(c)}
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

function formatCallTitle(c: CallSummary): string {
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
