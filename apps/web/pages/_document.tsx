import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="icon" href="/logo/MYXCROWLOGO.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/MYXCROWLOGO.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f1414" />
        <meta
          name="facebook-domain-verification"
          content="v00t2xzk48f70lsl0me78o73tumca3"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var p=location.pathname;var c=/^\\/wallet\\/admin/.test(p)?'#1f1414':/^\\/(login|register|forgot-password|reset-password)\\/?$/.test(p)?'#ffffff':/^\\/(dashboard|escrows|wallet|disputes|profile|kyc|change-password|payments)(\\/|$)/.test(p)?'#f2f2f7':'#1f1414';document.documentElement.style.setProperty('--app-chrome-bg',c);if(c==='#f2f2f7')document.documentElement.classList.add('customer-app');})();",
          }}
        />
      </Head>
      <body>
        <div id="app-status-bar-cover" aria-hidden="true" />
        <Script src="/webview-gold-chrome.js" strategy="beforeInteractive" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
