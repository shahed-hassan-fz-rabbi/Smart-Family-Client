'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Sparkles, MessagesSquare, Phone, ListChecks, CalendarDays, BellRing, Users,
  Bell, ChevronRight, ClipboardList, CircleCheck, Clock3, Home, TrendingUp,
} from 'lucide-react';
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

const OPEN_TASKS_LIMIT = 50; // fetched with head-room; counts stay truthful

export default function DashboardPage() {
  const { user } = useAuth();
  const { family, loading: famLoading } = useFamilyData();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  // Set the current time after mount so server HTML and first client render match.
  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!family) return;
    let cancelled = false;
    (async () => {
      try {
        const [tasks, events, reminders, notifications, updates] = await Promise.all([
          api.get<{ tasks: Task[] }>(`/tasks?familyId=${family.id}&status=pending&limit=${OPEN_TASKS_LIMIT}`),
          api.get<{ events: CalendarEventT[] }>(`/calendar/events?familyId=${family.id}`),
          api.get<{ reminders: Reminder[] }>(`/reminders?familyId=${family.id}&scope=upcoming`),
          api.get<{ notifications: NotificationT[] }>('/notifications?limit=5'),
          api.get<{ updates: FamilyUpdateT[] }>(`/${family.id}/updates`),
        ]);
        if (!cancelled) {
          const upcoming = events.events
            .filter((e) => new Date(e.endAt).getTime() > Date.now())
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          setData({
            openTasks: tasks.tasks,
            upcomingEvents: upcoming,
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
  }, [family, attempt]);

  if (famLoading) return <LoadingState label="Loading your dashboard…" />;

  /* ---------- No family space: focused onboarding, no zero-value widgets ---------- */
  if (!family) {
    const firstName = user?.name.split(' ')[0] ?? '';
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sf-ink">{firstName ? `Welcome, ${firstName}` : 'Welcome to Smart Family'}</h1>
          <p className="mt-1 text-sm text-sf-muted-gray">
            Your coordination hub for chats, calls, tasks, and care — everything in one place.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <Home className="h-8 w-8 text-sf-deep-orange" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-sf-ink">Create your family space</h2>
            <p className="mt-1 text-sm text-sf-muted-gray">
              Start a private space for your family, then invite your loved ones with a secure link.
            </p>
            <Link href="/family" className="mt-4 inline-flex h-10 items-center rounded-lg bg-sf-deep-orange px-4 text-sm font-semibold text-white hover:brightness-110">
              Create a family space
            </Link>
          </Card>
          <Card className="p-6">
            <Users className="h-8 w-8 text-sf-deep-orange" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-sf-ink">Have an invitation?</h2>
            <p className="mt-1 text-sm text-sf-muted-gray">
              A family member can invite you with a secure link — open the link they shared with you to join their space instantly.
            </p>
          </Card>
        </div>

        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-5 w-5 text-sf-orange shrink-0" aria-hidden />
            <p className="flex-1 min-w-0 text-sm text-sf-charcoal">
              <span className="font-semibold text-sf-ink">AI Assistant</span> works best inside a family space — it can plan tasks, set reminders, and coordinate care for you.
            </p>
            <Link href="/assistant" className="text-sm font-semibold text-sf-deep-orange hover:underline">
              Try it now
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------- Family space exists ---------- */
  const hour = now?.getHours() ?? 12;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name.split(' ')[0] ?? '';
  const today = now
    ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    : null;

  const openTasks = data?.openTasks ?? [];
  const openTaskCount = openTasks.length; // fetch cap is 50 — treated as full list
  const overdueCount = openTasks.filter((t) => t.status !== 'completed' && t.dueDate && isOverdue(t.dueDate)).length;
  const eventsToday = (data?.upcomingEvents ?? []).filter(
    (e) => now && new Date(e.startAt).toDateString() === now.toDateString(),
  );
  const unreadCount = (data?.recentNotifications ?? []).filter((n) => !n.readAt).length;

  return (
    <div>
      {/* Compact welcome */}
      <div className="mb-6">
        {today ? <p className="text-xs font-medium uppercase tracking-wider text-sf-muted-gray">{today}</p> : null}
        <h1 className="text-2xl font-bold text-sf-ink">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-sf-muted-gray">A quick view of what matters in {family.name} today.</p>
      </div>

      {/* Primary entries */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/assistant"
          className="flex items-start gap-3 rounded-xl bg-sf-midnight p-4 text-white hover:shadow-card-hover transition-shadow sm:col-span-1 sm:flex-col sm:row-span-1"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-sf-orange" aria-hidden />
          <span className="block">
            <span className="block text-sm font-semibold">AI Assistant</span>
            <span className="mt-0.5 block text-xs text-white/70">Plan tasks, reminders, and schedules by asking.</span>
          </span>
        </Link>
        <QuickAction href="/chats" icon={MessagesSquare} label="Family Chat" hint="Catch up on conversations" />
        <QuickAction href="/calls" icon={Phone} label="Calls" hint="Reach family by voice or video" />
      </div>

      {/* Real overview numbers (all computed from live data) */}
      {error ? (
        <Card className="mt-5">
          <ErrorState
            message={error}
            onRetry={() => {
              setError(null);
              setData(null);
              setAttempt((a) => a + 1);
            }}
          />
        </Card>
      ) : data ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={openTaskCount} label={`Open tasks${overdueCount ? ` · ${overdueCount} overdue` : ''}`} href="/tasks" icon={ListChecks} alert={overdueCount > 0} />
          <StatTile value={eventsToday.length} label="Events today" href="/calendar" icon={CalendarDays} />
          <StatTile value={(data.upcomingReminders ?? []).length} label="Active reminders" href="/reminders" icon={BellRing} />
          <StatTile value={unreadCount} label="Unread notices" href="/notifications" icon={Bell} />
        </div>
      ) : null}

      {error ? null : (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* Open tasks */}
          <Card className="lg:col-span-2">
            <CardHeader
              icon={<ClipboardList className="h-5 w-5 text-sf-deep-orange" />}
              title="Open tasks"
              action={<Link href="/tasks" className="text-sm font-medium text-sf-deep-orange hover:underline flex items-center">All tasks <ChevronRight className="h-4 w-4" /></Link>}
            />
            {data ? (
              openTasks.length ? (                <ul className="divide-y divide-sf-border-gray">
                  {openTasks
                    .slice()
                    .sort((a, b) => {
                      const aOd = a.dueDate && a.status !== 'completed' && isOverdue(a.dueDate) ? 1 : 0;
                      const bOd = b.dueDate && b.status !== 'completed' && isOverdue(b.dueDate) ? 1 : 0;
                      return bOd - aOd;
                    })
                    .slice(0, 5)
                    .map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                        <CircleCheck className="h-5 w-5 text-sf-border-gray shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-sf-ink">{t.title}</p>
                          <p className="text-xs text-sf-muted-gray truncate">
                            {t.assignee ? `Assigned to ${t.assignee.name}` : 'Unassigned'}
                            {t.dueDate ? ` · due ${formatDateTime(t.dueDate)}` : ''}
                          </p>
                        </div>
                        {t.status !== 'completed' && t.dueDate && isOverdue(t.dueDate) ? (
                          <Badge color="red">Overdue</Badge>
                        ) : t.priority === 'high' ? (
                          <Badge color="orange">High</Badge>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<ListChecks className="h-8 w-8" />}
                  title="No open tasks"
                  description="Everything is done — or nothing is planned yet."
                />
              )
            ) : (
              <LoadingState label="Loading tasks…" />
            )}
          </Card>

          {/* Upcoming schedule */}
          <div className="space-y-5">
            <Card>
              <CardHeader
                icon={<Clock3 className="h-5 w-5 text-sf-deep-orange" />}
                title="Upcoming events"
                action={<Link href="/calendar" className="text-xs font-medium text-sf-deep-orange hover:underline">Calendar</Link>}
              />
              {data?.upcomingEvents.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.upcomingEvents.slice(0, 4).map((e) => (
                    <li key={e.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-sf-ink truncate">{e.title}</p>
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
                action={<Link href="/reminders" className="text-xs font-medium text-sf-deep-orange hover:underline">All</Link>}
              />
              {data?.upcomingReminders.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.upcomingReminders.map((r) => (
                    <li key={r.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-sf-ink truncate">{r.title}</p>
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
                icon={<TrendingUp className="h-5 w-5 text-sf-deep-orange" />}
                title="Family updates"
                action={<Link href="/updates" className="text-xs font-medium text-sf-deep-orange hover:underline">View all</Link>}
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
                action={<Link href="/notifications" className="text-xs font-medium text-sf-deep-orange hover:underline">Inbox</Link>}
              />
              {data?.recentNotifications.length ? (
                <ul className="divide-y divide-sf-border-gray">
                  {data.recentNotifications.map((n) => (
                    <li key={n.id} className="px-5 py-3">
                      <p className={`text-sm text-pretty ${n.readAt ? 'text-sf-muted-gray' : 'font-medium text-sf-ink'}`}>{n.title}</p>
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
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, hint }: { href: string; icon: typeof Sparkles; label: string; hint?: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-sf-border-gray bg-sf-white p-4 shadow-card hover:shadow-card-hover hover:border-sf-orange transition-shadow"
    >
      <Icon className="h-5 w-5 shrink-0 text-sf-deep-orange" aria-hidden />
      <span className="block min-w-0">
        <span className="block text-sm font-semibold text-sf-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-sf-muted-gray">{hint}</span> : null}
      </span>
    </Link>
  );
}

function StatTile({
  value, label, href, icon: Icon, alert,
}: {
  value: number;
  label: string;
  href: string;
  icon: typeof ListChecks;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-sf-border-gray bg-sf-white px-4 py-3 shadow-card hover:border-sf-orange transition-colors"
    >
      <Icon className={`h-4 w-4 shrink-0 ${alert ? 'text-sf-error' : 'text-sf-deep-orange'}`} aria-hidden />
      <span className="min-w-0">
        <span className="block text-xl font-bold text-sf-ink tabular-nums">{value}</span>
        <span className="block text-xs text-sf-muted-gray leading-tight">{label}</span>
      </span>
    </Link>
  );
}
