import { Link } from "react-router-dom";

import { LegalNote, Section, StaticPageShell } from "@/features/static/StaticPageShell";

export function TermsPage() {
  return (
    <StaticPageShell title="Terms of Service" updated="July 2026">
      <LegalNote />

      <Section title="1. The service">
        <p>
          TutorDoor operates a marketplace connecting students (and parents acting for them) with independent tutors
          and institutes for tutoring sessions and courses. Tutors are independent professionals, not TutorDoor
          employees; TutorDoor provides discovery, scheduling, communication, payment processing, and dispute support.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          You must provide accurate information, keep your credentials confidential, and be legally able to enter this
          agreement. Accounts for minors are used with the involvement of a parent or guardian, who may link to the
          minor's account through the parent-link flow. One person, one account, one role per account.
        </p>
      </Section>

      <Section title="3. Bookings and courses">
        <p>
          A booking is confirmed when payment completes (free demo sessions confirm immediately). Course seats are
          limited and allocated on paid enrollment. Cancellations and refunds are governed by the{" "}
          <Link to="/refunds" className="font-medium text-primary hover:underline">Refund Policy</Link>, which is part
          of these terms.
        </p>
      </Section>

      <Section title="4. Payments, fees, and wallets">
        <p>
          Prices are set by tutors; TutorDoor charges tutors a platform commission disclosed before publishing.
          Payments are processed by third-party gateways — TutorDoor does not store card details. Tutor earnings
          accrue to a TutorDoor wallet as a ledger balance; withdrawal terms are presented in the tutor portal.
        </p>
      </Section>

      <Section title="5. Conduct">
        <p>
          No harassment, discrimination, or unlawful content; no attempting to move platform-originated relationships
          off-platform to avoid fees; no misrepresenting qualifications; no scraping or interfering with the service.
          Verification badges are granted and revoked at TutorDoor's discretion based on documentation.
        </p>
      </Section>

      <Section title="6. Content and reviews">
        <p>
          You retain rights to content you post and grant TutorDoor a license to display it in operating the service.
          Reviews must reflect a genuine completed session; fraudulent reviews are removed and may lead to account
          action.
        </p>
      </Section>

      <Section title="7. Liability and disputes">
        <p>
          The service is provided "as is". To the maximum extent permitted by law, TutorDoor's aggregate liability is
          limited to the fees you paid to TutorDoor in the three months preceding a claim. Disputes are first raised
          via <Link to="/support" className="font-medium text-primary hover:underline">Support</Link>; unresolved
          disputes are subject to the courts of the operating jurisdiction.
        </p>
      </Section>

      <Section title="8. Changes and termination">
        <p>
          We may update these terms with notice through the service; continued use after the effective date is
          acceptance. You can close your account at any time; we may suspend accounts that break these terms, with
          wallet balances handled per the payment terms above.
        </p>
      </Section>
    </StaticPageShell>
  );
}

export function PrivacyPage() {
  return (
    <StaticPageShell title="Privacy Policy" updated="July 2026">
      <LegalNote />

      <Section title="What we collect">
        <p>
          Account details (name, email, phone, role), profile content you provide (bio, subjects, availability,
          learning goals), verification documents for tutors and institutes, booking and payment records (amounts,
          status, gateway references — never card numbers), messages sent through platform chat, and standard
          technical logs.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          To run the marketplace: matching search results, scheduling, processing payments and payouts, sending
          transactional email/SMS/push notifications (reminders, confirmations, verification updates), preventing
          fraud, and improving the product with aggregate analytics. We do not sell personal data.
        </p>
      </Section>

      <Section title="What other users see">
        <p>
          Tutor profiles (name, photo, headline, subjects, rates, ratings) are public. Students share their name with
          tutors they book. Linked parents see their child's bookings, course progress, and related payments. Chat is
          visible to conversation participants and, on reports, to the safety team.
        </p>
      </Section>

      <Section title="Sharing with processors">
        <p>
          We share the minimum necessary with service providers: payment gateways (Razorpay, Stripe), communication
          providers (email/SMS/push), and video-conferencing infrastructure for live classes. Each processes data
          under its own compliance obligations.
        </p>
      </Section>

      <Section title="Retention and security">
        <p>
          Financial ledger records are retained as required by law. Verification documents are stored access-restricted
          and retained only as long as needed to maintain verification status. Passwords are hashed; transport is
          encrypted; access to production data is role-limited.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can access and correct your data from your profile pages, and request export or deletion via{" "}
          <Link to="/support" className="font-medium text-primary hover:underline">Support</Link>. Deletion requests
          are honored except where records must be kept (e.g., tax and payment law).
        </p>
      </Section>
    </StaticPageShell>
  );
}

export function RefundsPage() {
  return (
    <StaticPageShell title="Refund & Cancellation Policy" updated="July 2026">
      <Section title="1-on-1 sessions">
        <p>
          Cancel <strong className="text-navy">12 or more hours</strong> before the scheduled start and you're eligible
          for a full refund of what you paid. Cancellations inside 12 hours may forfeit the session fee — that window
          protects tutors who have reserved the time. Free demo sessions can be cancelled anytime.
        </p>
        <p>
          If a <strong className="text-navy">tutor</strong> cancels, or a technical failure on our side prevents the
          class from happening, you receive a full refund regardless of timing.
        </p>
      </Section>

      <Section title="Group courses">
        <p>
          Leaving a course before it begins makes you eligible for a full refund of the course fee. Once sessions have
          started, refunds are prorated at TutorDoor's discretion based on sessions elapsed; your seat is released
          either way.
        </p>
      </Section>

      <Section title="How refunds are settled">
        <p>
          Approved refunds are returned to the original payment method. Gateway processing typically takes 5–7
          business days to reflect on your statement. Every refund is recorded against the original payment so support
          can trace it end-to-end.
        </p>
      </Section>

      <Section title="Coupons and promotions">
        <p>
          Refunds return the amount actually paid; promotional discounts aren't converted to cash. A coupon consumed
          on a refunded order may be reinstated at our discretion.
        </p>
      </Section>

      <Section title="Disagree with an outcome?">
        <p>
          Raise it via <Link to="/support" className="font-medium text-primary hover:underline">Support</Link> with the
          booking reference within 7 days of the session date and a human will review the record.
        </p>
      </Section>
    </StaticPageShell>
  );
}
