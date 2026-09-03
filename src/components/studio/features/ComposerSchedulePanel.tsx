"use client";

import { useMemo } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";
import { ComposerFieldError, composerFieldLabel } from "./ComposerContentPreview";

const panelClass =
  "overflow-hidden rounded-2xl border border-[var(--wrapper-color-rim)] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]";

type ComposerSchedulePanelProps = {
  scheduleLabel: string;
  dateLabel: string;
  timeLabel: string;
  pickedDateKey: string;
  minDateKey?: string;
  onDateChange: (dateKey: string) => void;
  showTime: boolean;
  timeValue: string;
  onTimeChange: (time: string) => void;
  stepMinutes?: number;
  dateError?: string;
  timeError?: string;
  showPostNow?: boolean;
  postNow?: boolean;
  onPostNowChange?: (next: boolean) => void;
  postNowLabel?: string;
  postNowSummary?: string;
  /** When false, hide schedule toggle/date/time and keep Post now only (no paid cron yet). */
  allowScheduling?: boolean;
};

function parseDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const d = new Date(dateKey + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ComposerSchedulePanel({
  scheduleLabel,
  dateLabel,
  timeLabel,
  pickedDateKey,
  minDateKey,
  onDateChange,
  showTime,
  timeValue,
  onTimeChange,
  stepMinutes = 5,
  dateError,
  timeError,
  showPostNow = false,
  postNow = false,
  onPostNowChange,
  postNowLabel,
  postNowSummary,
  allowScheduling = true,
}: ComposerSchedulePanelProps) {
  const { locale } = useI18n();
  const date = useMemo(() => parseDateKey(pickedDateKey), [pickedDateKey]);
  const effectivePostNow = showPostNow && (!allowScheduling || postNow);
  const scheduling = allowScheduling && (!showPostNow || !effectivePostNow);

  const dateSummary = useMemo(() => {
    if (!date) return null;
    return new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }, [date, locale]);

  const timeSummary = useMemo(() => {
    if (!scheduling || !showTime || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
    const [hh, mm] = timeValue.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    const anchor = date ?? new Date();
    const at = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), hh, mm, 0, 0);
    return new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit" }).format(at);
  }, [date, locale, scheduling, showTime, timeValue]);

  return (
    <div className={panelClass}>
      <div className="border-b border-[var(--wrapper-color-rim)] bg-white/80 px-4 py-3">
        <p className={composerFieldLabel}>{scheduleLabel}</p>
        {showPostNow && effectivePostNow ? (
          <p className="mt-2 text-sm font-semibold leading-snug text-[var(--fg)]">{postNowSummary}</p>
        ) : (
          <>
            {dateSummary ? (
              <p className="mt-2 text-sm font-semibold capitalize leading-snug text-[var(--fg)]">{dateSummary}</p>
            ) : null}
            {timeSummary ? (
              <p className="mt-0.5 font-mono text-xs tabular-nums text-[var(--ice)]">{timeSummary}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="grid gap-3 p-4">
        {showPostNow && allowScheduling ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--wrapper-color-rim)] bg-[var(--studio-surface-3)]/80 px-3 py-2.5 transition hover:bg-[var(--studio-surface-2)]">
            <input
              type="checkbox"
              checked={postNow}
              onChange={(e) => onPostNowChange?.(e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--fg)]">{postNowLabel}</span>
          </label>
        ) : null}

        {scheduling ? (
          <>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]/80" aria-hidden />
                <span className={composerFieldLabel}>{dateLabel}</span>
              </div>
              <DatePicker
                variant="studio"
                label={dateLabel}
                value={pickedDateKey}
                minDateKey={minDateKey}
                widthClassName="w-full"
                onChange={onDateChange}
              />
              <ComposerFieldError message={dateError} />
            </div>

            {showTime ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]/80" aria-hidden />
                  <span className={composerFieldLabel}>{timeLabel}</span>
                </div>
                <TimePicker
                  variant="studio"
                  label={timeLabel}
                  value={timeValue}
                  onChange={onTimeChange}
                  stepMinutes={stepMinutes}
                  widthClassName="w-full"
                />
                <ComposerFieldError message={timeError} />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
