"use client";

import Link from "next/link";
import { ArtifactsCharacter, CHARACTER_META, ROLE_COLORS, ROLE_LABELS } from "@/types/character";
import { useLiveCharacter } from "@/lib/realtime";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">{children}</h2>;
}

function ProgressBar({ value, max, color = "bg-emerald-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-800 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function SkillRow({ skill, level, xp, maxXp }: { skill: string; level: number; xp: number; maxXp: number }) {
  return (
    <div className="flex flex-col gap-1 py-1.5 border-b border-gray-800">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 capitalize">{skill}</span>
        <span className="text-amber-400 font-semibold">Niv. {level}</span>
      </div>
      <ProgressBar value={xp} max={maxXp} color="bg-blue-500" />
    </div>
  );
}

function SlotRow({ slot, value }: { slot: string; value: string | null }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-800 text-sm">
      <span className="text-gray-400 capitalize">{slot}</span>
      <span className={value ? "text-white" : "text-gray-600 italic"}>{value || "vide"}</span>
    </div>
  );
}

function ElementRow({ label, atk, dmg, res }: { label: string; atk: number; dmg: number; res: number }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-800 text-sm">
      <span className="text-gray-400">{label}</span>
      <div className="flex gap-3 text-xs">
        <span className="text-red-400">ATK {atk}</span>
        <span className="text-orange-400">DMG {dmg}</span>
        <span className="text-blue-400">RES {res}</span>
      </div>
    </div>
  );
}

interface CharacterDetailProps {
  /** Snapshot serveur — remplacé par l'état WSS dès le premier account_log. */
  initialCharacter: ArtifactsCharacter;
  objective?: string;
}

