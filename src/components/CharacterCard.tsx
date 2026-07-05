import Link from "next/link";
import { ArtifactsCharacter, CHARACTER_META, ROLE_COLORS, ROLE_LABELS } from "@/types/character";
import { ArtifactsMap } from "@/types/map";
import { MiniMap } from "@/components/MiniMap";
import { CooldownTimer } from "@/components/CooldownTimer";

interface CharacterCardProps {
  character: ArtifactsCharacter;
  objective?: string;
  neighborhood: (ArtifactsMap | null)[];
}

function ProgressBar({ value, max, color = "bg-emerald-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-gray-800 rounded px-2 py-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export function CharacterCard({ character, objective, neighborhood }: CharacterCardProps) {
  const meta = CHARACTER_META[character.name];
  const role = meta?.role ?? "fighter";
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const hpPct = character.max_hp > 0 ? Math.round((character.hp / character.max_hp) * 100) : 0;

  const inventoryUsed = character.inventory?.filter((s) => s.code !== "").length ?? 0;

  return (
    <Link href={`/characters/${character.name}`}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-all cursor-pointer flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{character.name}</h2>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-400">Niv. {character.level}</div>
            <div className="text-xs text-gray-400">({character.gold} or)</div>
          </div>
        </div>

        {/* HP */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>HP</span>
            <span>{character.hp} / {character.max_hp} ({hpPct}%)</span>
          </div>
          <ProgressBar
            value={character.hp}
            max={character.max_hp}
            color={hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}
          />
        </div>

        {/* XP */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>XP</span>
            <span>{character.xp} / {character.max_xp}</span>
          </div>
          <ProgressBar value={character.xp} max={character.max_xp} color="bg-blue-500" />
        </div>

        {/* Stats clés */}
        <div className="grid grid-cols-4 gap-1.5">
          <StatBadge label="Spd" value={character.speed} />
          <StatBadge label="Haste" value={character.haste} />
          <StatBadge label="Crit" value={character.critical_strike} />
          <StatBadge label="Wis" value={character.wisdom} />
        </div>

        {/* Position + mini-carte */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <MiniMap neighborhood={neighborhood} />
          <span>
            📍 ({character.x}, {character.y})
          </span>
          <CooldownTimer expiration={character.cooldown_expiration} />
        </div>

        {/* Objectif */}
        {objective && (
          <div className="bg-gray-800/60 border-l-2 border-violet-500 rounded-r px-3 py-1.5 text-xs text-gray-300 italic">
            🎯 {objective}
          </div>
        )}

        {/* Tâche */}
        {character.task && (
          <div className="bg-gray-800 rounded p-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="capitalize">{character.task_type}: {character.task}</span>
              <span>{character.task_progress}/{character.task_total}</span>
            </div>
            <ProgressBar value={character.task_progress} max={character.task_total} color="bg-violet-500" />
          </div>
        )}

        {/* Inventaire */}
        <div className="text-xs text-gray-500 text-right">
          Inventaire : {inventoryUsed} / {character.inventory_max_items}
        </div>
      </div>
    </Link>
  );
}
