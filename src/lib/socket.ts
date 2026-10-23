import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO connection manager. Cookie-based auth (credentials: include) —
 * same session cookie as the REST API, no token in JS storage.
 */
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/+$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '').replace(/\/+$/, '') ||
    (typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
      ? window.location.origin // honest same-origin fallback; never localhost in production
      : 'http://localhost:4000');

  socket = io(socketUrl, {
    withCredentials: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