export function CharacterDetail({ initialCharacter, objective }: CharacterDetailProps) {
  const live = useLiveCharacter(initialCharacter.name);
  const character = live ?? initialCharacter;

  const meta = CHARACTER_META[character.name];
  const role = meta?.role ?? "fighter";
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const hpPct = character.max_hp > 0 ? Math.round((character.hp / character.max_hp) * 100) : 0;

  const inventoryItems = character.inventory?.filter((s) => s.code !== "") ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold">{character.name}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${roleColor}`}>
            {roleLabel}
          </span>
          <span className="ml-auto text-amber-400 font-bold">Niv. {character.level}</span>
        </div>
        {objective && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
            <span className="text-violet-400">🎯</span>
            <span className="italic">{objective}</span>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Santé & XP */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Santé & Progression</SectionTitle>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">HP</span>
                <span>{character.hp} / {character.max_hp} ({hpPct}%)</span>
              </div>
              <ProgressBar
                value={character.hp}
                max={character.max_hp}
                color={hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">XP</span>
                <span>{character.xp} / {character.max_xp}</span>
              </div>
              <ProgressBar value={character.xp} max={character.max_xp} color="bg-blue-500" />
            </div>
            <StatRow label="Or" value={`${character.gold} 💰`} />
            <StatRow label="Position" value={`(${character.x}, ${character.y})`} />
            {character.cooldown_expiration && (
              <StatRow label="Cooldown expire" value={new Date(character.cooldown_expiration).toLocaleTimeString("fr-FR")} />
            )}
          </div>
        </section>

        {/* Stats de combat */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Stats de combat</SectionTitle>
          <StatRow label="Vitesse" value={character.speed} />
          <StatRow label="Haste" value={character.haste} />
          <StatRow label="Coup critique" value={`${character.critical_strike}%`} />
          <StatRow label="Sagesse" value={character.wisdom} />
          <StatRow label="Prospection" value={character.prospecting} />
          <StatRow label="Menace" value={character.threat} />
          <StatRow label="Initiative" value={character.initiative} />
        </section>

        {/* Éléments */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Éléments</SectionTitle>
          <ElementRow label="🔥 Feu"   atk={character.attack_fire}  dmg={character.dmg_fire}  res={character.res_fire} />
          <ElementRow label="🌍 Terre" atk={character.attack_earth} dmg={character.dmg_earth} res={character.res_earth} />
          <ElementRow label="💧 Eau"   atk={character.attack_water} dmg={character.dmg_water} res={character.res_water} />
          <ElementRow label="💨 Air"   atk={character.attack_air}   dmg={character.dmg_air}   res={character.res_air} />
        </section>

        {/* Compétences */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Compétences</SectionTitle>
          <SkillRow skill="Minage"          level={character.mining_level}         xp={character.mining_xp}         maxXp={character.mining_max_xp} />
          <SkillRow skill="Bûcheronnage"    level={character.woodcutting_level}    xp={character.woodcutting_xp}    maxXp={character.woodcutting_max_xp} />
          <SkillRow skill="Pêche"           level={character.fishing_level}        xp={character.fishing_xp}        maxXp={character.fishing_max_xp} />
          <SkillRow skill="Cuisine"         level={character.cooking_level}        xp={character.cooking_xp}        maxXp={character.cooking_max_xp} />
          <SkillRow skill="Armement"        level={character.weaponcrafting_level} xp={character.weaponcrafting_xp} maxXp={character.weaponcrafting_max_xp} />
          <SkillRow skill="Équipement"      level={character.gearcrafting_level}   xp={character.gearcrafting_xp}   maxXp={character.gearcrafting_max_xp} />
          <SkillRow skill="Bijouterie"      level={character.jewelrycrafting_level} xp={character.jewelrycrafting_xp} maxXp={character.jewelrycrafting_max_xp} />
          <SkillRow skill="Alchimie"        level={character.alchemy_level}        xp={character.alchemy_xp}        maxXp={character.alchemy_max_xp} />
        </section>

        {/* Équipement */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Équipement</SectionTitle>
          <SlotRow slot="Arme"         value={character.weapon_slot} />
          <SlotRow slot="Rune"         value={character.rune_slot} />
          <SlotRow slot="Bouclier"     value={character.shield_slot} />
          <SlotRow slot="Casque"       value={character.helmet_slot} />
          <SlotRow slot="Armure"       value={character.body_armor_slot} />
          <SlotRow slot="Jambières"    value={character.leg_armor_slot} />
          <SlotRow slot="Bottes"       value={character.boots_slot} />
          <SlotRow slot="Bague 1"      value={character.ring1_slot} />
          <SlotRow slot="Bague 2"      value={character.ring2_slot} />
          <SlotRow slot="Amulette"     value={character.amulet_slot} />
          <SlotRow slot="Artefact 1"   value={character.artifact1_slot} />
          <SlotRow slot="Artefact 2"   value={character.artifact2_slot} />
          <SlotRow slot="Artefact 3"   value={character.artifact3_slot} />
          <SlotRow slot="Utilitaire 1" value={character.utility1_slot} />
          <SlotRow slot="Utilitaire 2" value={character.utility2_slot} />
          <SlotRow slot="Sac"          value={character.bag_slot} />
        </section>

        {/* Tâche & Inventaire */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          {character.task && (
            <div>
              <SectionTitle>Tâche en cours</SectionTitle>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 capitalize">{character.task_type}: {character.task}</span>
                  <span className="text-gray-400">{character.task_progress}/{character.task_total}</span>
                </div>
                <ProgressBar value={character.task_progress} max={character.task_total} color="bg-violet-500" />
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Inventaire ({inventoryItems.length}/{character.inventory_max_items})</SectionTitle>
            {inventoryItems.length === 0 ? (
              <p className="text-gray-600 text-sm italic">Inventaire vide</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {inventoryItems.map((item) => (
                  <div key={item.slot} className="flex justify-between text-sm py-0.5 border-b border-gray-800">
                    <span className="text-gray-300">{item.code}</span>
                    <span className="text-gray-400">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
