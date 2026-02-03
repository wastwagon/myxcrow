import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms and Conditions - MYXCROW</title>
        <meta name="description" content="Terms and Conditions for MYXCROW secure escrow services. Ghana-based platform for web, Android and iOS." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-3xl font-bold text-brand-maroon-black mb-2">Terms and Conditions</h1>
              <p className="text-sm text-gray-500 mb-8">Last updated: February 2025. Ghana-based. Applies to web, Android and iOS.</p>

              <section className="space-y-6 text-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">1. Acceptance and scope</h2>
                  <p>By registering, accessing or using MYXCROW (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;) — including our website, Android app, and iOS app — you agree to these Terms and Conditions. If you do not agree, do not use the Platform. These terms apply to all users in Ghana and any other jurisdiction where we make the service available.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">2. Eligibility</h2>
                  <p>You must be at least 18 years old and have the legal capacity to enter into a binding contract. By using the Platform you represent that you meet these requirements. The service is primarily intended for users in Ghana; use from other countries is at your own risk and subject to local laws.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">3. Description of service</h2>
                  <p>MYXCROW is an escrow platform. We hold funds securely between buyers and sellers until agreed conditions (e.g. delivery, acceptance) are met. We are not a bank, payment institution, or party to your underlying commercial transaction. We facilitate secure holding and release of funds according to the escrow agreement and our policies.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">4. Account and KYC</h2>
                  <p>You must register with accurate and complete information (e.g. name, email, phone, Ghana Card details where required). You are responsible for keeping your account credentials secure. We may require identity verification (KYC), including Ghana Card and selfie verification, to comply with law and reduce fraud. Providing false information or failing KYC may result in account suspension or termination.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">5. Escrow process</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Creation:</strong> Escrow terms (amount, milestones, release conditions) are set when the escrow is created.</li>
                    <li><strong>Funding:</strong> Funds are held by us until release conditions are met or the escrow is cancelled/refunded per the agreement.</li>
                    <li><strong>Release/refund:</strong> We release or refund funds only in accordance with the escrow agreement, user instructions (e.g. buyer confirmation), or a resolved dispute.</li>
                    <li><strong>Disputes:</strong> If there is a dispute, we may hold funds until the dispute is resolved by the parties or through our dispute process.</li>
                  </ul>
                  <p className="mt-2">You must not use escrow for illegal goods or services, fraud, or any purpose prohibited by law or these terms.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">6. Fees</h2>
                  <p>Fees (e.g. platform or escrow fees) are displayed before you confirm a transaction. By completing a transaction you agree to the applicable fees. Fees may be updated; changes will not apply retroactively to existing escrows unless otherwise stated.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">7. Prohibited use</h2>
                  <p>You must not use the Platform for any illegal activity, money laundering, fraud, or to violate any law. You must not attempt to circumvent security, abuse other users, or misuse the escrow process. We may suspend or terminate accounts and report activity to authorities where required.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">8. Intellectual property</h2>
                  <p>MYXCROW and its logos, branding, and content are our property or our licensors. You may not copy, modify, or use them without our written permission.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">9. Disclaimers</h2>
                  <p>The Platform is provided &quot;as is&quot;. We do not guarantee uninterrupted or error-free service. We are not responsible for the quality, legality, or delivery of goods or services in your underlying transactions — only for holding and releasing funds according to the escrow agreement and our processes.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">10. Limitation of liability</h2>
                  <p>To the fullest extent permitted by law, our liability for any claim arising from or related to the Platform (including escrow, disputes, or data loss) shall not exceed the fees you paid to us in the twelve (12) months before the claim, or the amount held in the relevant escrow, whichever is lower. We are not liable for indirect, consequential, or punitive damages.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">11. Indemnity</h2>
                  <p>You agree to indemnify and hold harmless MYXCROW, its affiliates, and their officers and employees from any claims, losses, or costs arising from your use of the Platform, breach of these terms, or violation of any law.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">12. Termination</h2>
                  <p>We may suspend or terminate your account for breach of these terms, fraud, or at our discretion with notice where required. You may close your account subject to completing or resolving any open escrows. Upon termination, your right to use the Platform ceases; provisions that by their nature should survive (e.g. liability, indemnity, governing law) will survive.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">13. Governing law and disputes</h2>
                  <p>These terms are governed by the laws of the Republic of Ghana. Any dispute shall be subject to the exclusive jurisdiction of the courts of Ghana. Nothing in these terms excludes any mandatory consumer or data protection rights you have under Ghanaian law.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">14. Changes</h2>
                  <p>We may update these terms from time to time. We will notify you of material changes via the Platform, email, or in-app notice. Continued use after the effective date constitutes acceptance. If you do not agree, you must stop using the Platform and may close your account.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">15. Contact</h2>
                  <p>For questions about these terms, contact us via the in-app chat widget or email from your registered account. Include your escrow ID when relevant. See our <Link href="/support" className="text-brand-maroon font-semibold hover:underline">Support</Link> page for more information.</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-brand-maroon-black mb-2">16. Web, Android and iOS</h2>
                  <p>These same Terms and Conditions apply whether you use MYXCROW on the web, via the Android app (e.g. Google Play), or the iOS app (e.g. App Store). Downloading or using the mobile apps constitutes acceptance of these terms. Where the app store&apos;s terms conflict with ours regarding your relationship with the store (e.g. payment through the store), the store&apos;s terms apply for that relationship only; our escrow and user terms remain as set out here.</p>
                </div>
              </section>

              <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>
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
