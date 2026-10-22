import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  {
    n: 1,
    title: 'Create your account and family space',
    body: 'Sign up with your email, name your family, and choose the default timezone. You become the family owner.',
  },
  {
    n: 2,
    title: 'Invite your family members',
    body: 'Generate a secure invitation link (or send an email invite). Members accept the invitation and join your space with a role.',
  },
  {
    n: 3,
    title: 'Add your schedule and responsibilities',
    body: 'Create tasks with owners and due dates, add calendar events, and set reminders — or just ask the AI assistant to do it after you confirm.',
  },
  {
    n: 4,
    title: 'Talk, call, and stay in sync',
    body: 'Message family members in real time, start audio or video calls, and post updates everyone can see.',
  },
  {
    n: 5,
    title: 'Let the assistant coordinate the hard days',
    body: 'Describe a problem (in Bangla, English or Banglish). The assistant reads authorized context, proposes a plan, and executes it after your confirmation.',
  },
];

export const metadata = { title: 'How It Works' };

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />
      <main className="bg-sf-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-3xl font-bold text-sf-ink">How It Works</h1>
          <p className="mt-2 text-sf-muted-gray">From empty space to coordinated family — five steps.</p>
          <div className="mt-10 space-y-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grad-primary font-bold text-white">
                  {s.n}
                </span>
                <div className="border-b border-sf-border-gray pb-6">
                  <h2 className="font-semibold text-sf-ink">{s.title}</h2>
                  <p className="mt-1 text-sm text-sf-muted-gray leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className="inline-flex h-11 items-center rounded-xl bg-grad-primary px-6 font-semibold text-white hover:brightness-110">
              Start now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
