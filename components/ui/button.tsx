"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "outline"
      ? "border border-zinc-200 bg-transparent text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200 active:text-zinc-950"
      : "bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black active:text-white";
  const sizeClass = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm";

  return (
    <button
      type={type}
      className={`pressable inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 hover:brightness-95 active:scale-[0.98] active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
