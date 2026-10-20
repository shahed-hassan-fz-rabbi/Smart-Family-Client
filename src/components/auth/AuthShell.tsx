'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();

  function goBack() {
    // Honest fallback: history back if possible, otherwise the marketing home.
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }

  return (
    <div className="min-h-screen bg-grad-dark flex flex-col">
      {/* Top navbar: back button on the left corner, brand centered */}
      <header className="relative flex h-20 items-center px-4 sm:px-6">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <BrandMark />
          <span className="text-lg font-bold text-white">Smart Family</span>
        </Link>
        <Link
          href="/help"
          className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Help
        </Link>
      </header>

      {/* Centered card */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-hover p-6 sm:p-8">
            <h1 className="text-xl font-bold text-sf-midnight">{title}</h1>
            <p className="text-sm text-sf-muted-gray mt-1 mb-6">{subtitle}</p>
            {children}
          </div>
          {footer ? <p className="text-center text-sm text-white/80 mt-5">{footer}</p> : null}
        </div>
      </main>

      {/* Bottom footer */}
      <footer className="border-t border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Smart Family</span>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/help" className="hover:text-white">Help</Link>
        </div>
      </footer>
    </div>
  );
}
