// Envoltorio sobre localStorage. Mismas claves que la versión anterior (vanilla JS)
// de FitLog, para que los datos ya guardados en el navegador sigan funcionando tal cual.
import type { ExerciseCheck, Food, LogEntry, Profile, WeekPlan, WeightEntry } from "./types";

const KEYS = {
  profile: "fitlog_profile",
  customFoods: "fitlog_custom_foods",
  week: "fitlog_week_plan",
  logPrefix: "fitlog_log_", // + YYYY-MM-DD
  donePrefix: "fitlog_done_", // + YYYY-MM-DD -> boolean (entreno sin lista de ejercicios)
  exercisesPrefix: "fitlog_exercises_", // + YYYY-MM-DD -> [{name, done}]
  weightLog: "fitlog_weight_log",
  favorites: "fitlog_favorite_foods",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error("Error leyendo", key, e);
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error guardando", key, e);
  }
}

export const store = {
  getProfile(): Profile | null {
    return read<Profile | null>(KEYS.profile, null);
  },
  setProfile(profile: Profile) {
    write(KEYS.profile, profile);
  },

  getCustomFoods(): Food[] {
    return read<Food[]>(KEYS.customFoods, []);
  },
  addCustomFood(food: Food) {
    const foods = read<Food[]>(KEYS.customFoods, []);
    foods.unshift(food);
    write(KEYS.customFoods, foods);
  },
  findCustomFoodByBarcode(barcode: string): Food | null {
    return read<Food[]>(KEYS.customFoods, []).find((f) => f.barcode === barcode) || null;
  },

  getWeekPlan(): WeekPlan | null {
    return read<WeekPlan | null>(KEYS.week, null);
  },
  setWeekPlan(plan: WeekPlan) {
    write(KEYS.week, plan);
  },

  getLog(dateKey: string): LogEntry[] {
    return read<LogEntry[]>(KEYS.logPrefix + dateKey, []);
  },
  setLog(dateKey: string, entries: LogEntry[]) {
    write(KEYS.logPrefix + dateKey, entries);
  },

  isWorkoutDone(dateKey: string): boolean {
    return read<boolean>(KEYS.donePrefix + dateKey, false);
  },
  setWorkoutDone(dateKey: string, done: boolean) {
    write(KEYS.donePrefix + dateKey, done);
  },

  getExerciseChecks(dateKey: string): ExerciseCheck[] | null {
    return read<ExerciseCheck[] | null>(KEYS.exercisesPrefix + dateKey, null);
  },
  setExerciseChecks(dateKey: string, list: ExerciseCheck[]) {
    write(KEYS.exercisesPrefix + dateKey, list);
  },

  getWeightLog(): WeightEntry[] {
    return read<WeightEntry[]>(KEYS.weightLog, []);
  },
  addWeightEntry(entry: WeightEntry) {
    const log = read<WeightEntry[]>(KEYS.weightLog, []);
    log.push(entry);
    log.sort((a, b) => a.date.localeCompare(b.date));
    write(KEYS.weightLog, log);
  },
  deleteWeightEntry(id: string) {
    const log = read<WeightEntry[]>(KEYS.weightLog, []).filter((e) => e.id !== id);
    write(KEYS.weightLog, log);
  },

  getFavorites(): Food[] {
    return read<Food[]>(KEYS.favorites, []);
  },
  isFavorite(name: string): boolean {
    return read<Food[]>(KEYS.favorites, []).some((f) => f.name.toLowerCase() === name.toLowerCase());
  },
  addFavorite(food: Food) {
    const favs = read<Food[]>(KEYS.favorites, []);
    if (favs.some((f) => f.name.toLowerCase() === food.name.toLowerCase())) return;
    favs.unshift({
      id: food.id,
      source: food.source,
      name: food.name,
      kcal100: food.kcal100,
      protein100: food.protein100,
      carbs100: food.carbs100,
      fat100: food.fat100,
    });
    write(KEYS.favorites, favs);
  },
  removeFavorite(name: string) {
    const favs = read<Food[]>(KEYS.favorites, []).filter((f) => f.name.toLowerCase() !== name.toLowerCase());
    write(KEYS.favorites, favs);
  },

  exportAll(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fitlog_")) data[key] = localStorage.getItem(key) as string;
    }
    return data;
  },
  importAll(data: Record<string, string>) {
    if (typeof window === "undefined") return;
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith("fitlog_")) localStorage.setItem(key, value);
    });
  },
};

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// dateKey de hoy desplazado N días (offset negativo = días atrás).
export function dateKeyForOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayKey(d);
}

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// 0 = Lunes ... 6 = Domingo (getDay() de JS usa 0=Domingo, lo convertimos)
export function isoDayIndex(d: Date = new Date()): number {
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}
