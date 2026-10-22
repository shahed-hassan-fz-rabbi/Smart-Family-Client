'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sf-theme';
const THEME_EVENT = 'sf-theme-change';

function readStored(): ThemeChoice {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

function apply(choice: ThemeChoice): void {
  const dark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/**
 * Accessible theme switcher (Light / Dark / System).
 * - Persists to localStorage under `sf-theme`.
 * - Multiple instances stay in sync via a custom window event.
 * - `system` follows the OS live (including while the menu is closed).
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>('light');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setChoice(readStored());

    const sync = () => setChoice(readStored());
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // While the user picked "system", follow OS changes live.
  useEffect(() => {
    if (choice !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [choice]);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (next: ThemeChoice) => {
    setChoice(next);
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
    window.dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
  };

  // Effective theme drives the button icon (mounted-only to avoid mismatch).
  const effectiveDark =
    choice === 'dark' ||
    (choice === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (!mounted) {
    return (
      <div className={`h-9 w-9 ${className}`} aria-hidden />
      );
  }

  const options: Array<{ value: ThemeChoice; label: string; icon: ReactElement }> = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" aria-hidden /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" aria-hidden /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${options.find((o) => o.value === choice)?.label ?? 'light'}. Change theme`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-sf-border-gray bg-sf-white text-sf-charcoal transition-colors hover:bg-sf-light-orange"
      >
        {effectiveDark ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-sf-border-gray bg-sf-white py-1 shadow-card"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={choice === o.value}
              onClick={() => select(o.value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-sf-light-orange ${
                choice === o.value ? 'font-semibold text-sf-deep-orange' : 'text-sf-charcoal'
              }`}
            >
              {o.icon}
              {o.label}
              {choice === o.value && <span className="ml-auto text-xs" aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
