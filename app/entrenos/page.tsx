"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { store } from "@/lib/storage";
import { ensureWeekPlan } from "@/lib/state";
import type { WeekPlan } from "@/lib/types";

export default function EntrenosPage() {
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<WeekPlan>([]);

  useEffect(() => {
    setPlan(ensureWeekPlan());
    setReady(true);
  }, []);

  if (!ready) return null;

  function updateDay(i: number, patch: Partial<WeekPlan[number]>) {
    const next = plan.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    setPlan(next);
    store.setWeekPlan(next);
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-[30px]">Entrenos</h1>
        <span className="text-dim text-[13px]">Plantilla semanal</span>
      </div>
      <Card variant="flat">
        <p className="text-dim text-sm">
          Define lo que entrenas cada día. Se repite cada semana — edítalo cuando cambies de rutina.
        </p>
      </Card>

      <Card>
        {plan.map((d, i) => (
          <div key={d.day} className="flex gap-3 py-3 border-b border-line last:border-0 first:pt-0">
            <span className="text-dim text-[13px] font-mono pt-2.5 w-9 shrink-0">{d.day.slice(0, 3)}</span>
            <div className="flex-1 flex flex-col gap-1.5">
              <input
                type="text"
                placeholder="Descanso"
                value={d.name}
                onChange={(e) => updateDay(i, { name: e.target.value })}
              />
              <textarea
                placeholder="Notas (ej. piernas + core, 45 min)"
                value={d.notes}
                onChange={(e) => updateDay(i, { notes: e.target.value })}
              />
              <label className="block text-dim text-[12px] mt-1">Ejercicios (opcional, uno por línea)</label>
              <textarea
                placeholder={"Sentadilla\nZancadas\nPrensa"}
                value={(d.exercises || []).join("\n")}
                onChange={(e) =>
                  updateDay(i, {
                    exercises: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
