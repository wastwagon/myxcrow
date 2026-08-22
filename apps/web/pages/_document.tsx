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
        <meta name="theme-color" content="#ffffff" />
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
              "(function(){var p=location.pathname;if(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);var light=p!=='/';var c=light?'#f2f2f7':'#1f1414';document.documentElement.style.setProperty('--app-chrome-bg',c);if(/^\\/(dashboard|escrows|wallet|disputes|profile|kyc|change-password|payments)(\\/|$)/.test(p)&&!/^\\/wallet\\/admin/.test(p))document.documentElement.classList.add('customer-app');if(light)document.documentElement.classList.add('public-light');})();",
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
