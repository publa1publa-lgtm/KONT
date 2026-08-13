"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({ className, showLabel, hideLabel, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={[className, "!pr-11"].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 z-[1] grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[rgba(29,29,31,0.42)] transition hover:bg-[rgba(0,113,227,0.06)] hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32ade6]/40"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
