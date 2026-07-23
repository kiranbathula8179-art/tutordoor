import { Section, StaticPageShell } from "@/features/static/StaticPageShell";

const FAQS: { q: string; a: string }[] = [
  {
    q: "My payment succeeded but the booking still says pending.",
    a: "Card payments can take a minute to confirm end-to-end. Refresh after a minute; if it persists, contact support with the booking reference — no money is lost, every gateway transaction is reconciled.",
  },
  {
    q: "How do I cancel a session?",
    a: "Open the booking and choose Cancel. Cancelling 12+ hours before the start time keeps you eligible for a full refund; inside 12 hours the fee may be forfeited (see the Refund Policy).",
  },
  {
    q: "Where does my class happen?",
    a: "Online sessions include a Join Class button on the booking page, active around the scheduled time. In-person sessions show the agreed location instead.",
  },
  {
    q: "I'm a tutor — when do I get paid?",
    a: "Session earnings are credited to your TutorDoor wallet when the session completes; course fees are credited when a student's enrollment is paid. The Earnings page shows every ledger entry.",
  },
  {
    q: "Why can't I publish a course yet?",
    a: "Course creation and appearing in search require a verified profile. Upload your documents on the Verification page — the admin team reviews and responds with a reason either way.",
  },
  {
    q: "How do parent accounts work?",
    a: "Invite your child by the email on their TutorDoor account. They confirm from their inbox; after that you can book for them and follow their progress from your parent portal.",
  },
];

export function SupportPage() {
  return (
    <StaticPageShell title="Support" subtitle="Answers to the common stuff, and a human for everything else.">
      <Section title="Frequently asked">
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group rounded-card border border-line bg-canvas px-5 py-4">
              <summary className="cursor-pointer list-none font-medium text-navy marker:content-none">
                {faq.q}
              </summary>
              <p className="mt-2 text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section title="Still stuck?">
        <p>
          Email <a href="mailto:support@tutordoor.example" className="font-medium text-primary hover:underline">support@tutordoor.example</a> from
          your account email and include the booking or payment reference if there is one. Payment issues get
          first-in-line treatment; everything else is answered within one business day.
        </p>
      </Section>
    </StaticPageShell>
  );
}
