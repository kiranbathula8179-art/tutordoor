import { Link } from "react-router-dom";

import { Section, StaticPageShell } from "@/features/static/StaticPageShell";

export function AboutPage() {
  return (
    <StaticPageShell
      title="About TutorDoor"
      subtitle="Great tutors change trajectories. Finding one shouldn't take luck."
    >
      <Section title="What we're building">
        <p>
          TutorDoor is a marketplace that connects students with verified tutors for 1-on-1 sessions and structured
          group courses — online or in person. We handle the unglamorous parts (identity verification, scheduling,
          payments, refunds, live classrooms) so that learning is the only thing left to focus on.
        </p>
      </Section>

      <Section title="How it works">
        <p>
          <strong className="text-navy">Students</strong> search by subject, compare verified profiles with real
          post-session reviews, book a slot straight from a tutor's live availability, and pay securely. Every paid
          session comes with a joinable online classroom.
        </p>
        <p>
          <strong className="text-navy">Tutors</strong> build a profile, pass document verification, publish their
          weekly availability once, and get paid into their TutorDoor wallet the moment work completes — with every
          rupee traceable in an immutable ledger.
        </p>
        <p>
          <strong className="text-navy">Parents</strong> link to their children's accounts to book on their behalf and
          follow progress. <strong className="text-navy">Institutes</strong> bring their faculty and student rolls onto
          one roster.
        </p>
      </Section>

      <Section title="What we believe">
        <p>
          <strong className="text-navy">Trust is earned with process, not promises</strong> — that's why verification is
          document-based and reviews only come from completed sessions.
        </p>
        <p>
          <strong className="text-navy">Tutors are professionals</strong> — transparent commissions, immediate payout
          accounting, and tools that respect their time.
        </p>
        <p>
          <strong className="text-navy">Money deserves an audit trail</strong> — amounts are computed server-side, and
          every wallet movement is a permanent ledger entry.
        </p>
      </Section>

      <Section title="Get in touch">
        <p>
          Questions, feedback, partnership ideas? Head to <Link to="/support" className="font-medium text-primary hover:underline">Support</Link> — a
          real person reads everything.
        </p>
      </Section>
    </StaticPageShell>
  );
}

export function TrustSafetyPage() {
  return (
    <StaticPageShell
      title="Trust & Safety"
      subtitle="The systems that make a marketplace of strangers safe enough for your family."
    >
      <Section title="Tutor verification">
        <p>
          Tutors don't appear in search results as "verified" until a platform administrator has reviewed
          government-issued ID and qualification documents. Rejections come with a written reason; approvals are
          revocable. Look for the verification badge on any profile.
        </p>
      </Section>

      <Section title="Payments you can trust">
        <p>
          All payments run through PCI-DSS-compliant gateways (Razorpay, Stripe) — TutorDoor never sees or stores card
          numbers. Prices are computed on our servers from the tutor's published rates, never from what a browser
          claims. Tutor earnings live in an auditable wallet ledger where every entry is permanent.
        </p>
      </Section>

      <Section title="Reviews that mean something">
        <p>
          Only students who actually completed a session with a tutor can review them — one review per booking,
          tied to the record. No purchased stars, no drive-by ratings.
        </p>
      </Section>

      <Section title="For minors">
        <p>
          Parents can link to a child's account (the child confirms by email), see their bookings and course progress,
          and manage payments. Live class links are unique per session and shared only with enrolled participants.
        </p>
      </Section>

      <Section title="Reporting a problem">
        <p>
          If a session, message, or profile crosses a line, report it via <Link to="/support" className="font-medium text-primary hover:underline">Support</Link> with
          the booking reference. Verified reports can lead to warnings, payout holds, or removal from the platform.
          For emergencies, always contact local authorities first.
        </p>
      </Section>
    </StaticPageShell>
  );
}
