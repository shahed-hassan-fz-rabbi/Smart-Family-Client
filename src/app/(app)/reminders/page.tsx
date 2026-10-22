'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Plus, CheckCircle2, XCircle, Trash2, Repeat } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button, Card, Badge, EmptyState, ErrorState, Field, Input, LoadingState,
  Modal, Select, Textarea, Toast, Checkbox,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { formatDateTime, localToIso } from '@/lib/format';
import type { Reminder } from '@/lib/types';

export default function RemindersPage() {
  const { family } = useFamilyData();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const { reminders } = await api.get<{ reminders: Reminder[] }>(`/reminders?familyId=${family.id}`);
      setReminders(reminders);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load reminders');
    }
  }, [family]);

  useEffect(() => {
    setReminders(null);
    void load();
  }, [load]);

  async function setStatus(r: Reminder, status: 'completed' | 'dismissed' | 'pending') {
    if (!family) return;
    try {
      await api.patch(`/reminders/${r.id}`, { familyId: family.id, status });
      await load();
      setToast({ kind: 'success', message: status === 'completed' ? 'Reminder completed.' : 'Reminder dismissed.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Update failed' });
    }
  }

  async function remove(r: Reminder) {
    if (!family) return;
    try {
      await api.delete(`/reminders/${r.id}?familyId=${family.id}`);
      await load();
      setToast({ kind: 'success', message: 'Reminder deleted.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Delete failed' });
    }
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Reminders" />
        <Card><ErrorState message="Join a family to create reminders." /></Card>
      </div>
    );
  }

  const pending = (reminders ?? []).filter((r) => r.status === 'pending');
  const past = (reminders ?? []).filter((r) => r.status !== 'pending');

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="Server-side reminders fire for the whole family or just you — even when the app is closed."
        action={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> New reminder</Button>}
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      {reminders === null ? (
        <LoadingState label="Loading reminders…" />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sf-muted-gray">Upcoming</h2>
            {pending.length ? (
              <div className="space-y-3">
                {pending.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <BellRing className="h-5 w-5 text-sf-deep-orange mt-0.5 shrink-0" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sf-ink">{r.title}</p>
                        {r.notes ? <p className="text-sm text-sf-muted-gray">{r.notes}</p> : null}
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-sf-muted-gray">
                          <span>{formatDateTime(r.dueAt)}</span>
                          {r.recurrence !== 'none' ? (
                            <Badge color="orange"><Repeat className="mr-1 inline h-3 w-3" />{r.recurrence}</Badge>
                          ) : null}
                          <Badge color={r.remindFamily ? 'dark' : 'gray'}>{r.remindFamily ? 'Whole family' : r.createdBy === 'ai' ? 'AI · for you' : r.isMine ? 'For you' : 'Assigned'}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setStatus(r, 'completed')} className="p-2 text-sf-muted-gray hover:text-sf-success" title="Mark completed" aria-label="Mark completed">
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button onClick={() => setStatus(r, 'dismissed')} className="p-2 text-sf-muted-gray hover:text-sf-warning" title="Dismiss" aria-label="Dismiss">
                          <XCircle className="h-5 w-5" />
                        </button>
                        {r.isMine ? (
                          <button onClick={() => remove(r)} className="p-2 text-sf-muted-gray hover:text-sf-error" title="Delete" aria-label="Delete">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><EmptyState icon={<BellRing className="h-10 w-10" />} title="No pending reminders" description="Create one below, or ask the AI assistant — try “Remind our family every Sunday to review next week's schedule”." /></Card>
            )}
          </section>
          {past.length ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sf-muted-gray">Completed / dismissed</h2>
              <div className="space-y-2">
                {past.map((r) => (
                  <Card key={r.id} className="p-3 opacity-70">
                    <div className="flex items-center gap-3">
                      <p className={`flex-1 truncate text-sm ${r.status === 'completed' ? 'line-through text-sf-muted-gray' : 'text-sf-muted-gray'}`}>{r.title}</p>
                      <Badge color={r.status === 'completed' ? 'green' : 'gray'}>{r.status}</Badge>
                      {r.isMine ? (
                        <button onClick={() => remove(r)} className="p-1.5 text-sf-muted-gray hover:text-sf-error" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ReminderModal
        open={modal}
        familyId={family.id}
        onClose={() => setModal(false)}
        onDone={async () => {
          setModal(false);
          setToast({ kind: 'success', message: 'Reminder created.' });
          await load();
        }}
      />
    </div>
  );
}

function ReminderModal({
  open, familyId, onClose, onDone,
}: {
  open: boolean;
  familyId: string;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [remindFamily, setRemindFamily] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Give the reminder a title.'); return; }
    const iso = localToIso(dueAt);
    if (!iso) { setError('Pick a date and time.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/reminders', {
        familyId,
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueAt: iso,
        recurrence,
        remindFamily,
        recipientIds: [],
      });
      setTitle('');
      setNotes('');
      setDueAt('');
      setRecurrence('none');
      setRemindFamily(false);
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the reminder');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New reminder">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review next week's schedule" autoFocus /></Field>
        <Field label="Notes" hint="Optional."><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Field label="When"><Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
        <Field label="Repeat">
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            <option value="none">One time</option>
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </Select>
        </Field>
        <Checkbox
          label="Remind the whole family"
          description="Everyone in the family gets this reminder, not just you."
          checked={remindFamily}
          onChange={setRemindFamily}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create reminder</Button>
        </div>
      </form>
    </Modal>
  );
}
