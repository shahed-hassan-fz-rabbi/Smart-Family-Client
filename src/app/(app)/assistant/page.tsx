'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles, Plus, Send, Check, X, Pencil, RotateCcw, Trash2, PanelRightOpen, Search,
  TriangleAlert, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, Toast } from '@/components/ui';
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

/** A turn that failed — kept separate from real assistant messages so the
 *  error is always visually "system", never a fabricated assistant reply. */
interface FailedTurn {
  text: string;
  message: string;
}

const EXAMPLES: { label: string; text: string; lang: 'EN' | 'বাংলা' | 'Banglish' }[] = [
  {
    lang: 'EN',
    label: 'Doctor visit plan',
    text: 'Tomorrow my mother has a doctor appointment, but I have work. Help our family organize everything.',
  },
  {
    lang: 'বাংলা',
    label: 'চিকিৎসা পরিকল্পনা',
    text: 'পরশু মার ডাক্তার অ্যাপয়েন্টমেন্ট আছে, কী কী করতে হবে?',
  },
  {
    lang: 'Banglish',
    label: 'Medicine bag',
    text: 'Ma er doctor appointment kalke — medicine bag ready rakhte hobe kina bolo',
  },
  {
    lang: 'EN',
    label: 'Weekly reminders',
    text: 'Remind our family every Sunday to review next week\'s schedule.',
  },
  {
    lang: 'বাংলা',
    label: 'বাসায় কাজ ভাগ করা',
    text: 'বাসার কাজ আমরা প্রতিদিন ভুলে যাই, একটা রুটিন বানাও।',
  },
  {
    lang: 'Banglish',
    label: 'Chore rotein',
    text: 'We keep forgetting household chores. Help us organize them.',
  },
];

