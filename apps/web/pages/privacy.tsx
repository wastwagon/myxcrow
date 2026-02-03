import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - MYXCROW</title>
        <meta name="description" content="Privacy Policy for MYXCROW. How we collect, use and protect your data. Ghana Data Protection Act 2012 (Act 843). Web, Android and iOS." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-3xl font-bold text-brand-maroon-black mb-2">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mb-8">Last updated: February 2025. Ghana-based. Applies to web, Android and iOS.</p>

              <section className="space-y-6 text-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">1. Who we are</h2>
                  <p>MYXCROW (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a Ghana-based escrow platform. We operate the MYXCROW website, Android app, and iOS app. We are the data controller for the personal data we collect in connection with these services. This Privacy Policy explains how we collect, use, store, and protect your information in line with the Data Protection Act 2012 (Act 843) of Ghana and applicable law.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">2. Data we collect</h2>
                  <p className="mb-2">We collect the following categories of data:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Account data:</strong> Email, name, phone number, password (stored in hashed form), account type (buyer/seller), and registration date.</li>
                    <li><strong>Identity verification (KYC):</strong> Ghana Card number, photos of Ghana Card (front and back), selfie photo, and face verification results (e.g. similarity score) used to verify your identity and prevent fraud.</li>
                    <li><strong>Escrow and transaction data:</strong> Escrow IDs, amounts, parties, milestones, release/refund actions, wallet balances, top-ups, withdrawals, and related transaction history.</li>
                    <li><strong>Communications and support:</strong> Messages you send via the in-app chat widget, emails from your registered account, and any screenshots or attachments you provide when reporting issues (e.g. escrow ID, evidence).</li>
                    <li><strong>Device and usage data:</strong> IP address, device type, browser or app version, and general usage information (e.g. pages visited, actions taken) to operate the service, secure it, and improve it.</li>
                  </ul>
                  <p className="mt-2">We do not sell your personal data to third parties.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">3. How we use your data</h2>
                  <p>We use your data to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Provide and operate the escrow, wallet, and support services.</li>
                    <li>Verify your identity (KYC) and comply with legal and fraud-prevention requirements.</li>
                    <li>Process disputes, releases, and refunds in line with escrow agreements.</li>
                    <li>Communicate with you (e.g. notifications, support, important updates).</li>
                    <li>Secure the Platform (e.g. authentication, fraud detection, risk scoring).</li>
                    <li>Improve our services and user experience (e.g. analytics, troubleshooting).</li>
                    <li>Comply with applicable law and respond to lawful requests from authorities.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">4. Legal basis</h2>
                  <p>We process your data on the basis of: (a) performance of our contract with you (e.g. providing escrow and account services); (b) your consent where we ask for it (e.g. marketing, optional features); (c) our legitimate interests (e.g. security, fraud prevention, improving the service); and (d) compliance with legal obligations (e.g. KYC, anti-fraud, regulatory reporting where required).</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">5. Sharing your data</h2>
                  <p>We may share your data with:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>Payment and service providers:</strong> To process top-ups, withdrawals, or other payments (e.g. mobile money, bank transfers) in line with our terms and your instructions.</li>
                    <li><strong>Regulators and authorities:</strong> Where required by law or to protect rights and safety.</li>
                    <li><strong>Support and infrastructure:</strong> Trusted partners who help us run the Platform (e.g. hosting, support tools), under strict confidentiality and data protection obligations.</li>
                  </ul>
                  <p className="mt-2">We do not sell your personal data. We do not share it for third-party marketing without your consent.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">6. Retention</h2>
                  <p>We retain your data for as long as your account is active and as needed to provide the service, resolve disputes, and comply with legal obligations (e.g. tax, anti-fraud). After account closure, we may retain certain data for a limited period for legal, security, or dispute-resolution purposes. KYC and transaction records may be retained as required by law or our policies.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">7. Security</h2>
                  <p>We implement appropriate technical and organisational measures to protect your data against unauthorised access, loss, or misuse (e.g. encryption, access controls, secure storage). In the event of a data breach that affects your rights, we will notify you and the Data Protection Commission as required by the Data Protection Act 2012 (Act 843).</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">8. Your rights (Ghana Data Protection Act 2012)</h2>
                  <p>Under the Data Protection Act 2012 (Act 843), you have rights including:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>Access:</strong> To request a copy of the personal data we hold about you.</li>
                    <li><strong>Correction:</strong> To request correction of inaccurate or incomplete data.</li>
                    <li><strong>Erasure:</strong> To request deletion of your data where the law allows.</li>
                    <li><strong>Objection:</strong> To object to processing based on legitimate interests or for direct marketing.</li>
                    <li><strong>Withdraw consent:</strong> Where we rely on consent, you may withdraw it at any time.</li>
                  </ul>
                  <p className="mt-2">To exercise these rights, contact us via the in-app chat or email from your registered account. You may also lodge a complaint with the Data Protection Commission of Ghana.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">9. Children</h2>
                  <p>The Platform is not intended for users under 18. We do not knowingly collect personal data from anyone under 18. If you become aware that a minor has provided us with data, please contact us so we can delete it.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">10. International transfer</h2>
                  <p>Your data is primarily processed in Ghana. If we transfer data outside Ghana, we will ensure appropriate safeguards (e.g. contracts, adequacy decisions) in line with the Data Protection Act 2012.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">11. Changes</h2>
                  <p>We may update this Privacy Policy from time to time. We will notify you of material changes via the Platform, email, or in-app notice. Continued use after the effective date constitutes acceptance. We encourage you to review this policy periodically.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">12. Web, Android and iOS</h2>
                  <p>This Privacy Policy applies to your use of MYXCROW on the web, the Android app (e.g. Google Play), and the iOS app (e.g. App Store). The same data practices and rights apply across all platforms. By using any of these, you acknowledge that you have read and understood this policy.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">13. Contact</h2>
                  <p>For privacy-related questions, to exercise your rights, or to contact a data protection officer (where applicable), use the in-app chat widget or email from your registered account. Include your account/escrow ID when relevant. See our <Link href="/support" className="text-brand-maroon font-semibold hover:underline">Support</Link> page for more information.</p>
                </div>
              </section>

              <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                <Link href="/support" className="text-brand-maroon font-semibold hover:underline">Support</Link>
                <Link href="/" className="text-brand-maroon font-semibold hover:underline">Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
