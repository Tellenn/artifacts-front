"use client";

import { GeMarketItem, GeOrder, GeOrderType, GeSale } from "@/types/grand-exchange";
import { readApiKeyCookieClient } from "@/lib/api-key";

const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";
const PAGE_SIZE = 100;

/**
 * Cache mémoire court (30 s) : les carnets d'ordres bougent, mais on évite de
 * refrapper l'API à chaque frappe/re-render pendant une même consultation.
 * Best-effort — un échec n'est jamais mis en cache.
 */
const CACHE_TTL_MS = 30 * 1000;

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function store<T>(key: string, value: T) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

/** Vide le cache : à appeler après une action GE (achat/vente/annulation). */
export function invalidateGeCache() {
  cache.clear();
}

/**
 * Récupère toutes les pages d'un endpoint tableau de l'API publique.
 * `authenticated` ajoute le Bearer (clé du cookie) pour les endpoints `/my/*`.
 */
async function fetchAllPages<T>(
  path: string,
  authenticated = false,
): Promise<T[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authenticated) {
    const key = readApiKeyCookieClient();
    if (!key) throw new Error("Clé API absente : ordres personnels indisponibles.");
    headers.Authorization = `Bearer ${key}`;
  }

  const items: T[] = [];
  let page = 1;
  let pages = 1;

  do {
    const separator = path.includes("?") ? "&" : "?";
    const response = await fetch(
      `${ARTIFACTS_PUBLIC_API}${path}${separator}size=${PAGE_SIZE}&page=${page}`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(`Erreur API GE (${response.status}) sur ${path}`);
    }
    const body: unknown = await response.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !Array.isArray((body as { data?: unknown }).data)
    ) {
      throw new Error(`Réponse GE inattendue sur ${path}`);
    }
    const typed = body as { data: T[]; pages?: number };
    items.push(...typed.data);
    pages = typed.pages ?? 1;
    page++;
  } while (page <= pages);

  return items;
}

/** Ordres de vente publics d'un item, triés du moins cher au plus cher. */
export async function searchSellOrders(code: string): Promise<GeOrder[]> {
  const key = `orders:${code}`;
  const hit = cached<GeOrder[]>(key);
  if (hit) return hit;

  const orders = await fetchAllPages<GeOrder>(
    `/grandexchange/orders?code=${encodeURIComponent(code)}`,
  );
  orders.sort((a, b) => a.price - b.price);
  store(key, orders);
  return orders;
}

/** Historique des ventes conclues d'un item, de la plus récente à la plus ancienne. */
export async function getSaleHistory(code: string): Promise<GeSale[]> {
  const key = `history:${code}`;
  const hit = cached<GeSale[]>(key);
  if (hit) return hit;

  const sales = await fetchAllPages<GeSale>(
    `/grandexchange/history/${encodeURIComponent(code)}`,
  );
  sales.sort((a, b) => b.sold_at.localeCompare(a.sold_at));
  store(key, sales);
  return sales;
}

/** Tous les ordres publics (ventes + demandes d'achat), tous items confondus. */
export async function getAllOrders(): Promise<GeOrder[]> {
  const key = "all-orders";
  const hit = cached<GeOrder[]>(key);
  if (hit) return hit;

  const orders = await fetchAllPages<GeOrder>("/grandexchange/orders");
  store(key, orders);
  return orders;
}

/**
 * Agrège les ordres d'un type donné en une ligne par item.
 * Fonction pure : `bestPrice` vaut le min pour `sell` (l'acheteur veut le moins
 * cher) et le max pour `buy` (le vendeur veut la meilleure offre).
 */
export function aggregateOrders(
  orders: GeOrder[],
  type: GeOrderType,
): GeMarketItem[] {
  const byCode = new Map<string, GeOrder[]>();
  for (const order of orders) {
    if (order.type !== type) continue;
    const group = byCode.get(order.code);
    if (group) group.push(order);
    else byCode.set(order.code, [order]);
  }

  return Array.from(byCode, ([code, group]) => {
    const prices = group.map((order) => order.price);
    return {
      code,
      bestPrice: type === "sell" ? Math.min(...prices) : Math.max(...prices),
      totalQuantity: group.reduce((sum, order) => sum + order.quantity, 0),
      orderCount: group.length,
    };
  });
}

/** Nos propres ordres actifs (clé API requise), du plus récent au plus ancien. */
export async function getMyOrders(): Promise<GeOrder[]> {
  const key = "my-orders";
  const hit = cached<GeOrder[]>(key);
  if (hit) return hit;

  const orders = await fetchAllPages<GeOrder>("/my/grandexchange/orders", true);
  orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  store(key, orders);
  return orders;
}
