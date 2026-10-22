import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Smart Family — One Family. One Platform. Smarter Care with AI.',
    template: '%s · Smart Family',
  },
  description:
    'Stay connected, organize care, get reminders, and help keep your loved ones safe — all in one place.',
  icons: {
    // The official logo (public/smartfamily logo.png) as the browser icon.
    icon: '/smartfamily%20logo.png',
    apple: '/smartfamily%20logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Runs before first paint so the saved theme (or the OS preference) is applied
 * immediately — no wrong-theme flash and no hydration mismatch.
 */
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('sf-theme');
    var dark =
      saved === 'dark' ||
      (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* no-op — light theme is the safe default */
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
