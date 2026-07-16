// Miroir partiel du JSON de l'API publique Artifacts MMO (GET /maps).
// Snake_case conforme au JSON réel ; seuls les champs consommés sont typés.

export interface MapAccess {
  type: string;
}

export interface MapContent {
  type: string;
  code: string;
}

export interface MapTransition {
  map_id: number;
  x: number;
  y: number;
  layer: string;
}

export interface MapInteractions {
  content: MapContent | null;
  transition: MapTransition | null;
}

export interface ArtifactsMap {
  map_id: number;
  name: string;
  skin: string;
  x: number;
  y: number;
  layer: string;
  access: MapAccess | null;
  interactions: MapInteractions | null;
}
