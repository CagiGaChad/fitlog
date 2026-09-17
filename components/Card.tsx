import type { ReactNode } from "react";

type CardVariant = "default" | "flat" | "amber" | "danger";

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface border border-line",
  flat: "bg-transparent border border-line",
  amber: "bg-surface border-l-4 border-l-amber border-y border-r border-y-line border-r-line",
  danger: "bg-surface border-l-4 border-l-danger border-y border-r border-y-line border-r-line",
};

export function Card({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <div className={`rounded-[14px] p-4 mb-3 ${VARIANT_CLASSES[variant]} ${className}`}>{children}</div>
  );
}
