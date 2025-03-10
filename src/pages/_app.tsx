import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import Head from "next/head";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  DisclaimerComponent,
} from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";

import { config } from "../wagmi";
import { arbitrum } from "viem/chains";
import { PriceProvider } from "../lib/websocket-price-context";
import { DailyBasePricesProvider } from "../lib/daily-base-prices-context";
import { Footer } from "../components/shared/Footer";
import { Toaster } from "../components/ui/toaster";
import NewVersionNotification from "../components/shared/NewVersionNotification";

const client = new QueryClient();
const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree that you are not a US citizen or in any
    resticted territory based the {" "}
    <Link href="https://termsofservice.xyz">Terms of Service</Link> and
    acknowledge you have read and understand the protocol {" "}
    <Link href="https://disclaimer.xyz">Disclaimer</Link>
  </Text>
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="application-name" content="UniDex Exchange" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UniDex" />
        <meta name="description" content="Open Source Perp Liquidity Layer" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        <link rel="manifest" href="/manifest.json" />
        
        {/* Standard favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/static/images/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/images/favicon/favicon-16x16.png" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/static/images/favicon/iOS180X180.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/static/images/favicon/apple-touch-icon-120x120.png" />
        
        {/* Android/PWA icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/static/images/favicon/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/static/images/favicon/android-chrome-512x512.png" />
      </Head>
      <Script
        id="register-sw"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful');
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `,
        }}
      />
      <Script
        src="/static/charting_library/charting_library.standalone.js"
        strategy="beforeInteractive"
      />
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        themes={['light', 'dark', 'greenify', 'hotline', 'oled']}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={client}>
            <RainbowKitProvider
              modalSize="compact"
              appInfo={{
                appName: "RainbowKit Demo",
                disclaimer: Disclaimer,
              }}
              theme={{
                lightMode: lightTheme(),
                darkMode: darkTheme({ overlayBlur: "small" }),
              }}
              initialChain={arbitrum}
            >
              <PriceProvider>
                <DailyBasePricesProvider>
                  <div className="relative flex flex-col min-h-screen">
                    <div className="flex-grow pb-8">
                      <Component {...pageProps} />
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 bg-background">
                      <Footer />
                    </div>
                    <div className="relative z-50">
                      <Toaster />
                      <NewVersionNotification />
                    </div>
                  </div>
                </DailyBasePricesProvider>
              </PriceProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;