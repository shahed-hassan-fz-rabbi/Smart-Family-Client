'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { getSocket } from '@/lib/socket';
import { relativeTime } from '@/lib/format';
import type { NotificationT } from '@/lib/types';

const TYPE_STYLES: Record<string, { label: string; color: 'orange' | 'green' | 'amber' | 'gray' | 'red' | 'dark' }> = {
  task_assigned: { label: 'Task assigned', color: 'orange' },
  task_completed: { label: 'Task done', color: 'green' },
  reminder_due: { label: 'Reminder', color: 'amber' },
  family_invitation: { label: 'Invitation', color: 'orange' },
  event_change: { label: 'Calendar', color: 'amber' },
  family_update: { label: 'Update', color: 'gray' },
  chat_message: { label: 'Message', color: 'orange' },
  call_incoming: { label: 'Call', color: 'red' },
  system: { label: 'System', color: 'gray' },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationT[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: NotificationT[]; unreadCount: number }>('/notifications?limit=50');
      setItems(res.notifications);
      setUnread(res.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notifications');
    }
  }, []);

  useEffect(() => {
    void load();
    const socket = getSocket();
    const handler = () => void load();
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [load]);

  async function markRead(n: NotificationT) {
    try {
      await api.post(`/notifications/${n.id}/read`);
      await load();
    } catch {
      // failed silently — list refresh will show real state
    }
  }

  async function markAll() {
    try {
      await api.post('/notifications/read-all');
      await load();
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up.'}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />
      {error ? <Card><ErrorState message={error} onRetry={load} /></Card> : null}
      {items === null && !error ? (
        <LoadingState label="Loading notifications…" />
      ) : items?.length === 0 ? (
        <Card><EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications yet" description="Task assignments, reminders, invitations and calls will appear here." /></Card>
      ) : items ? (
        <div className="space-y-2">
          {items.map((n) => {
            const style = TYPE_STYLES[n.type] ?? { label: n.type, color: 'gray' as const };
            const inner = (
              <Card className={`p-4 transition-colors ${n.readAt ? '' : 'border-l-4 border-l-sf-orange'}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={style.color}>{style.label}</Badge>
                      {!n.readAt ? <span className="h-2 w-2 rounded-full bg-sf-orange" aria-label="Unread" /> : null}
                    </div>
                    <p className={`mt-1.5 text-sm ${n.readAt ? 'text-sf-charcoal' : 'font-semibold text-sf-ink'}`}>{n.title}</p>
                    {n.message ? <p className="text-xs text-sf-muted-gray mt-0.5">{n.message}</p> : null}
                    <p className="text-xs text-sf-muted-gray mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-sf-border-gray shrink-0" aria-hidden />
                </div>
              </Card>
            );
            return (
              <div
                key={n.id}
                onClick={() => void markRead(n)}
                className="cursor-pointer"
              >
                {n.linkPath ? (
                  <Link href={n.linkPath} className="block">{inner}</Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
