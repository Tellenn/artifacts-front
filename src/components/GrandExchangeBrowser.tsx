"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { GeOrder, GeSale } from "@/types/grand-exchange";
import {
  getMyOrders,
  getSaleHistory,
  invalidateGeCache,
  searchSellOrders,
} from "@/lib/ge-client";
import { readApiKeyCookieClient } from "@/lib/api-key";
import { useRealtimeEvents } from "@/lib/realtime";
import {
  GeActionResult,
  submitBuy,
  submitCancel,
  submitSell,
} from "@/app/grand-exchange/actions";

interface SearchResult {
  code: string;
  orders: GeOrder[];
  sales: GeSale[];
}

/** receivedAt du dernier événement WSS grandexchange_*, 0 si aucun. */
function useLastGeEventSignal(): number {
  const events = useRealtimeEvents();
  return events.find((e) => e.type.startsWith("grandexchange"))?.receivedAt ?? 0;
}

export function GrandExchangeBrowser() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentCode = useRef<string | null>(null);
  const geSignal = useLastGeEventSignal();

  async function runSearch(code: string, silent: boolean) {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [orders, sales] = await Promise.all([
        searchSellOrders(code),
        getSaleHistory(code),
      ]);
      currentCode.current = code;
      setResult({ code, orders, sales });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible.");
      if (!silent) setResult(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const code = input.trim().toLowerCase();
    if (code) void runSearch(code, false);
  }

  // Un événement GE (Aerith a agi) : on invalide le cache et on rejoue en
  // silence la recherche courante. Tout le setState vit dans le .then de
  // runSearch — jamais synchrone dans le corps de l'effet.
  const handledSignal = useRef(0);
  useEffect(() => {
    if (geSignal === 0 || geSignal === handledSignal.current) return;
    handledSignal.current = geSignal;
    invalidateGeCache();
    if (currentCode.current) void runSearch(currentCode.current, true);
    // On ne réagit qu'au signal WSS ; runSearch lit currentCode via la ref.
  }, [geSignal]);

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

      {result && (
        <SearchPanel
          result={result}
          onBought={() => runSearch(result.code, true)}
        />
      )}

      <SellForm />
      <MyOrdersPanel geSignal={geSignal} />
      <GeEventsFeed />
    </div>
  );
}

