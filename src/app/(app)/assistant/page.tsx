'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles, Plus, Send, Check, X, Pencil, RefreshCw, MessageSquarePlus, Trash2, Bot,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, LoadingState, Toast, Modal, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { relativeTime } from '@/lib/format';
import type { AiProposal, AiTurnResult, AiConversationSummary, AiConversationFull } from '@/lib/types';

interface ProposalView {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  explanation: string;
  state: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  result?: string;
}

const SUGGESTIONS = [
  'Tomorrow my mother has a doctor appointment, but I have work. Help our family organize everything.',
  'We keep forgetting household chores. Help us organize them.',
  'Remind our family every Sunday to review next week\'s schedule.',
  'পরশু মার ডাক্তার অ্যাপয়েন্টমেন্ট আছে, কী কী করতে হবে?', // Bangla sample
  'Ma er doctor appointment kalke — medicine bag ready rakhte hobe kina bolo', // Banglish sample
];

export default function AssistantPage() {
  const { user } = useAuth();
  const { family } = useFamilyData();
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [active, setActive] = useState<AiConversationFull | null>(null);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get<{ conversations: AiConversationSummary[] }>('/ai/conversations');
      setConversations(res.conversations);
    } catch {
      // sidebar failures shouldn't block the chat itself
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(scrollToEnd, [active, proposals]);

  async function openConversation(id: string) {
    setLoadErr(null);
    try {
      const res = await api.get<{ conversation: AiConversationFull }>(`/ai/conversations/${id}`);
      setActive(res.conversation);
      // Proposals that arrived in this conversation earlier are not re-fetched; only new ones show action buttons.
      setProposals([]);
    } catch (err) {
      setLoadErr(err instanceof ApiError ? err.message : 'Could not open the conversation');
    }
  }

  async function newConversation() {
    setActive(null);
    setProposals([]);
    setInput('');
  }

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput('');
    const myMsgCount = (active?.messages.length ?? 0) + 1;
    // Optimistically show the user's message + pending indicator
    setActive((prev) => ({
      ...(prev ?? { id: 'new', title: text.slice(0, 60), familyId: family?.id ?? null, messages: [] }),
      messages: [...(prev?.messages ?? []), { role: 'user' as const, content: text, createdAt: new Date().toISOString() }],
    }));
    scrollToEnd();

    try {
      const res = await api.post<AiTurnResult>('/ai/conversations', {
        content: text,
        familyId: family?.id,
        conversationId: active && active.id !== 'new' ? active.id : undefined,
      });
      const convRes = await api.get<{ conversation: AiConversationFull }>(`/ai/conversations/${res.conversationId}`);
      setActive(convRes.conversation);
      if (res.proposal) {
        setProposals((prev) => [
          ...prev,
          { id: res.proposal!.id, type: res.proposal!.type, payload: res.proposal!.payload, explanation: res.proposal!.explanation, state: 'pending' },
        ]);
      }
      await loadConversations();
      scrollToEnd();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'The assistant could not answer. Please try again.';
      setActive((prev) => ({
        ...(prev ?? { id: 'new', title: text.slice(0, 60), familyId: family?.id ?? null, messages: [] }),
        messages: [...prev?.messages.slice(0, myMsgCount - 1) ?? [], { role: 'user' as const, content: text, createdAt: new Date().toISOString() }, { role: 'assistant' as const, content: message, createdAt: new Date().toISOString() }],
      }));
      scrollToEnd();
    } finally {
      setSending(false);
    }
  }

  async function confirmProposal(p: ProposalView) {
    try {
      const res = await api.post<{ type: string; result: Record<string, unknown> }>(`/ai/actions/${p.id}/confirm`);
      const summary = summarizeResult(res.type, res.result);
      setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, state: 'confirmed', result: summary } : x)));
      setToast({ kind: 'success', message: `Done: ${summary}` });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Execution failed';
      setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, state: 'failed', result: message } : x)));
      setToast({ kind: 'error', message });
    }
  }

  async function cancelProposal(p: ProposalView) {
    try {
      await api.post(`/ai/actions/${p.id}/cancel`);
      setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, state: 'cancelled' } : x)));
    } catch {
      setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, state: 'cancelled' } : x)));
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation? Its history is removed permanently.')) return;
    await api.delete(`/ai/conversations/${id}`);
    if (active?.id === id) newConversation();
    await loadConversations();
  }

  async function rename(id: string) {
    if (!renameValue.trim()) return;
    // Title updates come from the next turn; renaming is a local display change in the sidebar list
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: renameValue.trim() } : c)));
    setRenameId(null);
  }

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle={
          family
            ? 'Describe a family coordination problem in Bangla, English, or Banglish. The assistant proposes — you confirm.'
            : 'Create a family space so the assistant can see your authorized family context.'
        }
        action={<Button variant="outline" onClick={newConversation}><MessageSquarePlus className="h-4 w-4" /> New conversation</Button>}
      />

      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* History sidebar */}
        <div className="hidden lg:block">
          <Card className="max-h-[70vh] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-sf-muted-gray">No conversations yet. Start one on the right.</p>
            ) : (
              <ul className="divide-y divide-sf-border-gray">
                {conversations.map((c) => (
                  <li key={c.id} className={`group ${active?.id === c.id ? 'bg-sf-light-orange' : ''}`}>
                    <div className="flex items-center gap-1 px-3 py-2.5">
                      {renameId === c.id ? (
                        <input
                          className="flex-1 h-7 rounded border border-sf-orange px-2 text-xs focus:outline-none"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void rename(c.id); }}
                          autoFocus
                        />
                      ) : (
                        <button onClick={() => void openConversation(c.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium text-sf-midnight">{c.title}</p>
                          <p className="truncate text-xs text-sf-muted-gray">{c.preview || '…'}</p>
                        </button>
                      )}
                      <button
                        onClick={() => { setRenameId(c.id); setRenameValue(c.title); }}
                        className="p-1 text-sf-muted-gray opacity-0 group-hover:opacity-100 hover:text-sf-deep-orange"
                        aria-label="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => void deleteConversation(c.id)}
                        className="p-1 text-sf-muted-gray opacity-0 group-hover:opacity-100 hover:text-sf-error"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Chat panel */}
        <Card className="flex h-[70vh] flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {!active ? (
              <WelcomeState userName={user?.name.split(' ')[0] ?? 'there'} hasFamily={Boolean(family)} onSuggest={(s) => void send(s)} />
            ) : (
              active.messages.map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content} createdAt={m.createdAt} userName={user?.name ?? 'You'} />
              ))
            )}
            {sending ? (
              <div className="flex items-center gap-2 text-sm text-sf-muted-gray">
                <Sparkles className="h-4 w-4 animate-pulse text-sf-orange" /> Thinking about your family…
              </div>
            ) : null}

            {/* Pending proposals */}
            {proposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onConfirm={() => void confirmProposal(p)}
                onCancel={() => void cancelProposal(p)}
              />
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
            className="border-t border-sf-border-gray p-3 flex gap-2 items-center"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={family ? 'Ask about schedules, tasks, reminders — any language…' : 'Create a family space to give the assistant family context'}
              disabled={sending || !family}
              aria-label="Message the assistant"
            />
            <Button type="submit" loading={sending} disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function WelcomeState({ userName, hasFamily, onSuggest }: { userName: string; hasFamily: boolean; onSuggest: (s: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad-primary text-white shrink-0">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm text-sf-charcoal">
            Hi {userName}! I&apos;m your family assistant. Tell me a real coordination problem and I&apos;ll
            propose tasks, reminders, calendar events or messages — always with your confirmation before anything happens.
          </p>
          {!hasFamily ? (
            <p className="mt-2 text-xs text-sf-warning bg-sf-light-orange border border-amber-200 rounded-lg p-2">
              Tip: create a family space first so I can see your authorized family context.
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left rounded-lg border border-sf-border-gray px-3 py-2.5 text-sm text-sf-charcoal hover:border-sf-orange hover:bg-sf-cream transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, content, createdAt, userName }: { role: 'user' | 'assistant'; content: string; createdAt: string; userName: string }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-sf-deep-orange text-white px-4 py-2.5 text-sm">
          <p className="whitespace-pre-line">{content}</p>
          <p className="mt-1 text-right text-[10px] text-white/70">{relativeTime(createdAt)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white">
        <Bot className="h-4 w-4" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-sf-cream border border-sf-light-orange px-4 py-2.5 text-sm text-sf-charcoal">
        <p className="whitespace-pre-line">{content}</p>
        <p className="mt-1 text-[10px] text-sf-muted-gray">{relativeTime(createdAt)}</p>
      </div>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  create_task: 'Create task',
  update_task: 'Update task',
  propose_event: 'Calendar event',
  create_reminder: 'Reminder',
  create_checklist: 'Checklist',
  draft_message: 'Draft message',
};

function ProposalCard({ proposal, onConfirm, onCancel }: { proposal: ProposalView; onConfirm: () => void; onCancel: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState(() => JSON.stringify(proposal.payload, null, 2));
  const [payload, setPayload] = useState<Record<string, unknown>>(proposal.payload);

  const itemsText = (p: Record<string, unknown>): string => {
    switch (proposal.type) {
      case 'create_task':
        return `${p.title ?? ''}${p.dueDate ? ` · due ${new Date(String(p.dueDate)).toLocaleString()}` : ''}${p.assigneeName ? ` · assign to ${p.assigneeName}` : ' · assign to you'}`;
      case 'update_task':
        return `Task ${String(p.taskId ?? '').slice(-6)} → ${p.status ?? p.title ?? 'update'}`;
      case 'propose_event':
        return `${p.title ?? ''} · ${new Date(String(p.startAt)).toLocaleString()}${p.location ? ` · ${p.location}` : ''}`;
      case 'create_reminder':
        return `${p.title ?? ''} · ${new Date(String(p.dueAt)).toLocaleString()}${p.recurrence && p.recurrence !== 'none' ? ` · repeats ${p.recurrence}` : ''}${p.remindFamily ? ' · whole family' : ''}`;
      case 'create_checklist':
        return `${(p.items as unknown[])?.length ?? 0} items: ${(p.items as Record<string, unknown>[]).map((i) => i.title).join(', ')}`;
      case 'draft_message':
        return `“${String(p.content ?? '').slice(0, 120)}”`;
      default:
        return JSON.stringify(p).slice(0, 160);
    }
  };

  function applyEdit() {
    try {
      setPayload(JSON.parse(editedPayload));
      setEditing(false);
    } catch {
      return;
    }
  }

  if (proposal.state !== 'pending') {
    const done = proposal.state === 'confirmed';
    return (
      <Card className={`p-4 ${done ? 'border-sf-success/40 bg-green-50/40' : 'border-sf-border-gray opacity-75'}`}>
        <div className="flex items-center gap-2 text-sm">
          <Badge color={done ? 'green' : proposal.state === 'failed' ? 'red' : 'gray'}>
            {done ? 'Executed' : proposal.state === 'failed' ? 'Failed' : 'Cancelled'}
          </Badge>
          <span className="font-medium text-sf-midnight">{TYPE_LABEL[proposal.type] ?? proposal.type}</span>
          {proposal.result ? <span className="text-sf-muted-gray truncate">{proposal.result}</span> : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-sf-orange/50">
      <div className="flex items-center gap-2 mb-2">
        <Badge color="orange">{TYPE_LABEL[proposal.type] ?? proposal.type}</Badge>
        <span className="text-xs text-sf-muted-gray">Review this proposal — nothing happens until you confirm.</span>
      </div>
      {!editing ? (
        <>
          <p className="text-sm text-sf-charcoal">{itemsText(payload as Record<string, unknown>)}</p>
          {payload && typeof payload === 'object' && 'description' in payload ? (
            <p className="mt-1 text-xs text-sf-muted-gray">{String((payload as Record<string, unknown>).description)}</p>
          ) : null}
        </>
      ) : (
        <textarea
          className="w-full rounded-lg border border-sf-border-gray p-2 font-mono text-xs h-40 focus:border-sf-orange focus:outline-none"
          value={editedPayload}
          onChange={(e) => setEditedPayload(e.target.value)}
          aria-label="Edit proposal as JSON"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onConfirm}>
          <Check className="h-4 w-4" /> Confirm
        </Button>
        {editing ? (
          <Button size="sm" variant="outline" onClick={applyEdit}><Check className="h-4 w-4" /> Apply edit</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditedPayload(JSON.stringify(payload, null, 2)); }}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /> Cancel</Button>
      </div>
    </Card>
  );
}

function localizeResultKey(key: string): string {
  const map: Record<string, string> = {
    taskId: 'Task', eventId: 'Event', reminderId: 'Reminder', messageId: 'Message',
    assignedTo: 'Assigned to', title: 'Title', status: 'Status', createdCount: 'Created',
    dueAt: 'Due', recurrence: 'Repeats', conversationId: 'Conversation',
  };
  return map[key] ?? key;
}

function summarizeResult(type: string, result: Record<string, unknown>): string {
  const parts: string[] = [];
  const orderId = ['title', 'taskTitle', 'eventId', 'reminderId', 'dueAt', 'recurrence', 'assignedTo', 'createdCount', 'status'];
  for (const key of Object.keys(result)) {
    const v = result[key];
    if (v === undefined || v === null) continue;
    const label = localizeResultKey(key);
    parts.push(typeof v === 'object' ? '' : `${label}: ${v}`);
    void orderId;
  }
  const base = parts.filter(Boolean).join(' · ');
  if (type === 'draft_message') return 'message sent to the conversation member';
  return base || type;
}
