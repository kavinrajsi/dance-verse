export const metadata = {
  title: "Terms & Conditions | Danceverse",
  description:
    "The terms that govern your use of danceverse.org.in, class enrollments, payments, and participation in Danceverse activities.",
  alternates: { canonical: "https://www.danceverse.org.in/terms" },
};

export default function TermsPage() {
  const effective = "September 21, 2025";

  return (
    <main className="container page__policy mx-auto max-w-3xl px-5 py-10">
      <header>
        <h1>Terms & Conditions</h1>
        <p><strong>Effective date:</strong> {effective}</p>
        <p>
          These Terms &amp; Conditions (“Terms”) govern your access to and use of{" "}
          <a href="https://www.danceverse.org.in">danceverse.org.in</a> (the “Site”)
          and Danceverse’s services. By using the Site or enrolling, you agree to these
          Terms.
        </p>
      </header>

      <section>
        <h2>1) Services</h2>
        <p>
          Danceverse offers dance classes, workshops, performances, and related events.
          Details such as schedule, fees, and instructors may change and will be
          updated on the Site or via direct communication.
        </p>
      </section>

      <section>
        <h2>2) Accounts & Eligibility</h2>
        <ul>
          <li>Provide accurate and up-to-date information when registering.</li>
          <li>Users under 18 require parent/guardian consent.</li>
          <li>You are responsible for keeping your login details secure.</li>
        </ul>
      </section>

      <section>
        <h2>3) Payments & Refunds</h2>
        <ul>
          <li>Fees must be paid in advance through accepted payment methods.</li>
          <li>
            Refund policy: [Insert your own policy—e.g., “Full refund before first
            class; partial refunds after.”]
          </li>
          <li>Third-party processors handle payments securely.</li>
        </ul>
      </section>

      <section>
        <h2>4) Conduct & Safety</h2>
        <ul>
          <li>Follow instructor guidance and studio rules.</li>
          <li>Wear appropriate attire and disclose any health conditions.</li>
          <li>
            We may suspend participation if safety or conduct rules are violated.
          </li>
        </ul>
      </section>

      <section>
        <h2>5) Health Disclaimer</h2>
        <p>
          Dance involves physical activity. You confirm you are fit to participate and
          assume all normal risks. Consult a physician if you have health concerns.
        </p>
      </section>

      <section>
        <h2>6) Intellectual Property</h2>
        <p>
          All Site content and class materials belong to Danceverse or licensors.
          Choreographies are for personal learning only and may not be copied or
          distributed without permission.
        </p>
      </section>

      <section>
        <h2>7) Media & Recordings</h2>
        <p>
          We may record classes or events for educational or promotional purposes. If
          you do not wish to appear, notify us in writing before attending.
        </p>
      </section>

      <section>
        <h2>8) Disclaimers</h2>
        <p>
          Services are provided “as is.” We do not guarantee that the Site or Services
          will always be uninterrupted or error-free.
        </p>
      </section>

      <section>
        <h2>9) Limitation of Liability</h2>
        <p>
          To the extent permitted by law, Danceverse is not liable for indirect or
          consequential damages. Our maximum liability is limited to the amount you
          paid in the last 6 months.
        </p>
      </section>

      <section>
        <h2>10) Termination</h2>
        <p>
          We may suspend or terminate access for violations of these Terms. You may
          stop using the Services at any time.
        </p>
      </section>

      <section>
        <h2>11) Governing Law</h2>
        <p>
          These Terms are governed by the laws of <strong>[Your State], India</strong>.
          Courts in <strong>[Your City]</strong> will have jurisdiction, unless
          arbitration/mediation is specified.
        </p>
      </section>

      <section>
        <h2>12) Changes</h2>
        <p>
          We may update these Terms at any time. Updates will be posted here with a new
          effective date. Continued use means you accept the changes.
        </p>
      </section>
    </main>
  );
}
