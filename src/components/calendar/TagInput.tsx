"use client";

import { useMemo, useState } from "react";

function normalizeTag(raw: string): string | null {
  const t = raw.trim().replace(/^#+/, "");
  if (!t) return null;
  return t.replace(/\s+/g, "_");
}

const studioInputClass =
  "w-full rounded-xl border border-[var(--wrapper-color-rim)] bg-white/95 px-3 py-2 text-sm text-[var(--fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[var(--muted)]/55 focus:border-[var(--ice)]/35 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/20";

export function TagInput({
  label,
  placeholder,
  value,
  onChange,
  variant = "default",
}: {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (next: string[]) => void;
  variant?: "default" | "studio";
}) {
  const [text, setText] = useState("");
  const isStudio = variant === "studio";

  const chips = useMemo(() => value, [value]);

  const add = (raw: string) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
  };

  const addFromText = () => {
    const parts = text.split(/[, ]+/g).map((x) => x.trim()).filter(Boolean);
    if (parts.length === 0) return;
    let next = [...value];
    for (const p of parts) {
      const t = normalizeTag(p);
      if (!t) continue;
      if (next.includes(t)) continue;
      next.push(t);
    }
    onChange(next);
    setText("");
  };

  return (
    <div className="grid gap-2">
      <div className={isStudio ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]" : "text-xs font-semibold text-[var(--muted)]"}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((t) => (
          <span
            key={t}
            className={
              isStudio
                ? "inline-flex items-center gap-2 rounded-full border border-[var(--line)]/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[var(--fg)]"
            }
          >
            <span className="font-mono text-[var(--ice)]">#{t}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className={
                isStudio
                  ? "rounded-full border border-[var(--wrapper-color-rim)] bg-white/90 px-2 py-0.5 text-[10px] text-[var(--muted)] hover:bg-[var(--wrapper-color-soft)]"
                  : "rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-[var(--muted)] hover:bg-black/40"
              }
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addFromText();
          }
        }}
        onBlur={() => {
          if (text.trim()) addFromText();
        }}
        placeholder={placeholder ?? "Type tag and press Enter"}
        className={
          isStudio
            ? studioInputClass
            : "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--fg)] outline-none ring-[var(--ice)]/50 placeholder:text-white/25 focus:ring-2"
        }
      />
      <div className="text-[11px] text-[var(--muted)]">Enter to add multiple tags. “#” optional.</div>
    </div>
  );
}
