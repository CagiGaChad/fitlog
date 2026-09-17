"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { MacroBar } from "@/components/MacroBar";
import { ChickenIcon, RiceIcon, AvocadoIcon, FlameIcon } from "@/components/icons/FoodIcons";
import { store, todayKey, isoDayIndex } from "@/lib/storage";
import { activeGoals, sumLog } from "@/lib/macros";
import { ensureWeekPlan, hasProfile } from "@/lib/state";
import type { ExerciseCheck, Goals, Totals, WeekDay } from "@/lib/types";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface DayData {
  hasProfile: boolean;
  goals: Goals;
  totals: Totals;
  todayPlan: WeekDay;
  exerciseChecks: ExerciseCheck[] | null;
  done: boolean;
  dateKey: string;
}

function loadDay(): DayData | null {
  if (!hasProfile()) return null;
  const dateKey = todayKey();
  const profile = store.getProfile()!;
  const goals = activeGoals(profile);
  const totals = sumLog(store.getLog(dateKey));
  const plan = ensureWeekPlan();
  const todayPlan = plan[isoDayIndex()];
  const exerciseNames = todayPlan.exercises || [];

  let exerciseChecks: ExerciseCheck[] | null = null;
  if (exerciseNames.length > 0) {
    const prev = store.getExerciseChecks(dateKey) || [];
    const prevByName = new Map(prev.map((e) => [e.name, e.done]));
    exerciseChecks = exerciseNames.map((name) => ({ name, done: prevByName.get(name) || false }));
    store.setExerciseChecks(dateKey, exerciseChecks);
  }
  const done = exerciseNames.length > 0 ? exerciseChecks!.every((e) => e.done) : store.isWorkoutDone(dateKey);

  return { hasProfile: true, goals, totals, todayPlan, exerciseChecks, done, dateKey };
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

  const { goals, totals, todayPlan, exerciseChecks, done, dateKey } = data;
  const exerciseNames = todayPlan.exercises || [];
  const dateLabel = capitalize(
    new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  );

  function toggleWorkoutDone() {
    const newDone = !store.isWorkoutDone(dateKey);
    store.setWorkoutDone(dateKey, newDone);
    setData(loadDay());
  }

  function toggleExercise(i: number) {
    const checks = store.getExerciseChecks(dateKey);
    if (!checks) return;
    checks[i].done = !checks[i].done;
    store.setExerciseChecks(dateKey, checks);
    setData(loadDay());
  }

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

      <Card variant="amber">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-text text-[17px]">{todayPlan.name || "Descanso"}</h3>
            {todayPlan.notes && <span className="text-dim text-[13px]">{todayPlan.notes}</span>}
          </div>
          {exerciseNames.length === 0 && todayPlan.name && (
            <button
              onClick={toggleWorkoutDone}
              className={`h-9 w-9 rounded-full border flex items-center justify-center text-lg ${
                done ? "bg-good border-good text-white" : "border-line text-dim"
              }`}
            >
              ✓
            </button>
          )}
        </div>
        {exerciseNames.length > 0 && exerciseChecks && (
          <div className="mt-3 flex flex-col gap-2">
            {exerciseChecks.map((e, i) => (
              <div key={e.name + i} className="flex items-center justify-between bg-surface-2 rounded-[10px] px-3 py-2">
                <span className="text-[14px]">{e.name}</span>
                <button
                  onClick={() => toggleExercise(i)}
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
    </>
  );
}
