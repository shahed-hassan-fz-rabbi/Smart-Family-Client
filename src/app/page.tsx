import Link from 'next/link';
import {
  Sparkles, MessagesSquare, Video, Home, ListChecks, CalendarDays, ShieldCheck,
  HeartHandshake, LockKeyhole, ArrowRight, CheckCircle2, AlertTriangle, Clock, Users,
} from 'lucide-react';
import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';

const FEATURES = [
  { icon: Sparkles, title: 'AI Family Assistant', desc: 'Describe a real coordination problem in Bangla, English, or Banglish — get practical plans and confirm tasks, reminders, and events in one place.' },
  { icon: MessagesSquare, title: 'Private Family Messaging', desc: 'Direct and group conversations for your family only — real-time delivery, persistent history, unread badges.' },
  { icon: Video, title: 'Audio & Video Calls', desc: 'Call a family member or the whole group — authenticated rooms, camera and mic controls.' },
  { icon: Home, title: 'Family Space', desc: 'One shared home for members, roles, invitations, and updates that everyone can see.' },
  { icon: ListChecks, title: 'Care Tasks & Reminders', desc: 'Assign responsibilities with due dates, priorities, and server-side recurring reminders.' },
  { icon: CalendarDays, title: 'Shared Calendar', desc: 'Appointments and family events with conflict detection and preparation checklists.' },
  { icon: ShieldCheck, title: 'Safety & Emergency Contacts', desc: 'Emergency contacts, an explicit SOS handoff, and opt-in-only location sharing.' },
  { icon: HeartHandshake, title: 'Health & Wellbeing', desc: 'Everyday wellbeing resources and appointment preparation — never a diagnosis.' },
  { icon: LockKeyhole, title: 'Privacy & Responsible AI', desc: 'You confirm every AI action before it happens. Private chats stay private. No covert tracking, ever.' },
];

