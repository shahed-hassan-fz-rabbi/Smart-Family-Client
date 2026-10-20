'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-sf-midnight/95 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="font-bold text-white">Smart Family</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80" aria-label="Primary">
          <Link href="/" className="hover:text-white">Home</Link>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/90 hover:text-white font-medium">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-lg bg-grad-primary px-4 text-sm font-semibold text-white hover:brightness-110 transition"
          >
            Get Started
          </Link>
        </div>
        <button className="md:hidden ml-auto text-white p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <nav className="md:hidden border-t border-white/10 px-4 py-3 space-y-2 bg-sf-midnight" aria-label="Mobile">
          <Link href="/" className="block py-1 text-white/80">Home</Link>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block py-1 text-white/80">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="block py-1 text-white/80">Sign In</Link>
          <Link href="/signup" className="block py-1 font-semibold text-sf-orange">Get Started</Link>
        </nav>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-sf-midnight text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="font-bold text-white">Smart Family</span>
            </div>
            <p className="text-sm">One Family. One Platform. Smarter Care with AI.</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-sm">Product</p>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-sm">Account</p>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/signup" className="hover:text-white">Get Started</Link></li>
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/help" className="hover:text-white">Help &amp; Support</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-sm">Legal &amp; Trust</p>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} Smart Family. Smart Family is a coordination tool — it does not replace emergency services, medical care, or professional advice.
        </div>
      </div>
    </footer>
  );
}
