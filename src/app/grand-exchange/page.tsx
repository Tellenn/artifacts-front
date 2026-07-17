import { GrandExchangeBrowser } from "@/components/GrandExchangeBrowser";

export const metadata = { title: "Grand Exchange — Artifacts MMO" };

export default function GrandExchangePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Grand Exchange</h1>
        <p className="mt-1 text-sm text-gray-400">
          Consulte les ordres de vente et l&apos;historique de prix de
          l&apos;API publique.
        </p>
      </div>
      <GrandExchangeBrowser />
    </main>
  );
}
