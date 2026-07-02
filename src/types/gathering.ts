// Miroir de GatheringTaskStatus / ReservationStatus (backend, camelCase).
// Les Instant Kotlin sérialisent en chaînes ISO-8601.

export interface ReservationStatus {
  owner: string;
  amount: number;
  reservedAt: string;
}

export interface GatheringTaskStatus {
  materialCode: string;
  skill: string;
  targetQuantity: number;
  producedQuantity: number;
  remaining: number;
  reserved: number;
  progressPercent: number;
  reservations: ReservationStatus[];
  createdAt: string;
}

/** Émoji par compétence de récolte. */
export const SKILL_ICONS: Record<string, string> = {
  mining: "⛏️",
  woodcutting: "🪓",
  fishing: "🎣",
  alchemy: "🧪",
};

export const SKILL_FALLBACK_ICON = "🧺";
