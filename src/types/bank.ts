// Miroir des modèles Kotlin du backend.
// BankItemDocument sérialise en camelCase ; BankDetails est annoté
// @JsonProperty côté Kotlin et sérialise en snake_case.

export interface ItemEffect {
  code: string;
  value: number;
  description: string | null;
}

export interface RecipeIngredient {
  code: string;
  quantity: number;
}

export interface ItemCraft {
  skill: string;
  level: number;
  items: RecipeIngredient[];
  quantity: number;
}

export interface ItemCondition {
  code: string;
  operator: string;
  value: number;
}

export interface BankItem {
  code: string;
  name: string;
  description: string;
  type: string;
  subtype: string;
  level: number;
  tradeable: boolean;
  recyclable: boolean;
  effects: ItemEffect[] | null;
  craft: ItemCraft | null;
  conditions: ItemCondition[] | null;
  quantity: number;
}

export interface BankDetails {
  gold: number;
  next_expansion_cost: number;
  expansions: number;
  slots: number;
}

/** Émoji par type d'item, pour rester dans le langage visuel emoji de l'app. */
export const ITEM_TYPE_ICONS: Record<string, string> = {
  resource: "🪨",
  consumable: "🍖",
  weapon: "⚔️",
  shield: "🛡️",
  helmet: "🪖",
  body_armor: "🥋",
  leg_armor: "👖",
  boots: "🥾",
  ring: "💍",
  amulet: "📿",
  artifact: "🏺",
  rune: "🔮",
  utility: "🧪",
  currency: "🪙",
  bag: "🎒",
};

export const ITEM_TYPE_FALLBACK_ICON = "📦";
