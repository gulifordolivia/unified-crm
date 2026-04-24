import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLDivElement>;

export function Badge({ className = "", ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
      {...props}
    />
  );
}
