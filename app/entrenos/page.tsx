"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { store } from "@/lib/storage";
import { ensureWeekPlan, newWorkout } from "@/lib/state";
import type { WeekPlan, Workout } from "@/lib/types";

export default function EntrenosPage() {
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<WeekPlan>([]);

  useEffect(() => {
    setPlan(ensureWeekPlan());
    setReady(true);
  }, []);

  if (!ready) return null;

  function savePlan(next: WeekPlan) {
    setPlan(next);
    store.setWeekPlan(next);
  }

  function addWorkout(dayIndex: number) {
    savePlan(plan.map((d, i) => (i === dayIndex ? { ...d, workouts: [...d.workouts, newWorkout()] } : d)));
  }

  function updateWorkout(dayIndex: number, workoutId: string, patch: Partial<Workout>) {
    savePlan(
      plan.map((d, i) =>
        i === dayIndex ? { ...d, workouts: d.workouts.map((w) => (w.id === workoutId ? { ...w, ...patch } : w)) } : d
      )
    );
  }

  function removeWorkout(dayIndex: number, workoutId: string) {
    if (!confirm("¿Eliminar este entreno?")) return;
    savePlan(plan.map((d, i) => (i === dayIndex ? { ...d, workouts: d.workouts.filter((w) => w.id !== workoutId) } : d)));
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-[30px]">Entrenos</h1>
        <span className="text-dim text-[13px]">Plantilla semanal</span>
      </div>
      <Card variant="flat">
        <p className="text-dim text-sm">
          Define lo que entrenas cada día — puedes añadir más de un entreno el mismo día (ej. Fuerza y Natación por
          separado). Se repite cada semana.
        </p>
      </Card>

      {plan.map((d, dayIndex) => (
        <Card key={d.day}>
          <div className="flex items-center justify-between mb-3">
            <h3>{d.day}</h3>
            <button onClick={() => addWorkout(dayIndex)} className="text-accent text-[13px] font-medium">
              + Añadir entreno
            </button>
          </div>

          {d.workouts.length === 0 && <p className="text-dim text-sm py-1">Descanso</p>}

          <div className="flex flex-col gap-4">
            {d.workouts.map((w) => (
              <div key={w.id} className="bg-surface-2 rounded-[10px] p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre del entreno (ej. Fuerza)"
                    value={w.name}
                    onChange={(e) => updateWorkout(dayIndex, w.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeWorkout(dayIndex, w.id)}
                    className="shrink-0 h-[42px] w-[42px] rounded-[10px] border border-line text-dim"
                    title="Eliminar entreno"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  placeholder="Notas (ej. piernas + core, 45 min)"
                  value={w.notes}
                  onChange={(e) => updateWorkout(dayIndex, w.id, { notes: e.target.value })}
                  className="mb-2 min-h-[52px]"
                />
                <label className="block text-dim text-[12px] mb-1">Ejercicios (opcional, uno por línea)</label>
                <ExercisesEditor
                  exercises={w.exercises}
                  onSave={(exercises) => updateWorkout(dayIndex, w.id, { exercises })}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

// Textarea "sin control" para la lista de ejercicios: si reformateáramos el
// valor en cada pulsación (quitando líneas vacías al vuelo), el cursor
// saltaría mientras escribes. En vez de eso, el texto libre vive en estado
// local y solo se limpia/guarda al salir del campo.
function ExercisesEditor({ exercises, onSave }: { exercises: string[]; onSave: (exercises: string[]) => void }) {
  const [text, setText] = useState(exercises.join("\n"));

  useEffect(() => {
    setText(exercises.join("\n"));
  }, [exercises]);

  function commit(value: string) {
    onSave(
      value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  return (
    <textarea
      placeholder={"Sentadilla\nZancadas\nPrensa"}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      className="min-h-[220px]"
    />
  );
}
