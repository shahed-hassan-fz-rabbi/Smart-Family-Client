import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: rootDir,
  /**
   * Radical isolation for local runs: `next build` / `next start` (local
   * preview) can poison a concurrently running `next dev` because both wrote
   * into the same `.next` directory — the dev server then crashed with
   * errors like "Cannot find module './143.js'". Dev keeps `.next` (also the
   * default on Vercel/other hosts). Set NEXT_DIST_DIR=.next-prod when
   * building/starting the local production preview; the env default keeps
   * every deployed build behaviour unchanged.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

/**
 * NEXT_PUBLIC_* variables are inlined at build time. A deployed build without
 * NEXT_PUBLIC_API_URL would silently bake a localhost backend into the shipped
 * JS (the "Login with Google redirects me to localhost:4000" bug). Loudly fail
 * Vercel builds with the exact fix instead. Local builds are unaffected: the
 * committed .env supplies the value, and nothing throws outside Vercel.
 */
if (process.env.VERCEL === '1') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set in the Vercel build environment. Set it in Vercel Project Settings → Environment Variables to the deployed backend API, e.g. https://smart-family-server.onrender.com/api, then redeploy.',
    );
  }
  if (/localhost|127\.0\.0\.1|::1/i.test(apiUrl)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL (${apiUrl}) points to localhost on Vercel — deployed users can never reach a localhost backend. Set it to the deployed backend API, e.g. https://smart-family-server.onrender.com/api, then redeploy.`,
    );
  }
}

export default nextConfig;
