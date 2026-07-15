"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import type { Restaurant } from "@prisma/client";

export function RestaurantCombobox({
  onSelect,
}: {
  onSelect: (restaurant: Restaurant) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results as the query changes
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/restaurants/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Search failed.");
        }
        setResults(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function pick(restaurant: Restaurant) {
    setSelected(restaurant);
    setResults([]);
    setQuery("");
    onSelect(restaurant);
  }

  return (
    <div>
      {selected && (
        <div className="mb-2 flex items-center gap-2 rounded-(--radius-md) bg-(--color-success-soft) px-3 py-2 text-sm text-(--color-success-hover)">
          <Check className="h-4 w-4 shrink-0" />
          {selected.name} · {selected.neighborhood}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
        <input
          type="text"
          placeholder="Search Resy for a restaurant…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white pl-9 pr-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
        />
      </div>

      {loading && <p className="mt-1.5 text-xs text-(--color-text-muted)">Searching…</p>}
      {error && <p className="mt-1.5 text-xs text-(--color-coral)">{error}</p>}

      {results.length > 0 && (
        <div className="mt-2 divide-y divide-(--color-border) overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-white">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => pick(r)}
              className="block w-full px-3 py-2 text-left text-sm text-(--color-text-primary) hover:bg-(--color-bg-secondary)"
            >
              <span className="font-medium">{r.name}</span>{" "}
              <span className="text-(--color-text-muted)">
                · {r.cuisine} · {r.neighborhood}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
