// app/(dashboard)/refund/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — Borderless Translator',
  description:
    'Refund terms for Borderless Translator subscriptions and pay-as-you-go credits.',
};

export default function RefundPage() {
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
          Refund Policy
        </h1>
        <p className="mt-3 text-white/70 text-sm">
          Effective date: 2025-09-01 · Last updated: 2025-09-01
        </p>
      </header>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur">
        <section className="space-y-8 text-[15px] leading-7 text-white/90">
          <p>
            Borderless Translator is a digital translation service. We incur compute costs whenever a
            job is processed. This Refund Policy describes when refunds may be issued and when they are
            not available. If you have questions, contact <b>billing@yourdomain.com</b>.
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">1) General Principles</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Pay-as-you-go credits</b> and <b>consumed subscription usage</b> are{' '}
                <b>non-refundable</b> once used, because related compute has already been spent.
              </li>
              <li>
                <b>Minor translation imperfections</b> (e.g., OCR slips, occasional mistranslations,
                layout quirks) are expected in automated processing and <b>are not</b> a basis for
                refund.
              </li>
              <li>
                We aim for high fidelity, but <b>subjective dissatisfaction</b> with style, tone, or
                model choice is <b>not</b> eligible for refund. You can switch OCR/model/direction and
                re-run jobs.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2) Eligible Refund Cases</h2>
            <p className="mb-2">We may issue a full or partial refund in the following situations:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Duplicate charge</b> for the same plan/order (submit both receipts).
              </li>
              <li>
                <b>Unauthorized payment</b> proven via your payment provider (we may temporarily
                suspend access while investigating).
              </li>
              <li>
                <b>Persistent technical failure</b> attributable to us that prevents all translation
                attempts for your account over a continuous 24-hour period (provide timestamps, job
                IDs/logs). Output quality complaints alone do not qualify.
              </li>
              <li>
                <b>New subscription with zero usage</b> within 7 days of purchase, upon request.
              </li>
            </ul>
            <p className="mt-2">
              For purchases through third-party marketplaces (e.g., app stores), their refund rules
              apply; please request a refund directly from that store.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3) Non-Refundable Situations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Credits or plan quota already consumed.</li>
              <li>Minor OCR/translation/layout imperfections or model/style preference.</li>
              <li>Network issues, rate limits, or queue delays outside our control.</li>
              <li>Violation of our terms (e.g., restricted content) or account misuse.</li>
              <li>Forgetting to cancel before renewal; partial-period proration is not offered.</li>
              <li>Currency exchange differences or bank fees.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4) How to Request a Refund</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Email <b>billing@yourdomain.com</b> within <b>7 days</b> of the charge, including:
                order ID, account email, and a clear description (and screenshots/logs if technical).
              </li>
              <li>
                We usually respond within <b>3 business days</b>. If approved, refunds are issued to
                the original payment method; banks typically post them within <b>5-10 business
                days</b>.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5) Chargebacks</h2>
            <p>
              If you open a chargeback before contacting us, your account may be paused while we
              respond to the dispute. We’re happy to resolve billing issues directly and quickly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6) Local Rights</h2>
            <p>
              Some jurisdictions provide additional consumer rights; nothing in this policy limits
              those non-waivable rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p>
              Borderless Translator<br />
              Billing: <b>billing@yourdomain.com</b>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
