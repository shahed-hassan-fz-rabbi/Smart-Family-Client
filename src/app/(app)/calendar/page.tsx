'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, AlertTriangle, Trash2, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button, Card, Badge, EmptyState, ErrorState, Field, Input, LoadingState,
  Modal, Select, Toast, Textarea,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { formatDateTime, localToIso, isoToLocalInput } from '@/lib/format';
import type { CalendarEventT } from '@/lib/types';

export default function CalendarPage() {
  const { family, members } = useFamilyData();
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEventT[] | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | null>(null);
  const [dayModal, setDayModal] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const [ev, cf] = await Promise.all([
        api.get<{ events: CalendarEventT[] }>(`/calendar/events?familyId=${family.id}`),
        api.get<{ conflicts: { between: string; a: string; b: string }[] }>(`/calendar/events/conflicts?familyId=${family.id}`),
      ]);
      setEvents(ev.events);
      setConflicts(cf.conflicts.map((c) => c.between));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the calendar');
    }
  }, [family]);

  useEffect(() => {
    setEvents(null);
    void load();
  }, [load]);

  if (!family) {
    return (
      <div>
        <PageHeader title="Shared Calendar" />
        <Card><ErrorState message="Join a family to use the shared calendar." /></Card>
      </div>
    );
  }

  const eventsByDay = new Map<string, CalendarEventT[]>();
  for (const e of events ?? []) {
    const key = new Date(e.startAt).toDateString();
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), e]);
  }

  const y = monthCursor.getFullYear();
  const m = monthCursor.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date().toDateString();

  return (
    <div>
      <PageHeader
        title="Shared Calendar"
        subtitle="Appointments and family events, together."
        action={
          <Button onClick={() => { setModal('create'); setDayModal(null); }}>
            <Plus className="h-4 w-4" /> New event
          </Button>
        }
      />

      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      {conflicts.length > 0 ? (
        <Card className="mb-4 p-4 border-amber-300 bg-amber-50">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">{conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected</p>
              <ul className="mt-1 space-y-0.5">
                {conflicts.slice(0, 3).map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="mt-1 text-xs text-amber-700">Ask the AI assistant to help resolve overlapping events.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mb-4 flex gap-2">
        <Button variant={view === 'month' ? 'primary' : 'outline'} size="sm" onClick={() => setView('month')}>Month</Button>
        <Button variant={view === 'agenda' ? 'primary' : 'outline'} size="sm" onClick={() => setView('agenda')}>Agenda</Button>
      </div>

      {events === null ? (
        <LoadingState label="Loading calendar…" />
      ) : view === 'month' ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonthCursor(new Date(y, m - 1, 1))} className="p-2 rounded-lg hover:bg-sf-cream" aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-bold text-sf-midnight">{monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => setMonthCursor(new Date(y, m + 1, 1))} className="p-2 rounded-lg hover:bg-sf-cream" aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-sf-muted-gray mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(y, m, i + 1);
              const dayEvents = eventsByDay.get(date.toDateString()) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => dayEvents.length && setDayModal(date)}
                  className={`rounded-lg p-2 min-h-[72px] text-left align-top border transition-colors ${
                    date.toDateString() === today
                      ? 'border-sf-orange bg-sf-light-orange/50'
                      : 'border-sf-border-gray hover:border-sf-orange'
                  }`}
                >
                  <span className={`text-xs font-semibold ${date.toDateString() === today ? 'text-sf-deep-orange' : 'text-sf-charcoal'}`}>
                    {i + 1}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <p key={e.id} className="truncate text-[10px] rounded bg-sf-light-orange text-sf-deep-orange px-1 py-0.5 font-medium" title={e.title}>
                        {e.title}
                      </p>
                    ))}
                    {dayEvents.length > 2 ? <p className="text-[10px] text-sf-muted-gray">+{dayEvents.length - 2} more</p> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.filter((e) => new Date(e.endAt) > new Date()).map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <CalendarDays className="h-5 w-5 text-sf-deep-orange mt-0.5 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sf-midnight">{e.title}</p>
                  <p className="text-sm text-sf-muted-gray">
                    {formatDateTime(e.startAt)} – {new Date(e.endAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {e.location ? <p className="mt-0.5 text-xs text-sf-muted-gray flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</p> : null}
                  {e.participants.length && e.participants[0]?.name ? (
                    <p className="mt-1 text-xs text-sf-muted-gray">With: {e.participants.map((p) => p.name).join(', ')}</p>
                  ) : null}
                </div>
                <Badge color="orange">{e.category.replace('_', ' ')}</Badge>
              </div>
            </Card>
          ))}
          {events.filter((e) => new Date(e.endAt) > new Date()).length === 0 ? (
            <Card><EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No upcoming events" description="Add an appointment or family event to get started." /></Card>
          ) : null}
        </div>
      )}

      <EventModal
        open={modal === 'create' || Boolean(dayModal)}
        defaultDate={dayModal ?? monthCursor}
        familyId={family.id}
        memberNames={members.map((mm) => ({ id: mm.userId, name: mm.name }))}
        onClose={() => { setModal(null); setDayModal(null); }}
        onDone={async () => {
          setModal(null);
          setDayModal(null);
          setToast({ kind: 'success', message: 'Event created. Participants were notified.' });
          await load();
        }}
      />
    </div>
  );
}

function EventModal({
  open, defaultDate, familyId, memberNames, onClose, onDone,
}: {
  open: boolean;
  defaultDate: Date;
  familyId: string;
  memberNames: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultStart = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T09:00`;
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(() => {
    const d = defaultDate;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
  });
  const [category, setCategory] = useState('appointment');
  const [participants, setParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const d = defaultDate;
      const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
      const de = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
      setStartAt(ds);
      setEndAt(de);
      setTitle('');
      setLocation('');
      setParticipants([]);
    }
  }, [open, defaultDate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Give the event a title.'); return; }
    const s = localToIso(startAt);
    const en = localToIso(endAt);
    if (!s || !en || new Date(s) >= new Date(en)) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/calendar/events', {
        familyId,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startAt: s,
        endAt: en,
        category,
        participantIds: participants,
      });
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the event');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New event">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Doctor appointment — Mom" autoFocus /></Field>
        <Field label="Location" hint="Optional.">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Green Hospital, Room 4B" />
        </Field>
        <Field label="Description" hint="Optional.">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts"><Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></Field>
          <Field label="Ends"><Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></Field>
        </div>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="appointment">Appointment</option>
            <option value="family_event">Family event</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-sf-charcoal mb-1.5">Invite participants (optional)</legend>
          <div className="flex flex-wrap gap-2">
            {memberNames.map((p) => {
              const checked = participants.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                    checked ? 'border-sf-deep-orange bg-sf-light-orange text-sf-deep-orange font-medium' : 'border-sf-border-gray text-sf-charcoal'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      setParticipants((prev) => (checked ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
                    }
                  />
                  {p.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create event</Button>
        </div>
      </form>
    </Modal>
  );
}
