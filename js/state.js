import { store, DAY_NAMES } from "./storage.js";

export function defaultWeekPlan() {
  return DAY_NAMES.map((day) => ({ day, name: "", notes: "", exercises: [] }));
}

export function ensureWeekPlan() {
  let plan = store.getWeekPlan();
  if (!plan) {
    plan = defaultWeekPlan();
    store.setWeekPlan(plan);
  }
  return plan;
}

export function hasProfile() {
  const p = store.getProfile();
  return !!(p && p.weight && p.height && p.age && p.sex && p.activity && p.goalType);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