function SearchPanel({
  result,
  onBought,
}: {
  result: SearchResult;
  onBought: () => void;
}) {
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

      <BuyForm
        code={result.code}
        suggestedPrice={cheapest}
        onBought={onBought}
      />
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

// ── Formulaires d'action (Server Actions → backend) ──────────────────────────

function ActionMessage({ result }: { result: GeActionResult | null }) {
  if (!result) return null;
  return (
    <p className={`text-sm ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
      {result.message}
    </p>
  );
}

function BuyForm({
  code,
  suggestedPrice,
  onBought,
}: {
  code: string;
  suggestedPrice?: number;
  onBought: () => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [maxUnitPrice, setMaxUnitPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GeActionResult | null>(null);

  async function handleBuy(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    const price = Number(maxUnitPrice);
    if (!Number.isInteger(qty) || qty <= 0 || !Number.isInteger(price) || price <= 0) {
      setResult({ ok: false, message: "Quantité et prix max doivent être > 0." });
      return;
    }
    setPending(true);
    const outcome = await submitBuy(code, qty, price);
    setResult(outcome);
    setPending(false);
    if (outcome.ok) {
      setQuantity("");
      onBought();
    }
  }

  return (
    <form
      onSubmit={handleBuy}
      className="flex flex-wrap items-end gap-2 border-t border-gray-800 pt-4"
    >
      <span className="text-sm font-medium text-gray-300">Acheter</span>
      <NumberField label="Quantité" value={quantity} onChange={setQuantity} />
      <NumberField
        label="Prix max / unité"
        value={maxUnitPrice}
        onChange={setMaxUnitPrice}
        placeholder={suggestedPrice ? String(suggestedPrice) : undefined}
      />
      <SubmitButton pending={pending}>Acheter</SubmitButton>
      <ActionMessage result={result} />
    </form>
  );
}

function SellForm() {
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GeActionResult | null>(null);

  async function handleSell(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim().toLowerCase();
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!trimmed || !Number.isInteger(qty) || qty <= 0 || !Number.isInteger(price) || price <= 0) {
      setResult({ ok: false, message: "Code, quantité et prix doivent être renseignés (> 0)." });
      return;
    }
    setPending(true);
    const outcome = await submitSell(trimmed, qty, price);
    setResult(outcome);
    setPending(false);
    if (outcome.ok) {
      setQuantity("");
      setUnitPrice("");
    }
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-4">
      <h2 className="font-semibold">Vendre (stock banque)</h2>
      <p className="text-sm text-gray-400">
        Aerith retire l&apos;item de la banque et crée l&apos;ordre de vente.
      </p>
      <form onSubmit={handleSell} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Item</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="copper_ore"
            autoComplete="off"
            className="w-40 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
          />
        </div>
        <NumberField label="Quantité" value={quantity} onChange={setQuantity} />
        <NumberField label="Prix / unité" value={unitPrice} onChange={setUnitPrice} />
        <SubmitButton pending={pending}>Mettre en vente</SubmitButton>
      </form>
      <ActionMessage result={result} />
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-28 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
      />
    </div>
  );
}

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-950 transition-colors hover:bg-white disabled:opacity-40"
    >
      {pending ? "Envoi…" : children}
    </button>
  );
}

/** Store cookie sans écouteur : la clé ne change pas pendant la vie de la page. */
const noopSubscribe = () => () => {};

function MyOrdersPanel({ geSignal }: { geSignal: number }) {
  const [orders, setOrders] = useState<GeOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = useSyncExternalStore(
    noopSubscribe,
    readApiKeyCookieClient,
    () => null,
  );

  // Rechargé au montage, quand la clé apparaît, et à chaque événement GE.
  // invalidateGeCache est synchrone mais n'est pas du setState — lint OK ;
  // setOrders/setError vivent dans les callbacks de la promesse.
  useEffect(() => {
    if (!apiKey) return;
    invalidateGeCache();
    getMyOrders()
      .then((loaded) => {
        setOrders(loaded);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Chargement impossible."),
      );
  }, [apiKey, geSignal]);

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
                <th className="py-1.5 pr-4 font-medium">Quantité</th>
                <th className="py-1.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <CancellableOrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CancellableOrderRow({ order }: { order: GeOrder }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCancel() {
    setPending(true);
    const outcome = await submitCancel(order.id);
    setPending(false);
    // Succès : l'événement WSS grandexchange_cancel_* rechargera la liste.
    if (!outcome.ok) setMessage(outcome.message);
  }

  return (
    <tr className="border-t border-gray-800">
      <td className="py-1.5 pr-4 font-mono">{order.code}</td>
      <td className="py-1.5 pr-4 text-gray-400">{order.type}</td>
      <td className="py-1.5 pr-4 font-mono text-amber-300">{order.price}</td>
      <td className="py-1.5 pr-4 font-mono">{order.quantity}</td>
      <td className="py-1.5 text-right">
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-red-500 hover:text-red-300 disabled:opacity-40"
        >
          {pending ? "…" : "Annuler"}
        </button>
        {message && <span className="ml-2 text-xs text-red-400">{message}</span>}
      </td>
    </tr>
  );
}

/** Journal des événements GE reçus en temps réel (achats/ventes/annulations). */
function GeEventsFeed() {
  const events = useRealtimeEvents();
  const geEvents = events
    .filter((e) => e.type.startsWith("grandexchange"))
    .slice(0, 15);

  if (geEvents.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-3">
      <h2 className="font-semibold">Activité temps réel</h2>
      <ul className="space-y-1 text-sm">
        {geEvents.map((event) => (
          <li
            key={event.receivedAt}
            className="flex justify-between gap-4 text-gray-400"
          >
            <span className="font-mono text-gray-300">
              {event.type.replace("grandexchange_", "")}
            </span>
            <span className="text-xs text-gray-600">
              {new Date(event.receivedAt).toLocaleTimeString("fr-FR")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
