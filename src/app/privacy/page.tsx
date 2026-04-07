import type { Metadata } from "next";
import { getConfig } from "@/lib/property";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: `Privacy Policy — ${config.name}`,
    robots: { index: false },
  };
}

export default async function PrivacyPage() {
  const config = await getConfig();
  const propertyName = config.name;
  const adminEmail = config.adminEmail;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <a href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
            ← {propertyName}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              {propertyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates this website and manages
              the accommodation booking process. For any privacy-related queries, contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="underline">{adminEmail}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What Information We Collect</h2>
            <p>We collect information you provide directly to us when making a booking:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Full name and email address</li>
              <li>Phone number (optional)</li>
              <li>Number of guests and special requests</li>
              <li>Payment information (processed securely by Stripe — we never store card details)</li>
            </ul>
            <p className="mt-3">We also automatically collect certain technical information when you visit our website:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>IP address and browser type</li>
              <li>Pages visited and time spent (analytics, only with your consent)</li>
              <li>Referring website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and manage your reservation</li>
              <li>To send booking confirmations, payment links, and pre-arrival information</li>
              <li>To communicate with you about your stay</li>
              <li>To improve our website and services</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing</h2>
            <p>
              We process your personal data on the following legal bases:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Contract performance</strong> — to fulfil your booking and communicate about your stay.</li>
              <li><strong>Legitimate interests</strong> — to improve our services and protect our business.</li>
              <li><strong>Consent</strong> — for analytics cookies (you can withdraw consent at any time).</li>
              <li><strong>Legal obligation</strong> — where we are required to retain data by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>We share data with trusted third parties only as necessary:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Stripe</strong> — payment processing. Your card details are handled directly by Stripe and
                are never stored on our servers. See{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                  Stripe&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Google Analytics</strong> — anonymous website usage statistics (only if you grant cookie
                consent). Data is anonymised and does not identify you personally. See{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                  Google&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery for booking confirmations and notifications.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              We use cookies to remember your cookie consent preference. If you accept analytics cookies, Google
              Analytics will set additional cookies to track anonymous usage statistics.
            </p>
            <p className="mt-2">
              You can change your cookie preference at any time by clearing your browser&apos;s local storage or
              by declining consent on your next visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain booking data for up to <strong>3 years</strong> from the date of your stay to comply with
              financial and legal obligations. Analytics data (if consented) is retained for 14 months per Google
              Analytics default settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Right to access the data we hold about you</li>
              <li>Right to correction of inaccurate data</li>
              <li>Right to erasure (&ldquo;right to be forgotten&rdquo;)</li>
              <li>Right to restriction of processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent (for analytics)</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="underline">{adminEmail}</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Security</h2>
            <p>
              We take reasonable technical and organisational measures to protect your personal data. However,
              no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated revision date. Your continued use of our website after any changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              For any questions about this Privacy Policy or how we handle your data, contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="underline">{adminEmail}</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 flex gap-6 text-xs text-gray-400">
          <a href="/terms" className="hover:text-gray-600">Terms &amp; Conditions</a>
          <a href="/" className="hover:text-gray-600">Back to {propertyName}</a>
        </div>
      </footer>
    </div>
  );
}
