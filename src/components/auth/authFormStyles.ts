import { cn } from "@/lib/utils";

export const authFieldClass =
  "w-full rounded-xl border border-[rgba(0,113,227,0.14)] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] outline-none transition placeholder:text-[rgba(29,29,31,0.38)] focus:border-[#0071e3]/55 focus:ring-2 focus:ring-[#32ade6]/18";

export function authInputClass(invalid?: boolean) {
  return cn(
    authFieldClass,
    invalid &&
      "border-red-400/80 focus:border-red-500 focus:ring-red-400/25",
  );
}
