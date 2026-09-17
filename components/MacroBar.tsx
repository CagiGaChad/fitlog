import type { ReactNode } from "react";

export function MacroBar({
  label,
  icon,
  current,
  goal,
  unit,
  textColorClass,
  barColorClass,
}: {
  label: string;
  icon: ReactNode;
  current: number;
  goal: number;
  unit: string;
  textColorClass: string;
  barColorClass: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const over = goal > 0 && current > goal;

  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-[15px]">
          <span className={textColorClass}>{icon}</span>
          {label}
        </span>
        <span className="font-mono text-[13px] text-dim">
          {Math.round(current)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${over ? "bg-danger" : barColorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
