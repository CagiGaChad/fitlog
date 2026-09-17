import { DAY_NAMES, store } from "./storage";
import type { WeekPlan } from "./types";

export function defaultWeekPlan(): WeekPlan {
  return DAY_NAMES.map((day) => ({ day, name: "", notes: "", exercises: [] }));
}

export function ensureWeekPlan(): WeekPlan {
  let plan = store.getWeekPlan();
  if (!plan) {
    plan = defaultWeekPlan();
    store.setWeekPlan(plan);
  }
  return plan;
}

export function hasProfile(): boolean {
  const p = store.getProfile();
  return !!(p && p.weight && p.height && p.age && p.sex && p.activity && p.goalType);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
