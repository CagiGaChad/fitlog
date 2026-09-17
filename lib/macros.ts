// Fórmula de Mifflin-St Jeor + factor de actividad + reparto de macros según objetivo.
import type { ActivityId, GoalType, Goals, LogEntry, Profile, Sex, Totals } from "./types";

export const ACTIVITY_LEVELS: { id: ActivityId; label: string; factor: number }[] = [
  { id: "sedentario", label: "Sedentario (poco o nada de ejercicio)", factor: 1.2 },
  { id: "ligero", label: "Ligero (1-3 días/semana)", factor: 1.375 },
  { id: "moderado", label: "Moderado (3-5 días/semana)", factor: 1.55 },
  { id: "activo", label: "Activo (6-7 días/semana)", factor: 1.725 },
  { id: "muy_activo", label: "Muy activo (entreno intenso a diario)", factor: 1.9 },
];

export const GOALS: { id: GoalType; label: string }[] = [
  { id: "perder", label: "Perder grasa" },
  { id: "mantener", label: "Mantener" },
  { id: "ganar", label: "Ganar músculo" },
];

export function calcBMR({
  weight,
  height,
  age,
  sex,
}: {
  weight: number;
  height: number;
  age: number;
  sex: Sex;
}): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "mujer" ? base - 161 : base + 5;
}

export function calcGoals(profile: {
  weight: number;
  height: number;
  age: number;
  sex: Sex;
  activity: ActivityId;
  goalType: GoalType;
}): Goals {
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) || ACTIVITY_LEVELS[1];
  const bmr = calcBMR(profile);
  const tdee = bmr * activity.factor;

  let calories: number, proteinPerKg: number, fatPct: number;
  if (profile.goalType === "perder") {
    calories = tdee * 0.8;
    proteinPerKg = 2.2;
    fatPct = 0.25;
  } else if (profile.goalType === "ganar") {
    calories = tdee * 1.12;
    proteinPerKg = 1.9;
    fatPct = 0.25;
  } else {
    calories = tdee;
    proteinPerKg = 1.8;
    fatPct = 0.28;
  }

  const protein = proteinPerKg * profile.weight;
  const fat = (calories * fatPct) / 9;
  const carbsKcal = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, carbsKcal / 4);

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

// Objetivo real: los overrides manuales de Ajustes pisan al cálculo automático, campo a campo.
export function activeGoals(profile: Profile): Goals {
  const calculated = calcGoals(profile);
  if (!profile.overrides) return calculated;
  return {
    ...calculated,
    calories: profile.overrides.calories ?? calculated.calories,
    protein: profile.overrides.protein ?? calculated.protein,
    carbs: profile.overrides.carbs ?? calculated.carbs,
    fat: profile.overrides.fat ?? calculated.fat,
  };
}

export function sumLog(entries: LogEntry[]): Totals {
  return entries.reduce(
    (acc, e) => {
      acc.calories += e.kcal;
      acc.protein += e.protein;
      acc.carbs += e.carbs;
      acc.fat += e.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
