import { Header } from "../components/shared/Header";
import { LendingComponent } from "../components/features/lending/LendingComponent";

export default function LendingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4">
        <LendingComponent />
      </main>
    </div>
  );
} 