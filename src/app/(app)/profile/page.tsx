'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, CardHeader, Badge, Field, Input, Select, Toast } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [language, setLanguage] = useState<'en' | 'bn' | 'banglish'>(user?.preferredLanguage ?? 'en');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', { name: name.trim(), preferredLanguage: language, timezone });
      await refresh();
      setToast({ kind: 'success', message: 'Profile updated.' });
    } catch (err) {
      setToast({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not save your profile' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Your Profile" subtitle="How you appear to your family inside Smart Family." />
      {toast ? <div className="mb-4"><Toast kind={toast.kind} message={toast.message} /></div> : null}

      <Card>
        <CardHeader title="Account identity" />
        <div className="flex items-center gap-4 px-5 pt-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-grad-primary text-white text-xl font-bold">
            {(user?.name ?? 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-sf-ink">{user?.email}</p>
            <Badge color="gray">{user?.preferredLanguage === 'bn' ? 'Bangla' : user?.preferredLanguage === 'banglish' ? 'Banglish' : 'English'} speaker</Badge>
          </div>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Display name" hint="Shown to family members in tasks, chats, and updates.">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preferred language" hint="The AI assistant replies in this language.">
              <Select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'bn' | 'banglish')}>
                <option value="en">English</option>
                <option value="bn">Bangla</option>
                <option value="banglish">Banglish (Bangla in Latin letters)</option>
              </Select>
            </Field>
            <Field label="Timezone">
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {['UTC', 'Asia/Dhaka', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Los_Angeles'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> Save profile
          </Button>
        </form>
      </Card>

      <Card className="mt-5 p-5">
        <h3 className="font-semibold text-sf-ink mb-2">What your family can see</h3>
        <ul className="text-sm text-sf-muted-gray space-y-1">
          <li>• Your name, role, and language preference</li>
          <li>• Tasks you assigned or completed in your family</li>
          <li>• Family updates you posted</li>
          <li>• Whether you opted into location sharing (never your actual location history)</li>
          <li>• <span className="text-sf-charcoal">Never:</span> your private direct messages, your account settings, or your AI conversations</li>
        </ul>
      </Card>
    </div>
  );
}
