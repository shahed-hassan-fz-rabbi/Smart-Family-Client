'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Mic, MicOff, PhoneOff,
} from 'lucide-react';
import {
  LiveKitRoom,
  VideoConference,
  useLocalParticipant,
  useToken,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Button, Badge, ErrorState, LoadingState, Toast } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface TokenData {
  token: string;
  url: string;
  room: string;
  mode: 'audio' | 'video';
}

const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';

function Inner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [conn, setConn] = useState('connecting');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'audio' | 'video'>(
    (search.get('mode') as 'audio' | 'video') ?? 'audio',
  );
  const [startedAt, setStartedAt] = useState<string | null>(search.get('t'));
  const tokenRef = useRef<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const endedRef = useRef(false);

  const loadToken = useCallback(async () => {
    try {
      const res = await api.get<TokenData>(`/calls/${params.id}/token`);
      tokenRef.current = res.token;
      urlRef.current = LK_URL || res.url;
      setMode(res.mode);
      setConn('ready');
      return res;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not get a call token. Is LiveKit configured on the server?';
      setError(message);
      setConn('error');
      return null;
    }
  }, [params.id]);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  const leave = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    try {
      await api.post(`/calls/${params.id}/end`);
    } catch {
      // End may already have been recorded by another participant.
    }
    router.push('/calls');
  }, [params.id, router]);

  if (conn === 'error') {
    return (
      <div className="mx-auto max-w-xl mt-8">
        <div className="bg-sf-white rounded-xl border border-sf-border-gray p-6">
          <ErrorState message={error ?? 'Calling is unavailable'} />
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => void loadToken()}>Retry</Button>
            <Button variant="ghost" onClick={() => router.push('/calls')}>Back to calls</Button>
          </div>
        </div>
      </div>
    );
  }

  if (conn !== 'ready' || !tokenRef.current || !urlRef.current) {
    return <LoadingState label="Preparing your call room…" />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-sf-midnight">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => void leave()} className="text-white/70 hover:text-white" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-semibold text-white">{mode === 'video' ? 'Video call' : 'Audio call'} · Smart Family</p>
            <p className="text-xs text-white/60">
              {user?.name} · {startedAt ? `started ${new Date(startedAt).toLocaleTimeString()}` : 'connecting…'}
            </p>
          </div>
        </div>
        <Badge color={conn === 'ready' ? 'green' : 'amber'}>{conn === 'ready' ? 'Room ready' : conn}</Badge>
      </div>

      <div className="h-[calc(100%-4rem)]">
        <LiveKitRoom
          token={tokenRef.current}
          serverUrl={urlRef.current}
          connect={true}
          audio={mode === 'audio' ? true : undefined}
          video={mode === 'video' ? true : undefined}
          onConnected={() => setConn('connected')}
          onDisconnected={() => {
            if (!endedRef.current) {
              endedRef.current = true;
              void api.post(`/calls/${params.id}/end`).catch(() => null);
              router.push('/calls');
            }
          }}
          onError={(err: unknown) => {
            if (endedRef.current) return;
            const message =
              (err as { message?: string })?.message ??
              'Devices could not start. Check your browser permissions for camera and microphone.';
            setError(message);
            setConn('error');
          }}
          style={{ height: '100%' }}
        >
          {mode === 'video' ? (
            <VideoConference />
          ) : (
            <AudioCallStage onLeave={() => void leave()} />
          )}
        </LiveKitRoom>
      </div>
    </div>
  );
}

/** Audio-only stage: shows participants + real mic control, dark high contrast. */
import { RoomAudioRenderer, useParticipants } from '@livekit/components-react';

function AudioCallStage({ onLeave }: { onLeave: () => void }) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex-1 grid place-content-center gap-6">
        <div className="flex flex-wrap justify-center gap-8">
          {participants.map((p) => (
            <div key={p.identity} className="flex flex-col items-center gap-3">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-grad-primary text-white text-2xl font-bold">
                {(p.name ?? p.identity).split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <span className="text-white text-sm font-medium">{p.name ?? p.identity}</span>
              <span className={`text-xs ${p.isMicrophoneEnabled ? 'text-green-400' : 'text-white/40'}`}>
                {p.isMicrophoneEnabled ? 'mic on' : 'muted'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-white/50 text-sm">Audio call in progress — voice only.</p>
      </div>
      <RoomAudioRenderer />
      <div className="flex items-center justify-center gap-4 p-4">
        <button
          onClick={() => void toggleMic()}
          aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
            isMicrophoneEnabled ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={onLeave}
          className="flex h-12 w-16 items-center justify-center rounded-xl bg-sf-error text-white hover:brightness-110"
          aria-label="End call"
          title="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function CallRoomPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
