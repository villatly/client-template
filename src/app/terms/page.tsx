import type { Metadata } from "next";
import { getConfig, getContent } from "@/lib/property";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: `Terms & Conditions — ${config.name}`,
    robots: { index: false },
  };
}

export default async function TermsPage() {
  const [config, content] = await Promise.all([getConfig(), getContent()]);
  const propertyName = config.name;
  const adminEmail = config.adminEmail;
  const cancellationPolicy = content.policies.cancellation;
  const checkIn = content.policies.checkIn;
  const checkOut = content.policies.checkOut;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By making a reservation with {propertyName} you agree to be bound by these Terms &amp; Conditions.
              Please read them carefully before completing your booking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Reservations</h2>
            <p>
              A booking is confirmed only after you receive a written confirmation from us, either by email or
              through the booking platform. We reserve the right to decline any reservation at our discretion.
            </p>
            <p className="mt-2">
              You must be at least 18 years old to make a reservation. By submitting a booking request, you
              confirm that you meet this requirement and that the information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Check-in &amp; Check-out</h2>
            <ul className="list-disc pl-5 space-y-1">
              {checkIn && <li>Check-in: from <strong>{checkIn}</strong></li>}
              {checkOut && <li>Check-out: by <strong>{checkOut}</strong></li>}
              <li>Early check-in or late check-out may be arranged subject to availability and may incur an additional charge.</li>
              <li>Guests must present valid photo identification at check-in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Payment</h2>
            <p>
              Payment is processed securely via Stripe. By providing your payment details you authorise us to
              charge the total amount stated at the time of booking. All prices are inclusive of applicable taxes
              unless stated otherwise.
            </p>
            <p className="mt-2">
              For <strong>Instant Book</strong> reservations, your card is charged immediately upon booking confirmation.
              For <strong>Request to Book</strong> reservations, no payment is taken until your request has been accepted;
              you will then receive a secure payment link by email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cancellation Policy</h2>
            {cancellationPolicy ? (
              <p>{cancellationPolicy}</p>
            ) : (
              <p>
                Please contact us directly for our cancellation policy. Cancellation terms vary by season and
                rate plan.
              </p>
            )}
            <p className="mt-2">
              To request a cancellation, please contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="underline">{adminEmail}</a>{" "}
              with your booking reference number. Cancellations are not effective until confirmed in writing by us.
            </p>
            <p className="mt-2">
              Where a refund is due, it will be processed to the original payment method within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Guest Conduct</h2>
            <p>
              Guests are expected to treat the property and its contents with care. Any damage caused during your
              stay will be charged to you. We reserve the right to terminate a stay without refund if guests
              behave in a manner that is disruptive, illegal, or contrary to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Liability</h2>
            <p>
              {propertyName} shall not be liable for any loss, injury, or damage to guests or their property
              during their stay, except where such liability cannot be excluded by law. Guests are responsible
              for their own personal belongings and are encouraged to obtain travel insurance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Force Majeure</h2>
            <p>
              We shall not be liable for any failure to perform our obligations due to circumstances beyond our
              reasonable control, including but not limited to natural disasters, government actions, pandemics,
              or power outages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
            <p>
              These Terms &amp; Conditions are governed by the laws of {config.country}.
              Any disputes shall be subject to the exclusive jurisdiction of the courts of {config.country}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              For any questions regarding these terms, please contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="underline">{adminEmail}</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 flex gap-6 text-xs text-gray-400">
          <a href="/privacy" className="hover:text-gray-600">Privacy Policy</a>
          <a href="/" className="hover:text-gray-600">Back to {propertyName}</a>
        </div>
      </footer>
    </div>
  );
}
