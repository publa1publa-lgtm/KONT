"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function formatStudioCreateCta(template: string, label: string): string {
  return template.includes("{label}") ? template.replace("{label}", label) : `${template} ${label}`;
}

type StudioCreateButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
};

export function StudioCreateButton({
  children,
  className = "",
  type = "button",
  ...props
}: StudioCreateButtonProps) {
  return (
    <button type={type} className={["studio-create-btn", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}

type StudioGhostButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
};

export function StudioGhostButton({
  children,
  className = "",
  type = "button",
  ...props
}: StudioGhostButtonProps) {
  return (
    <button type={type} className={["studio-btn-ghost", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
