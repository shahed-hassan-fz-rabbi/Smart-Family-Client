import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';

const SECTIONS = [
  {
    title: 'AI Family Assistant',
    intro: 'Understands real coordination problems — in Bangla, English, and Banglish — and proposes concrete actions.',
    items: [
      'Reads only authorized family context (tasks, calendar, reminders, updates).',
      'Proposes tasks, events, reminders, checklists, and message drafts.',
      'Asks one short clarifying question only when a real detail is missing.',
      'You confirm or edit every proposal — the AI never executes silently.',
    ],
  },
  {
    title: 'Private Family Messaging',
    intro: 'A real-time messaging system for your family, separate from the AI assistant.',
    items: [
      'One-to-one and group conversations with persistent history.',
      'Real-time delivery, typing indicators, unread badges, and read receipts.',
      'Conversation membership enforced on every message via the backend.',
    ],
  },
  {
    title: 'Audio & Video Calls',
    intro: 'Genuine WebRTC calling through a managed provider (LiveKit), with authenticated rooms.',
    items: [
      'Audio or video calls to a family member or a conversation group.',
      'Server-generated access tokens after membership verification.',
      'Mic, camera, and connection controls with real status feedback.',
    ],
  },
  {
    title: 'Tasks, Calendar & Reminders',
    intro: 'The day-to-day coordination core.',
    items: [
      'Assign tasks with priority, due dates, and status tracking.',
      'Shared calendar with conflict detection for the same participants.',
      'Server-side reminders including daily, weekly and monthly recurrence.',
    ],
  },
  {
    title: 'Safety, Health & Privacy',
    intro: 'Care features with consent built in.',
    items: [
      'Family emergency contacts and an explicit SOS handoff.',
      'Location sharing is opt-in, visible, and revocable — never covert.',
      'Wellbeing resources and appointment checklists without medical claims.',
    ],
  },
];

export const metadata = { title: 'Features' };

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />
      <main className="bg-grad-light">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl font-bold text-sf-midnight">Features</h1>
          <p className="mt-2 text-sf-muted-gray max-w-2xl">
            Every feature below is built against a real backend — persistent data, authorization checks, and honest states.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title} className="mt-10 bg-white rounded-xl border border-sf-border-gray shadow-card p-6">
              <h2 className="text-xl font-bold text-sf-midnight">{s.title}</h2>
              <p className="mt-2 text-sm text-sf-muted-gray">{s.intro}</p>
              <ul className="mt-4 space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-sf-charcoal">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sf-orange shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="mt-12 text-center">
            <Link href="/signup" className="inline-flex h-11 items-center rounded-xl bg-grad-primary px-6 font-semibold text-white hover:brightness-110">
              Get Started
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
