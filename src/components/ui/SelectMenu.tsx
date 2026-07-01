"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectMenuOption<T extends string | number> = {
  value: T;
  label: string;
};

/** Above studio chrome (sidebar z-40, scroll clipping). */
const PANEL_Z_INDEX = 10_000;

type PanelPosition = { top: number; left: number; width: number };

function useOnClickOutside(refs: Array<React.RefObject<HTMLElement | null>>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      for (const r of refs) {
        const el = r.current;
        if (el && el.contains(t)) return;
      }
      onOutside();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [enabled, onOutside, refs]);
}

export function SelectMenu<T extends string | number>({
  label,
  value,
  options,
  onChange,
  widthClassName = "min-w-[160px]",
  triggerClassName = "",
  variant = "default",
}: {
  label: string;
  value: T;
  options: Array<SelectMenuOption<T>>;
  onChange: (v: T) => void;
  widthClassName?: string;
  /** Merged into the trigger button (e.g. min height for touch targets). */
  triggerClassName?: string;
  /** `studio` — light glass surfaces for KONT studio calendar chrome. */
  variant?: "default" | "studio";
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(() => Math.max(0, options.findIndex((o) => o.value === value)));

  const selected = useMemo(() => options.find((o) => o.value === value) ?? options[0]!, [options, value]);

  const updatePanelPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [options, value]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    updatePanelPos();
    window.addEventListener("resize", updatePanelPos);
    window.addEventListener("scroll", updatePanelPos, true);
    return () => {
      window.removeEventListener("resize", updatePanelPos);
      window.removeEventListener("scroll", updatePanelPos, true);
    };
  }, [open, updatePanelPos]);

  useOnClickOutside([buttonRef, panelRef], () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[activeIndex];
        if (!opt) return;
        onChange(opt.value);
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, onChange, open, options]);

  const isStudio = variant === "studio";

  const panel =
    open && panelPos ? (
      <div
        ref={panelRef}
        className="pointer-events-auto fixed origin-top scale-100 opacity-100 transition duration-200 ease-out"
        style={{
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          zIndex: PANEL_Z_INDEX,
        }}
      >
        <div
          className={
            isStudio
              ? "studio-cal-select__panel overflow-hidden rounded-xl border p-1"
              : "overflow-hidden rounded-2xl border border-white/10 bg-[rgba(12,12,14,0.92)] shadow-[0_30px_90px_-50px_rgba(0,0,0,0.92)] backdrop-blur-xl"
          }
        >
          <div className="max-h-64 overflow-auto p-1" id={listId} role="listbox" aria-label={label}>
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <button
                  key={`${String(opt.value)}-${opt.label}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={[
                    "flex w-full min-h-[44px] items-center rounded-xl px-3 py-2.5 text-left text-sm transition",
                    isStudio
                      ? isSelected
                        ? "studio-cal-select__option studio-cal-select__option--selected font-semibold"
                        : "studio-cal-select__option"
                      : isSelected
                        ? "border border-[var(--ice)]/30 bg-[var(--ice)]/14 font-semibold text-[var(--ice)] ring-1 ring-[var(--ice)]/25"
                        : "border border-transparent text-[var(--fg)] hover:bg-white/7",
                    !isStudio && isActive && !isSelected ? "bg-white/5" : "",
                    isStudio && isActive && !isSelected ? "studio-cal-select__option--active" : "",
                  ].join(" ")}
                >
                  <span className="truncate capitalize">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className={["relative", widthClassName].join(" ")}>
      <span className="sr-only">{label}</span>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "group flex w-full min-h-[44px] items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none",
          isStudio
            ? "studio-cal-select__trigger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
            : [
                "border-white/10 bg-white/5 text-[var(--fg)]",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]",
                "hover:bg-white/10 focus:ring-2 focus:ring-[var(--ice)]/40",
              ].join(" "),
          triggerClassName,
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className="truncate capitalize">{selected.label}</span>
        <span
          className={[
            "transition",
            isStudio ? "studio-cal-select__caret" : "text-white/55 group-hover:text-white/75",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▾
        </span>
      </button>

      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
