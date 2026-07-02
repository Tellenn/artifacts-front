import Link from "next/link";
import { ArtifactsCharacter, CHARACTER_META, ROLE_COLORS, ROLE_LABELS } from "@/types/character";

interface CharacterCardProps {
  character: ArtifactsCharacter;
  objective?: string;
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

export function CharacterCard({ character, objective }: CharacterCardProps) {
  const meta = CHARACTER_META[character.name];
  const role = meta?.role ?? "fighter";
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const hpPct = character.maxHp > 0 ? Math.round((character.hp / character.maxHp) * 100) : 0;
  const xpPct = character.maxXp > 0 ? Math.round((character.xp / character.maxXp) * 100) : 0;

  const isOnCooldown =
    character.cooldownExpiration != null &&
    new Date(character.cooldownExpiration) > new Date();

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
            <span>{character.hp} / {character.maxHp} ({hpPct}%)</span>
          </div>
          <ProgressBar
            value={character.hp}
            max={character.maxHp}
            color={hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}
          />
        </div>

        {/* XP */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>XP</span>
            <span>{character.xp} / {character.maxXp}</span>
          </div>
          <ProgressBar value={character.xp} max={character.maxXp} color="bg-blue-500" />
        </div>

        {/* Stats clés */}
        <div className="grid grid-cols-4 gap-1.5">
          <StatBadge label="Spd" value={character.speed} />
          <StatBadge label="Haste" value={character.haste} />
          <StatBadge label="Crit" value={character.criticalStrike} />
          <StatBadge label="Wis" value={character.wisdom} />
        </div>

        {/* Position */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>📍</span>
          <span>
            ({character.x}, {character.y})
          </span>
          {isOnCooldown && (
            <span className="ml-auto text-orange-400 font-medium">⏳ Cooldown</span>
          )}
        </div>

        {/* Tâche */}
        {character.task && (
          <div className="bg-gray-800 rounded p-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="capitalize">{character.taskType}: {character.task}</span>
              <span>{character.taskProgress}/{character.taskTotal}</span>
            </div>
            <ProgressBar value={character.taskProgress} max={character.taskTotal} color="bg-violet-500" />
          </div>
        )}

        {/* Objectif */}
        {objective && (
          <div className="bg-gray-800/60 border-l-2 border-violet-500 rounded-r px-3 py-1.5 text-xs text-gray-300 italic">
            🎯 {objective}
          </div>
        )}

        {/* Inventaire */}
        <div className="text-xs text-gray-500 text-right">
          Inventaire : {inventoryUsed} / {character.inventoryMaxItems}
        </div>
      </div>
    </Link>
  );
}
