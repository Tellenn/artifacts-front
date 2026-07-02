"use client";

import { useMemo, useState } from "react";
import {
  BankItem,
  ITEM_TYPE_FALLBACK_ICON,
  ITEM_TYPE_ICONS,
} from "@/types/bank";

interface BankBrowserProps {
  items: BankItem[];
}

export function BankBrowser({ items }: BankBrowserProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => typeFilter === null || item.type === typeFilter)
      .filter(
        (item) =>
          q === "" ||
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [items, query, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un item (nom ou code)…"
          aria-label="Rechercher un item"
          className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <TypeChip
            label="Tous"
            count={items.length}
            active={typeFilter === null}
            onClick={() => setTypeFilter(null)}
          />
          {types.map(([type, count]) => (
            <TypeChip
              key={type}
              label={type.replaceAll("_", " ")}
              icon={ITEM_TYPE_ICONS[type] ?? ITEM_TYPE_FALLBACK_ICON}
              count={count}
              active={typeFilter === type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          Aucun item ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map((item) => (
            <BankItemRow key={item.code} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface TypeChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: string;
}

function TypeChip({ label, count, active, onClick, icon }: TypeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
      }`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
      <span className="ml-1.5 text-gray-500 font-mono">{count}</span>
    </button>
  );
}

interface BankItemRowProps {
  item: BankItem;
}

function BankItemRow({ item }: BankItemRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-gray-900 border border-gray-800 px-3 py-2.5">
      <span className="text-lg" aria-hidden>
        {ITEM_TYPE_ICONS[item.type] ?? ITEM_TYPE_FALLBACK_ICON}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-gray-500 truncate">
          <span className="font-mono">{item.code}</span>
          {item.level > 0 && <span> · niv. {item.level}</span>}
        </p>
      </div>
      <span className="font-mono text-sm text-gray-200 tabular-nums">
        ×{item.quantity.toLocaleString("fr-FR")}
      </span>
    </li>
  );
}
