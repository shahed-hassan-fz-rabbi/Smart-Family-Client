'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, ErrorState, LoadingState } from '@/components/ui';

type AuditEntry = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

type AuditResponse = { total: number; page: number; limit: number; entries: AuditEntry[] };

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageArg = page, query = q) => {
      try {
        const params = new URLSearchParams({ page: String(pageArg), limit: '25' });
        if (query.trim()) params.set('q', query.trim());
        const res = await api.get<AuditResponse>(`/admin/audit?${params.toString()}`);
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit log');
      }
    },
    [page, q],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-sf-ink">Audit log</h1>
        <p className="text-sm text-sf-muted-gray mt-1">
          Append-only record of every privileged action (suspensions, restorations, bootstrap promotions).
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
        <input
          className="flex-1 rounded-lg border border-sf-border-gray bg-sf-white px-3 py-2 text-sm text-sf-ink"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by action, e.g. platform.user"
          aria-label="Filter audit entries"
        />
      </form>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!data && !error ? <LoadingState label="Loading audit trail…" /> : null}

      {data ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-sf-muted-gray border-b border-sf-border-gray">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sf-muted-gray">
                      No audit entries match this filter.
                    </td>
                  </tr>
                ) : null}
                {data.entries.map((a) => (
                  <tr key={a.id} className="border-b border-sf-border-gray/60 align-top">
                    <td className="px-4 py-3 font-medium text-sf-ink">
                      {a.action}
                      {a.meta && typeof a.meta.reason === 'string' ? (
                        <p className="text-xs text-sf-muted-gray font-normal mt-0.5">"{(a.meta as { reason: string }).reason}"</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sf-charcoal">{a.actorEmail}</td>
                    <td className="px-4 py-3 text-xs text-sf-muted-gray">
                      {a.targetType ?? '—'}
                      {a.targetId ? <span className="block truncate max-w-[16rem]">{a.targetId}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-sf-muted-gray">
                      {new Date(a.createdAt).toLocaleString()}
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
          <button
            className="rounded-lg border border-sf-border-gray bg-sf-white px-3 py-1.5 text-sf-charcoal disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Previous
          </button>
          <span className="text-sf-muted-gray">
            Page {page} of {totalPages} ({data.total} entries)
          </span>
          <button
            className="rounded-lg border border-sf-border-gray bg-sf-white px-3 py-1.5 text-sf-charcoal disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}
