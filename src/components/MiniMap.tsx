import { ArtifactsMap } from "@/types/map";
import { TileContentInfo, tileContentKey } from "@/types/tile-content";
import { MapTile } from "@/components/MapTile";

interface MiniMapProps {
  /** 9 cartes (3×3), du nord-ouest au sud-est ; la case 4 est la position courante. */
  neighborhood: (ArtifactsMap | null)[];
  /** Contenus résolus indexés par `type:code` (voir resolveTileContents). */
  contents?: Record<string, TileContentInfo>;
}

export function MiniMap({ neighborhood, contents = {} }: MiniMapProps) {
  // API maps injoignable : pas de données du tout → on masque la mini-carte.
  if (neighborhood.every((map) => map === null)) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 shrink-0">
      {neighborhood.map((map, i) => {
        const content = map?.interactions?.content;
        return (
          <MapTile
            key={i}
            map={map}
            content={
              content
                ? contents[tileContentKey(content.type, content.code)]
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
