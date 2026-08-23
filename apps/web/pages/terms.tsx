import Link from 'next/link';
import PublicPage from '@/components/PublicPage';
import { publicForm } from '@/lib/form-classes';

export default function TermsPage() {
  return (
    <PublicPage
      title="Terms and Conditions"
      subtitle="Last updated: February 2025. Ghana-based. Applies to web, Android and iOS."
      documentTitle="Terms and Conditions - MYXCROW"
      description="Terms and Conditions for MYXCROW secure escrow services. Ghana-based platform for web, Android and iOS."
    >
              <section className={publicForm.legalProse}>
                <div>
                  <h2 className={publicForm.legalSectionTitle}>1. Acceptance and scope</h2>
                  <p>By registering, accessing or using MYXCROW (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;) — including our website, Android app, and iOS app — you agree to these Terms and Conditions. If you do not agree, do not use the Platform. These terms apply to all users in Ghana and any other jurisdiction where we make the service available.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>2. Eligibility</h2>
                  <p>You must have the legal capacity to enter into a binding contract in your jurisdiction. We do not impose a minimum age. By using the Platform you represent that you meet these requirements. The service is primarily intended for users in Ghana; use from other countries is at your own risk and subject to local laws.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>3. Description of service</h2>
                  <p>MYXCROW is an escrow platform. We hold funds securely between buyers and sellers until agreed conditions (e.g. delivery, acceptance) are met. We are not a bank, payment institution, or party to your underlying commercial transaction. We facilitate secure holding and release of funds according to the escrow agreement and our policies.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>4. Account and phone verification</h2>
                  <p>You must register with accurate information (name, email, and a Ghana mobile number). We verify your number with a one-time SMS code during registration. You are responsible for keeping your account credentials secure. Providing false information or failing phone verification may result in account suspension or termination.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>5. Escrow process</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Creation:</strong> Escrow terms (amount, milestones, release conditions) are set when the escrow is created.</li>
                    <li><strong>Funding:</strong> Funds are held by us until release conditions are met or the escrow is cancelled/refunded per the agreement.</li>
                    <li><strong>Release/refund:</strong> We release or refund funds only in accordance with the escrow agreement, user instructions (e.g. buyer confirmation), or a resolved dispute.</li>
                    <li><strong>Disputes:</strong> If there is a dispute, we may hold funds until the dispute is resolved by the parties or through our dispute process.</li>
                  </ul>
                  <p className="mt-2">You must not use escrow for illegal goods or services, fraud, or any purpose prohibited by law or these terms.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>6. Fees</h2>
                  <p>Fees (e.g. platform or escrow fees) are displayed before you confirm a transaction. By completing a transaction you agree to the applicable fees. Fees may be updated; changes will not apply retroactively to existing escrows unless otherwise stated.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>7. Prohibited use</h2>
                  <p>You must not use the Platform for any illegal activity, money laundering, fraud, or to violate any law. You must not attempt to circumvent security, abuse other users, or misuse the escrow process. We may suspend or terminate accounts and report activity to authorities where required.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>8. Intellectual property</h2>
                  <p>MYXCROW and its logos, branding, and content are our property or our licensors. You may not copy, modify, or use them without our written permission.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>9. Disclaimers</h2>
                  <p>The Platform is provided &quot;as is&quot;. We do not guarantee uninterrupted or error-free service. We are not responsible for the quality, legality, or delivery of goods or services in your underlying transactions — only for holding and releasing funds according to the escrow agreement and our processes.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>10. Limitation of liability</h2>
                  <p>To the fullest extent permitted by law, our liability for any claim arising from or related to the Platform (including escrow, disputes, or data loss) shall not exceed the fees you paid to us in the twelve (12) months before the claim, or the amount held in the relevant escrow, whichever is lower. We are not liable for indirect, consequential, or punitive damages.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>11. Indemnity</h2>
                  <p>You agree to indemnify and hold harmless MYXCROW, its affiliates, and their officers and employees from any claims, losses, or costs arising from your use of the Platform, breach of these terms, or violation of any law.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>12. Termination</h2>
                  <p>We may suspend or terminate your account for breach of these terms, fraud, or at our discretion with notice where required. You may close your account subject to completing or resolving any open escrows. Upon termination, your right to use the Platform ceases; provisions that by their nature should survive (e.g. liability, indemnity, governing law) will survive.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>13. Governing law and disputes</h2>
                  <p>These terms are governed by the laws of the Republic of Ghana. Any dispute shall be subject to the exclusive jurisdiction of the courts of Ghana. Nothing in these terms excludes any mandatory consumer or data protection rights you have under Ghanaian law.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>14. Changes</h2>
                  <p>We may update these terms from time to time. We will notify you of material changes via the Platform, email, or in-app notice. Continued use after the effective date constitutes acceptance. If you do not agree, you must stop using the Platform and may close your account.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>15. Contact</h2>
                  <p>For questions about these terms, contact us via the in-app chat widget or email from your registered account. Include your escrow ID when relevant. See our <Link href="/support" className="text-brand-maroon font-semibold hover:underline">Support</Link> page for more information.</p>
                </div>

                <div>
                  <h2 className={publicForm.legalSectionTitle}>16. Web and Mobile Web</h2>
                  <p>These same Terms and Conditions apply whether you use MYXCROW on the web (desktop or mobile browser). Accessing or using the service constitutes acceptance of these terms.</p>
                </div>
              </section>

              <div className={publicForm.legalFooter}>
                <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-brand-maroon font-semibold touch-manipulation">Privacy Policy</Link>
                <Link href="/support" className="inline-flex min-h-[44px] items-center text-brand-maroon font-semibold touch-manipulation">Support</Link>
                <Link href="/" className="inline-flex min-h-[44px] items-center text-brand-maroon font-semibold touch-manipulation">Home</Link>
              </div>
    </PublicPage>
  );
}
