// Miroir des schémas de l'API publique Artifacts (snake_case tel quel).

/** GEOrderSchema — /grandexchange/orders et /my/grandexchange/orders. */
export interface GeOrder {
  id: string;
  type: string;
  account: string;
  code: string;
  quantity: number;
  price: number;
  created_at: string;
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
