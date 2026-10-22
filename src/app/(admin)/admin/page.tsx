'use client';

import { useEffect, useState } from 'react';
import { Database, Users2, ListChecks, ScrollText } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Card, ErrorState, LoadingState } from '@/components/ui';

type Overview = {
  users: { total: number; suspended: number; deleted: number; superAdmins: number; newLast7Days: number };
  families: { total: number; memberships: number };
  activity: { tasks: number; reminders: number };
};

type Services = {
  db: { connected: boolean; pingMs: number | null };
  integrations: {
    gemini: { configured: boolean; model: string };
    livekit: { configured: boolean };
    googleSignIn: { configured: boolean };
  };
  process: { uptimeSeconds: number; nodeVersion: string; environment: string; memoryRssMb: number };
};

type AuditEntry = { id: string; actorEmail: string; action: string; createdAt: string };

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sf-muted-gray">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sf-ink">{value}</p>
      {hint ? <p className="text-xs text-sf-muted-gray mt-0.5">{hint}</p> : null}
    </Card>
  );
}

function ServiceBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge color={ok ? 'green' : 'gray'}>
      {label}: {ok ? 'Connected' : 'Not configured'}
    </Badge>
  );
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [services, setServices] = useState<Services | null>(null);
  const [recent, setRecent] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [o, s, a] = await Promise.all([
          api.get<Overview>('/admin/overview'),
          api.get<Services>('/admin/services'),
          api.get<{ entries: AuditEntry[] }>('/admin/audit?limit=6'),
        ]);
        if (!alive) return;
        setOverview(o);
        setServices(s);
        setRecent(a.entries);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load overview');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => typeof window !== 'undefined' && window.location.reload()} />;
  if (!overview || !services || !recent) return <LoadingState label="Loading platform overview…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sf-ink">Platform overview</h1>
        <p className="text-sm text-sf-muted-gray mt-1">
          Aggregated metrics only — private family messages and personal records are never exposed here.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Metric label="Users" value={overview.users.total} hint={`+${overview.users.newLast7Days} in last 7 days`} />
        <Metric label="Families" value={overview.families.total} hint={`${overview.families.memberships} memberships`} />
        <Metric label="Suspended accounts" value={overview.users.suspended} hint={overview.users.deleted + ' deactivated (soft-deleted)'} />
        <Metric label="Platform admins" value={overview.users.superAdmins} hint="Protected accounts" />
        <Metric label="Tasks" value={overview.activity.tasks} />
        <Metric label="Reminders" value={overview.activity.reminders} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-sf-deep-orange" aria-hidden />
          <h2 className="font-semibold text-sf-ink">Service health</h2>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ServiceBadge label="Database" ok={services.db.connected} />
          <span className="text-xs text-sf-muted-gray">
            {services.db.pingMs !== null ? `ping ${services.db.pingMs} ms · ` : ''}
            {services.process.environment} · node {services.process.nodeVersion} · uptime{' '}
            {Math.round(services.process.uptimeSeconds / 60)} min · {services.process.memoryRssMb} MB
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <ServiceBadge label="Gemini AI" ok={services.integrations.gemini.configured} />
          <ServiceBadge label="LiveKit calls" ok={services.integrations.livekit.configured} />
          <ServiceBadge label="Google sign-in" ok={services.integrations.googleSignIn.configured} />
        </div>
        {services.integrations.gemini.configured ? (
          <p className="text-xs text-sf-muted-gray mt-2">AI model: {services.integrations.gemini.model}</p>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="h-4 w-4 text-sf-deep-orange" aria-hidden />
          <h2 className="font-semibold text-sf-ink">Recent privileged actions</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-sf-muted-gray">No privileged actions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-sf-border-gray text-sm">
            {recent.map((e) => (
              <li key={e.id} className="py-2 flex items-center gap-2">
                <Users2 className="h-3.5 w-3.5 text-sf-muted-gray shrink-0" aria-hidden />
                <span className="font-medium text-sf-ink">{e.action}</span>
                <span className="text-sf-muted-gray">by {e.actorEmail}</span>
                <span className="ml-auto text-xs text-sf-muted-gray">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
