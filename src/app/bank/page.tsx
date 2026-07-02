import { fetchBankDetails, fetchBankItems } from "@/lib/api";
import { BankBrowser } from "@/components/BankBrowser";
import { BankDetails, BankItem } from "@/types/bank";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  let items: BankItem[] = [];
  let details: BankDetails | null = null;
  let error: string | null = null;

  try {
    // Les détails (or, slots) viennent de l'API du jeu : leur échec ne doit
    // pas empêcher d'afficher le contenu (base locale).
    [items, details] = await Promise.all([
      fetchBankItems(),
      fetchBankDetails().catch(() => null),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <h1 className="text-xl font-bold tracking-tight">🏦 Banque</h1>

        {error ? (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">
              Impossible de contacter le backend
            </p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        ) : (
          <>
            <BankLedger details={details} usedSlots={items.length} />
            <BankBrowser items={items} />
          </>
        )}
      </div>
    </main>
  );
}

interface BankLedgerProps {
  details: BankDetails | null;
  usedSlots: number;
}

function BankLedger({ details, usedSlots }: BankLedgerProps) {
  if (!details) {
    return (
      <p className="text-xs text-gray-500">
        Or et capacité indisponibles (API du jeu injoignable) — contenu affiché
        depuis la base locale.
      </p>
    );
  }

  const slotPct = details.slots > 0 ? (usedSlots / details.slots) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <LedgerTile label="Or en banque">
        <span className="text-amber-400 font-mono text-lg tabular-nums">
          {details.gold.toLocaleString("fr-FR")}
        </span>
        <span className="ml-1 text-amber-400/70">💰</span>
      </LedgerTile>

      <LedgerTile label={`Slots · ${usedSlots}/${details.slots}`}>
        <div
          className="mt-2 h-1.5 w-full rounded-full bg-gray-800"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={details.slots}
          aria-valuenow={usedSlots}
          aria-label="Slots de banque utilisés"
        >
          <div
            className={`h-full rounded-full ${slotPct >= 90 ? "bg-red-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(slotPct, 100)}%` }}
          />
        </div>
      </LedgerTile>

      <LedgerTile label="Extensions achetées">
        <span className="font-mono text-lg tabular-nums">
          {details.expansions}
        </span>
      </LedgerTile>

      <LedgerTile label="Prochaine extension">
        <span className="font-mono text-lg tabular-nums">
          {details.next_expansion_cost.toLocaleString("fr-FR")}
        </span>
        <span className="ml-1 text-gray-500 text-sm">or</span>
      </LedgerTile>
    </div>
  );
}

interface LedgerTileProps {
  label: string;
  children: React.ReactNode;
}

function LedgerTile({ label, children }: LedgerTileProps) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
