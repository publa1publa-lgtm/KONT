import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Shared class names — wrapper-color canvas + white rows (lists & tables). */
export const studioWrapperList = {
  surface: "studio-wrapper-list",
  surfaceGrow: "studio-wrapper-list studio-wrapper-list--grow",
  body: "studio-wrapper-list__body",
  row: "studio-wrapper-list__row",
  rowEmpty: "studio-wrapper-list__row studio-wrapper-list__empty",
  tableScroll: "studio-wrapper-list__table-scroll",
  table: "studio-wrapper-list__table",
  thead: "studio-wrapper-list__thead",
  th: "studio-wrapper-list__th",
  tbody: "studio-wrapper-list__tbody",
  tr: "studio-wrapper-list__tr",
  td: "studio-wrapper-list__td",
} as const;

type BoxProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function StudioWrapperList<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: BoxProps<T>) {
  const Comp = as ?? "div";
  return (
    <Comp className={cx(studioWrapperList.surface, className)} {...rest}>
      {children}
    </Comp>
  );
}

export function StudioWrapperListBody<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: BoxProps<T>) {
  const Comp = as ?? "div";
  return (
    <Comp className={cx(studioWrapperList.body, className)} {...rest}>
      {children}
    </Comp>
  );
}

export function StudioWrapperListRow<T extends ElementType = "div">({
  as,
  className,
  children,
  empty,
  ...rest
}: BoxProps<T> & { empty?: boolean }) {
  const Comp = as ?? "div";
  return (
    <Comp className={cx(empty ? studioWrapperList.rowEmpty : studioWrapperList.row, className)} {...rest}>
      {children}
    </Comp>
  );
}
