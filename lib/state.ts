import { DAY_NAMES, LEGACY_WORKOUT_ID, store } from "./storage";
import type { LegacyWeekDay, WeekDay, WeekPlan, Workout } from "./types";

export function defaultWeekPlan(): WeekPlan {
  return DAY_NAMES.map((day) => ({ day, workouts: [] }));
}

function isLegacyDay(day: WeekDay | LegacyWeekDay): day is LegacyWeekDay {
  return !Array.isArray((day as WeekDay).workouts);
}

// Los planes guardados por versiones previas de la app tenían un único
// entreno por día (name/notes/exercises sueltos). Los convertimos a la forma
// nueva (lista de entrenos) conservando su contenido bajo el id "legacy",
// que es el mismo que usa storage.ts para leer el historial ya guardado.
function migrateWeekPlan(plan: (WeekDay | LegacyWeekDay)[]): WeekPlan {
  return plan.map((day) => {
    if (!isLegacyDay(day)) return day;
    const hasContent = day.name || day.notes || (day.exercises && day.exercises.length > 0);
    const workouts: Workout[] = hasContent
      ? [{ id: LEGACY_WORKOUT_ID, name: day.name || "", notes: day.notes || "", exercises: day.exercises || [] }]
      : [];
    return { day: day.day, workouts };
  });
}

export function ensureWeekPlan(): WeekPlan {
  const stored = store.getWeekPlan();
  if (!stored) {
    const plan = defaultWeekPlan();
    store.setWeekPlan(plan);
    return plan;
  }
  if (stored.some((d) => isLegacyDay(d as WeekDay | LegacyWeekDay))) {
    const migrated = migrateWeekPlan(stored as (WeekDay | LegacyWeekDay)[]);
    store.setWeekPlan(migrated);
    return migrated;
  }
  return stored;
}

export function newWorkout(): Workout {
  return { id: uid(), name: "", notes: "", exercises: [] };
}

export function hasProfile(): boolean {
  const p = store.getProfile();
  return !!(p && p.weight && p.height && p.age && p.sex && p.activity && p.goalType);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
