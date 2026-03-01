import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/logo/app-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/app-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8f2126" />
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
