"use client";

import { useSyncExternalStore } from "react";
import { ArtifactsCharacter } from "@/types/character";
import { readApiKeyCookieClient } from "@/lib/api-key";

const REALTIME_URL = "wss://realtime.artifactsmmo.com";

/** Événements souscrits — même protocole que le backend (token + subscriptions). */
const SUBSCRIPTIONS = [
  "event_spawn",
  "event_removed",
  "raid_started",
  "raid_removed",
  "grandexchange_sell_order",
  "grandexchange_buy_order",
  "grandexchange_buy",
  "grandexchange_sell",
  "grandexchange_cancel_sell_order",
  "grandexchange_cancel_buy_order",
  "account_log",
  "achievement_unlocked",
];

const MAX_EVENTS_KEPT = 100;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type RealtimeStatus = "off" | "connecting" | "connected";

export interface RealtimeEvent {
  type: string;
  data: unknown;
  receivedAt: number;
}

export interface RealtimeState {
  status: RealtimeStatus;
  /** Derniers états connus des personnages, mis à jour à chaque account_log. */
  characters: Record<string, ArtifactsCharacter>;
  /** Feed brut des derniers événements reçus (plafonné), pour affichage futur. */
  events: RealtimeEvent[];
}

const SERVER_STATE: RealtimeState = { status: "off", characters: {}, events: [] };

let state: RealtimeState = { status: "off", characters: {}, events: [] };
const listeners = new Set<() => void>();

let socket: WebSocket | null = null;
let connectedKey: string | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<RealtimeState>) {
  state = { ...state, ...partial };
  emit();
}

/**
 * Aligne la connexion WSS sur la clé API du cookie : ouvre si une clé est
 * présente, ferme si elle a été effacée, reconnecte si elle a changé.
 * À appeler au montage de l'app et après toute modification de la clé.
 */
export function syncRealtimeConnection() {
  if (typeof window === "undefined") return;

  const key = readApiKeyCookieClient();
  if (key === connectedKey && socket) return;

  teardown();
  connectedKey = key;
  if (!key) {
    setState({ status: "off" });
    return;
  }
  open(key);
}

function teardown() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    // Détache les handlers avant close : onclose ne doit pas replanifier.
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    socket.close(1000, "Reconfiguration");
    socket = null;
  }
  reconnectAttempts = 0;
}

function open(key: string) {
  setState({ status: "connecting" });
  const ws = new WebSocket(REALTIME_URL);
  socket = ws;

  ws.onopen = () => {
    ws.send(JSON.stringify({ token: key, subscriptions: SUBSCRIPTIONS }));
    reconnectAttempts = 0;
    setState({ status: "connected" });
  };

  ws.onmessage = (event) => {
    if (typeof event.data === "string") handleMessage(event.data);
  };

  ws.onerror = () => ws.close();

  ws.onclose = () => {
    socket = null;
    scheduleReconnect(key);
  };
}

/** Reconnexion en backoff exponentiel (1 s → 30 s), comme le backend. */
function scheduleReconnect(key: string) {
  setState({ status: "connecting" });
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
    MAX_RECONNECT_DELAY_MS,
  );
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    // La clé peut avoir changé pendant l'attente — on repart du cookie.
    if (readApiKeyCookieClient() === key) open(key);
    else syncRealtimeConnection();
  }, delay);
}

function handleMessage(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== "object") return;

  const { type, data } = parsed as { type?: unknown; data?: unknown };
  if (typeof type !== "string" || type.length === 0) return;

  const events = [
    { type, data, receivedAt: Date.now() },
    ...state.events,
  ].slice(0, MAX_EVENTS_KEPT);

  if (type === "account_log") {
    const character = extractCharacter(data);
    if (character) {
      setState({
        events,
        characters: { ...state.characters, [character.name]: character },
      });
      return;
    }
  }

  setState({ events });
}

/**
 * Un account_log porte l'état complet du personnage dans data.content.character
 * (data.character n'est que le nom). Forme validée avant usage — une réponse
 * dégradée ne doit jamais empoisonner le store.
 */
function extractCharacter(data: unknown): ArtifactsCharacter | null {
  if (!data || typeof data !== "object") return null;
  const content = (data as { content?: unknown }).content;
  if (!content || typeof content !== "object") return null;
  const character = (content as { character?: unknown }).character;
  if (!character || typeof character !== "object") return null;

  const candidate = character as Record<string, unknown>;
  if (
    typeof candidate.name !== "string" ||
    typeof candidate.hp !== "number" ||
    typeof candidate.x !== "number" ||
    typeof candidate.y !== "number"
  ) {
    return null;
  }
  return character as ArtifactsCharacter;
}

function subscribeRealtime(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(
    subscribeRealtime,
    () => state.status,
    () => SERVER_STATE.status,
  );
}

/** Dernier état WSS du personnage, ou null tant qu'aucun account_log ne l'a porté. */
export function useLiveCharacter(name: string): ArtifactsCharacter | null {
  return useSyncExternalStore(
    subscribeRealtime,
    () => state.characters[name] ?? null,
    () => null,
  );
}

/** Map name → personnage live (vide côté serveur et sans clé). */
export function useLiveCharacters(): Record<string, ArtifactsCharacter> {
  return useSyncExternalStore(
    subscribeRealtime,
    () => state.characters,
    () => SERVER_STATE.characters,
  );
}
