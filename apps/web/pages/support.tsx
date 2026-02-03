import Layout from '@/components/Layout';

export default function SupportPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600">
          Use the chat widget (bottom-right) to contact support. If chat isn&apos;t available, email support from your
          registered account.
        </p>
        <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-sm text-brand-maroon-black">
          Tip: include your escrow ID and screenshots when reporting an issue.
        </div>
      </div>
    </Layout>
  );
}

