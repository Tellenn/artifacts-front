"use client";

import { useMemo } from "react";
import { ArtifactsCharacter } from "@/types/character";
import { useLiveCharacters } from "@/lib/realtime";

/** Doit refléter la grille de la page carte : cases de 3.5rem, gap de 0.125rem. */
const CELL_SIZE_REM = 3.5;
const CELL_GAP_REM = 0.125;
const CELL_PITCH_REM = CELL_SIZE_REM + CELL_GAP_REM;

interface MapCharacterMarkersProps {
  /** Snapshot serveur — écrasé par personnage dès que la WSS fournit du plus frais. */
  initialCharacters: ArtifactsCharacter[];
  activeLayer: string;
  minX: number;
  minY: number;
}

/**
 * Calque de marqueurs positionné en absolu au-dessus de la grille de la carte,
 * pour que les personnages bougent en temps réel sans re-rendre les ~600 cases.
 */
export function MapCharacterMarkers({
  initialCharacters,
  activeLayer,
  minX,
  minY,
}: MapCharacterMarkersProps) {
  const liveCharacters = useLiveCharacters();

  const markers = useMemo(() => {
    const byName = new Map(initialCharacters.map((c) => [c.name, c]));
    for (const [name, character] of Object.entries(liveCharacters)) {
      byName.set(name, character);
    }

    const byCell = new Map<string, { x: number; y: number; names: string[] }>();
    for (const character of byName.values()) {
      if (character.layer !== activeLayer) continue;
      const key = `${character.x}:${character.y}`;
      const cell = byCell.get(key) ?? { x: character.x, y: character.y, names: [] };
      cell.names.push(character.name);
      byCell.set(key, cell);
    }
    return [...byCell.values()];
  }, [initialCharacters, liveCharacters, activeLayer]);

  return (
    <>
      {markers.map((cell) => (
        <div
          key={`${cell.x}:${cell.y}`}
          className="pointer-events-none absolute z-20 flex flex-col items-center gap-0.5 transition-all duration-500"
          style={{
            left: `${(cell.x - minX) * CELL_PITCH_REM}rem`,
            top: `calc(${(cell.y - minY) * CELL_PITCH_REM}rem - 0.375rem)`,
            width: `${CELL_SIZE_REM}rem`,
          }}
        >
          {cell.names.map((name) => (
            <span
              key={name}
              className="rounded-full bg-violet-600 px-1.5 py-px text-[9px] font-semibold text-white shadow"
            >
              {name}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
