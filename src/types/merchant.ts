export interface MerchantOffer {
  code: string;
  npc: string;
  currency: string;
  price: number;
  /** Solde de la devise en banque (or, ou quantité de l'item-devise). */
  currencyInBank: number;
  /** Nombre d'exemplaires finançables avec le solde actuel (currencyInBank / price). */
  affordable: number;
}
