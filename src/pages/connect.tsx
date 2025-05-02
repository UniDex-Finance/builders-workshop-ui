import Head from "next/head";
import { ConnectDashboard } from "../components/features/connect";

export default function ConnectPage() {
  return (
    <>
      <Head>
        <title>Connect Wallet | UniDex</title>
        <meta name="description" content="Connect your wallet to the UniDex platform" />
      </Head>
      <ConnectDashboard />
    </>
  );
} 