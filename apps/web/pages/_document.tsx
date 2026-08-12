import { Html, Head, Main, NextScript } from 'next/document';

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
        <meta name="theme-color" content="#8f2126" />
        <meta
          name="facebook-domain-verification"
          content="v00t2xzk48f70lsl0me78o73tumca3"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
