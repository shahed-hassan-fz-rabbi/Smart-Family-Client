'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState, Field, Input, LoadingState, Modal, Select, Textarea, Toast,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';

export default function FamilySpacePage() {
  const { refresh } = useAuth();
  const { family, members, role, loading, error, reload } = useFamilyData();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [editable, setEditable] = useState<{ name: string; description: string; timezone: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState label="Loading family space…" />;

  if (error) {
    return (
      <div>
        <PageHeader title="Family Space" />
        <Card><Toast kind="error" message={error} /></Card>
      </div>
    );
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Family Space" subtitle="Create your first family space — everything else connects to it." />
        <CreateFamilyForm onDone={async () => { await refresh(); await reload(); }} />
      </div>
    );
  }

  const isAdmin = role === 'owner' || role === 'admin';

  async function saveFamily() {
    if (!editable || !family) return;
    setSaving(true);
    try {
      await api.patch(`/families/${family.id}`, {
        name: editable.name,
        description: editable.description,
        timezone: editable.timezone,
      });
      setToast({ kind: 'success', message: 'Family details updated.' });
      setEditable(null);
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Update failed' });
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(membershipId: string, name: string) {
    if (!confirm(`Remove ${name} from the family? Their access ends immediately.`)) return;
    try {
      await api.delete(`/families/${family!.id}/members/${membershipId}`);
      setToast({ kind: 'success', message: `${name} was removed from the family.` });
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not remove the member' });
    }
  }

  async function changeRole(membershipId: string, newRole: 'admin' | 'member') {
    try {
      await api.patch(`/families/${family!.id}/members/${membershipId}`, { role: newRole });
      setToast({ kind: 'success', message: 'Role updated.' });
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not change the role' });
    }
  }

  async function leaveFamily() {
    if (!confirm('Leave this family? You will need a new invitation to rejoin.')) return;
    try {
      await api.delete(`/families/${family!.id}/members/me`);
      await refresh();
      await reload();
      router.push('/family');
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not leave the family' });
    }
  }

  return (
    <div>
      <PageHeader
        title="Family Space"
        subtitle={family.description ?? 'Your shared family home.'}
        action={
          isAdmin ? (
            <Button variant="outline" onClick={() => setEditable({ name: family.name, description: family.description ?? '', timezone: 'UTC' })}>
              <Save className="h-4 w-4" /> Edit details
            </Button>
          ) : undefined
        }
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader icon={<Users className="h-5 w-5 text-sf-deep-orange" />} title={`Members (${members.length})`} />
          <ul className="divide-y divide-sf-border-gray">
            {members.map((m) => (
              <li key={m.membershipId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-primary text-white text-xs font-bold">
                  {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sf-ink">{m.name}</p>
                  <p className="truncate text-xs text-sf-muted-gray">{m.email}</p>
                </div>
                <Badge color={m.role === 'owner' ? 'dark' : m.role === 'admin' ? 'orange' : 'gray'}>
                  {m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
                {m.locationSharingOptIn ? <Badge color="green">Shares location</Badge> : null}
                {role === 'owner' && m.role !== 'owner' ? (
                  <Select
                    className="w-28 h-8 text-xs"
                    value={m.role}
                    onChange={(e) => void changeRole(m.membershipId, e.target.value as 'admin' | 'member')}
                    aria-label={`Change role for ${m.name}`}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Select>
                ) : null}
                {(isAdmin && m.role !== 'owner') ? (
                  <button
                    onClick={() => void removeMember(m.membershipId, m.name)}
                    className="text-xs text-sf-error hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sf-ink">Family actions</h3>
            <Button className="w-full" onClick={() => router.push('/family/invitations')}>
              <Plus className="h-4 w-4" /> Invite a family member
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => router.push('/updates')}>
              Share a family update
            </Button>
            {role !== 'owner' ? (
              <Button variant="danger" className="w-full" onClick={leaveFamily}>
                Leave this family
              </Button>
            ) : null}
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-sf-ink mb-2">Your role</h3>
            <p className="text-sm text-sf-muted-gray">
              You are {role === 'owner' ? 'the family owner' : role === 'admin' ? 'a family admin' : 'a family member'} of{' '}
              <span className="font-medium text-sf-charcoal">{family.name}</span>.
              {role === 'member' ? ' Admins and the owner manage members, invitations and settings.' : ''}
            </p>
          </Card>
        </div>
      </div>

      {/* Edit family modal */}
      <Modal open={Boolean(editable)} onClose={() => setEditable(null)} title="Edit family details">
        {editable ? (
          <form
            onSubmit={(e) => { e.preventDefault(); void saveFamily(); }}
            className="space-y-4"
          >
            <Field label="Family name">
              <Input value={editable.name} onChange={(e) => setEditable({ ...editable, name: e.target.value })} />
            </Field>
            <Field label="Description" hint="Optional — what makes your family… your family.">
              <Textarea rows={3} value={editable.description} onChange={(e) => setEditable({ ...editable, description: e.target.value })} />
            </Field>
            <Field label="Timezone">
              <Select value={editable.timezone} onChange={(e) => setEditable({ ...editable, timezone: e.target.value })}>
                {['UTC', 'Asia/Dhaka', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Los_Angeles'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditable(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

/* ---------- creation form for users with no family ---------- */

function CreateFamilyForm({ onDone }: { onDone: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Give your family a name (at least 2 characters).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/families', { name: name.trim(), description: description.trim() || undefined });
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the family');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="Create your family space"
        description="One space per family. Members join via secure invitations."
      />
      <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Family name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Hassan Family" autoFocus />
        </Field>
        <Field label="Description" hint="Optional.">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What brings you together?" />
        </Field>
        <Button type="submit" className="w-full" loading={saving}>
          <Plus className="h-4 w-4" /> Create family
        </Button>
      </form>
    </Card>
  );
}
