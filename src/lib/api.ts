/**
 * Typed API client. Requests always include credentials so the HttpOnly
 * session cookie reaches the backend. No tokens are stored in JS.
 *
 * NEXT_PUBLIC_* values are inlined at BUILD time: set NEXT_PUBLIC_API_URL in
 * the Vercel project settings (e.g. https://smart-family-server.onrender.com/api)
 * BEFORE the build that ships it. In development the default points at the
 * local dev server; in production a missing value degrades to the app's own
 * origin ("/api") — it can never silently point at localhost.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:4000/api' : '/api');

export { API_URL };

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON edge
  }
  const body = (payload ?? {}) as { error?: string; message?: string; details?: unknown };

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.error ?? body.message ?? `Request failed (${res.status})`,
      body.details,
    );
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const API_BASE = API_URL;
