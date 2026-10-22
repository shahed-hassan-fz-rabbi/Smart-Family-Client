import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />
      <main className="bg-sf-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold text-sf-ink">Privacy Policy</h1>
          <p className="mt-2 text-sm text-sf-muted-gray">Plain-language summary of what Smart Family stores and shares.</p>

          <div className="mt-8 space-y-8 text-sm text-sf-charcoal leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">1. What we store</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account data: name, email, hashed password (never plaintext), language and timezone preferences.</li>
                <li>Family data: family name and description, member roles, invitations, tasks, calendar events, reminders, updates, and chat messages.</li>
                <li>Service logs with passwords, tokens and cookies redacted.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">2. What we share — and with whom</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Family content is visible only to members of that family, enforced by backend authorization on every request.</li>
                <li>Direct one-to-one messages stay between the two participants. They are never used as AI context or shown to other members.</li>
                <li>You control whether your calendar events are shared with the family via your privacy settings.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">3. AI processing</h2>
              <p>
                Assistant requests are processed by Google Gemini (server-side API key only). Only the authorized context
                required to answer — family name, member names, open tasks, upcoming events, pending reminders — is sent,
                and only when you have that consent enabled. You can disable AI access to your family context from
                Settings → Privacy at any time.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">4. Location</h2>
              <p>
                Location sharing is strictly opt-in, off by default, visible to your family, and revocable at any time from
                your privacy settings. Smart Family never tracks location covertly and never treats missing location data
                as an emergency.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">5. Calls</h2>
              <p>
                Calls use a managed WebRTC provider (LiveKit). Calls are not recorded. Call metadata (participants,
                started/ended times) is stored for your call history.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">6. Your controls</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Edit your profile, privacy consents, and notification preferences in Settings.</li>
                <li>Delete AI conversations at any time.</li>
                <li>Deactivate your account from Settings → Account. Family memberships are removed on request.</li>
              </ul>
            </section>
            <section className="text-xs text-sf-muted-gray border-t border-sf-border-gray pt-4">
              This policy describes the application&apos;s actual implemented behavior. It is not legal advice and may be updated as features change.
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
