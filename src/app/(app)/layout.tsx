'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Users,
  Sparkles,
  MessagesSquare,
  Phone,
  ListChecks,
  CalendarDays,
  BellRing,
  Megaphone,
  ShieldCheck,
  HeartHandshake,
  User,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { IncomingCallWatcher } from '@/components/IncomingCallWatcher';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spinner } from '@/components/ui';

const NAV = [
  { section: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Family',
    items: [
      { href: '/family', label: 'Family Space', icon: Home },
      { href: '/family/invitations', label: 'Invitations', icon: Users },
      { href: '/updates', label: 'Family Updates', icon: Megaphone },
    ],
  },
  {
    section: 'AI & Communication',
    items: [
      { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
      { href: '/chats', label: 'Family Chats', icon: MessagesSquare },
      { href: '/calls', label: 'Calls', icon: Phone },
    ],
  },
  {
    section: 'Coordination',
    items: [
      { href: '/tasks', label: 'Tasks', icon: ListChecks },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/reminders', label: 'Reminders', icon: BellRing },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    section: 'Care & Safety',
    items: [
      { href: '/safety', label: 'Safety', icon: ShieldCheck },
      { href: '/health', label: 'Health & Wellbeing', icon: HeartHandshake },
    ],
  },
  {
    section: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/help', label: 'Help & Support', icon: HelpCircle },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, family, loading, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-sf-cream">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-sf-cream p-4">
        <div className="text-center space-y-4">
          <p className="text-sf-ink font-semibold">Your session has ended.</p>
          <Link href="/login" className="text-sf-deep-orange underline font-medium">
            Sign in again
          </Link>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-grad-light">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-sf-white/90 backdrop-blur border-b border-sf-border-gray">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            className="lg:hidden text-sf-charcoal p-2 -ml-2"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandMark />
            <span className="hidden sm:block font-bold text-sf-ink">Smart Family</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {family ? (
              <Link
                href="/family"
                className="hidden sm:inline-flex max-w-[14rem] items-center truncate rounded-full bg-sf-light-orange px-2.5 py-1 text-xs font-medium text-sf-deep-orange hover:brightness-95"
                title={`Family space: ${family.name}`}
              >
                {family.name}
              </Link>
            ) : (
              <Link
                href="/family"
                className="hidden sm:inline-flex items-center rounded-lg border border-sf-border-gray px-2.5 py-1 text-xs font-medium text-sf-deep-orange hover:bg-sf-light-orange"
              >
                Create your family space
              </Link>
            )}
            {user.role === 'super_admin' ? (
              <Link
                href="/admin"
                className="hidden sm:inline-flex h-8 items-center rounded-lg border border-sf-border-gray px-3 text-xs font-semibold text-sf-deep-orange hover:bg-sf-light-orange"
              >
                Admin
              </Link>
            ) : null}
            <Link
              href="/profile"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-grad-primary text-white text-xs font-bold hover:brightness-110"
              title={user.name}
            >
              <span aria-hidden>{initials}</span>
              <span className="sr-only">Your profile</span>
            </Link>
            <ThemeToggle />
            <button
              onClick={() => void logout()}
              className="rounded-lg p-2 text-sf-muted-gray hover:bg-sf-cream hover:text-sf-error"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile nav backdrop */}
        {navOpen ? (
          <div className="fixed inset-0 z-20 bg-sf-midnight/40 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden />
        ) : null}
        {/* Sidebar */}
        <nav
          className={`${
            navOpen ? 'block' : 'hidden'
          } fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-sf-white border-r border-sf-border-gray pt-16 lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:pt-0 lg:block`}
          aria-label="Main navigation"
        >
          <div className="p-4 space-y-5">
            {NAV.map((group) => (
              <div key={group.section}>
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sf-muted-gray">
                  {group.section}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setNavOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                            active
                              ? 'bg-sf-light-orange text-sf-deep-orange font-semibold'
                              : 'text-sf-charcoal hover:bg-sf-cream'
                          }`}
                          aria-current={active ? 'page' : undefined}
                        >
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <IncomingCallWatcher />
    </div>
  );
}

