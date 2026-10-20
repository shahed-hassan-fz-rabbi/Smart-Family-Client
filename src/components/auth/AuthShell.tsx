import Link from 'next/link';
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
  return (
    <div className="min-h-screen bg-grad-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <BrandMark />
          <span className="text-lg font-bold text-white">Smart Family</span>
        </Link>
        <div className="bg-white rounded-2xl shadow-card-hover p-6 sm:p-8">
          <h1 className="text-xl font-bold text-sf-midnight">{title}</h1>
          <p className="text-sm text-sf-muted-gray mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
        {footer ? <p className="text-center text-sm text-white/80 mt-5">{footer}</p> : null}
      </div>
    </div>
  );
}
