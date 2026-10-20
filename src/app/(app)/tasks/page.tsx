'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ListChecks, RotateCcw, Trash2, CheckCircle2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button, Card, Badge, EmptyState, ErrorState, Field, Input, LoadingState,
  Modal, Select, Textarea, Toast,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { formatDateTime, isOverdue, localToIso, isoToLocalInput } from '@/lib/format';

const STATUS_META: Record<string, { label: string; color: 'gray' | 'amber' | 'green' }> = {
  pending: { label: 'Pending', color: 'gray' },
  in_progress: { label: 'In progress', color: 'amber' },
  completed: { label: 'Completed', color: 'green' },
};

export default function TasksPage() {
  const { user } = useAuth();
  const { family, members, loading: famLoading } = useFamilyData();
  const [tasks, setTasks] = useState<TaskT[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [modal, setModal] = useState<'create' | null>(null);
  const [editing, setEditing] = useState<TaskT | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const params = new URLSearchParams({ familyId: family.id, limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      const { tasks } = await api.get<{ tasks: (TaskT & { created: string | null })[] }>(`/tasks?${params.toString()}`);
      setTasks(
        tasks.map((t) => ({
          ...t,
          isAssigneeMe: Boolean(user && t.assignee && t.assignee.id === user.id),
        })),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load tasks');
    }
  }, [family, statusFilter, user]);

  useEffect(() => {
    setTasks(null);
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!tasks) return null;
    return mineOnly ? tasks.filter((t) => t.isAssigneeMe) : tasks;
  }, [tasks, mineOnly, ]);

  async function toggleComplete(t: TaskT) {
    if (!family) return;
    try {
      await api.patch(`/tasks/${t.id}`, {
        familyId: family.id,
        status: t.status === 'completed' ? 'pending' : 'completed',
      });
      await load();
      setToast({ kind: 'success', message: t.status === 'completed' ? 'Task reopened.' : 'Task completed 🎉' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Update failed' });
    }
  }

  async function removeTask(t: TaskT) {
    if (!family) return;
    try {
      await api.delete(`/tasks/${t.id}?familyId=${family.id}`);
      await load();
      setToast({ kind: 'success', message: 'Task deleted.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Delete failed' });
    }
  }

  const overdueCount = (tasks ?? []).filter((t) => t.status !== 'completed' && t.dueDate && isOverdue(t.dueDate)).length;

  if (famLoading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Family Tasks"
        subtitle={family ? `${overdueCount ? `${overdueCount} overdue · ` : ''}Plan, assign, and track care responsibilities.` : 'Join a family to use tasks.'}
        action={
          family ? (
            <Button onClick={() => setModal('create')}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          ) : undefined
        }
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}

      {family ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </Select>
            <Button variant={mineOnly ? 'primary' : 'outline'} onClick={() => setMineOnly((v) => !v)}>
              My tasks
            </Button>
          </div>

          <TaskList tasks={visible} onToggle={toggleComplete} onEdit={setEditing} onDelete={removeTask} loading={tasks === null} error={error} onRetry={load} />

          <TaskModal
            open={modal === 'create'}
            onClose={() => setModal(null)}
            members={members}
            familyId={family!.id}
            meId={null}
            onDone={async (msg) => {
              setModal(null);
              setToast({ kind: 'success', message: msg });
              await load();
            }}
          />
          <EditModal
            task={editing}
            onClose={() => setEditing(null)}
            members={members}
            familyId={family!.id}
            onDone={async (msg) => {
              setEditing(null);
              setToast({ kind: 'success', message: msg });
              await load();
            }}
          />
        </>
      ) : null}
    </div>
  );
}

/* ------------ task list rendering ------------ */

export interface TaskT {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignee: { id: string; name: string } | null;
  isAssigneeMe?: boolean;
  createdBy?: 'user' | 'ai';
}

function TaskList({
  tasks, onToggle, onEdit, onDelete, loading, error, onRetry,
}: {
  tasks: TaskT[] | null;
  onToggle: (t: TaskT) => void;
  onEdit: (t: TaskT) => void;
  onDelete: (t: TaskT) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) return <LoadingState label="Loading tasks…" />;
  if (error) return <Card><ErrorState message={error} onRetry={onRetry} /></Card>;
  if (!tasks?.length) return <Card><EmptyState icon={<ListChecks className="h-10 w-10" />} title="No tasks found" description="Create a task or ask the AI assistant to plan one for you." /></Card>;

  return (
    <div className="space-y-3">
      {tasks.map((t) => {
        const done = t.status === 'completed';
        return (
          <Card key={t.id} className={`p-4 ${done ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-start gap-3">
              <button
                onClick={() => onToggle(t)}
                className={`mt-0.5 shrink-0 rounded-full p-1 ${done ? 'text-sf-success' : 'text-sf-border-gray hover:text-sf-orange'}`}
                title={done ? 'Reopen task' : 'Mark complete'}
                aria-label={done ? 'Reopen task' : 'Mark task complete'}
              >
                <CheckCircle2 className="h-6 w-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-sf-midnight ${done ? 'line-through' : ''}`}>{t.title}</p>
                {t.description ? <p className="mt-0.5 text-sm text-sf-muted-gray line-clamp-2">{t.description}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-sf-muted-gray">
                  <Badge color={STATUS_META[t.status]?.color ?? 'gray'}>{STATUS_META[t.status]?.label ?? t.status}</Badge>
                  <Badge color={t.priority === 'high' ? 'orange' : t.priority === 'low' ? 'gray' : 'amber'}>{t.priority}</Badge>
                  {t.dueDate ? (
                    <span className={t.status !== 'completed' && isOverdue(t.dueDate) ? 'text-sf-error font-medium' : ''}>
                      due {formatDateTime(t.dueDate)}
                    </span>
                  ) : null}
                  {t.assignee ? <span>· {t.assignee.name}</span> : <span>· unassigned</span>}
                  {t.createdBy === 'ai' ? <Badge color="dark">AI</Badge> : null}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(t)} className="p-2 text-sf-muted-gray hover:text-sf-deep-orange" title="Edit" aria-label={`Edit ${t.title}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(t)} className="p-2 text-sf-muted-gray hover:text-sf-error" title="Delete" aria-label={`Delete ${t.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------ create modal ------------ */

function TaskModal({
  open, onClose, members, familyId, meId, onDone,
}: {
  open: boolean;
  onClose: () => void;
  members: { userId: string; name: string }[];
  familyId: string;
  meId: string | null;
  onDone: (message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('me');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give the task a title.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/tasks', {
        familyId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assignee === 'me' ? undefined : assignee,
        dueDate: dueDate ? localToIso(dueDate) : undefined,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setAssignee('me');
      await onDone('Task created.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pick up prescriptions" autoFocus />
        </Field>
        <Field label="Description" hint="Optional details.">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Assign to">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="me">Me</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Due date" hint="Optional.">
          <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create task</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------ edit modal ------------ */

function EditModal({
  task, onClose, members, familyId, onDone,
}: {
  task: TaskT | null;
  onClose: () => void;
  members: { userId: string; name: string }[];
  familyId: string;
  onDone: (message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee?.id ?? '');
      setDueDate(isoToLocalInput(task.dueDate));
      setError(null);
    }
  }, [task]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/tasks/${task.id}`, {
        familyId,
        title: title.trim(),
        status,
        priority,
        assigneeId: assignee || undefined,
        dueDate: dueDate ? localToIso(dueDate) : undefined,
      });
      await onDone('Task updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(task)} onClose={onClose} title="Edit task">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
        </div>
        <Field label="Assign to">
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Due date"><Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}><RotateCcw className="h-4 w-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
