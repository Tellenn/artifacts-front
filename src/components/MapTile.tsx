/* eslint-disable @next/next/no-img-element -- sprites statiques ~2 Ko, next/image superflu */
import { ArtifactsMap } from "@/types/map";
import {
  DropInfo,
  MonsterTileContent,
  ResourceTileContent,
  TileContentInfo,
} from "@/types/tile-content";

const SIZE_CLASSES = {
  sm: "w-7 h-7",
  lg: "w-14 h-14",
} as const;

const CONTENT_DOT_COLORS: Record<TileContentInfo["kind"], string> = {
  monster: "bg-red-400",
  resource: "bg-emerald-400",
  other: "bg-amber-300",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  bank: "Banque",
  workshop: "Atelier",
  grand_exchange: "Hôtel des ventes",
  tasks_master: "Maître des tâches",
  npc: "PNJ",
};

interface MapTileProps {
  map: ArtifactsMap | null;
  /** Contenu résolu de la case (via resolveTileContents) — active le tooltip. */
  content?: TileContentInfo;
  size?: keyof typeof SIZE_CLASSES;
}

/**
 * Une case de carte : skin, indicateur de contenu et tooltip au survol.
 * Générique : mini-carte 3×3 aujourd'hui, onglet carte complète demain.
 */
export function MapTile({ map, content, size = "sm" }: MapTileProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (!map) {
    return <div className={`${sizeClass} rounded-sm bg-gray-800`} />;
  }

  const blocked = map.access?.type === "blocked";

  return (
    <div className={`group relative ${sizeClass} rounded-sm bg-gray-800`}>
      <img
        src={`https://artifactsmmo.com/images/maps/${map.skin}.png`}
        alt={map.name}
        loading="lazy"
        className={`h-full w-full rounded-sm object-cover ${blocked ? "opacity-40" : ""}`}
      />
      {content && (
        <>
          <span
            className={`absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-gray-950 ${CONTENT_DOT_COLORS[content.kind]}`}
          />
          <TileTooltip content={content} />
        </>
      )}
    </div>
  );
}

function TileTooltip({ content }: { content: TileContentInfo }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-max max-w-60 -translate-x-1/2 flex-col gap-1.5 rounded-lg border border-gray-700 bg-gray-900/95 p-2.5 shadow-xl group-hover:flex">
      <TooltipHeader content={content} />
      {content.kind !== "other" && <DropList drops={content.drops} />}
    </div>
  );
}

function TooltipHeader({ content }: { content: TileContentInfo }) {
  if (content.kind === "other") {
    return (
      <span className="text-xs font-semibold text-white">
        {CONTENT_TYPE_LABELS[content.type] ?? content.type}
        <span className="ml-1 font-normal text-gray-400">({content.code})</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://artifactsmmo.com/images/${content.kind}s/${content.code}.png`}
        alt={content.name}
        loading="lazy"
        className="h-8 w-8 object-contain"
      />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-white">{content.name}</span>
        <ContentSubtitle content={content} />
      </div>
    </div>
  );
}

function ContentSubtitle({
  content,
}: {
  content: MonsterTileContent | ResourceTileContent;
}) {
  const subtitle =
    content.kind === "monster"
      ? `Niv. ${content.level} · ${content.hp} HP`
      : `${content.skill} niv. ${content.levelRequired}`;

  const color = content.kind === "monster" ? "text-red-400" : "text-emerald-400";

  return <span className={`text-[10px] capitalize ${color}`}>{subtitle}</span>;
}

function DropList({ drops }: { drops: DropInfo[] }) {
  if (drops.length === 0) {
    return <span className="text-[10px] italic text-gray-500">Aucun butin</span>;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {drops.map((drop) => (
        <li
          key={drop.code}
          className="flex items-center gap-1.5 text-[11px] text-gray-300"
        >
          <img
            src={`https://artifactsmmo.com/images/items/${drop.code}.png`}
            alt=""
            loading="lazy"
            className="h-4 w-4 object-contain"
          />
          <span className="truncate">{drop.code}</span>
          {drop.maxQuantity > 1 && (
            <span className="shrink-0 text-gray-500">
              ×{drop.minQuantity}–{drop.maxQuantity}
            </span>
          )}
          <span className="ml-auto shrink-0 pl-2 text-gray-500">
            1/{drop.rate}
          </span>
        </li>
      ))}
    </ul>
  );
}
