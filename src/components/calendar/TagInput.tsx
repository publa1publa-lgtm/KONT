"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

function normalizeTag(raw: string): string | null {
  const t = raw.trim().replace(/^#+/, "");
  if (!t) return null;
  return t.replace(/\s+/g, "_");
}

export function TagInput({
  label,
  placeholder,
  hint,
  value,
  onChange,
  error,
  variant = "default",
}: {
  label: string;
  placeholder?: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  variant?: "default" | "studio";
}) {
  const [text, setText] = useState("");
  const isStudio = variant === "studio";

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

  const remove = (tag: string) => onChange(value.filter((x) => x !== tag));

  return (
    <div className="grid gap-1.5">
      <div
        className={
          isStudio
            ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            : "text-xs font-semibold text-[var(--muted)]"
        }
      >
        {label}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-[#E8F4FD] py-1 pe-1 ps-2.5 text-[12px] font-medium leading-none text-[#00376b]"
          >
            <span className="truncate">#{t}</span>
            <button
              type="button"
              onClick={() => remove(t)}
              className="grid size-4 shrink-0 place-items-center rounded-md text-[#00376b]/55 transition hover:bg-[#00376b]/10 hover:text-[#00376b]"
              aria-label={`Remove ${t}`}
            >
              <X className="size-3" strokeWidth={2.25} aria-hidden />
            </button>
          </span>
        ))}

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addFromText();
            }
            if (e.key === "Backspace" && !text && value.length) {
              e.preventDefault();
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (text.trim()) addFromText();
          }}
          placeholder={placeholder ?? "Type tag and press Enter"}
          className={cn(
            "min-w-[8rem] flex-1 text-sm outline-none transition placeholder:text-[var(--muted)]/55",
            value.length ? "min-h-[2.25rem] py-1.5" : "min-h-[42px] py-2.5",
            isStudio
              ? "rounded-xl border bg-white/95 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus:outline-none focus:ring-2"
              : "rounded-xl border border-white/10 bg-black/30 px-3 py-2",
            isStudio && error
              ? "border-[var(--ember)]/55 focus:border-[var(--ember)]/70 focus:ring-[var(--ember)]/20"
              : isStudio
                ? "border-[var(--wrapper-color-rim)] focus:border-[var(--ice)]/35 focus:ring-[var(--ice)]/20"
                : "",
          )}
        />
      </div>

      {error ? (
        <p className="text-[12px] leading-snug text-[var(--ember)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <div className="text-[11px] text-[var(--muted)]">{hint}</div>
      ) : isStudio ? null : (
        <div className="text-[11px] text-[var(--muted)]">Enter to add multiple tags. “#” optional.</div>
      )}
    </div>
  );
}
