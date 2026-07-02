// Miroir de ArtifactsCharacter (Kotlin). Les champs annotés @JsonProperty
// côté backend sérialisent en snake_case, les autres restent tels quels —
// d'où le mélange assumé ici : ce type reflète le JSON réel de l'API.

export interface InventorySlot {
  slot: number;
  code: string;
  quantity: number;
}

export interface Effect {
  code: string;
  value: number;
  description: string | null;
}

export interface ArtifactsCharacter {
  name: string;
  account: string;
  level: number;
  gold: number;
  hp: number;
  max_hp: number;
  x: number;
  y: number;
  map_id: number;
  layer: string;
  inventory: InventorySlot[];
  cooldown: number;
  skin: string | null;
  task: string | null;
  initiative: number;
  threat: number;
  dmg: number;
  wisdom: number;
  prospecting: number;
  critical_strike: number;
  speed: number;
  haste: number;
  xp: number;
  max_xp: number;
  task_type: string | null;
  task_total: number;
  task_progress: number;
  mining_level: number;
  mining_xp: number;
  mining_max_xp: number;
  woodcutting_level: number;
  woodcutting_xp: number;
  woodcutting_max_xp: number;
  fishing_level: number;
  fishing_xp: number;
  fishing_max_xp: number;
  weaponcrafting_level: number;
  weaponcrafting_xp: number;
  weaponcrafting_max_xp: number;
  gearcrafting_level: number;
  gearcrafting_xp: number;
  gearcrafting_max_xp: number;
  jewelrycrafting_level: number;
  jewelrycrafting_xp: number;
  jewelrycrafting_max_xp: number;
  cooking_level: number;
  cooking_xp: number;
  cooking_max_xp: number;
  alchemy_level: number;
  alchemy_xp: number;
  alchemy_max_xp: number;
  inventory_max_items: number;
  attack_fire: number;
  attack_earth: number;
  attack_water: number;
  attack_air: number;
  dmg_fire: number;
  dmg_earth: number;
  dmg_water: number;
  dmg_air: number;
  res_fire: number;
  res_earth: number;
  res_water: number;
  res_air: number;
  weapon_slot: string | null;
  rune_slot: string | null;
  shield_slot: string | null;
  helmet_slot: string | null;
  body_armor_slot: string | null;
  leg_armor_slot: string | null;
  boots_slot: string | null;
  ring1_slot: string | null;
  ring2_slot: string | null;
  amulet_slot: string | null;
  artifact1_slot: string | null;
  artifact2_slot: string | null;
  artifact3_slot: string | null;
  utility1_slot: string;
  utility1_slot_quantity: number;
  utility2_slot: string;
  utility2_slot_quantity: number;
  bag_slot: string | null;
  cooldown_expiration: string | null;
  effects: Effect[];
}

export type CharacterRole = "crafter" | "fighter" | "alchemist" | "miner" | "woodworker";

export interface CharacterMeta {
  name: string;
  role: CharacterRole;
  skin: string;
}

export const CHARACTER_META: Record<string, CharacterMeta> = {
  Renoir: { name: "Renoir", role: "crafter", skin: "men1" },
  Cloud: { name: "Cloud", role: "fighter", skin: "men2" },
  Aerith: { name: "Aerith", role: "alchemist", skin: "women1" },
  Kepo: { name: "Kepo", role: "miner", skin: "women2" },
  Gustave: { name: "Gustave", role: "woodworker", skin: "men3" },
};

export const ROLE_LABELS: Record<CharacterRole, string> = {
  crafter: "Artisan",
  fighter: "Combattant",
  alchemist: "Alchimiste",
  miner: "Mineur",
  woodworker: "Bûcheron",
};

export const ROLE_COLORS: Record<CharacterRole, string> = {
  crafter: "bg-amber-500",
  fighter: "bg-red-500",
  alchemist: "bg-purple-500",
  miner: "bg-stone-500",
  woodworker: "bg-green-600",
};