const FLOW = [
  'User Request', 'AI Understanding', 'Authorized Context Retrieval', 'Action Proposal',
  'Backend Validation', 'User Confirmation', 'Executed Action', 'Result',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-grad-dark">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
            One Family. One Platform.{' '}
            <span className="bg-grad-primary bg-clip-text text-transparent">Smarter Care with AI.</span>
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-2xl mx-auto">
            Stay connected, organize care, get reminders, and help keep your loved ones safe — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl bg-grad-primary px-7 text-base font-semibold text-white hover:brightness-110 transition shadow-lg shadow-orange-900/40"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex h-12 items-center rounded-xl border border-white/25 px-7 text-base font-semibold text-white hover:bg-white/10 transition"
            >
              Explore Features
            </Link>
          </div>

          {/* Product preview */}
          <div className="mt-14 mx-auto max-w-4xl rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4 sm:p-6 text-left">
            <div className="grid gap-4 sm:grid-cols-3">
              <PreviewCard title="Ourma's doctor visit — tomorrow 10:00" badge="Appointment" body="Rafi assigned the medicine bag checklist. 3 of 5 items done." />
              <PreviewCard title="Weekly schedule review" badge="Reminder" body="Every Sunday, the whole family gets one gentle nudge." dark />
              <PreviewCard title="Assistant" badge="AI" body='"Ma has an appointment tomorrow — let me check the calendar and prepare a plan."' />
            </div>
          </div>
        </div>
      </section>

      {/* Problem → solution */}
      <section className="bg-sf-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-sf-ink text-center">Families are busy and apart. Coordination shouldn&apos;t be hard.</h2>
          <p className="mt-3 text-sf-muted-gray text-center max-w-2xl mx-auto">
            Work, study, and life pull families into different cities — and different apps. Tasks get forgotten, appointments slip,
            and responsibilities stay unclear.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProblemCard icon={AlertTriangle} title="Fragmented communication" desc="Updates scattered across chat apps, phone calls, and sticky notes." />
            <ProblemCard icon={Clock} title="Forgotten tasks & timings" desc="Medicines, school pickups, and appointments missed because nobody remembered." />
            <ProblemCard icon={Users} title="Unclear responsibilities" desc="Everyone assumes someone else will handle it — so nobody does." />
            <ProblemCard icon={CheckCircle2} title="The Smart Family way" desc="One shared space where the AI helps plan, everyone confirms, and tasks actually happen." highlight />
          </div>
        </div>
      </section>

      {/* Feature showcase */}
      <section className="bg-grad-light">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-sf-ink text-center">Everything a family needs, nothing it doesn&apos;t</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-sf-white rounded-xl border border-sf-border-gray shadow-card p-5 hover:shadow-card-hover transition-shadow">
                <f.icon className="h-7 w-7 text-sf-deep-orange" aria-hidden />
                <h3 className="mt-3 font-semibold text-sf-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm text-sf-muted-gray leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI flow */}
      <section className="bg-sf-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-sf-ink text-center">How the AI actually helps</h2>
          <p className="mt-3 text-center text-sf-muted-gray max-w-2xl mx-auto">
            The assistant never acts on its own. It reads only what you&apos;re authorized to see, proposes a plan, and you confirm every step.
          </p>
          <ol className="mt-10 flex flex-wrap justify-center gap-2">
            {FLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className={`rounded-lg px-3 py-2 text-sm font-medium ${i === 5 ? 'bg-sf-deep-orange text-white' : 'bg-sf-cream text-sf-charcoal border border-sf-light-orange'}`}>
                  {i + 1}. {step}
                </span>
                {i < FLOW.length - 1 ? <ArrowRight className="h-4 w-4 text-sf-muted-gray shrink-0" aria-hidden /> : null}
              </li>
            ))}
          </ol>
          <div className="mt-10 mx-auto max-w-2xl bg-sf-midnight rounded-2xl p-6 text-white/85 text-sm leading-relaxed">
            <p className="text-sf-orange font-semibold mb-2">Example — a real day in a real family:</p>
            <p>&ldquo;Tomorrow my mother has a doctor appointment, but I have work.&rdquo;</p>
            <p className="mt-2">
              The assistant checks your authorized calendar, asks for the appointment time if missing, proposes a preparation checklist,
              suggests who could take which responsibility, and shows every change for confirmation before creating tasks, reminders,
              or sending any message.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy & trust */}
      <section className="bg-grad-light">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <TrustCard title="Your confirmation, always" desc="The AI proposes — you decide. No action happens without your explicit confirm." />
            <TrustCard title="Private stays private" desc="Direct messages between two members are never used as assistant context unless shared explicitly." />
            <TrustCard title="No covert tracking" desc="Location sharing is opt-in, visible, and revocable. Missing location is never treated as an emergency." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-grad-dark">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-white">Bring your family onto one platform</h2>
          <p className="mt-3 text-white/75">Free to start. Create your family space in under two minutes.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-grad-primary px-8 text-base font-semibold text-white hover:brightness-110 transition"
          >
            Get Started — It&apos;s simple <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function PreviewCard({ title, badge, body, dark }: { title: string; badge: string; body: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? 'border-white/15 bg-white/10' : 'border-sf-border-gray bg-white'}`}>
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${dark ? 'text-sf-orange' : 'text-sf-deep-orange'}`}>{badge}</span>
      <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-sf-ink'}`}>{title}</p>
      <p className={`mt-1 text-xs ${dark ? 'text-white/70' : 'text-sf-muted-gray'}`}>{body}</p>
    </div>
  );
}

function ProblemCard({ icon: Icon, title, desc, highlight }: { icon: typeof AlertTriangle; title: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? 'bg-sf-midnight text-white border-sf-midnight' : 'bg-sf-white border-sf-border-gray shadow-card'}`}>
      <Icon className={`h-6 w-6 ${highlight ? 'text-sf-orange' : 'text-sf-error'}`} aria-hidden />
      <h3 className={`mt-3 font-semibold ${highlight ? 'text-white' : 'text-sf-ink'}`}>{title}</h3>
      <p className={`mt-1 text-sm ${highlight ? 'text-white/75' : 'text-sf-muted-gray'}`}>{desc}</p>
    </div>
  );
}

function TrustCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-sf-white rounded-xl border border-sf-border-gray shadow-card p-6">
      <LockKeyhole className="h-6 w-6 text-sf-deep-orange" aria-hidden />
      <h3 className="mt-3 font-semibold text-sf-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-sf-muted-gray">{desc}</p>
    </div>
  );
}
