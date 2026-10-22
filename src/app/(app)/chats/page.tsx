'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, Field, Input, Toast, Select } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { getSocket } from '@/lib/socket';
import { relativeTime } from '@/lib/format';
import type { ChatPreview } from '@/lib/types';

export default function ChatsPage() {
  const { family, members } = useFamilyData();
  const [chats, setChats] = useState<ChatPreview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const res = await api.get<{ conversations: ChatPreview[] }>(`/conversations?familyId=${family.id}`);
      setChats(res.conversations);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load conversations');
    }
  }, [family]);

  useEffect(() => {
    setChats(null);
    void load();
    const socket = getSocket();
    const handler = () => void load();
    socket.on('chat:new-message', handler);
    socket.on('call:incoming', handler);
    return () => {
      socket.off('chat:new-message', handler);
      socket.off('call:incoming', handler);
    };
  }, [load]);

  if (!family) {
    return (
      <div>
        <PageHeader title="Family Chats" subtitle="Direct and group conversations with your family." />
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Join a family to start messaging"
            description="Create a family space — or open the invitation link a family member shared with you."
            action={<Link href="/family" className="inline-flex h-9 items-center rounded-lg bg-sf-deep-orange px-4 text-sm font-semibold text-white hover:brightness-110">Get started</Link>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Family Chats"
        subtitle="Direct and group conversations — private, real-time, and separate from the AI assistant."
        action={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> New chat</Button>}
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      {chats === null && !error ? (
        <LoadingState label="Loading conversations…" />
      ) : chats?.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessagesSquare className="h-8 w-8" />}
            title="No conversations yet"
            description="Start a direct chat with a family member, or create a family group."
            action={<Button size="sm" onClick={() => setModal(true)}>Start chatting</Button>}
          />
        </Card>
      ) : chats ? (
        <div className="space-y-2">
          {chats.map((c) => {
            const title = c.type === 'group' ? c.name ?? 'Group' : c.participants.find((p) => !p.isMe)?.name ?? 'Direct chat';
            return (
              <Link key={c.id} href={`/chats/${c.id}`} className="block">
                <Card className="px-4 py-3 hover:shadow-card-hover hover:border-sf-orange transition-[box-shadow,border-color]">
                  <div className="flex items-center gap-3">
                    {c.type === 'group' ? (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sf-light-orange text-sf-deep-orange" aria-hidden>
                        <Users className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white text-xs font-bold" aria-hidden>
                        {title.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium text-sf-ink truncate">{title}</p>
                        {c.lastMessageAt ? (
                          <span className="shrink-0 text-xs text-sf-muted-gray tabular-nums">{relativeTime(c.lastMessageAt)}</span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-sf-muted-gray">
                        {c.type === 'group' ? <span className="text-xs font-medium text-sf-muted-gray">{c.participants.length} members · </span> : null}
                        {c.preview ?? <span className="italic">No messages yet</span>}
                      </p>
                    </div>
                    {c.unreadCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-sf-deep-orange px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {c.unreadCount < 100 ? c.unreadCount : '99+'}
                      </span>
                    ) : null}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : null}

      <NewChatModal
        open={modal}
        familyId={family.id}
        members={members.map((m) => ({ id: m.userId, name: m.name }))}
        onClose={() => setModal(false)}
        onDone={async () => {
          setModal(false);
          setToast({ kind: 'success', message: 'Conversation ready.' });
          await load();
        }}
      />
    </div>
  );
}

function NewChatModal({
  open, familyId, members, onClose, onDone,
}: {
  open: boolean;
  familyId: string;
  members: { id: string; name: string }[];
  onClose: () => void;
  onDone: (id?: string) => Promise<void>;
}) {
  const [type, setType] = useState<'dm' | 'group'>('dm');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length < 1) {
      setError(type === 'dm' ? 'Pick a family member.' : 'Pick at least one member (you are added automatically).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ conversation: { id: string } }>('/conversations', {
        familyId,
        type,
        participantIds: selected,
        name: type === 'group' ? name.trim() || undefined : undefined,
      });
      setName('');
      setSelected([]);
      await onDone(res.conversation.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the conversation');
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    if (type === 'dm') setSelected([id]);
    else setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Modal open={open} onClose={onClose} title="New conversation">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Type">
          <Select value={type} onChange={(e) => { setType(e.target.value as 'dm' | 'group'); setSelected([]); }}>
            <option value="dm">Direct message</option>
            <option value="group">Group</option>
          </Select>
        </Field>
        {type === 'group' ? (
          <Field label="Group name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend plans" /></Field>
        ) : null}
        <fieldset>
          <legend className="text-sm font-medium text-sf-charcoal mb-1.5">Family members</legend>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {members.length ? (
              members.map((m) => {
                const checked = selected.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked ? 'border-sf-deep-orange bg-sf-light-orange text-sf-deep-orange font-medium' : 'border-sf-border-gray'
                    }`}
                  >
                    <input type="checkbox" className="h-4 w-4 accent-[#C2410C]" checked={checked} onChange={() => toggle(m.id)} />
                    {m.name}
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-sf-muted-gray">Invite family members first.</p>
            )}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{type === 'dm' ? 'Start chat' : 'Create group'}</Button>
        </div>
      </form>
    </Modal>
  );
}
