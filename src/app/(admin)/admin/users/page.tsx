'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, Button, Card, ErrorState, Field, LoadingState, Modal, Spinner, Textarea, Toast } from '@/components/ui';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'super_admin';
  suspendedAt: string | null;
  suspendReason: string | null;
  createdAt: string;
};

type UsersResponse = { total: number; page: number; limit: number; users: AdminUser[] };

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [bidden, setBidden] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [confirmRestore, setConfirmRestore] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(
    async (pageArg = page, query = q) => {
      try {
        const params = new URLSearchParams({ page: String(pageArg), limit: '25' });
        if (query.trim()) params.set('q', query.trim());
        const res = await api.get<UsersResponse>(`/admin/users?${params.toString()}`);
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      }
    },
    [page, q],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function executeSuspend() {
    if (!bidden) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${bidden.id}/suspend`, { reason: reason.trim() });
      setToast({ kind: 'success', message: `${bidden.email} has been suspended.` });
      setBidden(null);
      setReason('');
      await load();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Suspend failed' });
    } finally {
      setBusy(false);
    }
  }

  async function executeRestore() {
    if (!confirmRestore) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${confirmRestore.id}/restore`);
      setToast({ kind: 'success', message: `${confirmRestore.email} has been restored.` });
      setConfirmRestore(null);
      await load();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof Error ? err.message : 'Restore failed' });
    } finally {
      setBusy(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-sf-ink">User accounts</h1>
        <p className="text-sm text-sf-muted-gray mt-1">
          Suspend or restore registrations. Platform administrator accounts can never be suspended — that guard is
          enforced on the backend.
        </p>
      </div>

      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void load(1, q);
        }}
      >
        <div className="flex-1">
          <Field label="Search name or email">
            <input
              className="w-full rounded-lg border border-sf-border-gray bg-sf-white px-3 py-2 text-sm text-sf-ink"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. rafi@example.com"
              aria-label="Search users"
            />
          </Field>
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      {toast ? <Toast kind={toast.kind} message={toast.message} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!data && !error ? <LoadingState label="Loading users…" /> : null}

      {data ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-sf-muted-gray border-b border-sf-border-gray">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sf-muted-gray">
                      No accounts match this search.
                    </td>
                  </tr>
                ) : null}
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-sf-border-gray/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sf-ink">{u.name}</p>
                      <p className="text-xs text-sf-muted-gray">{u.email}</p>
                      {u.suspendReason ? (
                        <p className="text-xs text-sf-error mt-1">Reason: {u.suspendReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'super_admin' ? (
                        <Badge color="orange">Platform admin</Badge>
                      ) : (
                        <span className="text-sf-muted-gray">Family user</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.suspendedAt ? (
                        <Badge color="red">Suspended</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sf-muted-gray text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === 'super_admin' ? (
                        <span className="text-xs text-sf-muted-gray">Protected</span>
                      ) : u.suspendedAt ? (
                        <Button variant="secondary" onClick={() => setConfirmRestore(u)}>
                          Restore
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => setBidden(u)}>
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {data && data.total > data.limit ? (
        <div className="flex items-center gap-3 text-sm">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ← Previous
          </Button>
          <span className="text-sf-muted-gray">
            Page {page} of {totalPages} ({data.total} accounts)
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next →
          </Button>
        </div>
      ) : null}

      <Modal open={Boolean(bidden)} onClose={() => !busy && setBidden(null)} title={`Suspend ${bidden?.email ?? ''}`}>
        <p className="text-sm text-sf-muted-gray mb-3">
          A suspended user is signed out of all features immediately (the backend enforces this on every request).
          Suspension is reversible — nothing is deleted.
        </p>
        <Field label="Reason (stored in the audit log)">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={300} />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setBidden(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void executeSuspend()} disabled={busy || reason.trim().length < 3}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Suspend account'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmRestore)}
        onClose={() => !busy && setConfirmRestore(null)}
        title={`Restore ${confirmRestore?.email ?? ''}`}
      >
        <p className="text-sm text-sf-muted-gray mb-4">
          The account regains normal family access immediately. This action is recorded in the audit log.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmRestore(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void executeRestore()} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Restore account'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
