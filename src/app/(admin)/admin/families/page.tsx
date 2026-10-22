'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, ErrorState, LoadingState } from '@/components/ui';

type AdminFamily = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  owner: { id: string; name: string; email: string } | null;
};

type FamiliesResponse = { total: number; page: number; limit: number; families: AdminFamily[] };

export default function AdminFamiliesPage() {
  const [data, setData] = useState<FamiliesResponse | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageArg = page, query = q) => {
      try {
        const params = new URLSearchParams({ page: String(pageArg), limit: '25' });
        if (query.trim()) params.set('q', query.trim());
        const res = await api.get<FamiliesResponse>(`/admin/families?${params.toString()}`);
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load families');
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
        <h1 className="text-xl font-bold text-sf-ink">Families</h1>
        <p className="text-sm text-sf-muted-gray mt-1">
          Read-only structural view (names, sizes, owners). Family conversations and personal records are never
          accessible from here.
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
          placeholder="Search family name"
          aria-label="Search families"
        />
      </form>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!data && !error ? <LoadingState label="Loading families…" /> : null}

      {data ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-sf-muted-gray border-b border-sf-border-gray">
                  <th className="px-4 py-3">Family</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.families.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sf-muted-gray">
                      No families match this search.
                    </td>
                  </tr>
                ) : null}
                {data.families.map((f) => (
                  <tr key={f.id} className="border-b border-sf-border-gray/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sf-ink">{f.name}</p>
                      {f.description ? (
                        <p className="text-xs text-sf-muted-gray line-clamp-1">{f.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sf-charcoal">{f.memberCount}</td>
                    <td className="px-4 py-3">
                      {f.owner ? (
                        <>
                          <p className="text-sf-charcoal">{f.owner.name}</p>
                          <p className="text-xs text-sf-muted-gray">{f.owner.email}</p>
                        </>
                      ) : (
                        <span className="text-xs text-sf-muted-gray">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-sf-muted-gray">
                      {new Date(f.createdAt).toLocaleDateString()}
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
            Page {page} of {totalPages} ({data.total} families)
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
