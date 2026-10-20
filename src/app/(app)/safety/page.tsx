'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Siren, Plus, Phone, Trash2, Star, EyeOff, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState, ErrorState, Field, Input,
  LoadingState, Modal, Textarea, Toast, Checkbox,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useFamilyData } from '@/hooks/useFamilyData';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import type { EmergencyContactT } from '@/lib/types';

export default function SafetyPage() {
  const { user, refresh } = useAuth();
  const { family, role } = useFamilyData();
  const [contacts, setContacts] = useState<EmergencyContactT[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosResult, setSosResult] = useState<string | null>(null);
  const isAdmin = role === 'owner' || role === 'admin';

  const load = useCallback(async () => {
    if (!family) return;
    try {
      const res = await api.get<{ contacts: EmergencyContactT[] }>(`/${family.id}/emergency-contacts`);
      setContacts(res.contacts);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load emergency contacts');
    }
  }, [family]);

  useEffect(() => {
    void load();
    const socket = getSocket();
    const handler = (payload: { from: string; message: string; contacts: string; locationNote: string }) => {
      setSosResult(`⚠️ ${payload.message} — ${payload.locationNote}`);
    };
    socket.on('safety:sos', handler);
    return () => {
      socket.off('safety:sos', handler);
    };
  }, [load]);

  async function toggleLocation(optIn: boolean) {
    try {
      await api.patch('/users/me', { privacy: { locationSharingOptIn: optIn } });
      await refresh();
      setToast({
        kind: 'success',
        message: optIn
          ? 'Location sharing is now ON for your family members (visible to them, revocable any time).'
          : 'Location sharing is off. No location data is shared.',
      });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not update privacy' });
    }
  }

  async function raiseSos() {
    if (!family) return;
    setSosConfirm(false);
    try {
      const res = await api.post<{ message: string; contactsProvided: number; locationShared: boolean }>(`/${family.id}/sos`);
      setSosResult(res.message);
      await refresh();
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'SOS failed' });
    }
  }

  if (!family) {
    return (
      <div>
        <PageHeader title="Family Safety" />
        <Card><ErrorState message="Join a family to use safety features." /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Family Safety"
        subtitle="Emergency contacts, consent-based location sharing, and an explicit SOS handoff."
      />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}
      {error ? <Card className="mb-4"><ErrorState message={error} onRetry={load} /></Card> : null}

      {/* SOS */}
      <Card className="mb-6 border-sf-error/40 bg-red-50/60 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sf-error text-white">
            <Siren className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-[240px]">
            <h2 className="font-bold text-sf-midnight">Need urgent family help?</h2>
            <p className="text-sm text-sf-muted-gray">
              Sends an in-app SOS alert to your family members with your emergency contacts. Smart Family does NOT
              contact emergency services — call your local emergency number directly in a real emergency.
            </p>
          </div>
          <Button variant="danger" onClick={() => setSosConfirm(true)}>
            <Siren className="h-4 w-4" /> Raise SOS
          </Button>
        </div>
        {sosResult ? <div className="mt-3"><Toast kind="success" message={sosResult} /></div> : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Emergency contacts */}
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<Phone className="h-5 w-5 text-sf-deep-orange" />}
            title="Emergency contacts"
            action={isAdmin ? <Button size="sm" variant="outline" onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Add</Button> : undefined}
          />
          {contacts === null ? (
            <LoadingState label="Loading contacts…" />
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-10 w-10" />}
              title="No emergency contacts yet"
              description={isAdmin ? 'Add doctors, neighbours, or anyone your family should reach in urgent moments.' : 'Ask a family admin to add emergency contacts.'}
            />
          ) : (
            <ul className="divide-y divide-sf-border-gray">
              {contacts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sf-midnight truncate">{c.name}</p>
                      {c.isPrimary ? <Badge color="orange"><Star className="inline h-3 w-3 mr-0.5" />Primary</Badge> : null}
                    </div>
                    <p className="text-xs text-sf-muted-gray">{c.relationship}</p>
                    {c.notes ? <p className="text-xs text-sf-muted-gray">{c.notes}</p> : null}
                  </div>
                  <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`} className="text-sm font-medium text-sf-deep-orange hover:underline">
                    {c.phone}
                  </a>
                  {isAdmin ? (
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove emergency contact ${c.name}?`)) return;
                        await api.delete(`/${family!.id}/emergency-contacts/${c.id}`);
                        await load();
                      }}
                      className="p-2 text-sf-muted-gray hover:text-sf-error"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Privacy controls */}
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sf-midnight">Privacy controls</h3>
            <Checkbox
              label={<span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Share my location with family</span>}
              description="Opt-in only. Family members can see that you share location; Smart Family never tracks secretly."
              checked={Boolean(user?.privacy.locationSharingOptIn)}
              onChange={(v) => void toggleLocation(v)}
            />
            <p className="text-xs text-sf-muted-gray flex items-start gap-1.5">
              <EyeOff className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Missing location data is never treated as an emergency, by you or by the app.
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-sf-midnight mb-2">What SOS does &amp; doesn&apos;t do</h3>
            <ul className="text-xs text-sf-muted-gray space-y-1.5">
              <li>✅ Sends an in-app alert to family members with your emergency contacts</li>
              <li>✅ Indicates whether you opted into location sharing (never the actual coordinates)</li>
              <li>❌ Does not contact or dispatch emergency services</li>
              <li>❌ Does not detect emergencies automatically</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Add contact modal */}
      <AddContactModal
        open={modal}
        familyId={family.id}
        onClose={() => setModal(false)}
        onDone={async () => {
          setModal(false);
          setToast({ kind: 'success', message: 'Emergency contact added.' });
          await load();
        }}
      />

      {/* SOS confirm */}
      <Modal open={sosConfirm} onClose={() => setSosConfirm(false)} title="Confirm SOS alert">
        <div className="space-y-4">
          <p className="text-sm text-sf-charcoal">
            This sends an SOS alert to your family members in the app now, including your emergency contact list and your location-sharing status.
          </p>
          <p className="text-xs text-sf-error bg-red-50 border border-sf-error/20 rounded-lg p-2">
            If this is a real emergency (medical, fire, police), also call your local emergency number directly — Smart Family cannot dispatch help.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSosConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => void raiseSos()}>Send SOS alert</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddContactModal({ open, familyId, onClose, onDone }: { open: boolean; familyId: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !relationship.trim() || phone.trim().length < 5) {
      setError('Name, relationship and a valid phone number are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post(`/${familyId}/emergency-contacts`, {
        familyId,
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        isPrimary,
      });
      setName('');
      setRelationship('');
      setPhone('');
      setNotes('');
      setIsPrimary(false);
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the contact');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add emergency contact">
      <form onSubmit={submit} className="space-y-4">
        {error ? <Toast kind="error" message={error} /> : null}
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Karim" autoFocus /></Field>
        <Field label="Relationship"><Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Family physician" /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1700 000000" /></Field>
        <Field label="Notes" hint="Optional — opening hours, address, etc."><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Checkbox label="Set as primary contact" checked={isPrimary} onChange={setIsPrimary} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save contact</Button>
        </div>
      </form>
    </Modal>
  );
}
