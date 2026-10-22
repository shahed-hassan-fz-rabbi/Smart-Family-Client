'use client';

import { EmptyState } from '@/components/ui';

/**
 * Honest state: the platform does not currently have an end-user reporting /
 * moderation system (no abuse-report model or endpoints exist in the backend).
 * When a real reporting feature is built, this page will surface it — we never
 * show fake or mock data.
 */
export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-sf-ink">Reports</h1>
      </div>
      <EmptyState
        title="No reporting system exists yet"
        description="The platform currently has no end-user abuse/content reporting feature, so there is nothing to review. This page will show real reports once that system is implemented."
      />
    </div>
  );
}
