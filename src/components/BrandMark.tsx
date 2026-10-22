import { LOGO_PATH } from '@/lib/brand';

/**
 * The official Smart Family logo (public/smartfamily logo.png).
 * The PNG has transparent corners (verified), so the vivid heart + family
 * figures read clearly on both Light and Dark surfaces. The image is served
 * untouched — never recolored or redrawn.
 */
export function BrandMark({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      className={`inline-block overflow-hidden ${className}`}
      style={{ height: size, width: Math.round(size * 1.26) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_PATH}
        alt="Smart Family logo"
        width={Math.round(size * 1.26)}
        height={size}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}
