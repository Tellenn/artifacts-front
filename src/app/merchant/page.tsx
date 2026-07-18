import { MerchantBuyForm } from "@/components/MerchantBuyForm";

export const metadata = { title: "Marchand — Artifacts MMO" };

export default function MerchantPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Marchand</h1>
        <p className="mt-1 text-sm text-gray-400">
          Commande un achat chez un marchand fixe de la carte. Les marchands
          d&apos;événement, eux, sont gérés automatiquement.
        </p>
      </div>
      <MerchantBuyForm />
    </main>
  );
}
