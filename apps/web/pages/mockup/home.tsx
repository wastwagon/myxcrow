/**
 * Premium App Store mockup: Home (Hero + Features) with device frame
 */
import Head from 'next/head';
import Image from 'next/image';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Secure Escrow',
    benefit: 'Funds held safely until delivery',
  },
  {
    icon: '🔒',
    title: 'Protected Payments',
    benefit: 'Get paid with confidence',
  },
  {
    icon: '⚡',
    title: 'Fast Processing',
    benefit: 'Quick verification & notifications',
  },
  {
    icon: '✓',
    title: 'Trusted Platform',
    benefit: 'Verified users you can trust',
  },
];

export default function MockupHome() {
  return (
    <>
      <Head>
        <title>MYXCROW - App Store Mockup</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="mockup-wrapper">
        <div className="mockup-bg" />

        <div className="device-frame">
          <div className="device-notch" />
          <div className="device-screen">
            <div className="mockup-content">
              <div className="screen-headline">Protect Your Payments</div>
              <div className="screen-subheadline">Trusted escrow for safe transactions</div>
              {/* Hero */}
              <div className="hero-section">
                <div className="hero-logo">
                  <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={72} height={72} className="object-contain" />
                </div>
                <h1 className="hero-title">MYXCROW</h1>
                <p className="hero-tagline">Secure Escrow for Safe Transactions</p>
                <p className="hero-desc">Protect your payments with our trusted platform. Funds held until both parties are satisfied.</p>
                <div className="hero-cta">Create Account</div>
              </div>

              {/* Features */}
              <div className="features-section">
                {FEATURES.map((f, i) => (
                  <div key={i} className="feature-card">
                    <span className="feature-icon">{f.icon}</span>
                    <div>
                      <div className="feature-title">{f.title}</div>
                      <div className="feature-benefit">{f.benefit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .mockup-wrapper {
          min-height: 100vh;
          min-width: 100vw;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0a0a0a;
        }
        .mockup-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(165deg, #1f1414 0%, #331518 40%, #160f10 100%);
        }
        .screen-headline {
          font-size: clamp(16px, 2.5vw, 20px);
          font-weight: 800;
          color: #160f10;
          text-align: center;
          letter-spacing: -0.02em;
          margin-bottom: 2px;
        }
        .screen-subheadline {
          font-size: clamp(11px, 1.8vw, 13px);
          font-weight: 500;
          color: #8f2126;
          text-align: center;
          margin-bottom: 12px;
        }
        .device-frame {
          position: relative;
          width: min(85vw, 380px);
          height: min(85vh, 820px);
          aspect-ratio: 9 / 19.5;
          background: linear-gradient(145deg, #3a3a3a 0%, #1f1f1f 100%);
          border-radius: 40px;
          padding: 14px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
          z-index: 1;
          overflow: hidden;
          flex-shrink: 0;
        }
        @media (min-width: 1100px) {
          .device-frame {
            width: min(60vw, 520px);
            height: min(85vh, 700px);
            aspect-ratio: 4 / 3;
            border-radius: 28px;
            padding: 18px;
          }
        }
        .device-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 26px;
          background: #1a1a1a;
          border-radius: 0 0 16px 16px;
          z-index: 3;
        }
        @media (min-width: 1100px) {
          .device-notch { display: none; }
        }
        .device-screen {
          position: absolute;
          inset: 14px;
          background: linear-gradient(180deg, #f8f9fa 0%, #fff 100%);
          border-radius: 28px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1100px) {
          .device-screen {
            inset: 18px;
            border-radius: 14px;
          }
        }
        @media (min-width: 1200px) {
          .device-screen { border-radius: 16px; }
        }
        .mockup-content {
          flex: 1;
          overflow-y: auto;
          padding: 44px 20px 24px;
          min-height: 0;
        }
        @media (min-width: 1200px) {
          .mockup-content { padding: 24px 28px; }
        }
        .hero-section {
          text-align: center;
          margin-bottom: 24px;
        }
        .hero-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto 12px;
          border-radius: 16px;
          overflow: hidden;
          background: #331518;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-title {
          font-size: 28px;
          font-weight: 800;
          color: #160f10;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        .hero-tagline {
          font-size: 15px;
          font-weight: 600;
          color: #8f2126;
          margin-bottom: 8px;
        }
        .hero-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          max-width: 280px;
          margin: 0 auto 20px;
        }
        .hero-cta {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #8f2126 0%, #59191f 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          border-radius: 12px;
          box-shadow: 0 4px 14px rgba(143, 33, 38, 0.4);
        }
        .features-section {
          display: grid;
          gap: 12px;
        }
        .feature-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
        }
        .feature-icon {
          font-size: 24px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8f2126 0%, #59191f 100%);
          color: #fff;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .feature-title {
          font-size: 14px;
          font-weight: 700;
          color: #111;
        }
        .feature-benefit {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
      `}</style>
    </>
  );
}
