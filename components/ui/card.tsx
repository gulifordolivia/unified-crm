import type { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;
type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

export function Card({ className = "", ...props }: DivProps) {
  return <div className={`border border-zinc-200 ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HeadingProps) {
  return <h3 className={`text-xl font-semibold tracking-tight ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}
