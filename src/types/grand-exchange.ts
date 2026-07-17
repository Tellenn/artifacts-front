// Miroir des schémas de l'API publique Artifacts (snake_case tel quel).

/** Un ordre GE est soit une vente, soit une demande d'achat. */
export type GeOrderType = "sell" | "buy";

/** GEOrderSchema — /grandexchange/orders et /my/grandexchange/orders. */
export interface GeOrder {
  id: string;
  type: GeOrderType;
  account: string;
  code: string;
  quantity: number;
  price: number;
  created_at: string;
}

/**
 * Vue marché agrégée par item pour un type d'ordre donné.
 * `bestPrice` : min pour les ventes (meilleure affaire), max pour les demandes
 * d'achat (meilleure offre reçue).
 */
export interface GeMarketItem {
  code: string;
  bestPrice: number;
  totalQuantity: number;
  orderCount: number;
}

/** GEOrderHistorySchema — /grandexchange/history/{code} : ventes réellement conclues. */
export interface GeSale {
  order_id: string;
  seller: string;
  buyer: string;
  code: string;
  quantity: number;
  price: number;
  sold_at: string;
}
