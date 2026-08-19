import { Archive, PencilLine, Trash2, Undo2, type LucideIcon } from "lucide-react";

type ActionTone = "default" | "muted" | "danger";

const chipBase =
  "group relative flex min-h-[3.25rem] w-[3.1rem] flex-col items-center justify-center gap-1 rounded-[0.85rem] px-0.5 py-1.5 transition-[background,box-shadow,transform] duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-nav-active-ring)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45";

const chipBaseCompact =
  "group relative flex min-h-[2.75rem] w-[2.65rem] flex-col items-center justify-center gap-0.5 rounded-[0.75rem] px-0.5 py-1 transition-[background,box-shadow,transform] duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-nav-active-ring)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45";

const chipIconOnly =
  "group flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-0 transition-[background,box-shadow,transform] duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-nav-active-ring)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45";

const labelClassCompact =
  "font-display max-w-[2.6rem] truncate text-center text-[8px] font-medium leading-none tracking-tight transition-colors duration-200";

const iconShellCompact = "flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-200";

const toneStyles: Record<ActionTone, { chip: string; icon: string; label: string }> = {
  default: {
    chip: "text-[var(--fg)] hover:bg-[var(--studio-nav-hover)] hover:shadow-[inset_0_0_0_1px_var(--studio-nav-active-ring)]",
    icon: "border-[var(--nav-border)] bg-[var(--nav-item)] text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group-hover:border-[var(--line)] group-hover:bg-[var(--nav-item-hover)] group-hover:text-[var(--fg)]",
    label: "text-[var(--muted)] group-hover:text-[var(--fg)]",
  },
  muted: {
    chip: "text-[var(--fg)] hover:bg-[var(--studio-nav-hover)] hover:shadow-[inset_0_0_0_1px_var(--studio-nav-active-ring)]",
    icon: "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--muted)] group-hover:border-[var(--line)] group-hover:text-[var(--fg)]",
    label: "text-[var(--muted)] group-hover:text-[var(--fg)]",
  },
  danger: {
    chip:
      "text-[var(--ember)] hover:bg-[var(--ember)]/16 hover:shadow-[inset_0_0_0_1px_rgba(255,69,0,0.45),0_8px_24px_-16px_rgba(255,69,0,0.35)]",
    icon: "border-[var(--ember)]/50 bg-[var(--ember)]/14 text-[var(--ember)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_-8px_rgba(255,69,0,0.35)] group-hover:border-[var(--ember)]/65 group-hover:bg-[var(--ember)]/22",
    label: "font-medium text-[var(--ember)]",
  },
};

const iconShell =
  "flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200";

const labelClass =
  "font-display max-w-[3rem] truncate text-center text-[9px] font-medium leading-none tracking-tight transition-colors duration-200 sm:text-[10px]";

function ActionChip({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
  compact = false,
  iconsOnly = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  compact?: boolean;
  iconsOnly?: boolean;
}) {
  const s = toneStyles[tone];
  if (iconsOnly) {
    return (
      <button
        type="button"
        className={[chipIconOnly, s.chip].join(" ")}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
      >
        <span className={[iconShellCompact, s.icon].join(" ")}>
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        </span>
      </button>
    );
  }
  const shell = compact ? iconShellCompact : iconShell;
  const labelCls = compact ? labelClassCompact : labelClass;
  return (
    <button
      type="button"
      className={[compact ? chipBaseCompact : chipBase, s.chip].join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <span className={[shell, s.icon].join(" ")}>
        <Icon
          className={[compact ? "h-3.5 w-3.5" : "h-[17px] w-[17px]", "shrink-0"].join(" ")}
          strokeWidth={2}
          aria-hidden
        />
      </span>
      <span className={[labelCls, s.label].join(" ")}>{label}</span>
    </button>
  );
}

export type ContentTableActionsLabels = {
  edit: string;
  delete: string;
  archive?: string;
  toDraft?: string;
};

type ContentTableActionsProps = {
  labels: ContentTableActionsLabels;
  onDelete: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onToDraft?: () => void;
  compact?: boolean;
  iconsOnly?: boolean;
};

export function ContentTableActions({
  labels,
  onDelete,
  onEdit,
  onArchive,
  onToDraft,
  compact = false,
  iconsOnly = false,
}: ContentTableActionsProps) {
  return (
    <div
      className={[
        "studio-table-actions relative z-[1] inline-flex w-fit shrink-0 items-stretch rounded-2xl border border-[var(--line)]/90 bg-[var(--studio-surface-3)]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_32px_-28px_rgba(0,0,0,0.35)] backdrop-blur-[2px]",
        iconsOnly ? "studio-table-actions--icons gap-px p-px" : compact ? "gap-0.5 p-0.5" : "p-1",
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
    >
      {onEdit ? (
        <ActionChip compact={compact} iconsOnly={iconsOnly} icon={PencilLine} label={labels.edit} onClick={onEdit} />
      ) : null}
      {onToDraft && labels.toDraft ? (
        <ActionChip
          compact={compact}
          iconsOnly={iconsOnly}
          icon={Undo2}
          label={labels.toDraft}
          onClick={onToDraft}
          tone="muted"
        />
      ) : null}
      {onArchive && labels.archive ? (
        <ActionChip
          compact={compact}
          iconsOnly={iconsOnly}
          icon={Archive}
          label={labels.archive}
          onClick={onArchive}
          tone="muted"
        />
      ) : null}
      <span
        className={
          iconsOnly
            ? "mx-px w-px shrink-0 self-stretch bg-[var(--line)]"
            : "mx-0.5 my-2 w-px shrink-0 self-stretch bg-[var(--line)]"
        }
        aria-hidden
      />
      <ActionChip
        compact={compact}
        iconsOnly={iconsOnly}
        icon={Trash2}
        label={labels.delete}
        onClick={onDelete}
        tone="danger"
      />
    </div>
  );
}
