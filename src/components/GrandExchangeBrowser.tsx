"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { GeOrder, GeSale } from "@/types/grand-exchange";
import {
  getMyOrders,
  getSaleHistory,
  searchSellOrders,
} from "@/lib/ge-client";
import { readApiKeyCookieClient } from "@/lib/api-key";

interface SearchResult {
  code: string;
  orders: GeOrder[];
  sales: GeSale[];
}

export function GrandExchangeBrowser() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const code = input.trim().toLowerCase();
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const [orders, sales] = await Promise.all([
        searchSellOrders(code),
        getSaleHistory(code),
      ]);
      setResult({ code, orders, sales });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Code de l'item (ex. copper_ore)…"
          autoComplete="off"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-950 transition-colors hover:bg-white disabled:opacity-40"
        >
          {loading ? "Recherche…" : "Rechercher"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && <SearchPanel result={result} />}

      <MyOrdersPanel />
    </div>
  );
}

function SearchPanel({ result }: { result: SearchResult }) {
  const cheapest = result.orders[0]?.price;
  const totalStock = result.orders.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold font-mono">{result.code}</h2>
        <div className="text-sm text-gray-400">
          {result.orders.length > 0 ? (
            <>
              Meilleur prix{" "}
              <span className="font-mono text-amber-300">{cheapest} or</span> ·{" "}
              {totalStock} en vente
            </>
          ) : (
            "Aucun ordre de vente"
          )}
        </div>
      </div>

      <PriceHistory sales={result.sales} />

      {result.orders.length > 0 && <OrdersTable orders={result.orders} />}
    </section>
  );
}

function OrdersTable({ orders }: { orders: GeOrder[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-1.5 pr-4 font-medium">Prix unité</th>
            <th className="py-1.5 pr-4 font-medium">Quantité</th>
            <th className="py-1.5 font-medium">Vendeur</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-gray-800">
              <td className="py-1.5 pr-4 font-mono text-amber-300">
                {order.price}
              </td>
              <td className="py-1.5 pr-4 font-mono">{order.quantity}</td>
              <td className="py-1.5 text-gray-400">{order.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Mini-courbe SVG du prix unitaire des ventes conclues (ancien → récent). */
function PriceHistory({ sales }: { sales: GeSale[] }) {
  if (sales.length < 2) {
    return (
      <p className="text-sm text-gray-500">
        Pas assez d&apos;historique pour tracer une courbe.
      </p>
    );
  }

  // sold_at décroissant en entrée : on remet chronologique pour la courbe.
  const points = [...sales].reverse().map((sale) => sale.price);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const width = 100;
  const height = 32;
  const path = points
    .map((price, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((price - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = points[points.length - 1];

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-10 w-40 text-emerald-400"
        aria-label="Historique de prix"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="text-sm text-gray-400">
        <span className="font-mono text-gray-200">{last} or</span> · min {min} ·
        max {max}
        <span className="block text-xs text-gray-600">
          {sales.length} ventes récentes
        </span>
      </div>
    </div>
  );
}

/** Store cookie sans écouteur : la clé ne change pas pendant la vie de la page. */
const noopSubscribe = () => () => {};

function MyOrdersPanel() {
  const [orders, setOrders] = useState<GeOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = useSyncExternalStore(
    noopSubscribe,
    readApiKeyCookieClient,
    () => null,
  );

  useEffect(() => {
    if (!apiKey) return;
    getMyOrders()
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Chargement impossible."),
      );
  }, [apiKey]);

  if (!apiKey) return null;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-4">
      <h2 className="font-semibold">Mes ordres</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && orders === null && (
        <p className="text-sm text-gray-500">Chargement…</p>
      )}
      {orders?.length === 0 && (
        <p className="text-sm text-gray-500">Aucun ordre actif.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1.5 pr-4 font-medium">Item</th>
                <th className="py-1.5 pr-4 font-medium">Type</th>
                <th className="py-1.5 pr-4 font-medium">Prix</th>
                <th className="py-1.5 font-medium">Quantité</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-800">
                  <td className="py-1.5 pr-4 font-mono">{order.code}</td>
                  <td className="py-1.5 pr-4 text-gray-400">{order.type}</td>
                  <td className="py-1.5 pr-4 font-mono text-amber-300">
                    {order.price}
                  </td>
                  <td className="py-1.5 font-mono">{order.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
