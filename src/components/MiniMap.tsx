import { ArtifactsMap } from "@/types/map";

interface MiniMapProps {
  /** 9 cartes (3×3), du nord-ouest au sud-est ; la case 4 est la position courante. */
  neighborhood: (ArtifactsMap | null)[];
}

export function MiniMap({ neighborhood }: MiniMapProps) {
  // API maps injoignable : pas de données du tout → on masque la mini-carte.
  if (neighborhood.every((map) => map === null)) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 shrink-0">
      {neighborhood.map((map, i) => {
        const highlight = i === 4 ? "ring-2 ring-amber-400" : "";

        if (!map) {
          return <div key={i} className={`w-7 h-7 rounded-sm bg-gray-800 ${highlight}`} />;
        }

        const blocked = map.access?.type === "blocked";

        return (
          <div key={i} className={`w-7 h-7 rounded-sm overflow-hidden bg-gray-800 ${highlight}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tuiles statiques ~2 Ko, next/image superflu */}
            <img
              src={`https://artifactsmmo.com/images/maps/${map.skin}.png`}
              alt={map.name}
              loading="lazy"
              className={`h-full w-full object-cover ${blocked ? "opacity-40" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
}
