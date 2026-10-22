import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />
      <main className="bg-sf-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold text-sf-ink">Terms of Service</h1>
          <p className="mt-2 text-sm text-sf-muted-gray">The essentials, in plain language.</p>
          <div className="mt-8 space-y-8 text-sm text-sf-charcoal leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">1. Your account</h2>
              <p>You are responsible for the accuracy of your account information and for keeping your password safe. One person per account.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">2. Families and roles</h2>
              <p>Whoever creates a family space is its Owner. Owners and Admins manage members and invitations. Invitations expire and cannot be reused. Respecting your family members&apos; consent settings is part of the deal.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">3. AI actions</h2>
              <p>The assistant proposes actions — creating tasks, events, reminders, checklists, or drafted messages. They are executed only after the proposing user explicitly confirms them in the interface, and only if your permissions allow it.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">4. Health and emergency limitations</h2>
              <p>Smart Family is a coordination tool. It is not a medical or emergency service: it does not diagnose, does not prescribe, and does not contact emergency services. In an emergency, always call your local emergency number directly.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">5. Acceptable use</h2>
              <p>No harassment, no covert monitoring of family members, no attempts to access other families&apos; data, and no abuse of the calling or messaging features.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-sf-ink mb-2">6. Availability</h2>
              <p>The service depends on third-party infrastructure (hosting, database, AI provider, calling provider). Features may be unavailable if an external provider is not configured or fails; the app communicates this honestly in the interface.</p>
            </section>
            <section className="text-xs text-sf-muted-gray border-t border-sf-border-gray pt-4">
              These terms describe implemented functionality and may be updated as the product evolves.
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
