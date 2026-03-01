/**
 * Premium App Store mockup: Register with device frame
 */
import Head from 'next/head';
import Image from 'next/image';

export default function MockupRegister() {
  return (
    <>
      <Head>
        <title>MYXCROW Register - App Store Mockup</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="mockup-wrapper">
        <div className="mockup-bg" />
        <div className="device-frame">
          <div className="device-notch" />
          <div className="device-screen">
            <div className="mockup-content">
              <div className="screen-headline">Start Protecting Your Deals Today</div>
              <div className="screen-subheadline">Join thousands of trusted users</div>
              <div className="form-header">
                <div className="form-logo">
                  <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={56} height={56} className="object-contain" />
                </div>
                <h1 className="form-title">MYXCROW</h1>
                <p className="form-subtitle">Create Account</p>
              </div>

              <div className="form-fields">
                <div className="field-row">
                  <div className="field half">
                    <label>First Name</label>
                    <div className="input">John</div>
                  </div>
                  <div className="field half">
                    <label>Last Name</label>
                    <div className="input">Doe</div>
                  </div>
                </div>
                <div className="field">
                  <label>Email</label>
                  <div className="input">john@example.com</div>
                </div>
                <div className="field">
                  <label>Phone</label>
                  <div className="input">055 123 4567</div>
                </div>
                <div className="field">
                  <label>Password</label>
                  <div className="input">••••••••</div>
                </div>
                <div className="btn-primary">Create Account</div>
                <p className="form-footer">
                  Already have an account? <span>Sign in</span>
                </p>
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
            width: min(58vw, 520px);
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
        .mockup-content {
          flex: 1;
          overflow-y: auto;
          padding: 44px 24px 24px;
          min-height: 0;
        }
        @media (min-width: 1200px) {
          .mockup-content { padding: 24px 28px; }
        }
        .form-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .form-logo {
          width: 56px;
          height: 56px;
          margin: 0 auto 8px;
          border-radius: 14px;
          overflow: hidden;
          background: #331518;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .form-title {
          font-size: 24px;
          font-weight: 800;
          color: #160f10;
          margin-bottom: 4px;
        }
        .form-subtitle {
          font-size: 16px;
          font-weight: 600;
          color: #8f2126;
        }
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .field-row {
          display: flex;
          gap: 12px;
        }
        .field.half { flex: 1; }
        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }
        .input {
          padding: 12px 14px;
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #9ca3af;
        }
        .btn-primary {
          padding: 14px;
          background: linear-gradient(135deg, #d0ab63 0%, #b89247 100%);
          color: #160f10;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          border-radius: 12px;
          box-shadow: 0 4px 14px rgba(208, 171, 99, 0.4);
          margin-top: 6px;
        }
        .form-footer {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          margin-top: 14px;
        }
        .form-footer span {
          font-weight: 700;
          color: #8f2126;
        }
      `}</style>
    </>
  );
}
