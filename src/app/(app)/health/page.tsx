'use client';

import Link from 'next/link';
import { HeartHandshake, Dumbbell, Salad, Baby, Stethoscope, ClipboardList, CalendarPlus } from 'lucide-react';

const CATEGORIES = [
  {
    icon: HeartHandshake,
    title: 'General wellbeing',
    description:
      'Healthy routines are easier with structure: regular sleep, movement, hydration and time together. Use family tasks to build a routine everyone can see and support.',
    tips: ['Set a consistent family sleep schedule', 'Eat at least one meal together when possible', 'Take a short daily walk together or in parallel'],
  },
  {
    icon: Dumbbell,
    title: 'Exercise & movement',
    description:
      'Adults generally benefit from regular moderate activity; children need daily active play through play, sport, or active chores. Talk to a professional before major changes, especially with existing conditions.',
    tips: ['Schedule a family activity slot on the shared calendar', 'Assign "walk with grandma" as a rotating care task'],
  },
  {
    icon: Salad,
    title: 'Nutrition',
    description:
      'Balanced meals, adequate water and limited processed snacks help every age group. For specific dietary conditions, consult a qualified nutrition professional — this app does not give medical advice.',
    tips: ['Add "weekly groceries" as a recurring family task', 'Use the AI assistant: "Plan a weekly grocery checklist"'],
  },
  {
    icon: Baby,
    title: 'Childcare organization',
    description:
      'Children thrive on predictability. Share school schedules, activity days, and handover responsibilities in the family space so nothing depends on one memory.',
    tips: ['Keep school events on the shared calendar', 'Assign pickup/drop-off with due dates and priorities'],
  },
  {
    icon: Stethoscope,
    title: 'Appointments & medical organization',
    description:
      'Smart Family helps you organize appointments — preparation checklists, transport, documents and reminders. It never diagnoses, prescribes, or replaces your doctor.',
    tips: ['Create an event, then ask the assistant to prepare a checklist', 'Add your doctor\u2019s office to emergency contacts'],
  },
  {
    icon: ClipboardList,
    title: 'Care checklists',
    description:
      'Preparing for a hospital visit, travel, or a busy week? The assistant can generate a checklist of tasks that your family confirms and completes together.',
    tips: ['Try the assistant: "Create a hospital visit preparation checklist for next Thursday"'],
  },
];

export default function HealthPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sf-midnight">Health &amp; Wellbeing</h1>
        <p className="mt-1 text-sm text-sf-muted-gray">
          Everyday family wellbeing resources — practical, general, and honest about limits.
          <span className="block mt-1 text-xs text-sf-warning">
            Smart Family is not a medical service. For personal health questions, consult a qualified professional. In urgent situations contact local emergency services.
          </span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Card key={c.title} className="p-5">
            <c.icon className="h-6 w-6 text-sf-deep-orange" aria-hidden />
            <h2 className="mt-3 font-semibold text-sf-midnight">{c.title}</h2>
            <p className="mt-1.5 text-sm text-sf-muted-gray leading-relaxed">{c.description}</p>
            <ul className="mt-3 space-y-1.5">
              {c.tips.map((t) => (
                <li key={t} className="flex gap-2 text-xs text-sf-charcoal">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-sf-orange shrink-0" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5 flex flex-wrap items-center gap-4">
        <CalendarPlus className="h-6 w-6 text-sf-deep-orange" aria-hidden />
        <p className="flex-1 text-sm text-sf-charcoal">Turn any of these into real tasks or reminders with the AI assistant.</p>
        <Link href="/assistant" className="inline-flex h-10 items-center rounded-lg bg-sf-deep-orange px-4 text-sm font-semibold text-white hover:brightness-110">
          Open assistant
        </Link>
      </Card>
    </div>
  );
}

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white rounded-xl border border-sf-border-gray shadow-card ${className}`}>{children}</div>;
}
