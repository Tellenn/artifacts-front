import { fetchCharacters, fetchGatheringTasks } from "@/lib/api";
import {
  GatheringTaskStatus,
  SKILL_FALLBACK_ICON,
  SKILL_ICONS,
} from "@/types/gathering";
import {
  ArtifactsCharacter,
  CHARACTER_META,
  ROLE_COLORS,
} from "@/types/character";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let pool: GatheringTaskStatus[] = [];
  let characters: ArtifactsCharacter[] = [];
  let error: string | null = null;

  try {
    // Les deux sources sont indépendantes : le pool (Mongo) reste consultable
    // même si l'API du jeu (personnages) ne répond pas, et inversement.
    [pool, characters] = await Promise.all([
      fetchGatheringTasks(),
      fetchCharacters().catch(() => [] as ArtifactsCharacter[]),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <h1 className="text-xl font-bold tracking-tight">📋 Tâches</h1>

        {error ? (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">
              Impossible de contacter le backend
            </p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <SectionHeading
                title="Pool de récolte"
                hint="Besoins publiés par l'artisan, réservés par tranches par les récolteurs"
              />
              {pool.length === 0 ? (
                <p className="text-gray-500 text-sm bg-gray-900 border border-gray-800 rounded-xl px-4 py-6 text-center">
                  Le pool est vide. Il se remplit quand l&apos;artisan publie
                  ses besoins en matériaux.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {pool.map((task) => (
                    <PoolTaskCard key={task.materialCode} task={task} />
                  ))}
                </div>
              )}
            </section>

            {characters.length > 0 && (
              <section className="space-y-3">
                <SectionHeading
                  title="Tâches de jeu"
                  hint="Tâche en cours de chaque personnage (maître des tâches)"
                />
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {characters.map((char) => (
                    <GameTaskRow key={char.name} character={char} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

interface SectionHeadingProps {
  title: string;
  hint: string;
}

function SectionHeading({ title, hint }: SectionHeadingProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
        {title}
      </h2>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );
}

interface PoolTaskCardProps {
  task: GatheringTaskStatus;
}

function PoolTaskCard({ task }: PoolTaskCardProps) {
  const producedPct = (task.producedQuantity / task.targetQuantity) * 100;
  const reservedPct = (task.reserved / task.targetQuantity) * 100;

  return (
    <article className="rounded-xl bg-gray-900 border border-gray-800 p-4 space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium capitalize truncate">
            {SKILL_ICONS[task.skill] ?? SKILL_FALLBACK_ICON}{" "}
            {task.materialCode.replaceAll("_", " ")}
          </h3>
          <p className="text-xs text-gray-500">
            <span className="capitalize">{task.skill}</span> · objectif{" "}
            <span className="font-mono tabular-nums">
              {task.targetQuantity.toLocaleString("fr-FR")}
            </span>
            {task.bankQuantityAtPost != null && (
              <>
                {" · "}
                <span
                  className="text-sky-400"
                  title="Stock banque disponible au moment de la publication (le besoin publié en est déjà net)"
                >
                  🏦{" "}
                  <span className="font-mono tabular-nums">
                    {task.bankQuantityAtPost.toLocaleString("fr-FR")}
                  </span>{" "}
                  en banque
                </span>
              </>
            )}
          </p>
        </div>
        <span className="font-mono text-lg tabular-nums text-gray-200 shrink-0">
          {task.progressPercent}%
        </span>
      </header>

      {/* Barre segmentée : produit / réservé / restant */}
      <div
        className="flex h-2 w-full gap-[2px] rounded-full overflow-hidden bg-gray-950"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={task.targetQuantity}
        aria-valuenow={task.producedQuantity}
        aria-label={`Progression de ${task.materialCode}`}
      >
        {producedPct > 0 && (
          <div
            className="bg-emerald-500 rounded-full"
            style={{ width: `${Math.min(producedPct, 100)}%` }}
          />
        )}
        {reservedPct > 0 && (
          <div
            className="bg-amber-500 rounded-full"
            style={{ width: `${Math.min(reservedPct, 100)}%` }}
          />
        )}
        <div className="flex-1 bg-gray-800 rounded-full" />
      </div>

      <p className="text-xs text-gray-400 font-mono tabular-nums">
        <span className="text-emerald-400">
          ● {task.producedQuantity.toLocaleString("fr-FR")} produit
        </span>
        {" · "}
        <span className="text-amber-400">
          ● {task.reserved.toLocaleString("fr-FR")} réservé
        </span>
        {" · "}
        <span className="text-gray-500">
          ● {task.remaining.toLocaleString("fr-FR")} restant
        </span>
      </p>

      {task.reservations.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {task.reservations.map((res, i) => (
            <li
              key={`${res.owner}-${i}`}
              className="flex items-center gap-1.5 rounded-full bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs"
            >
              <span
                className={`h-2 w-2 rounded-full ${roleColorFor(res.owner)}`}
                aria-hidden
              />
              {res.owner}
              <span className="font-mono text-gray-400 tabular-nums">
                ×{res.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function roleColorFor(characterName: string): string {
  const meta = CHARACTER_META[characterName];
  return meta ? ROLE_COLORS[meta.role] : "bg-gray-500";
}

interface GameTaskRowProps {
  character: ArtifactsCharacter;
}

function GameTaskRow({ character }: GameTaskRowProps) {
  const hasTask = character.task != null && character.task !== "";
  const pct =
    hasTask && character.task_total > 0
      ? (character.task_progress / character.task_total) * 100
      : 0;

  return (
    <li className="rounded-xl bg-gray-900 border border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium min-w-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${roleColorFor(character.name)}`}
            aria-hidden
          />
          <span className="truncate">{character.name}</span>
        </p>
        {hasTask ? (
          <p className="text-xs text-gray-400 truncate">
            <span className="capitalize">
              {character.task?.replaceAll("_", " ")}
            </span>
            <span className="text-gray-600"> · {character.task_type}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-600">Aucune tâche</p>
        )}
      </div>
      {hasTask && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-gray-400 tabular-nums">
            {character.task_progress}/{character.task_total}
          </span>
        </div>
      )}
    </li>
  );
}
