import { ButtonHTMLAttributes, forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect } from 'react';import { Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

/* ---------------- Button ---------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-sf-deep-orange text-white hover:brightness-110 shadow-sm',
  secondary: 'bg-sf-cream text-sf-deep-orange hover:bg-sf-light-orange border border-sf-light-orange',
  ghost: 'bg-transparent text-sf-charcoal hover:bg-sf-cream',
  danger: 'bg-sf-error text-white hover:brightness-110',
  outline: 'bg-sf-white text-sf-charcoal border border-sf-border-gray hover:border-sf-orange hover:text-sf-deep-orange',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-orange disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`bg-sf-white rounded-xl border border-sf-border-gray shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, icon }: { title: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-sf-border-gray">
      <div className="flex items-center gap-2 text-sf-ink font-semibold">
        {icon}
        <h3 className="text-base">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/* ---------------- Inputs ---------------- */

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-sf-border-gray bg-sf-white px-3 text-sm text-sf-ink placeholder:text-sf-muted-gray focus:border-sf-orange focus:outline-none focus:ring-2 focus:ring-sf-light-orange disabled:bg-sf-cream ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-sf-border-gray bg-sf-white px-3 py-2 text-sm text-sf-ink placeholder:text-sf-muted-gray focus:border-sf-orange focus:outline-none focus:ring-2 focus:ring-sf-light-orange ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full cursor-pointer rounded-lg border border-sf-border-gray bg-sf-white px-3 text-sm text-sf-ink focus:border-sf-orange focus:outline-none focus:ring-2 focus:ring-sf-light-orange ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-sf-charcoal">{label}</span>
      {children}
      {hint && !error ? <span className="block text-xs text-sf-muted-gray">{hint}</span> : null}
      {error ? <span className="block text-xs text-sf-error">{error}</span> : null}
    </label>
  );
}

/* ---------------- Badge ---------------- */

const badgeColors: Record<string, string> = {
  green: 'bg-[rgb(var(--sf-success)/0.12)] text-sf-success',
  amber: 'bg-[rgb(var(--sf-warning)/0.12)] text-[rgb(var(--sf-warning))]',
  orange: 'bg-sf-light-orange text-sf-deep-orange',
  red: 'bg-[rgb(var(--sf-error)/0.12)] text-sf-error',
  gray: 'bg-sf-border-gray/60 text-sf-charcoal',
  dark: 'bg-sf-midnight text-white',
};

export function Badge({ color = 'gray', children }: { color?: keyof typeof badgeColors; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[color]}`}>
      {children}
    </span>
  );
}

/* ---------------- States ---------------- */

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-6 w-6 animate-spin text-sf-orange ${className}`} aria-label="Loading" />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-sf-muted-gray">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center space-y-3">
      <p className="text-sm text-sf-error">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="py-10 text-center space-y-2.5">
      {icon ? <div className="flex justify-center text-sf-muted-gray">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-sf-ink">{title}</h3>
      {description ? <p className="text-sm text-sf-muted-gray max-w-sm mx-auto">{description}</p> : null}
      {action ? <div className="pt-1.5">{action}</div> : null}
    </div>
  );
}

export function Toast({ kind, message }: { kind: 'success' | 'error'; message: string }) {
  const colors = kind === 'success'
    ? 'bg-[rgb(var(--sf-success)/0.08)] border-[rgb(var(--sf-success)/0.35)] text-sf-success'
    : 'bg-[rgb(var(--sf-error)/0.08)] border-[rgb(var(--sf-error)/0.35)] text-sf-error';
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm animate-fade-in ${colors}`} role="status">
      {message}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: ReactNode;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-sf-border-gray p-3 hover:border-sf-orange transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#C2410C]"
      />
      <span>
        <span className="block text-sm font-medium text-sf-charcoal">{label}</span>
        {description ? <span className="block text-xs text-sf-muted-gray">{description}</span> : null}
      </span>
    </label>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Escape-to-close + background scroll lock while the dialog is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-sf-midnight/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-sf-white rounded-2xl shadow-card-hover animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sf-border-gray">
          <h2 className="text-base font-semibold text-sf-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sf-muted-gray hover:bg-sf-cream hover:text-sf-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
