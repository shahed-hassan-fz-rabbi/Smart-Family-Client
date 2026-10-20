'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Check, X, Ticket } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, EmptyState, ErrorState, LoadingState, Select, Toast, Field, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { formatDate } from '@/lib/format';
import type { FamilyInvitationSummary } from '@/lib/types';

export default function InvitationsPage() {
  const { family, role } = useFamilyData();
  const [invitations, setInvitations] = useState<FamilyInvitationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const isAdmin = role === 'owner' || role === 'admin';

  const load = useCallback(async () => {
    if (!family || !isAdmin) return;
    try {
      const res = await api.get<{ invitations: FamilyInvitationSummary[] }>(`/families/${family.id}/invitations`);
      setInvitations(res.invitations);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load invitations');
    }
  }, [family, isAdmin]);

  useEffect(() => {
    setInvitations(null);
    void load();
  }, [load]);

  async function createInvite() {
    if (!family) return;
    setCreating(true);
    try {
      const res = await api.post<{ invitation: { token: string } }>(`/families/${family.id}/invitations`, {
        role: inviteRole,
        ...(inviteEmail.trim() ? { email: inviteEmail.trim() } : {}),
      });
      setNewToken(res.invitation.token);
      setCopied(false);
      setInviteEmail('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the invitation');
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!family || !confirm('Revoke this invitation? Pending links stop working immediately.')) return;
    try {
      await api.delete(`/families/${family.id}/invitations/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not revoke the invitation');
    }
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Family Invitations" />
        <Card><ErrorState message="Create or join a family first." /></Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Family Invitations" subtitle="Ask a family admin or the owner to invite new members." />
        <Card>
          <EmptyState
            icon={<Ticket className="h-10 w-10" />}
            title="Members can't manage invitations"
            description="Only the family owner and admins can create or revoke invitation links. If someone invited you, open the invitation link they shared or use the token from your welcome email."
          />
          <AcceptInvitationForm onDone={() => window.location.reload()} />
        </Card>
      </div>
    );
  }

  const inviteUrl = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/family/join?token=${encodeURIComponent(token)}`;

  return (
    <div>
      <PageHeader title="Family Invitations" subtitle="Generate secure links that expire in 7 days and can be used once." />
      {error ? <div className="mb-4"><Toast kind="error" message={error} /></div> : null}

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-sf-midnight mb-3">Invite a family member</h2>
        {newToken ? (
          <div className="space-y-3">
            <Toast kind="success" message="Invitation created. Share the link below — it expires in 7 days." />
            <div className="rounded-lg border border-sf-border-gray bg-sf-cream p-3">
              <p className="text-xs text-sf-muted-gray mb-1">Invitation link</p>
              <code className="text-xs break-all">{inviteUrl(newToken)}</code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl(newToken));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4 text-sf-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
              <Button variant="ghost" onClick={() => setNewToken(null)}>Create another</Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); void createInvite(); }}
            className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
          >
            <Field label="Email (optional)" hint="Notifies the person if they already have an account.">
              <input
                className="h-10 w-full rounded-lg border border-sf-border-gray bg-white px-3 text-sm focus:border-sf-orange focus:outline-none"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="ma@example.com"
              />
            </Field>
            <Field label="Role">
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-32">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Button type="submit" loading={creating}>
              <Link2 className="h-4 w-4" /> Create link
            </Button>
          </form>
        )}
      </Card>

      {invitations === null ? (
        <LoadingState />
      ) : invitations.length === 0 ? (
        <Card><EmptyState title="No invitations yet" description="Generate a link above to bring your family in." /></Card>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sf-midnight">{inv.email ?? 'Invitation link'}</p>
                  <p className="text-xs text-sf-muted-gray">
                    Created {formatDate(inv.createdAt)} · expires {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <Badge color={inv.role === 'admin' ? 'orange' : 'gray'}>{inv.role}</Badge>
                <Badge color={inv.status === 'pending' ? 'amber' : inv.status === 'accepted' ? 'green' : 'red'}>
                  {inv.status}
                </Badge>
                {inv.status === 'pending' ? (
                  <button onClick={() => void revoke(inv.id)} className="text-xs text-sf-error hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Revoke
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- accepting an invitation token ---------- */

function AcceptInvitationForm({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/families/invitations/accept', { token: token.trim() });
      setMsg({ kind: 'success', message: 'Invitation accepted! Reloading…' });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not accept the invitation' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-sf-border-gray p-5">
      {msg ? <Toast kind={msg.kind} message={msg.message} /> : null}
      <Field label="Have an invitation token?" hint="Paste the code from the invitation you received.">
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Invitation token" />
      </Field>
      <Button type="submit" loading={busy}>Accept invitation</Button>
    </form>
  );
}
