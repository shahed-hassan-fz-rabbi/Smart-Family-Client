'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Home,
  ScrollText,
  FileWarning,
  LogOut,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spinner } from '@/components/ui';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/families', label: 'Families', icon: Home },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/reports', label: 'Reports', icon: FileWarning },
];

/**
 * Layout for the Platform Super Admin dashboard. Page-level authorization for
 * every privileged action happens on the backend API; this layout only hides
 * the shell from non-admins (honest "Not authorized" state — never fake data).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-sf-cream grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <BrandMark size={44} />
          <Spinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sf-cream grid place-items-center p-4">
        <div className="text-center space-y-4">
          <BrandMark size={48} className="mx-auto block" />
          <p className="text-sf-ink font-semibold">You need to sign in to access this area.</p>
          <Link href="/login?next=/admin" className="text-sf-deep-orange underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-sf-cream grid place-items-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <ShieldAlert className="h-10 w-10 text-sf-deep-orange mx-auto" aria-hidden />
          <h1 className="text-lg font-bold text-sf-ink">Not authorized</h1>
          <p className="text-sm text-sf-muted-gray">
            This dashboard is restricted to platform administrators. Your account has regular family access only.
          </p>
          <Link href="/dashboard" className="text-sf-deep-orange underline font-medium">
            Back to your family space
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sf-cream">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-sf-midnight/95 backdrop-blur border-b border-white/10">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            className="lg:hidden text-white p-2 -ml-2"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle admin navigation"
            aria-expanded={navOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <BrandMark size={32} />
            <span className="hidden sm:block font-bold text-white">Platform Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-white/60 text-xs">{user.email}</span>
            <ThemeToggle />
            <button
              onClick={() => void logout().then(() => router.push('/'))}
              className="text-white/70 hover:text-white p-2"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — dark in both themes (consistent with brand) */}
        <nav
          className={`${
            navOpen ? 'block' : 'hidden'
          } fixed inset-y-0 left-0 z-30 w-60 overflow-y-auto bg-sf-midnight border-r border-white/10 pt-16 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:pt-0`}
          aria-label="Admin navigation"
        >
          <div className="p-4">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        active ? 'bg-white/10 font-semibold text-sf-orange' : 'text-white/70 hover:bg-white/5 hover:text-white'
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
            <p className="px-2.5 pt-6 text-[11px] leading-relaxed text-white/40">
              Every action here is audited. Private family messages and personal records are never accessible from this dashboard.
            </p>
          </div>
        </nav>

        {/* Content */}
        <main className={`flex-1 min-w-0 px-4 sm:px-6 py-6 ${navOpen ? 'pt-20 lg:pt-6' : ''}`}>
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
