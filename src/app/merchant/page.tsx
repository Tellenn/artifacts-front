import { MerchantBuyForm } from "@/components/MerchantBuyForm";
import { fetchMerchantOffers } from "@/lib/api";
import { MerchantOffer } from "@/types/merchant";

export const metadata = { title: "Marchand — Artifacts MMO" };

/** Libellé de devise : l'or est le solde monétaire, sinon le code de l'item-devise. */
function currencyLabel(currency: string): string {
  return currency === "gold" ? "or" : currency;
}

export default async function MerchantPage() {
  let offers: MerchantOffer[] = [];
  let failed = false;
  try {
    offers = await fetchMerchantOffers();
  } catch {
    failed = true;
  }

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

      <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold">Catalogue des marchands fixes</h2>
        <p className="text-sm text-gray-400">
          Items achetables et leur coût. La colonne « En banque » indique le
          solde de la devise, et « Achetable » combien tu peux en prendre
          maintenant.
        </p>

        {failed ? (
          <p className="text-sm text-red-400">Backend injoignable.</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun marchand fixe ne propose d&apos;item pour l&apos;instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1.5 pr-4 font-medium">Item</th>
                  <th className="py-1.5 pr-4 font-medium">Marchand</th>
                  <th className="py-1.5 pr-4 font-medium">Prix / unité</th>
                  <th className="py-1.5 pr-4 font-medium">En banque</th>
                  <th className="py-1.5 font-medium">Achetable</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr
                    key={`${offer.code}-${offer.npc}`}
                    className="border-t border-gray-800"
                  >
                    <td className="py-1.5 pr-4 font-mono">{offer.code}</td>
                    <td className="py-1.5 pr-4 text-gray-400">{offer.npc}</td>
                    <td className="py-1.5 pr-4 font-mono text-amber-300">
                      {offer.price} {currencyLabel(offer.currency)}
                    </td>
                    <td className="py-1.5 pr-4 font-mono">
                      {offer.currencyInBank} {currencyLabel(offer.currency)}
                    </td>
                    <td
                      className={`py-1.5 font-mono ${
                        offer.affordable > 0 ? "text-emerald-400" : "text-gray-600"
                      }`}
                    >
                      {offer.affordable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
