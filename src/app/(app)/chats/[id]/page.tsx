'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send, Phone, Users, Dot } from 'lucide-react';
import { Card, Button, LoadingState, ErrorState, Badge } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import { formatTime } from '@/lib/format';
import type { ChatMsg } from '@/lib/types';

interface ConversationDetail {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  participants: { id: string; name: string; isMe: boolean }[];
}

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMsg[] | null>(null);
  const [differentUserTyping, setTyping] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentAt = useRef(0);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(scrollToEnd, [messages, differentUserTyping, scrollToEnd]);

  // Initial load
  useEffect(() => {
    const id = params.id;
    let cancelled = false;
    (async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get<{ conversation: ConversationDetail }>(`/conversations/${id}`),
          api.get<{ messages: ChatMsg[] }>(`/conversations/${id}/messages?limit=50`),
        ]);
        if (cancelled) return;
        setConv(convRes.conversation);
        setMessages(msgRes.messages);
        await api.post(`/conversations/${id}/read`);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not open the conversation');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Real-time layer
  useEffect(() => {
    const socket = getSocket();
    const id = params.id;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:new-message', (payload: { conversationId: string; message: { senderId: string; senderName?: string; content: string; createdAt: string; _id: string } }) => {
      if (payload.conversationId !== id) return;
      setMessages((prev) =>
        prev
          ? prev.some((m) => m.id === payload.message._id)
            ? prev // duplicate-safe on reconnects
            : [...prev, { id: payload.message._id, senderId: payload.message.senderId, senderName: payload.message.senderName, content: payload.message.content, createdAt: payload.message.createdAt }]
          : prev,
      );
      void api.post(`/conversations/${id}/read`);
    });
    socket.on('chat:typing', (payload: { conversationId: string; name?: string }) => {
      if (payload.conversationId !== id) return;
      setTyping(payload.name ?? 'Someone');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 2500);
    });

    if (socket.connected) {
      setConnected(true);
    }
    // Join is authorized server-side; failures surface as absence of events.
    socket.emit('conversation:join', id);

    return () => {
      socket.emit('conversation:leave', id);
      socket.off('chat:new-message');
      socket.off('chat:typing');
    };
  }, [params.id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await api.post<{ message: { id: string; createdAt: string } }>(`/conversations/${params.id}/messages`, { content, clientId: `c-${Date.now()}` });
      setMessages((prev) => {
        if (!prev) return prev;
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [
          ...prev,
          {
            id: res.message.id,
            senderId: user?.id ?? 'me',
            senderName: user?.name,
            content,
            createdAt: res.message.createdAt,
            readByMe: true,
          },
        ];
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Message could not be sent');
      setTimeout(() => setError(null), 4000);
    } finally {
      setSending(false);
    }
  }

  function onTypingChange(value: string) {
    setInput(value);
    // Throttle typing signals to at most one per 1.5s — the backend relays each one to the room.
    if (value && Date.now() - typingSentAt.current > 1500) {
      typingSentAt.current = Date.now();
      void api.post(`/conversations/${params.id}/typing`);
    }
  }

  if (error && !messages) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card><ErrorState message={error} /></Card>
      </div>
    );
  }

  if (!conv || messages === null) {
    return <LoadingState label="Opening conversation…" />;
  }

  const title = conv.type === 'group' ? conv.name ?? 'Group' : conv.participants.find((p) => !p.isMe)?.name ?? 'Direct chat';
  const othersOnline = conv.participants.filter((p) => !p.isMe);

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <Link href="/chats" className="p-2 -ml-2 rounded-lg hover:bg-sf-light-orange text-sf-charcoal" aria-label="Back to conversations">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-grad-primary text-white">
          {conv.type === 'group' ? <Users className="h-4 w-4" /> : <span className="text-xs font-bold">{title.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sf-midnight truncate">{title}</p>
          <p className="text-xs text-sf-muted-gray truncate">
            {conv.type === 'group' ? conv.participants.map((p) => p.name).join(', ') : conv.participants.map((p) => p.name).join(', ')}
          </p>
        </div>
        <Link
          href={`/calls?type=${conv.type === 'group' ? 'video' : 'audio'}&conversationId=${conv.id}&members=${othersOnline.map((p) => p.id).join(',')}`}
          className="p-2 rounded-full hover:bg-sf-light-orange text-sf-deep-orange"
          title="Start a call"
          aria-label="Start a call"
        >
          <Phone className="h-5 w-5" />
        </Link>
      </div>

      {/* Connection status — honest, always visible */}
      {!connected ? (
        <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
          Connecting to real-time delivery… messages still send over the API.
        </div>
      ) : null}
      {error ? (
        <div className="mb-2 rounded-lg bg-red-50 border border-sf-error/30 px-3 py-1.5 text-xs text-sf-error">{error}</div>
      ) : null}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white rounded-xl border border-sf-border-gray p-4 space-y-2.5">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-sf-muted-gray py-10">Say hello 👋 — messages are private between conversation participants.</p>
        ) : messages.map((m, i) => {
          const mine = m.senderId === user?.id;
          const showSender = !mine && messages[i - 1]?.senderId !== m.senderId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-sf-deep-orange text-white rounded-br-sm' : 'bg-sf-cream border border-sf-border-gray text-sf-charcoal rounded-bl-sm'}`}>
                {showSender ? <p className="text-[10px] font-semibold text-sf-deep-orange mb-0.5">{m.senderName}</p> : null}
                <p className="whitespace-pre-line break-words">{m.content}</p>
                <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-white/70' : 'text-sf-muted-gray'}`}>{formatTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {differentUserTyping ? (
          <div className="flex items-center gap-1 text-xs text-sf-muted-gray pl-1">
            <Dot className="animate-ping h-4 w-4" /> {differentUserTyping} is typing…
          </div>
        ) : null}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => onTypingChange(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
          className="flex-1 h-11 px-4 rounded-xl border border-sf-border-gray bg-white text-sm focus:border-sf-orange focus:outline-none focus:ring-2 focus:ring-sf-light-orange"
        />
        <Button type="submit" disabled={!input.trim() || sending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