export default function AssistantPage() {
  const { user } = useAuth();
  const { family } = useFamilyData();
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<AiConversationFull | null>(null);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [failedTurn, setFailedTurn] = useState<FailedTurn | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(scrollToEnd, [active, proposals, sending, failedTurn]);

  async function openConversation(id: string) {
    setFailedTurn(null);
    try {
      const res = await api.get<{ conversation: AiConversationFull }>(`/ai/conversations/${id}`);
      setActive(res.conversation);
      // Proposals that arrived in this conversation earlier are not re-fetched; only new ones show action buttons.
      setProposals([]);
      setDrawerOpen(false);
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Could not open the conversation',
      });
    }
  }

  function newConversation() {
    setActive(null);
    setProposals([]);
    setFailedTurn(null);
    setInput('');
    setDrawerOpen(false);
  }

  async function send(text: string, options?: { isRetry?: boolean }) {
    const clean = text.trim();
    if (!clean || sending || !family) return;
    setSending(true);
    setFailedTurn(null);
    setInput('');

    // On a retry the failed turn's user message is already in the local
    // history — never append it twice (no duplicated turns).
    if (!options?.isRetry) {
      setActive((prev) => ({
        ...(prev ?? { id: 'new', title: clean.slice(0, 60), familyId: family.id ?? null, messages: [] }),
        messages: [...(prev?.messages ?? []), { role: 'user' as const, content: clean, createdAt: new Date().toISOString() }],
      }));
    }
    scrollToEnd();

    try {
      const res = await api.post<AiTurnResult>('/ai/conversations', {
        content: clean,
        familyId: family.id,
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
      setFailedTurn({ text: clean, message });
      scrollToEnd();
    } finally {
      setSending(false);
      requestAnimationFrame(() => composerRef.current?.focus());
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
    } catch {
      // Treat cancel failures leniently: a pending proposal that cannot be
      // cancelled is safe to mark locally (nothing was executed either way).
    }
    setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, state: 'cancelled' } : x)));
  }

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation? Its history is removed permanently.')) return;
    try {
      await api.delete(`/ai/conversations/${id}`);
      if (active?.id === id) newConversation();
      await loadConversations();
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'The conversation could not be deleted',
      });
    }
  }

  function rename(id: string) {
    if (!renameValue.trim()) return;
    // Title updates come from the next turn; renaming is a local display change in the sidebar list
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: renameValue.trim() } : c)));
    setRenameId(null);
  }

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
  });

  const HistoryPanel = (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 p-3 pb-2">
        <Button onClick={newConversation} className="w-full justify-center">
          <Plus className="h-4 w-4" /> New conversation
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sf-muted-gray" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="h-8 w-full rounded-lg border border-sf-border-gray bg-transparent pl-8 pr-2 text-xs text-sf-ink placeholder:text-sf-muted-gray focus:border-sf-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-sf-orange/30"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-sf-muted-gray">
            No conversations yet.
            <br />
            Start one from the composer.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-sf-muted-gray">No conversations match “{search}”.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => (
              <li key={c.id} className={`group rounded-lg ${active?.id === c.id ? 'bg-sf-light-orange' : 'hover:bg-sf-cream'}`}>
                <div className="flex items-center gap-1 px-2 py-2">
                  {renameId === c.id ? (
                    <input
                      className="h-7 w-0 flex-1 rounded border border-sf-orange px-2 text-xs focus:outline-none"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void rename(c.id); if (e.key === 'Escape') setRenameId(null); }}
                      autoFocus
                      aria-label="New conversation title"
                    />
                  ) : (
                    <button onClick={() => void openConversation(c.id)} className="w-0 min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-sf-ink">{c.title}</p>
                      <p className="truncate text-xs text-sf-muted-gray">{c.preview || '…'}</p>
                    </button>
                  )}
                  <button
                    onClick={() => { setRenameId(c.id); setRenameValue(c.title); }}
                    className="shrink-0 p-1 text-sf-muted-gray opacity-0 transition-opacity hover:text-sf-deep-orange focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Rename conversation"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void deleteConversation(c.id)}
                    className="shrink-0 p-1 text-sf-muted-gray opacity-0 transition-opacity hover:text-sf-error focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle={
          family
            ? 'Describe a family coordination problem in Bangla, English, or Banglish. The assistant proposes — you confirm.'
            : 'Create a family space so the assistant can see your authorized family context.'
        }
        action={<Button variant="outline" onClick={newConversation}><Plus className="h-4 w-4" /> New</Button>}
      />

      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
        {/* History sidebar — inline on desktop, drawer on mobile/tablet */}
        <Card className="hidden h-[calc(100vh-13.5rem)] lg:block">
          {HistoryPanel}
        </Card>

        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Conversation history">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close conversation history"
            />
            <Card className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col rounded-l-none shadow-xl">
              {HistoryPanel}
            </Card>
          </div>
        ) : null}

        {/* Chat panel */}
        <Card className="flex h-[calc(100vh-13.5rem)] flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 border-b border-sf-border-gray px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden"
              aria-label="Open conversation history"
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-sf-ink">Smart Family Assistant</h2>
              <p className="truncate text-xs text-sf-muted-gray">
                {family ? `${family.name} · proposes, you confirm` : 'No family space connected yet'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} role="log" aria-live="polite" aria-label="Assistant conversation" className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
              {!active ? (
                <WelcomeState userName={user?.name.split(' ')[0] ?? 'there'} hasFamily={Boolean(family)} onSuggest={(s) => void send(s)} />
              ) : (
                active.messages.map((m, i) => (
                  <Bubble key={i} role={m.role} content={m.content} createdAt={m.createdAt} userName={user?.name.split(' ')[0] ?? 'You'} />
                ))
              )}

              {failedTurn ? (
                <ErrorBubble message={failedTurn.message} onRetry={() => void send(failedTurn.text, { isRetry: true })} />
              ) : null}

              {sending ? <ThinkingBubble /> : null}

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
          </div>

          {/* Composer */}
          <div className="border-t border-sf-border-gray p-3 sm:px-4">
            <form
              onSubmit={(e) => { e.preventDefault(); void send(input); }}
              className="mx-auto flex max-w-3xl items-end gap-2"
            >
              <textarea
                ref={composerRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const ta = e.currentTarget;
                  ta.style.height = 'auto';
                  ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder={family ? 'Ask about schedules, tasks, reminders — any language…' : 'Create a family space to give the assistant family context'}
                disabled={sending || !family}
                aria-label="Message the assistant"
                className="max-h-40 min-h-[2.75rem] w-full resize-none rounded-xl border border-sf-border-gray bg-transparent px-3.5 py-2.5 text-sm text-sf-ink placeholder:text-sf-muted-gray focus:border-sf-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-sf-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button
                type="submit"
                className="h-[2.75rem] shrink-0 px-4"
                disabled={!input.trim() || sending || !family}
                aria-label="Send message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </form>
            <p className="mx-auto mt-1.5 max-w-3xl px-1 text-[11px] text-sf-muted-gray">
              <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line · </span>
              Nothing is executed without your confirmation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WelcomeState({ userName, hasFamily, onSuggest }: { userName: string; hasFamily: boolean; onSuggest: (s: string) => void }) {
  return (
    <div className="space-y-6 py-4 text-center sm:py-8">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grad-primary text-white shadow-sm">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-lg font-semibold text-sf-ink">
          Hello {userName}, how can I help your family today?
        </h2>
        <p className="mt-1.5 text-sm text-sf-charcoal">
          Write a real coordination problem in Bangla, English, or Banglish. I&apos;ll propose tasks, reminders,
          calendar events or messages — and nothing happens until you confirm.
        </p>
        {!hasFamily ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-sf-light-orange p-2 text-xs text-sf-warning">
            Tip: create a family space first so I can see your authorized family context.
          </p>
        ) : null}
      </div>
      <div className="grid gap-2.5 text-left sm:grid-cols-2">
        {EXAMPLES.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggest(s.text)}
            className="group rounded-xl border border-sf-border-gray px-3.5 py-3 transition-colors hover:border-sf-orange hover:bg-sf-cream focus-visible:ring-2 focus-visible:ring-sf-orange/40 focus-visible:outline-none"
          >
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-sf-muted-gray">
              {s.lang}
            </span>
            <span className="mt-0.5 block text-sm text-sf-charcoal group-hover:text-sf-ink">{s.text}</span>
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
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-sf-deep-orange px-4 py-2.5 text-sm text-white">
            <p className="whitespace-pre-line">{content}</p>
          </div>
          <p className="mt-1 pr-1 text-right text-[10px] text-sf-muted-gray">{userName} · {relativeTime(createdAt)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white" aria-hidden="true">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md border border-sf-light-orange bg-sf-cream px-4 py-2.5 text-sm text-sf-charcoal">
          <p className="whitespace-pre-line">{content}</p>
        </div>
        <p className="mt-1 pl-1 text-[10px] text-sf-muted-gray">Assistant · {relativeTime(createdAt)}</p>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-2.5" aria-live="polite">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-primary text-white opacity-70" aria-hidden="true">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      </span>
      <div className="rounded-2xl rounded-bl-md border border-sf-light-orange bg-sf-cream px-4 py-3">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sf-orange [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sf-orange [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sf-orange" />
        </span>
        <p className="mt-2 text-xs text-sf-muted-gray">
          Thinking… usually a few seconds, but the model can be slow at busy times — this can take a few minutes. We&apos;ll try an alternative model before giving up.
        </p>
      </div>
    </div>
  );
}

function ErrorBubble({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-0 rounded-xl border border-sf-error/30 bg-red-50/60 p-3.5 dark:bg-red-950/20">
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sf-error" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-sf-charcoal">{message}</p>
          <p className="mt-0.5 text-[11px] text-sf-muted-gray">
            Your message wasn&apos;t processed — retrying is safe and won&apos;t duplicate anything.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </Button>
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
  const [busy, setBusy] = useState<'confirm' | 'cancel' | null>(null);

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

  async function handleConfirm() {
    setBusy('confirm');
    await onConfirm();
    setBusy(null);
  }

  async function handleCancel() {
    setBusy('cancel');
    await onCancel();
    setBusy(null);
  }

  if (proposal.state !== 'pending') {
    const done = proposal.state === 'confirmed';
    return (
      <Card className={`p-3.5 ${done ? 'border-sf-success/40 bg-green-50/40' : 'border-sf-border-gray opacity-75'}`}>
        <div className="flex items-center gap-2 text-sm">
          <Badge color={done ? 'green' : proposal.state === 'failed' ? 'red' : 'gray'}>
            {done ? 'Executed' : proposal.state === 'failed' ? 'Failed' : 'Cancelled'}
          </Badge>
          <span className="font-medium text-sf-ink">{TYPE_LABEL[proposal.type] ?? proposal.type}</span>
          {proposal.result ? <span className="truncate text-sf-muted-gray">{proposal.result}</span> : null}
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-sf-orange/60 bg-white/60 p-4 shadow-sm dark:bg-black/20">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge color="orange">{TYPE_LABEL[proposal.type] ?? proposal.type}</Badge>
        <Badge color="gray">Requires your confirmation</Badge>
      </div>
      <p className="text-sm font-medium text-sf-ink">{itemsText(proposal.payload)}</p>
      {proposal.payload && typeof proposal.payload === 'object' && 'description' in proposal.payload ? (
        <p className="mt-1 text-xs text-sf-muted-gray">{String(proposal.payload.description)}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-sf-muted-gray">
        {proposal.explanation ? '' : 'The assistant proposed this based on your message. '}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void handleConfirm()} disabled={busy !== null}>
          {busy === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void handleCancel()} disabled={busy !== null}>
          <X className="h-4 w-4" aria-hidden="true" /> Cancel
        </Button>
      </div>
    </div>
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
  for (const key of Object.keys(result)) {
    const v = result[key];
    if (v === undefined || v === null) continue;
    const label = localizeResultKey(key);
    parts.push(typeof v === 'object' ? '' : `${label}: ${v}`);
  }
  const base = parts.filter(Boolean).join(' · ');
  if (type === 'draft_message') return 'message sent to the conversation member';
  return base || type;
}
