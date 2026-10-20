'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BellRing, Trash2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, CardHeader, Checkbox, Toast, Modal } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';

export default function SettingsPage() {
  const { user, refresh, logout, family } = useAuth();
  const { role } = useFamilyData();
  const router = useRouter();
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function updatePrivacy(patch: Record<string, boolean>) {
    try {
      await api.patch('/users/me', { privacy: patch });
      await refresh();
      setToast({ kind: 'success', message: 'Privacy settings saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not save settings' });
    }
  }

  async function updateNotif(patch: Record<string, boolean>) {
    try {
      await api.patch('/users/me', { notificationPrefs: patch });
      await refresh();
      setToast({ kind: 'success', message: 'Notification preferences saved.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not save settings' });
    }
  }

  async function deleteAccount() {
    try {
      await api.delete('/users/me');
      await logout();
      router.push('/');
    } catch {
      // fallthrough — toast below
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Account Settings" subtitle="Privacy, consent, notifications, and account management." />
      {toast ? <Toast kind={toast.kind} message={toast.message} /> : null}

      <Card>
        <CardHeader icon={<ShieldCheck className="h-5 w-5 text-sf-deep-orange" />} title="Privacy &amp; AI consent" />
        <div className="p-5 space-y-3">
          <Checkbox
            label="Allow AI to use my family context"
            description="When enabled, the assistant reads shared tasks, events and reminders to help plan. Disable to keep the assistant generic."
            checked={Boolean(user?.privacy.aiFamilyContextAllowed)}
            onChange={(v) => void updatePrivacy({ aiFamilyContextAllowed: v })}
          />
          <Checkbox
            label="Share calendar events I create"
            description="Other members only see events you chose to share with them."
            checked={Boolean(user?.privacy.shareCalendarWithFamily)}
            onChange={(v) => void updatePrivacy({ shareCalendarWithFamily: v })}
          />
          <Checkbox
            label="Allow family updates from my account"
            description="Turn off to prevent posting family updates."
            checked={Boolean(user?.privacy.shareUpdatesWithFamily)}
            onChange={(v) => void updatePrivacy({ shareUpdatesWithFamily: v })}
          />
          <Checkbox
            label="Location sharing (opt-in)"
            description="Visible and revocable. Smart Family never accesses location without this switch and never tracks secretly."
            checked={Boolean(user?.privacy.locationSharingOptIn)}
            onChange={(v) => void updatePrivacy({ locationSharingOptIn: v })}
          />
        </div>
      </Card>

      <Card>
        <CardHeader icon={<BellRing className="h-5 w-5 text-sf-deep-orange" />} title="Notifications" />
        <div className="p-5 space-y-3">
          <Checkbox
            label="In-app notifications"
            description="Task assignments, reminders, invitations and calls — delivered live."
            checked={Boolean(user?.notificationPrefs.inApp)}
            onChange={(v) => void updateNotif({ inApp: v })}
          />
          <Checkbox
            label="Email notifications"
            description={
              'Email delivery is not implemented yet on this server — toggling records your preference for when it lands. In-app delivery is real.'
            }
            checked={Boolean(user?.notificationPrefs.emailEnabled)}
            onChange={(v) => void updateNotif({ emailEnabled: v })}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" />
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-sf-cream border border-sf-light-orange p-4 text-sm text-sf-muted-gray">
            <p className="font-medium text-sf-charcoal mb-1">Signed in as {user?.email}</p>
            {family ? <p>Family role: <span className="font-medium text-sf-charcoal">{role}</span></p> : <p>No family space yet.</p>}
          </div>
          <Button variant="outline" onClick={() => void logout()}>Sign out</Button>
          {role !== 'owner' ? (
            <div className="border-t border-sf-border-gray pt-4">
              <h3 className="font-semibold text-sf-midnight mb-1 flex items-center gap-2"><Trash2 className="h-4 w-4 text-sf-error" /> Danger zone</h3>
              <p className="text-xs text-sf-muted-gray mb-3">
                Deactivating your account removes your access immediately. Family memberships are handled separately — ask your family owner to remove you as well.
              </p>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete my account</Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account?">
        <div className="space-y-4">
          <p className="text-sm text-sf-charcoal">
            Your account will be deactivated immediately and you will be signed out. You cannot undo this yourself.
          </p>
          <ul className="text-xs text-sf-muted-gray space-y-1 bg-sf-cream rounded-lg p-3">
            <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-sf-success mt-0.5" /> You are signed out everywhere in this browser</li>
            <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-sf-success mt-0.5" /> Your family data (tasks, events, messages) stays with the family</li>
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Keep my account</Button>
            <Button variant="danger" onClick={() => void deleteAccount()}>Delete account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
