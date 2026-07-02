export interface InventorySlot {
  slot: number;
  code: string;
  quantity: number;
}

export interface Effect {
  code: string;
  value: number;
}

export interface ArtifactsCharacter {
  name: string;
  account: string;
  skin: string;
  level: number;
  xp: number;
  maxXp: number;
  gold: number;
  speed: number;
  mining: number;
  miningXp: number;
  miningMaxXp: number;
  woodcutting: number;
  woodcuttingXp: number;
  woodcuttingMaxXp: number;
  fishing: number;
  fishingXp: number;
  fishingMaxXp: number;
  weaponcrafting: number;
  weaponcraftingXp: number;
  weaponcraftingMaxXp: number;
  gearcrafting: number;
  gearcraftingXp: number;
  gearcraftingMaxXp: number;
  jewelrycrafting: number;
  jewelrycraftingXp: number;
  jewelrycraftingMaxXp: number;
  cooking: number;
  cookingXp: number;
  cookingMaxXp: number;
  alchemy: number;
  alchemyXp: number;
  alchemyMaxXp: number;
  hp: number;
  maxHp: number;
  haste: number;
  criticalStrike: number;
  wisdom: number;
  prospecting: number;
  threat: number;
  initiative: number;
  attackFire: number;
  attackEarth: number;
  attackWater: number;
  attackAir: number;
  dmgFire: number;
  dmgEarth: number;
  dmgWater: number;
  dmgAir: number;
  resFire: number;
  resEarth: number;
  resWater: number;
  resAir: number;
  x: number;
  y: number;
  cooldown: number;
  cooldownExpiration: string | null;
  weaponSlot: string;
  shieldSlot: string;
  helmetSlot: string;
  bodyArmorSlot: string;
  legArmorSlot: string;
  bootsSlot: string;
  ring1Slot: string;
  ring2Slot: string;
  amuletSlot: string;
  artifact1Slot: string;
  artifact2Slot: string;
  artifact3Slot: string;
  utility1Slot: string;
  utility1SlotQuantity: number;
  utility2Slot: string;
  utility2SlotQuantity: number;
  bagSlot: string;
  task: string;
  taskType: string;
  taskTotal: number;
  taskProgress: number;
  inventoryMaxItems: number;
  inventory: InventorySlot[];
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
