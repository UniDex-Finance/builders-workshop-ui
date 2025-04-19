import { Header } from "../components/shared/Header";
import { FundingArbitrageScanner } from "../components/features/funding-arb/FundingArbitrageScanner";

export default function FundingArbPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <FundingArbitrageScanner />
      </main>
    </div>
  );
} 