'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, MessageSquare, Sparkles, Phone, ShieldQuestion, Database } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

const FAQS = [
  {
    q: 'How does the AI assistant respect my privacy?',
    a: 'The assistant only reads data you are authorized to see: your family name, member names, open tasks, upcoming events and pending reminders — and only if your AI consent is enabled in Settings. Private one-to-one chats are never included. Every proposed action waits for your explicit Confirm.',
  },
  {
    q: 'Can the assistant speak Bangla?',
    a: 'Yes — write in Bangla or Banglish and it replies in kind, converting natural time phrases like "kalke" or "next Sunday" into real calendar dates.',
  },
  {
    q: 'What happens when I confirm an AI proposal?',
    a: 'The backend re-validates everything (permissions, payload, assignee membership), then creates the real task/event/reminder/message through the same services a manual action uses. The result shown to you is the backend\u2019s actual response — the AI never claims success on its own.',
  },
  {
    q: 'Are family chats different from the AI assistant?',
    a: 'Completely. Family Chats are private conversations between members, delivered in real time. The AI cannot read them or send in them silently — it can only draft a message which you review and send.',
  },
  {
    q: 'Do calls get recorded?',
    a: 'No. Calls run through a WebRTC provider (LiveKit) with server-issued access tokens; only call metadata (participants and times) is kept.',
  },
  {
    q: 'What does the SOS feature actually do?',
    a: 'It sends an in-app alert to your family members including your emergency contact list and whether you opted into location sharing. It does NOT contact emergency services — always call your local emergency number directly.',
  },
  {
    q: 'How do reminders work if I close the app?',
    a: 'Reminders fire server-side (a scheduler on the backend), not in your browser. Recurring reminders repeat on schedule. Delivery is in-app; email/push are not claimed.',
  },
];

const GLOSSARY = [
  { icon: Sparkles, label: 'AI Assistant', href: '/assistant', desc: 'Plan tasks, events, reminders, checklists and message drafts' },
  { icon: MessageSquare, label: 'Family Chats', href: '/chats', desc: 'Real-time messaging with your family' },
  { icon: Phone, label: 'Calls', href: '/calls', desc: 'Audio and video calls inside your family' },
  { icon: ShieldQuestion, label: 'Safety', href: '/safety', desc: 'Emergency contacts and consent-based SOS' },
  { icon: Database, label: 'Settings', href: '/settings', desc: 'Privacy, consent and notification controls' },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start gap-3">
        <HelpCircle className="h-8 w-8 text-sf-deep-orange shrink-0" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-sf-midnight">Help &amp; Support</h1>
          <p className="mt-1 text-sm text-sf-muted-gray">How Smart Family works — and what it will (and won&apos;t) do for you.</p>
        </div>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-sf-midnight mb-3">Where everything lives</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <Link key={g.label} href={g.href} className="flex items-start gap-3 rounded-lg border border-sf-border-gray p-3 hover:border-sf-orange transition-colors">
              <g.icon className="h-4 w-4 text-sf-deep-orange mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-sf-midnight">{g.label}</span>
                <span className="block text-xs text-sf-muted-gray">{g.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <h2 className="font-semibold text-sf-midnight mb-3">Frequently asked questions</h2>
      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <Card key={f.q} className="overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              aria-expanded={open === i}
            >
              <span className="font-medium text-sm text-sf-midnight">{f.q}</span>
              <ChevronDown className={`h-4 w-4 text-sf-muted-gray transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open === i ? (
              <p className="px-5 pb-4 text-sm text-sf-muted-gray leading-relaxed">{f.a}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-sf-midnight mb-2">Still stuck?</h2>
        <p className="text-sm text-sf-muted-gray mb-3">
          If something in the app reports an error (for example, calling or AI needing configuration), that message reflects the real server state —
          share it with whoever administers your Smart Family deployment.
        </p>
        <Badge color="gray">Deployment admin: see the server README for configuration steps</Badge>
      </Card>
    </div>
  );
}
