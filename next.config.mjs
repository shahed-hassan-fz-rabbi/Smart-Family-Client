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

export default nextConfig;
