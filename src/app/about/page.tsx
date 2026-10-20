import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing/Chrome';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-sf-midnight">
      <MarketingNav />
      <main className="bg-grad-light">
        <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-sf-midnight">About Smart Family</h1>
            <p className="mt-3 text-sf-muted-gray leading-relaxed">
              Smart Family exists because staying coordinated with the people you care about is hard — especially when
              they live in different cities. Chats, calls, calendars, doctors, medicines, school runs, groceries: the
              information is everywhere and the responsibility is nowhere.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-sf-border-gray shadow-card p-6 space-y-4">
            <h2 className="text-xl font-bold text-sf-midnight">Our mission</h2>
            <p className="text-sm text-sf-muted-gray leading-relaxed">
              One shared platform where families coordinate everyday responsibilities, remember what matters, communicate
              in real time, and support care for children, elderly relatives, and loved ones — with AI that helps plan but
              never acts without confirmation.
            </p>
            <h2 className="text-xl font-bold text-sf-midnight">What Smart Family is not</h2>
            <ul className="space-y-2 text-sm text-sf-charcoal">
              <li>• It is not a medical service. The assistant never diagnoses, prescribes, or replaces professional care.</li>
              <li>• It is not an emergency system. It does not contact emergency services. Always call your local emergency number directly.</li>
              <li>• It is not a tracker. Location sharing is strictly opt-in, visible to the family, and revocable at any time.</li>
            </ul>
            <h2 className="text-xl font-bold text-sf-midnight">Built honestly</h2>
            <p className="text-sm text-sf-muted-gray leading-relaxed">
              Real database persistence (MongoDB), real authentication, real-time messaging, a real WebRTC calling
              integration path, and an AI layer that reads only what you&apos;re authorized to see and confirms every action
              with you before it writes anything.
            </p>
          </div>
          <div className="text-center">
            <Link href="/signup" className="inline-flex h-11 items-center rounded-xl bg-grad-primary px-6 font-semibold text-white hover:brightness-110">
              Join Smart Family
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
