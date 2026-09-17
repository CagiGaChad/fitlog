"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { MacroBar } from "@/components/MacroBar";
import { ChickenIcon, RiceIcon, AvocadoIcon, FlameIcon } from "@/components/icons/FoodIcons";
import { store, todayKey, isoDayIndex } from "@/lib/storage";
import { activeGoals, sumLog } from "@/lib/macros";
import { ensureWeekPlan, hasProfile } from "@/lib/state";
import type { ExerciseCheck, Goals, LogEntry, Totals, Workout } from "@/lib/types";

const MEALS = ["Desayuno", "Comida", "Merienda", "Cena", "Otro"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface WorkoutState {
  workout: Workout;
  exerciseChecks: ExerciseCheck[] | null;
  done: boolean;
}

interface DayData {
  goals: Goals;
  totals: Totals;
  workouts: WorkoutState[];
  entries: LogEntry[];
  dateKey: string;
}

function loadWorkoutState(dateKey: string, workout: Workout): WorkoutState {
  if (workout.exercises.length > 0) {
    const prev = store.getExerciseChecks(dateKey, workout.id) || [];
    const prevByName = new Map(prev.map((e) => [e.name, e.done]));
    const exerciseChecks = workout.exercises.map((name) => ({ name, done: prevByName.get(name) || false }));
    store.setExerciseChecks(dateKey, workout.id, exerciseChecks);
    return { workout, exerciseChecks, done: exerciseChecks.every((e) => e.done) };
  }
  return { workout, exerciseChecks: null, done: store.isWorkoutDone(dateKey, workout.id) };
}

function loadDay(): DayData | null {
  if (!hasProfile()) return null;
  const dateKey = todayKey();
  const profile = store.getProfile()!;
  const goals = activeGoals(profile);
  const entries = store.getLog(dateKey);
  const totals = sumLog(entries);
  const plan = ensureWeekPlan();
  const todayPlan = plan[isoDayIndex()];
  const workouts = todayPlan.workouts.map((w) => loadWorkoutState(dateKey, w));

  return { goals, totals, workouts, entries, dateKey };
}

export default function TodayPage() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<DayData | null>(null);

  useEffect(() => {
    setData(loadDay());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!data) {
    return (
      <>
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-[30px]">Hoy</h1>
        </div>
        <Card variant="amber">
          <h3>Configura tu perfil</h3>
          <p className="text-dim text-sm my-3">
            Para calcular tus calorías y macros diarios, primero necesito tu peso, altura y objetivo.
          </p>
          <Link href="/ajustes" className="block w-full text-center bg-accent text-white rounded-[10px] py-3 font-semibold">
            Ir a ajustes
          </Link>
        </Card>
      </>
    );
  }

  const { goals, totals, workouts, entries, dateKey } = data;
  const dateLabel = capitalize(
    new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  );

  function toggleWorkoutDone(workoutId: string) {
    const newDone = !store.isWorkoutDone(dateKey, workoutId);
    store.setWorkoutDone(dateKey, workoutId, newDone);
    setData(loadDay());
  }

  function toggleExercise(workoutId: string, i: number) {
    const checks = store.getExerciseChecks(dateKey, workoutId);
    if (!checks) return;
    checks[i].done = !checks[i].done;
    store.setExerciseChecks(dateKey, workoutId, checks);
    setData(loadDay());
  }

  function deleteEntry(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    const updated = store.getLog(dateKey).filter((e) => e.id !== id);
    store.setLog(dateKey, updated);
    setData(loadDay());
  }

  const byMeal = MEALS.map((m) => ({ meal: m, items: entries.filter((e) => e.meal === m) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-[30px]">Hoy</h1>
        <span className="text-dim text-[13px]">{dateLabel}</span>
      </div>

      <Card>
        <h3 className="mb-3">Macros de hoy</h3>
        <MacroBar
          label="Calorías"
          icon={<FlameIcon className="w-[18px] h-[18px]" />}
          current={totals.calories}
          goal={goals.calories}
          unit="kcal"
          textColorClass="text-accent"
          barColorClass="bg-accent"
        />
        <MacroBar
          label="Proteína"
          icon={<ChickenIcon className="w-[18px] h-[18px]" />}
          current={totals.protein}
          goal={goals.protein}
          unit="g"
          textColorClass="text-protein"
          barColorClass="bg-protein"
        />
        <MacroBar
          label="Carbohidratos"
          icon={<RiceIcon className="w-[18px] h-[18px]" />}
          current={totals.carbs}
          goal={goals.carbs}
          unit="g"
          textColorClass="text-amber"
          barColorClass="bg-amber"
        />
        <MacroBar
          label="Grasas"
          icon={<AvocadoIcon className="w-[18px] h-[18px]" />}
          current={totals.fat}
          goal={goals.fat}
          unit="g"
          textColorClass="text-fat"
          barColorClass="bg-fat"
        />
      </Card>

      {workouts.length === 0 ? (
        <Card variant="amber">
          <h3 className="text-text text-[17px]">Descanso</h3>
        </Card>
      ) : (
        workouts.map(({ workout, exerciseChecks, done }) => (
          <Card key={workout.id} variant="amber">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-text text-[17px]">{workout.name || "Entreno"}</h3>
                {workout.notes && <span className="text-dim text-[13px]">{workout.notes}</span>}
              </div>
              {workout.exercises.length === 0 && (
                <button
                  onClick={() => toggleWorkoutDone(workout.id)}
                  className={`h-9 w-9 rounded-full border flex items-center justify-center text-lg ${
                    done ? "bg-good border-good text-white" : "border-line text-dim"
                  }`}
                >
                  ✓
                </button>
              )}
            </div>
            {exerciseChecks && (
              <div className="mt-3 flex flex-col gap-2">
                {exerciseChecks.map((e, i) => (
                  <div key={e.name + i} className="flex items-center justify-between bg-surface-2 rounded-[10px] px-3 py-2">
                    <span className="text-[14px]">{e.name}</span>
                    <button
                      onClick={() => toggleExercise(workout.id, i)}
                      className={`h-7 w-7 rounded-full border flex items-center justify-center text-sm ${
                        e.done ? "bg-good border-good text-white" : "border-line text-dim"
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}

      {byMeal.length === 0 ? (
        <div className="text-dim text-sm text-center py-8">Todavía no has registrado ninguna comida hoy.</div>
      ) : (
        byMeal.map((g) => (
          <Card key={g.meal} variant="flat">
            <h3 className="mb-1">{g.meal}</h3>
            {g.items.map((e) => (
              <button
                key={e.id}
                onClick={() => deleteEntry(e.id)}
                className="w-full flex items-center justify-between py-2 border-b border-line last:border-0 text-left"
              >
                <span>
                  {e.foodName} <span className="text-dim text-[13px]">· {e.grams}g</span>
                </span>
                <span className="font-mono text-dim text-[13px]">{e.kcal} kcal</span>
              </button>
            ))}
          </Card>
        ))
      )}
    </>
  );
}
