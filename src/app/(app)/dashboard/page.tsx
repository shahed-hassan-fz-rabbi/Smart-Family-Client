'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Sparkles, MessagesSquare, Phone, ListChecks, CalendarDays, BellRing, Users,
  Bell, ChevronRight, Plus, ClipboardList, CircleCheck, Clock3,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Badge, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { formatDateTime, isOverdue } from '@/lib/format';
import type { Task, CalendarEventT, Reminder, NotificationT, FamilyUpdateT } from '@/lib/types';

interface DashboardData {
  openTasks: Task[];
  upcomingEvents: CalendarEventT[];
  upcomingReminders: Reminder[];
  recentNotifications: NotificationT[];
  recentUpdates: FamilyUpdateT[];
}
export default function DashboardPage() {
  const { user } = useAuth();
  const { family, loading: famLoading } = useFamilyData();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!family) return;
    let cancelled = false;
    (async () => {
      try {
        const [tasks, events, reminders, notifications, updates] = await Promise.all([
          api.get<{ tasks: Task[] }>(`/tasks?familyId=${family.id}&status=pending&limit=6`),
          api.get<{ events: CalendarEventT[] }>(`/calendar/events?familyId=${family.id}`),
          api.get<{ reminders: Reminder[] }>(`/reminders?familyId=${family.id}&scope=upcoming`),
          api.get<{ notifications: NotificationT[] }>('/notifications?limit=5'),
          api.get<{ updates: FamilyUpdateT[] }>(`/${family.id}/updates`),
        ]);
        if (!cancelled) {
          setData({
            openTasks: tasks.tasks,
            upcomingEvents: events.events
              .filter((e) => new Date(e.endAt).getTime() > Date.now())
              .slice(0, 4),
            upcomingReminders: reminders.reminders
              .filter((r) => r.status === 'pending')
              .slice(0, 4),
            recentNotifications: notifications.notifications,
            recentUpdates: updates.updates.slice(0, 3),
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [family]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.name.split(' ')[0] ?? ''} 👋`}
        subtitle={
          family
            ? `Here's what's happening in ${family.name}.`
            : 'Create or join a family space to unlock your dashboard.'
        }
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction href="/assistant" icon={Sparkles} label="AI Assistant" primary />
        <QuickAction href="/chats" icon={MessagesSquare} label="Family Chat" />
        <QuickAction href="/calls" icon={Phone} label="Calls" />
        <QuickAction href="/tasks" icon={Plus} label="New Task" />
      </div>

      {!family && !famLoading ? (
        <Card className="mt-6">
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="No family space yet"
            description="Create a family space or accept an invitation to connect with your loved ones."
            action={
              <Link href="/family" className="inline-flex h-10 items-center rounded-lg bg-sf-deep-orange px-4 text-sm font-semibold text-white hover:brightness-110">
                Get started
              </Link>
            }
          />
        </Card>
      ) : null}

      {error ? <Card className="mt-6"><ErrorState message={error} /></Card> : null}

      {family && !error ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader
              icon={<ClipboardList className="h-5 w-5 text-sf-deep-orange" />}
              title="Open tasks"
              action={<Link href="/tasks" className="text-sm text-sf-deep-orange hover:underline flex items-center">All tasks <ChevronRight className="h-4 w-4" /></Link>}
            />
            {data ? (
              data.openTasks.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.openTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <CircleCheck className="h-5 w-5 text-sf-border-gray shrink-0" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sf-midnight">{t.title}</p>
                        <p className="text-xs text-sf-muted-gray">
                          {t.assignee ? `Assigned to ${t.assignee.name}` : 'Unassigned'}
                          {t.dueDate ? ` · due ${formatDateTime(t.dueDate)}` : ''}
                        </p>
                      </div>
                      {t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed' ? (
                        <Badge color="red">Overdue</Badge>
                      ) : t.priority === 'high' ? (
                        <Badge color="orange">High</Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No open tasks" description="Everything is done — or nothing is planned yet." icon={<ListChecks className="h-8 w-8" />} />
              )
            ) : (
              <LoadingState label="Loading tasks…" />
            )}
          </Card>

          {/* Reminders + Events */}
          <div className="space-y-5">
            <Card>
              <CardHeader
                icon={<Clock3 className="h-5 w-5 text-sf-deep-orange" />}
                title="Upcoming events"
                action={<Link href="/calendar" className="text-xs text-sf-deep-orange hover:underline">Calendar</Link>}
              />
              {data?.upcomingEvents.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.upcomingEvents.map((e) => (
                    <li key={e.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-sf-midnight truncate">{e.title}</p>
                      <p className="text-xs text-sf-muted-gray">{formatDateTime(e.startAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No upcoming events" icon={<CalendarDays className="h-8 w-8" />} />
              )}
            </Card>
            <Card>
              <CardHeader
                icon={<BellRing className="h-5 w-5 text-sf-deep-orange" />}
                title="Reminders"
                action={<Link href="/reminders" className="text-xs text-sf-deep-orange hover:underline">All</Link>}
              />
              {data?.upcomingReminders.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.upcomingReminders.map((r) => (
                    <li key={r.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-sf-midnight truncate">{r.title}</p>
                      <p className="text-xs text-sf-muted-gray">{formatDateTime(r.dueAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No pending reminders" icon={<Bell className="h-8 w-8" />} />
              )}
            </Card>
          </div>

          {/* Updates + notifications */}
          <div className="lg:col-span-3 grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Family updates"
                action={<Link href="/updates" className="text-xs text-sf-deep-orange hover:underline">View all</Link>}
              />
              {data?.recentUpdates.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.recentUpdates.map((u) => (
                    <li key={u.id} className="px-5 py-3">
                      <p className="text-sm text-sf-charcoal line-clamp-2">{u.content}</p>
                      <p className="text-xs text-sf-muted-gray mt-1">— {u.isMine ? 'You' : u.author}, {formatDateTime(u.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No updates yet" description="Share how things are going with your family." />
              )}
            </Card>
            <Card>
              <CardHeader
                title="Recent notifications"
                action={<Link href="/notifications" className="text-xs text-sf-deep-orange hover:underline">Inbox</Link>}
              />
              {data?.recentNotifications.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.recentNotifications.map((n) => (
                    <li key={n.id} className="px-5 py-3">
                      <p className={`text-sm ${n.readAt ? 'text-sf-muted-gray' : 'font-medium text-sf-midnight'}`}>{n.title}</p>
                      <p className="text-xs text-sf-muted-gray">{formatDateTime(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No notifications" icon={<Bell className="h-8 w-8" />} />
              )}
            </Card>
          </div>
        </div>
      ) : null}
      {famLoading && <LoadingState />}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, primary }: { href: string; icon: typeof Sparkles; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold transition-shadow ${
        primary
          ? 'bg-sf-midnight text-white border-sf-midnight hover:shadow-card-hover'
          : 'bg-white text-sf-charcoal border-sf-border-gray shadow-card hover:shadow-card-hover'
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${primary ? 'text-sf-orange' : 'text-sf-deep-orange'}`} aria-hidden />
      {label}
    </Link>
  );
}
