'use client';

/**
 * Global incoming-call handler, mounted once in the app layout.
 * Listens for the server's `call:incoming` socket event and offers
 * Accept (enter the LiveKit room) / Decline (real API call) actions.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface IncomingCall {
  callId: string;
  mode: 'audio' | 'video';
  from: string;
  fromId: string;
}

let activeCall: IncomingCall | null = null;

export function IncomingCallWatcher() {
  const router = useRouter();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: IncomingCall) => {
      // Only show one incoming call at a time; the first stays visible.
      if (activeCall) return;
      activeCall = payload;
      setCall(payload);
    };
    socket.on('call:incoming', handler);
    const declined = (payload: { callId: string }) => {
      if (activeCall?.callId === payload.callId || call?.callId === payload.callId) {
        activeCall = null;
        setCall(null);
      }
    };
    socket.on('call:declined', declined);

    return () => {
      socket.off('call:incoming', handler);
      socket.off('call:declined', declined);
    };
    // `call` is intentionally not a dependency: the listener must not rebind on modal state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!call) return null;

  function accept() {
    router.push(`/calls/${call!.callId}?mode=${call!.mode}`);
  }

  async function decline() {
    setDeclining(true);
    try {
      await api.post(`/calls/${call!.callId}/decline`);
    } catch (err) {
      // Surface nothing modal-level; the caller sees the declined event or the call times out.
      if (err instanceof ApiError) console.warn('Decline failed:', err.message);
    } finally {
      activeCall = null;
      setCall(null);
      setDeclining(false);
    }
  }

  return (
    <Modal open onClose={() => { activeCall = null; setCall(null); }} title={call.mode === 'video' ? 'Incoming video call' : 'Incoming call'}>
      <div className="flex items-center gap-4 pb-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-grad-primary text-white animate-pulse">
          {call.mode === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
        </span>
        <div>
          <p className="font-semibold text-sf-ink">{call.from}</p>
          <p className="text-xs text-sf-muted-gray">
            {call.mode === 'video' ? 'Video' : 'Audio'} call · Smart Family does not record calls
          </p>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={accept}>
          <Phone className="h-4 w-4" /> Accept
        </Button>
        <Button variant="outline" className="flex-1" loading={declining} onClick={() => void decline()}>
          <PhoneOff className="h-4 w-4" /> Decline
        </Button>
      </div>
    </Modal>
  );
}
