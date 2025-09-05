// app/(dashboard)/privacy/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Borderless Translator',
  description:
    'How Borderless Translator collects, uses, and safeguards information when you use our website and translation services.',
};

export default function PrivacyPage() {
  return (
    <main className="relative mx-auto w-full max-w-4xl px-6 pt-12 pb-24 text-white">
      <header className="text-center mb-10">
        <h1
          className="hero-gradient-text text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          Privacy Policy
        </h1>
        <p className="mt-3 text-white/70 text-sm">
          Effective date: 2025-09-01 · Last updated: 2025-09-01
        </p>
      </header>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur">
        <section className="space-y-8 text-[15px] leading-7 text-white/90">
          <p>
            This Privacy Policy explains how <b>Borderless Translator</b> (“we”, “our”, “us”)
            collects, uses, and safeguards information when you use our website and translation
            services (the “Services”). Questions? Email <b>support@yourdomain.com</b>.
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">1) Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Account &amp; contact information.</b> Email address, display name, and support
                messages you send us.
              </li>
              <li>
                <b>Uploaded content.</b> Images/PDFs you submit for translation and the outputs we
                generate. By default, these are retained only as long as needed to provide the Service
                and deliver downloads.
              </li>
              <li>
                <b>Usage &amp; device data.</b> Basic technical logs (request time, IP address,
                browser type, language settings, approximate region) for security and operations.
              </li>
              <li>
                <b>Billing information.</b> Payments are handled by our payment providers; we receive
                limited records (e.g., transaction IDs and status).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2) How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide OCR, translation, and typesetting functionality.</li>
              <li>Troubleshoot issues, detect abuse, and protect users and the Service.</li>
              <li>
                Improve quality with aggregate metrics (errors, latency).{' '}
                <b>We do not use your uploads to train our models.</b>
              </li>
              <li>Communicate about support, updates, and important notices.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3) Legal Bases (EEA/UK)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Contract necessity</b> — to deliver the Service you request.</li>
              <li><b>Legitimate interests</b> — security, fraud prevention, improvement.</li>
              <li><b>Consent</b> — where required (e.g., certain analytics/cookies).</li>
              <li><b>Legal obligation</b> — when we must retain or disclose information.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4) Storage &amp; Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Short-lived processing by default.</b> Uploads/outputs are purged after delivery
                or at regular intervals.
              </li>
              <li>
                <b>Optional offline/private mode.</b> When enabled by an organization, processing
                happens in their private environment.
              </li>
              <li>
                <b>Account/billing data</b> is retained while your account is active or as required by law.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5) Sharing &amp; Processors</h2>
            <p className="mb-2">We do not sell personal data. We may share limited information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Infrastructure/GPU providers to run workloads.</li>
              <li>Payment processors for subscriptions/purchases.</li>
              <li>Analytics/monitoring tools to keep the Service reliable.</li>
              <li>Support/email providers under confidentiality obligations.</li>
            </ul>
            <p className="mt-2">We may disclose information if required by law or to protect rights and safety.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6) International Transfers</h2>
            <p>
              When data is processed outside your region, we rely on appropriate safeguards
              (e.g., standard contractual clauses, processor certifications).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7) Cookies &amp; Similar Technologies</h2>
            <p>
              We use essential cookies to operate the site. Optional analytics may be used with
              consent and offer opt-out controls where required.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8) Your Rights</h2>
            <p className="mb-2">
              Depending on your location, you may have rights to access, correct, delete, object to or
              restrict processing, port your data, and withdraw consent.
            </p>
            <p>To exercise rights, email <b>privacy@yourdomain.com</b>. We may verify your request.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9) Security</h2>
            <p>
              We apply administrative, technical, and physical safeguards appropriate to the risk
              (e.g., encryption in transit, access controls, monitoring). No system is perfectly
              secure—please keep your credentials safe.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">10) Children’s Privacy</h2>
            <p>
              The Service is not directed to children under 13 (or the minimum age in your region).
              If you believe a child provided personal data, contact us for prompt action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">11) Third-Party Links</h2>
            <p>
              External websites are governed by their own policies; we are not responsible for their
              content or privacy practices.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">12) Changes</h2>
            <p>
              We may update this Policy. Material changes will be announced here and, where
              appropriate, via additional notice. Continued use of the Service means you accept the updates.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p>
              Borderless Translator<br />
              Email: <b>support@yourdomain.com</b>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
