"use client";

import { FormEvent, useState } from "react";
import {
  MerchantActionResult,
  submitMerchantBuy,
} from "@/app/merchant/actions";

export function MerchantBuyForm() {
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<MerchantActionResult | null>(null);

  async function handleBuy(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim().toLowerCase();
    const qty = Number(quantity);
    if (!trimmed || !Number.isInteger(qty) || qty <= 0) {
      setResult({
        ok: false,
        message: "Code et quantité doivent être renseignés (quantité > 0).",
      });
      return;
    }
    setPending(true);
    const outcome = await submitMerchantBuy(trimmed, qty);
    setResult(outcome);
    setPending(false);
    if (outcome.ok) {
      setQuantity("");
    }
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-4">
      <h2 className="font-semibold">Acheter chez un marchand fixe</h2>
      <p className="text-sm text-gray-400">
        Aerith se rend chez le marchand permanent (hors événement) qui vend
        l&apos;item et paie avec la devise en banque (or ou item). L&apos;achat
        est plafonné par la devise disponible.
      </p>
      <form onSubmit={handleBuy} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Item</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="perfect_pearl"
            autoComplete="off"
            className="w-48 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Quantité</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-28 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-950 transition-colors hover:bg-white disabled:opacity-40"
        >
          {pending ? "Envoi…" : "Acheter"}
        </button>
      </form>
      {result && (
        <p
          className={`text-sm ${
            result.ok ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {result.message}
        </p>
      )}
    </section>
  );
}
