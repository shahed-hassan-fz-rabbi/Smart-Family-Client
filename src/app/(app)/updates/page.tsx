'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Pin, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, EmptyState, ErrorState, LoadingState, Modal, Textarea, Toast, Checkbox } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { relativeTime } from '@/lib/format';
import type { FamilyUpdateT } from '@/lib/types';

export default function UpdatesPage() {
  const { family, error: famError } = useFamilyData();
  const [updates, setUpdates] = useState<FamilyUpdateT[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const res = await api.get<{ updates: FamilyUpdateT[] }>(`/${family.id}/updates`);
      setUpdates(res.updates);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load updates');
    }
  }, [family]);

  useEffect(() => {
    setUpdates(null);
    void load();
  }, [load]);

  async function remove(id: string) {
    if (!family || !confirm('Delete this update?')) return;
    try {
      await api.delete(`/${family.id}/updates/${id}`);
      await load();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Delete failed' });
    }
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Family Updates" />
        <Card><ErrorState message={famError ?? 'Join a family to share updates.'} /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Family Updates"
        subtitle="Share news and status with everyone in your family."
        action={<Button onClick={() => setCompose(true)}><Plus className="h-4 w-4" /> Post an update</Button>}
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      {updates === null && !error ? (
        <LoadingState label="Loading updates…" />
      ) : updates?.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone className="h-10 w-10" />}
            title="No updates yet"
            description="Post the first family update — milestone, schedule note, or just a hello."
            action={<Button onClick={() => setCompose(true)}>Post an update</Button>}
          />
        </Card>
      ) : updates ? (
        <div className="space-y-3">
          {updates.map((u) => (
            <Card key={u.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white text-xs font-bold">
                  {u.author.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-sf-ink">{u.isMine ? 'You' : u.author}</p>
                    {u.pinned ? <Badge color="orange"><Pin className="inline h-3 w-3 mr-0.5" />Pinned</Badge> : null}
                    <span className="text-xs text-sf-muted-gray">{relativeTime(u.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-sf-charcoal whitespace-pre-line">{u.content}</p>
                </div>
                {u.isMine ? (
                  <button onClick={() => void remove(u.id)} className="p-2 text-sf-muted-gray hover:text-sf-error" aria-label="Delete update">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <ComposeModal
        open={compose}
        familyId={family.id}
        onClose={() => setCompose(false)}
        onDone={async () => {
          setCompose(false);
          setToast({ kind: 'success', message: 'Update posted.' });
          await load();
        }}
      />
    </div>
  );
}

function ComposeModal({ open, familyId, onClose, onDone }: { open: boolean; familyId: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError('Write something first.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post(`/${familyId}/updates`, { familyId, content: content.trim(), pinned });
      setContent('');
      setPinned(false);
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post the update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Post a family update">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening? Shared with everyone in your family."
          autoFocus
        />
        <Checkbox label="Pin this update" description="Pinned updates stay at the top." checked={pinned} onChange={setPinned} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Post update</Button>
        </div>
      </form>
    </Modal>
  );
}
