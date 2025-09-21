export const metadata = {
  title: "Privacy Policy | Danceverse",
  description:
    "How Danceverse collects, uses, and protects your personal information when you use danceverse.org.in and our services.",
  alternates: { canonical: "https://www.danceverse.org.in/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  const effective = "September 21, 2025";

  return (
    <main className="container page__policy mx-auto max-w-3xl px-5 py-10">
      <header>
        <h1>Privacy Policy</h1>
        <p><strong>Effective date:</strong> {effective}</p>
        <p>
          This Privacy Policy explains how <strong>Danceverse</strong> (“we”, “us”,
          “our”) collects, uses, and protects information when you use{" "}
          <a href="https://www.danceverse.org.in">danceverse.org.in</a> (the “Site”)
          and our services. By using the Site, you agree to this Policy.
        </p>
      </header>

      <section>
        <h2>1) Information We Collect</h2>
        <ul>
          <li><strong>Personal Information</strong>: name, email, phone, address, date of birth, etc.</li>
          <li><strong>Usage Data</strong>: IP address, browser type, pages visited, time & date, etc.</li>
          <li><strong>Payment Information</strong>: processed securely by third-party providers.</li>
          <li><strong>Communications</strong>: messages, forms, feedback, and preferences.</li>
        </ul>
      </section>

      <section>
        <h2>2) How We Use Information</h2>
        <ul>
          <li>Provide and manage classes, workshops, and events.</li>
          <li>Process payments and enrollments.</li>
          <li>Send confirmations, updates, and promotions (if opted in).</li>
          <li>Improve the Site, user experience, and security.</li>
          <li>Comply with legal requirements.</li>
        </ul>
      </section>

      <section>
        <h2>3) Cookies & Tracking</h2>
        <p>
          We use cookies and analytics to understand usage and improve performance.
          You can disable cookies in your browser, but some features may not work.
        </p>
      </section>

      <section>
        <h2>4) Sharing Your Information</h2>
        <p>We never sell your personal data. We may share it:</p>
        <ul>
          <li>With trusted service providers (hosting, payments, communications).</li>
          <li>As required by law or legal processes.</li>
          <li>To protect rights, property, or safety of users or the public.</li>
          <li>With your consent.</li>
        </ul>
      </section>

      <section>
        <h2>5) Data Security</h2>
        <p>
          We use reasonable safeguards to protect your data. However, no method of
          storage or transmission is completely secure.
        </p>
      </section>

      <section>
        <h2>6) Data Retention</h2>
        <p>
          We retain your data only as long as needed for services, or as required by
          law. Afterwards, it will be deleted or anonymized.
        </p>
      </section>

      <section>
        <h2>7) Children</h2>
        <p>
          Users under 18 must have a parent or guardian’s consent to use our services.
          We do not knowingly collect personal data from minors without consent.
        </p>
      </section>

      <section>
        <h2>8) Your Rights</h2>
        <p>
          You may request access, correction, or deletion of your data, or withdraw
          consent by contacting us.
        </p>
      </section>

      <section>
        <h2>9) International Users</h2>
        <p>
          If you access the Site from outside India, your data may be processed in
          India or other countries with different data laws.
        </p>
      </section>

      <section>
        <h2>10) Changes to This Policy</h2>
        <p>
          We may update this Policy at any time. Updates will be posted here with a new
          effective date.
        </p>
      </section>
    </main>
  );
}
