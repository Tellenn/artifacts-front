import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCharacters, fetchObjectives } from "@/lib/api";
import { ArtifactsCharacter, CHARACTER_META, ROLE_COLORS, ROLE_LABELS } from "@/types/character";

export const dynamic = "force-dynamic";

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

function SlotRow({ slot, value }: { slot: string; value: string }) {
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

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { name } = await params;
  const [characters, objectives] = await Promise.all([
    fetchCharacters(),
    fetchObjectives().catch(() => ({} as Record<string, string>)),
  ]);
  const character: ArtifactsCharacter | undefined = characters.find(
    (c) => c.name.toLowerCase() === decodeURIComponent(name).toLowerCase()
  );

  if (!character) notFound();

  const objective = objectives[character.name];

  const meta = CHARACTER_META[character.name];
  const role = meta?.role ?? "fighter";
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const hpPct = character.maxHp > 0 ? Math.round((character.hp / character.maxHp) * 100) : 0;

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
                <span>{character.hp} / {character.maxHp} ({hpPct}%)</span>
              </div>
              <ProgressBar
                value={character.hp}
                max={character.maxHp}
                color={hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">XP</span>
                <span>{character.xp} / {character.maxXp}</span>
              </div>
              <ProgressBar value={character.xp} max={character.maxXp} color="bg-blue-500" />
            </div>
            <StatRow label="Or" value={`${character.gold} 💰`} />
            <StatRow label="Position" value={`(${character.x}, ${character.y})`} />
            {character.cooldownExpiration && (
              <StatRow label="Cooldown expire" value={new Date(character.cooldownExpiration).toLocaleTimeString("fr-FR")} />
            )}
          </div>
        </section>

        {/* Stats de combat */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Stats de combat</SectionTitle>
          <StatRow label="Vitesse" value={character.speed} />
          <StatRow label="Haste" value={character.haste} />
          <StatRow label="Coup critique" value={`${character.criticalStrike}%`} />
          <StatRow label="Sagesse" value={character.wisdom} />
          <StatRow label="Prospection" value={character.prospecting} />
          <StatRow label="Menace" value={character.threat} />
          <StatRow label="Initiative" value={character.initiative} />
        </section>

        {/* Éléments */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Éléments</SectionTitle>
          <ElementRow label="🔥 Feu"   atk={character.attackFire}  dmg={character.dmgFire}  res={character.resFire} />
          <ElementRow label="🌍 Terre" atk={character.attackEarth} dmg={character.dmgEarth} res={character.resEarth} />
          <ElementRow label="💧 Eau"   atk={character.attackWater} dmg={character.dmgWater} res={character.resWater} />
          <ElementRow label="💨 Air"   atk={character.attackAir}   dmg={character.dmgAir}   res={character.resAir} />
        </section>

        {/* Compétences */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Compétences</SectionTitle>
          <SkillRow skill="Minage"          level={character.mining}         xp={character.miningXp}         maxXp={character.miningMaxXp} />
          <SkillRow skill="Bûcheronnage"    level={character.woodcutting}    xp={character.woodcuttingXp}    maxXp={character.woodcuttingMaxXp} />
          <SkillRow skill="Pêche"           level={character.fishing}        xp={character.fishingXp}        maxXp={character.fishingMaxXp} />
          <SkillRow skill="Cuisine"         level={character.cooking}        xp={character.cookingXp}        maxXp={character.cookingMaxXp} />
          <SkillRow skill="Armement"        level={character.weaponcrafting} xp={character.weaponcraftingXp} maxXp={character.weaponcraftingMaxXp} />
          <SkillRow skill="Équipement"      level={character.gearcrafting}   xp={character.gearcraftingXp}   maxXp={character.gearcraftingMaxXp} />
          <SkillRow skill="Bijouterie"      level={character.jewelrycrafting} xp={character.jewelrycraftingXp} maxXp={character.jewelrycraftingMaxXp} />
          <SkillRow skill="Alchimie"        level={character.alchemy}        xp={character.alchemyXp}        maxXp={character.alchemyMaxXp} />
        </section>

        {/* Équipement */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <SectionTitle>Équipement</SectionTitle>
          <SlotRow slot="Arme"         value={character.weaponSlot} />
          <SlotRow slot="Bouclier"     value={character.shieldSlot} />
          <SlotRow slot="Casque"       value={character.helmetSlot} />
          <SlotRow slot="Armure"       value={character.bodyArmorSlot} />
          <SlotRow slot="Jambières"    value={character.legArmorSlot} />
          <SlotRow slot="Bottes"       value={character.bootsSlot} />
          <SlotRow slot="Bague 1"      value={character.ring1Slot} />
          <SlotRow slot="Bague 2"      value={character.ring2Slot} />
          <SlotRow slot="Amulette"     value={character.amuletSlot} />
          <SlotRow slot="Artefact 1"   value={character.artifact1Slot} />
          <SlotRow slot="Artefact 2"   value={character.artifact2Slot} />
          <SlotRow slot="Artefact 3"   value={character.artifact3Slot} />
          <SlotRow slot="Utilitaire 1" value={character.utility1Slot} />
          <SlotRow slot="Utilitaire 2" value={character.utility2Slot} />
          <SlotRow slot="Sac"          value={character.bagSlot} />
        </section>

        {/* Tâche & Inventaire */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          {character.task && (
            <div>
              <SectionTitle>Tâche en cours</SectionTitle>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 capitalize">{character.taskType}: {character.task}</span>
                  <span className="text-gray-400">{character.taskProgress}/{character.taskTotal}</span>
                </div>
                <ProgressBar value={character.taskProgress} max={character.taskTotal} color="bg-violet-500" />
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Inventaire ({inventoryItems.length}/{character.inventoryMaxItems})</SectionTitle>
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
