"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { API_KEY_COOKIE, readApiKeyCookieClient } from "@/lib/api-key";
import { syncRealtimeConnection, useRealtimeError } from "@/lib/realtime";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// document.cookie n'émet aucun événement : mini-store notifié manuellement
// après chaque écriture, lu via useSyncExternalStore (null au rendu serveur).
let cookieListeners: Array<() => void> = [];

function subscribeToCookie(listener: () => void): () => void {
  cookieListeners.push(listener);
  return () => {
    cookieListeners = cookieListeners.filter((l) => l !== listener);
  };
}

function notifyCookieChanged() {
  cookieListeners.forEach((listener) => listener());
}

function writeApiKeyCookie(value: string) {
  document.cookie = `${API_KEY_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

function clearApiKeyCookie() {
  document.cookie = `${API_KEY_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Masque la clé : seuls les 4 derniers caractères restent lisibles. */
function maskKey(key: string): string {
  return `…${key.slice(-4)}`;
}

export function ApiKeyForm() {
  const router = useRouter();
  const savedKey = useSyncExternalStore(
    subscribeToCookie,
    readApiKeyCookieClient,
    () => null,
  );
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const realtimeError = useRealtimeError();

  function handleSave(event: FormEvent) {
    event.preventDefault();
    const key = input.trim();
    if (!key) return;

    writeApiKeyCookie(key);
    notifyCookieChanged();
    syncRealtimeConnection();
    setInput("");
    setMessage("Clé enregistrée — les prochains appels l'utiliseront.");
    // Re-rend les Server Components pour que les fetch serveur voient le cookie.
    router.refresh();
  }

  function handleClear() {
    clearApiKeyCookie();
    notifyCookieChanged();
    syncRealtimeConnection();
    setMessage("Clé effacée.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 space-y-4 max-w-xl"
    >
      <div>
        <h2 className="font-semibold">Clé API Artifacts MMO</h2>
        <p className="mt-1 text-sm text-gray-400">
          Stockée dans un cookie de ce navigateur et jointe aux appels vers
          l&apos;API du jeu. Aucune clé ne quitte ton poste en dehors de ces
          appels.
        </p>
      </div>

      <p className="text-sm">
        Clé actuelle :{" "}
        {savedKey ? (
          <span className="font-mono text-green-400">{maskKey(savedKey)}</span>
        ) : (
          <span className="text-gray-500">aucune</span>
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Coller la clé API…"
          autoComplete="off"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-950 transition-colors hover:bg-white disabled:opacity-40"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!savedKey}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-500 disabled:opacity-40"
        >
          Effacer
        </button>
      </div>

      {message && <p className="text-sm text-gray-400">{message}</p>}
      {realtimeError && (
        <p className="text-sm text-red-400">
          Temps réel refusé par le serveur : {realtimeError}
        </p>
      )}
    </form>
  );
}
