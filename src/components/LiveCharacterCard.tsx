"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactsCharacter } from "@/types/character";
import { ArtifactsMap } from "@/types/map";
import { TileContentInfo } from "@/types/tile-content";
import { CharacterCard } from "@/components/CharacterCard";
import { useLiveCharacter } from "@/lib/realtime";
import { loadAllMapsClient } from "@/lib/maps-client";
import { resolveTileContentsClient } from "@/lib/tile-content-client";
import { buildMapLookup, getNeighborhood, MapLookup } from "@/lib/maps";

interface LiveCharacterCardProps {
  /** Snapshot serveur — affiché tel quel tant que la WSS n'a rien fourni. */
  character: ArtifactsCharacter;
  objective?: string;
  neighborhood: (ArtifactsMap | null)[];
  tileContents?: Record<string, TileContentInfo>;
}

/**
 * CharacterCard alimentée par le temps réel : l'état du personnage vient du
 * store WSS dès qu'un account_log arrive, et la mini-carte est recalculée en
 * local (cartes publiques chargées une fois côté client).
 */
export function LiveCharacterCard({
  character,
  objective,
  neighborhood,
  tileContents,
}: LiveCharacterCardProps) {
  const live = useLiveCharacter(character.name);
  const current = live ?? character;

  const [mapLookup, setMapLookup] = useState<MapLookup | null>(null);
  useEffect(() => {
    let alive = true;
    loadAllMapsClient().then((maps) => {
      if (alive && maps.length > 0) setMapLookup(buildMapLookup(maps));
    });
    return () => {
      alive = false;
    };
  }, []);

  const currentNeighborhood = useMemo(() => {
    if (!live || !mapLookup) return neighborhood;
    return getNeighborhood(mapLookup, live.x, live.y, live.layer);
  }, [live, mapLookup, neighborhood]);

  // Contenus de tuiles découverts en se déplaçant, fusionnés au snapshot serveur.
  const [extraContents, setExtraContents] = useState<Record<string, TileContentInfo>>({});
  useEffect(() => {
    let alive = true;
    resolveTileContentsClient(currentNeighborhood).then((resolved) => {
      if (!alive || Object.keys(resolved).length === 0) return;
      setExtraContents((previous) => ({ ...previous, ...resolved }));
    });
    return () => {
      alive = false;
    };
  }, [currentNeighborhood]);

  const mergedContents = useMemo(
    () => ({ ...tileContents, ...extraContents }),
    [tileContents, extraContents],
  );

  return (
    <CharacterCard
      character={current}
      objective={objective}
      neighborhood={currentNeighborhood}
      tileContents={mergedContents}
    />
  );
}
